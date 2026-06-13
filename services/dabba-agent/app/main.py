from __future__ import annotations
import base64
import logging
import secrets
import time
from collections import defaultdict, deque
from typing import Annotated

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.agent.graph import DabbaAgent
from app.core.config import get_settings
from app.core.schemas import (
    AnalysisResponse,
    LabelScanRequest,
    ManualMealRequest,
    PDFReportRequest,
    PDFReportResponse,
    ReceiptScanRequest,
)
from app.services.pdf_report import generate_pdf_base64

settings = get_settings()
app = FastAPI(title="Dabba Agent API", version="1.0.0")
agent = DabbaAgent()
logger = logging.getLogger("dabba_agent")
logging.basicConfig(level=logging.INFO)
_rate_buckets: dict[str, deque[float]] = defaultdict(deque)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cache-Control"] = "no-store"
        return response


app.add_middleware(SecurityHeadersMiddleware)


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")
    auth = request.headers.get("authorization", "")
    return f"{ip}:{auth[-12:]}"


def enforce_request_limits(request: Request) -> None:
    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit():
        content_type = request.headers.get("content-type", "")
        limit_mb = settings.max_image_mb if content_type.startswith("multipart/form-data") else settings.max_json_mb
        max_bytes = limit_mb * 1024 * 1024
        if int(content_length) > max_bytes:
            raise HTTPException(status_code=413, detail="Request body too large.")

    now = time.monotonic()
    window_start = now - 60
    key = _client_key(request)
    bucket = _rate_buckets[key]
    while bucket and bucket[0] < window_start:
        bucket.popleft()
    if len(bucket) >= settings.rate_limit_per_minute:
        logger.warning("rate_limited path=%s client=%s", request.url.path, key[:24])
        raise HTTPException(status_code=429, detail="Too many requests. Please wait and try again.")
    bucket.append(now)


def require_api_auth(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    enforce_request_limits(request)
    token = settings.api_auth_token
    if not token or token == "change-me-for-private-api":
        logger.error("API_AUTH_TOKEN is not configured")
        raise HTTPException(status_code=503, detail="Agent API token is not configured.")

    expected = f"Bearer {token}"
    if not authorization or not secrets.compare_digest(authorization, expected):
        logger.warning("unauthorized path=%s", request.url.path)
        raise HTTPException(status_code=401, detail="Unauthorized")


def validate_upload(file: UploadFile, data: bytes) -> None:
    max_bytes = settings.max_image_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Image too large. Max {settings.max_image_mb} MB allowed.")

    mime_type = file.content_type or ""
    if not mime_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Only image uploads are supported by Dabba Agent.")


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "Dabba Agent",
    }


@app.get("/")
def root() -> dict:
    return {
        "status": "ok",
        "service": "Dabba Agent",
        "health": "/health",
        "manual_analysis": "/api/v1/analyze/manual",
        "receipt_analysis": "/api/v1/analyze/receipt",
        "label_analysis": "/api/v1/analyze/label",
    }


@app.post("/api/v1/analyze/manual", response_model=AnalysisResponse, dependencies=[Depends(require_api_auth)])
def analyze_manual(request: ManualMealRequest) -> AnalysisResponse:
    raw_from_meals = []
    for meal in request.meals:
        raw_from_meals.append(
            f"{meal.meal_name}: {', '.join(meal.items)}. Quantity: {meal.quantity_note}. Spice: {meal.spice_level}. Source: {meal.meal_source}. Notes: {meal.notes}"
        )
    raw_text = (request.raw_text or "") + "\n" + "\n".join(raw_from_meals)
    return agent.analyze(
        {
            "analysis_type": "manual",
            "language": request.language,
            "user_profile": request.user_profile.model_dump() if request.user_profile else None,
            "raw_text": raw_text,
            "source_type": "home",
            "mime_type": "image/jpeg",
        }
    )


@app.post("/api/v1/analyze/receipt", response_model=AnalysisResponse, dependencies=[Depends(require_api_auth)])
def analyze_receipt(request: ReceiptScanRequest) -> AnalysisResponse:
    return agent.analyze(
        {
            "analysis_type": "receipt",
            "language": request.language,
            "user_profile": request.user_profile.model_dump() if request.user_profile else None,
            "raw_text": request.raw_text,
            "image_base64": request.image_base64,
            "mime_type": request.mime_type,
            "source_type": request.source_type,
        }
    )


@app.post("/api/v1/analyze/label", response_model=AnalysisResponse, dependencies=[Depends(require_api_auth)])
def analyze_label(request: LabelScanRequest) -> AnalysisResponse:
    return agent.analyze(
        {
            "analysis_type": "label",
            "language": request.language,
            "user_profile": request.user_profile.model_dump() if request.user_profile else None,
            "product_name": request.product_name,
            "raw_text": request.raw_text,
            "image_base64": request.image_base64,
            "mime_type": request.mime_type,
            "source_type": "ecommerce",
        }
    )


@app.post("/api/v1/analyze/receipt-upload", response_model=AnalysisResponse, dependencies=[Depends(require_api_auth)])
async def analyze_receipt_upload(
    file: UploadFile = File(...),
    source_type: str = Form("unknown"),
    language: str = Form("hinglish"),
) -> AnalysisResponse:
    data = await file.read()
    validate_upload(file, data)
    image_b64 = base64.b64encode(data).decode("utf-8")
    return agent.analyze(
        {
            "analysis_type": "receipt",
            "language": language,
            "raw_text": None,
            "image_base64": image_b64,
            "mime_type": file.content_type or "image/jpeg",
            "source_type": source_type,
        }
    )


@app.post("/api/v1/analyze/label-upload", response_model=AnalysisResponse, dependencies=[Depends(require_api_auth)])
async def analyze_label_upload(
    file: UploadFile = File(...),
    product_name: str | None = Form(None),
    language: str = Form("hinglish"),
) -> AnalysisResponse:
    data = await file.read()
    validate_upload(file, data)
    image_b64 = base64.b64encode(data).decode("utf-8")
    return agent.analyze(
        {
            "analysis_type": "label",
            "language": language,
            "product_name": product_name,
            "raw_text": None,
            "image_base64": image_b64,
            "mime_type": file.content_type or "image/jpeg",
            "source_type": "ecommerce",
        }
    )


@app.post("/api/v1/report/pdf", response_model=PDFReportResponse, dependencies=[Depends(require_api_auth)])
def create_pdf_report(request: PDFReportRequest) -> PDFReportResponse:
    if hasattr(request.analysis, "model_dump"):
        analysis_dict = request.analysis.model_dump()
    else:
        analysis_dict = request.analysis
    pdf_b64 = generate_pdf_base64(request.title, analysis_dict)
    return PDFReportResponse(filename="dabbadoc-report.pdf", base64_pdf=pdf_b64)

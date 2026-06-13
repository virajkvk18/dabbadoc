from __future__ import annotations
import base64
import json
import re
from typing import Any


def strip_data_url(base64_text: str | None) -> str | None:
    if not base64_text:
        return None
    if "," in base64_text and base64_text.strip().startswith("data:"):
        return base64_text.split(",", 1)[1]
    return base64_text


def decode_base64_image(base64_text: str | None) -> bytes | None:
    clean = strip_data_url(base64_text)
    if not clean:
        return None
    try:
        return base64.b64decode(clean)
    except Exception:
        return None


def image_to_data_url(image_b64: str | None, mime_type: str = "image/jpeg") -> str | None:
    clean = strip_data_url(image_b64)
    if not clean:
        return None
    return f"data:{mime_type};base64,{clean}"


def extract_json_object(text: str | None) -> dict[str, Any]:
    if not text:
        return {}
    raw = text.strip()

    # Remove markdown fences.
    raw = re.sub(r"^```(?:json)?", "", raw, flags=re.IGNORECASE).strip()
    raw = re.sub(r"```$", "", raw).strip()

    try:
        return json.loads(raw)
    except Exception:
        pass

    # Try first JSON object in output.
    match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            return {}
    return {}


def compact_profile(profile: dict | None) -> str:
    if not profile:
        return "No user profile provided."
    try:
        return json.dumps(profile, ensure_ascii=False)
    except Exception:
        return str(profile)

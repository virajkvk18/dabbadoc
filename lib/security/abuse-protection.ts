import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/security/api-errors";
import { logSecurityEvent } from "@/lib/security/audit-log";
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  type RateLimitRule
} from "@/lib/security/rate-limit";

const API_GLOBAL_RULE: RateLimitRule = { limit: 180, windowMs: 60 * 1000 };
const API_ENDPOINT_RULE: RateLimitRule = { limit: 60, windowMs: 60 * 1000 };
const WEBHOOK_ENDPOINT_RULE: RateLimitRule = { limit: 120, windowMs: 60 * 1000 };
const PROTECTED_PAGE_RULE: RateLimitRule = { limit: 120, windowMs: 60 * 1000 };
const SUSPICIOUS_CLIENT_RULE: RateLimitRule = { limit: 12, windowMs: 10 * 60 * 1000 };

const AI_IP_RULE: RateLimitRule = { limit: 12, windowMs: 10 * 60 * 1000 };
const AI_USER_RULE: RateLimitRule = { limit: 30, windowMs: 60 * 60 * 1000 };
const REPORT_USER_RULE: RateLimitRule = { limit: 20, windowMs: 60 * 60 * 1000 };
const PAYMENT_USER_RULE: RateLimitRule = { limit: 10, windowMs: 10 * 60 * 1000 };
const PROFILE_WRITE_USER_RULE: RateLimitRule = { limit: 30, windowMs: 60 * 60 * 1000 };
const FAMILY_USER_RULE: RateLimitRule = { limit: 20, windowMs: 60 * 60 * 1000 };
const AUTH_CALLBACK_RULE: RateLimitRule = { limit: 30, windowMs: 15 * 60 * 1000 };

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
export const MAX_JSON_BYTES = 128 * 1024;

const DEFAULT_ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf"
]);

const protectedPrefixes = ["/dashboard", "/settings"];
const botLikeUserAgent =
  /(curl|wget|python-requests|scrapy|httpclient|go-http-client|libwww-perl|bot|crawler|spider|headlesschrome|phantomjs|selenium|playwright|puppeteer|sqlmap|nikto|nmap|masscan|zgrab)/i;

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isSuspiciousClient(request: NextRequest) {
  const userAgent = request.headers.get("user-agent")?.trim() ?? "";
  return !userAgent || botLikeUserAgent.test(userAgent);
}

function checkOrThrow(
  request: NextRequest,
  keyParts: Array<string | number | undefined | null>,
  rule: RateLimitRule,
  message: string,
  metadata?: Record<string, string | number | boolean | null | undefined>
) {
  const result = checkRateLimit(keyParts, rule);
  if (!result.allowed) {
    logSecurityEvent({
      type: "rate_limit_block",
      severity: "warning",
      request,
      status: 429,
      reason: message,
      metadata
    });
    throw new ApiError(message, 429, rateLimitHeaders(result));
  }

  return result;
}

function rateLimitResponse(message: string, headers: HeadersInit) {
  return NextResponse.json({ error: message }, { status: 429, headers });
}

function checkForMiddleware(
  request: NextRequest,
  keyParts: Array<string | number | undefined | null>,
  rule: RateLimitRule,
  message: string,
  metadata?: Record<string, string | number | boolean | null | undefined>
) {
  const result = checkRateLimit(keyParts, rule);
  if (!result.allowed) {
    logSecurityEvent({
      type: "rate_limit_block",
      severity: "warning",
      request,
      status: 429,
      reason: message,
      metadata
    });
    return rateLimitResponse(message, rateLimitHeaders(result));
  }

  return null;
}

export function protectRequestFromAbuse(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = getClientIp(request);

  if (pathname.startsWith("/api/")) {
    const globalLimit = checkForMiddleware(
      request,
      ["api", "global", ip],
      API_GLOBAL_RULE,
      "Too many API requests. Please wait before trying again.",
      { scope: "api_global" }
    );
    if (globalLimit) return globalLimit;

    const endpointLimit = checkForMiddleware(
      request,
      ["api", "endpoint", request.method, pathname, ip],
      pathname.startsWith("/api/webhooks/")
        ? WEBHOOK_ENDPOINT_RULE
        : API_ENDPOINT_RULE,
      "Too many requests to this endpoint. Please wait before trying again.",
      { scope: "api_endpoint", pathname, method: request.method }
    );
    if (endpointLimit) return endpointLimit;

    if (isSuspiciousClient(request)) {
      logSecurityEvent({
        type: "suspicious_traffic",
        severity: "warning",
        request,
        reason: "bot_like_api_client",
        metadata: { pathname, method: request.method }
      });

      return checkForMiddleware(
        request,
        ["api", "suspicious-client", pathname, ip],
        SUSPICIOUS_CLIENT_RULE,
        "Automated requests are temporarily limited.",
        { scope: "suspicious_api_client", pathname, method: request.method }
      );
    }
  }

  if (isProtectedPath(pathname)) {
    const pageLimit = checkForMiddleware(
      request,
      ["page", "protected", pathname, ip],
      PROTECTED_PAGE_RULE,
      "Too many page requests. Please wait before trying again.",
      { scope: "protected_page", pathname }
    );
    if (pageLimit) return pageLimit;

    if (isSuspiciousClient(request)) {
      logSecurityEvent({
        type: "suspicious_traffic",
        severity: "warning",
        request,
        reason: "bot_like_page_client",
        metadata: { pathname, method: request.method }
      });

      return checkForMiddleware(
        request,
        ["page", "suspicious-client", pathname, ip],
        SUSPICIOUS_CLIENT_RULE,
        "Automated page requests are temporarily limited.",
        { scope: "suspicious_page_client", pathname }
      );
    }
  }

  return null;
}

export function addAbuseProtectionHeaders(
  request: NextRequest,
  response: NextResponse
) {
  const pathname = request.nextUrl.pathname;
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (pathname.startsWith("/api/") || isProtectedPath(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
}

export function enforceAiGenerationRateLimit(
  request: NextRequest,
  userId: string,
  action: string
) {
  const ip = getClientIp(request);

  checkOrThrow(
    request,
    ["ai", "ip", action, ip],
    AI_IP_RULE,
    "AI analysis is temporarily rate limited. Please wait before trying again.",
    { scope: "ai_ip", action }
  );

  checkOrThrow(
    request,
    ["ai", "user", action, userId],
    AI_USER_RULE,
    "This account has reached the AI analysis limit. Please try again later.",
    { scope: "ai_user", action }
  );
}

export function enforceRequestSizeLimit(
  request: NextRequest,
  maxBytes: number,
  message = "Request body is too large."
) {
  const rawLength = request.headers.get("content-length");
  const contentLength = rawLength ? Number(rawLength) : Number.NaN;

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new ApiError(message, 413);
  }
}

export function enforceUploadFileType(
  file: { name?: string; type?: string; size?: number },
  allowedTypes = DEFAULT_ALLOWED_UPLOAD_MIME_TYPES
) {
  const mimeType = (file.type ?? "").toLowerCase();

  if (typeof file.size === "number" && file.size <= 0) {
    throw new ApiError("Upload file is empty.", 400);
  }

  if (!allowedTypes.has(mimeType)) {
    throw new ApiError(
      "Unsupported upload type. Please upload a JPG, PNG, WebP, HEIC, or PDF file.",
      415
    );
  }
}

export function enforceReportRateLimit(request: NextRequest, userId: string) {
  checkOrThrow(
    request,
    ["report", "user", userId],
    REPORT_USER_RULE,
    "Report generation is temporarily rate limited. Please try again later.",
    { scope: "report_user" }
  );
  checkOrThrow(
    request,
    ["report", "ip", getClientIp(request)],
    { limit: 10, windowMs: 10 * 60 * 1000 },
    "Report generation is temporarily rate limited. Please try again later.",
    { scope: "report_ip" }
  );
}

export function enforcePaymentRateLimit(request: NextRequest, userId: string) {
  checkOrThrow(
    request,
    ["payment", "user", userId],
    PAYMENT_USER_RULE,
    "Checkout is temporarily rate limited. Please try again later.",
    { scope: "payment_user" }
  );
  checkOrThrow(
    request,
    ["payment", "ip", getClientIp(request)],
    { limit: 20, windowMs: 10 * 60 * 1000 },
    "Checkout is temporarily rate limited. Please try again later.",
    { scope: "payment_ip" }
  );
}

export function enforceProfileMutationRateLimit(
  request: NextRequest,
  userId: string,
  action: string
) {
  checkOrThrow(
    request,
    ["profile", "write", action, userId],
    PROFILE_WRITE_USER_RULE,
    "Profile updates are temporarily rate limited. Please try again later.",
    { scope: "profile_write_user", action }
  );
  checkOrThrow(
    request,
    ["profile", "write", action, getClientIp(request)],
    { limit: 60, windowMs: 60 * 60 * 1000 },
    "Profile updates are temporarily rate limited. Please try again later.",
    { scope: "profile_write_ip", action }
  );
}

export function enforceFamilyRateLimit(
  request: NextRequest,
  userId: string,
  action: string
) {
  checkOrThrow(
    request,
    ["family", action, userId],
    FAMILY_USER_RULE,
    "Family actions are temporarily rate limited. Please try again later.",
    { scope: "family_user", action }
  );
  checkOrThrow(
    request,
    ["family", action, getClientIp(request)],
    { limit: 40, windowMs: 60 * 60 * 1000 },
    "Family actions are temporarily rate limited. Please try again later.",
    { scope: "family_ip", action }
  );
}

export function enforceAuthCallbackRateLimit(request: NextRequest) {
  checkOrThrow(
    request,
    ["auth", "callback", getClientIp(request)],
    AUTH_CALLBACK_RULE,
    "Too many auth callback attempts. Please wait before trying again.",
    { scope: "auth_callback_ip" }
  );
}

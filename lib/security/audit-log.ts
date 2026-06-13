import type { NextRequest } from "next/server";

type LogSeverity = "info" | "warning" | "error";

type AuditLogEvent = {
  type:
    | "auth_attempt"
    | "auth_success"
    | "auth_failure"
    | "auth_rate_limited"
    | "api_error"
    | "rate_limit_block"
    | "suspicious_traffic"
    | "https_redirect";
  severity?: LogSeverity;
  request?: Request | NextRequest;
  userId?: string | null;
  subject?: string | null;
  status?: number;
  reason?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

const MAX_METADATA_VALUE_LENGTH = 160;

function isAuditLoggingEnabled() {
  return process.env.SECURITY_AUDIT_LOGS_ENABLED !== "false";
}

function hashForLog(value?: string | null) {
  if (!value) return undefined;

  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function getRequestUrl(request?: Request | NextRequest) {
  if (!request) return null;

  try {
    return new URL(request.url);
  } catch {
    return null;
  }
}

function getHeader(request: Request | NextRequest | undefined, name: string) {
  return request?.headers.get(name) ?? undefined;
}

function getIpFingerprint(request?: Request | NextRequest) {
  const forwardedFor = getHeader(request, "x-forwarded-for")?.split(",")[0]?.trim();
  const ip =
    forwardedFor ||
    getHeader(request, "x-real-ip") ||
    getHeader(request, "cf-connecting-ip") ||
    "unknown";

  return hashForLog(ip);
}

function sanitizeMetadata(
  metadata?: Record<string, string | number | boolean | null | undefined>
) {
  if (!metadata) return undefined;

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        if (typeof value !== "string") return [key, value];
        return [key, value.slice(0, MAX_METADATA_VALUE_LENGTH)];
      })
  );
}

export function logSecurityEvent(event: AuditLogEvent) {
  if (!isAuditLoggingEnabled()) return;

  const url = getRequestUrl(event.request);
  const userAgent = getHeader(event.request, "user-agent") ?? "";
  const origin = getHeader(event.request, "origin") ?? "";

  const payload = {
    ts: new Date().toISOString(),
    event: "security",
    type: event.type,
    severity: event.severity ?? "info",
    status: event.status,
    reason: event.reason,
    method: event.request?.method,
    path: url?.pathname,
    ipHash: getIpFingerprint(event.request),
    userAgentHash: hashForLog(userAgent),
    originHash: hashForLog(origin),
    userIdHash: hashForLog(event.userId),
    subjectHash: hashForLog(event.subject),
    metadata: sanitizeMetadata(event.metadata)
  };

  const line = JSON.stringify(payload);

  if ((event.severity ?? "info") === "error") {
    console.error(line);
  } else if ((event.severity ?? "info") === "warning") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

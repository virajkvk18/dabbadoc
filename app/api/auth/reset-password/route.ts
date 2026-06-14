import { type NextRequest } from "next/server";
import {
  authJson,
  getAuthErrorMetadata,
  getRequestOrigin,
  sanitizeAuthError
} from "@/lib/auth/responses";
import { enforceRequestSizeLimit, MAX_JSON_BYTES } from "@/lib/security/abuse-protection";
import { logSecurityEvent } from "@/lib/security/audit-log";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/security/rate-limit";
import { createSupabaseServer } from "@/lib/supabase/server";
import { authResetRequestSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

const RESET_IP_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };
const RESET_IDENTITY_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 };

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimit = checkRateLimit(["auth", "reset", "ip", ip], RESET_IP_LIMIT);
  if (!ipLimit.allowed) {
    logSecurityEvent({
      type: "auth_rate_limited",
      severity: "warning",
      request,
      status: 429,
      reason: "reset_ip_limit"
    });
    return authJson(
      { error: "Too many reset requests. Please wait before trying again." },
      { status: 429, headers: rateLimitHeaders(ipLimit) }
    );
  }

  try {
    enforceRequestSizeLimit(request, MAX_JSON_BYTES);
  } catch {
    logSecurityEvent({
      type: "suspicious_traffic",
      severity: "warning",
      request,
      status: 413,
      reason: "reset_body_too_large"
    });
    return authJson({ error: "Request body is too large." }, { status: 413 });
  }

  const parsed = authResetRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    logSecurityEvent({
      type: "auth_failure",
      severity: "warning",
      request,
      status: 400,
      reason: "invalid_reset_payload"
    });
    return authJson({ error: parsed.error.issues[0]?.message ?? "Invalid reset request." }, { status: 400 });
  }

  logSecurityEvent({
    type: "auth_attempt",
    request,
    subject: parsed.data.email,
    reason: "password_reset_submitted"
  });

  const identityLimit = checkRateLimit(
    ["auth", "reset", "identity", ip, parsed.data.email],
    RESET_IDENTITY_LIMIT
  );
  if (!identityLimit.allowed) {
    logSecurityEvent({
      type: "auth_rate_limited",
      severity: "warning",
      request,
      subject: parsed.data.email,
      status: 429,
      reason: "reset_identity_limit"
    });
    return authJson(
      { error: "Too many reset requests. Please wait before trying again." },
      { status: 429, headers: rateLimitHeaders(identityLimit) }
    );
  }

  const supabase = await createSupabaseServer();
  if (!supabase) {
    logSecurityEvent({
      type: "auth_failure",
      severity: "error",
      request,
      subject: parsed.data.email,
      status: 503,
      reason: "supabase_unavailable"
    });
    return authJson({ error: "Secure account access is temporarily unavailable." }, { status: 503 });
  }

  const origin = getRequestOrigin(request);
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`
  });

  if (error) {
    logSecurityEvent({
      type: "auth_failure",
      severity: "warning",
      request,
      subject: parsed.data.email,
      status: 400,
      reason: "reset_provider_error",
      metadata: getAuthErrorMetadata(error)
    });
    return authJson({ error: sanitizeAuthError(error) }, { status: 400 });
  }

  logSecurityEvent({
    type: "auth_success",
    request,
    subject: parsed.data.email,
    status: 200,
    reason: "password_reset_email_queued"
  });

  return authJson({
    message: "If this email has an account, a reset link will arrive shortly."
  });
}

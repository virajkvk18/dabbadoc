import { type NextRequest } from "next/server";
import { authJson, getAuthErrorMetadata, sanitizeAuthError } from "@/lib/auth/responses";
import { setSessionStartedCookie } from "@/lib/auth/session";
import { enforceRequestSizeLimit, MAX_JSON_BYTES } from "@/lib/security/abuse-protection";
import { logSecurityEvent } from "@/lib/security/audit-log";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/security/rate-limit";
import { createSupabaseServer } from "@/lib/supabase/server";
import { authUpdatePasswordSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

const UPDATE_PASSWORD_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(["auth", "update-password", ip], UPDATE_PASSWORD_LIMIT);
  if (!limit.allowed) {
    logSecurityEvent({
      type: "auth_rate_limited",
      severity: "warning",
      request,
      status: 429,
      reason: "update_password_limit"
    });
    return authJson(
      { error: "Too many password update attempts. Please wait before trying again." },
      { status: 429, headers: rateLimitHeaders(limit) }
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
      reason: "update_password_body_too_large"
    });
    return authJson({ error: "Request body is too large." }, { status: 413 });
  }

  const parsed = authUpdatePasswordSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    logSecurityEvent({
      type: "auth_failure",
      severity: "warning",
      request,
      status: 400,
      reason: "invalid_update_password_payload"
    });
    return authJson({ error: parsed.error.issues[0]?.message ?? "Invalid password." }, { status: 400 });
  }

  const supabase = await createSupabaseServer();
  if (!supabase) {
    logSecurityEvent({
      type: "auth_failure",
      severity: "error",
      request,
      status: 503,
      reason: "supabase_unavailable"
    });
    return authJson({ error: "Secure account access is temporarily unavailable." }, { status: 503 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    logSecurityEvent({
      type: "auth_failure",
      severity: "warning",
      request,
      status: 401,
      reason: "password_reset_session_expired"
    });
    return authJson({ error: "Password reset session expired. Request a new reset link." }, { status: 401 });
  }

  logSecurityEvent({
    type: "auth_attempt",
    request,
    userId: user.id,
    status: 200,
    reason: "password_update_submitted"
  });

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  });

  if (error) {
    logSecurityEvent({
      type: "auth_failure",
      severity: "warning",
      request,
      userId: user.id,
      status: 400,
      reason: "password_update_provider_error",
      metadata: getAuthErrorMetadata(error)
    });
    return authJson({ error: sanitizeAuthError(error) }, { status: 400 });
  }

  logSecurityEvent({
    type: "auth_success",
    request,
    userId: user.id,
    status: 200,
    reason: "password_update_success"
  });

  const response = authJson({
    message: "Password updated. You are signed in securely.",
    next: "/dashboard"
  });
  setSessionStartedCookie(response);
  return response;
}

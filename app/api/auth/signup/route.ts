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
import { authSignupSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

const SIGNUP_IP_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };
const SIGNUP_IDENTITY_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 };

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimit = checkRateLimit(["auth", "signup", "ip", ip], SIGNUP_IP_LIMIT);
  if (!ipLimit.allowed) {
    logSecurityEvent({
      type: "auth_rate_limited",
      severity: "warning",
      request,
      status: 429,
      reason: "signup_ip_limit"
    });
    return authJson(
      { error: "Too many account requests. Please wait before trying again." },
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
      reason: "signup_body_too_large"
    });
    return authJson({ error: "Request body is too large." }, { status: 413 });
  }

  const parsed = authSignupSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    logSecurityEvent({
      type: "auth_failure",
      severity: "warning",
      request,
      status: 400,
      reason: "invalid_signup_payload"
    });
    return authJson({ error: parsed.error.issues[0]?.message ?? "Invalid signup request." }, { status: 400 });
  }

  logSecurityEvent({
    type: "auth_attempt",
    request,
    subject: parsed.data.email,
    reason: "signup_submitted"
  });

  const identityLimit = checkRateLimit(
    ["auth", "signup", "identity", ip, parsed.data.email],
    SIGNUP_IDENTITY_LIMIT
  );
  if (!identityLimit.allowed) {
    logSecurityEvent({
      type: "auth_rate_limited",
      severity: "warning",
      request,
      subject: parsed.data.email,
      status: 429,
      reason: "signup_identity_limit"
    });
    return authJson(
      { error: "Too many account requests. Please wait before trying again." },
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
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName ?? "" },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(parsed.data.next ?? "/dashboard")}`
    }
  });

  if (error) {
    logSecurityEvent({
      type: "auth_failure",
      severity: "warning",
      request,
      subject: parsed.data.email,
      status: 400,
      reason: "signup_provider_error",
      metadata: getAuthErrorMetadata(error)
    });
    return authJson({ error: sanitizeAuthError(error) }, { status: 400 });
  }

  if (data.session) {
    await supabase.auth.signOut();
  }

  logSecurityEvent({
    type: "auth_success",
    request,
    userId: data.user?.id,
    subject: parsed.data.email,
    status: 200,
    reason: "signup_verification_sent"
  });

  return authJson({
    message: "Account setup started. Check your email to verify your account."
  });
}

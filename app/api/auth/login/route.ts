import { type NextRequest } from "next/server";
import { setSessionStartedCookie } from "@/lib/auth/session";
import { authJson } from "@/lib/auth/responses";
import { enforceRequestSizeLimit, MAX_JSON_BYTES } from "@/lib/security/abuse-protection";
import { logSecurityEvent } from "@/lib/security/audit-log";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/security/rate-limit";
import { createSupabaseServer } from "@/lib/supabase/server";
import { authLoginSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

const LOGIN_IP_LIMIT = { limit: 30, windowMs: 15 * 60 * 1000 };
const LOGIN_IDENTITY_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimit = checkRateLimit(["auth", "login", "ip", ip], LOGIN_IP_LIMIT);
  if (!ipLimit.allowed) {
    logSecurityEvent({
      type: "auth_rate_limited",
      severity: "warning",
      request,
      status: 429,
      reason: "login_ip_limit"
    });
    return authJson(
      { error: "Too many login attempts. Please wait before trying again." },
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
      reason: "login_body_too_large"
    });
    return authJson({ error: "Request body is too large." }, { status: 413 });
  }

  const parsed = authLoginSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    logSecurityEvent({
      type: "auth_failure",
      severity: "warning",
      request,
      status: 400,
      reason: "invalid_login_payload"
    });
    return authJson({ error: parsed.error.issues[0]?.message ?? "Invalid login request." }, { status: 400 });
  }

  logSecurityEvent({
    type: "auth_attempt",
    request,
    subject: parsed.data.email,
    reason: "login_submitted"
  });

  const identityLimit = checkRateLimit(
    ["auth", "login", "identity", ip, parsed.data.email],
    LOGIN_IDENTITY_LIMIT
  );
  if (!identityLimit.allowed) {
    logSecurityEvent({
      type: "auth_rate_limited",
      severity: "warning",
      request,
      subject: parsed.data.email,
      status: 429,
      reason: "login_identity_limit"
    });
    return authJson(
      { error: "Too many login attempts. Please wait before trying again." },
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error || !data.user) {
    logSecurityEvent({
      type: "auth_failure",
      severity: "warning",
      request,
      subject: parsed.data.email,
      status: 401,
      reason: "invalid_credentials"
    });
    return authJson({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    logSecurityEvent({
      type: "auth_failure",
      severity: "warning",
      request,
      userId: data.user.id,
      subject: parsed.data.email,
      status: 403,
      reason: "email_unverified"
    });
    return authJson({ error: "Please verify your email before logging in." }, { status: 403 });
  }

  logSecurityEvent({
    type: "auth_success",
    request,
    userId: data.user.id,
    subject: parsed.data.email,
    status: 200,
    reason: "login_success"
  });

  const response = authJson({
    message: "Logged in.",
    next: parsed.data.next
  });
  setSessionStartedCookie(response);
  return response;
}

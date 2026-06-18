import { NextResponse, type NextRequest } from "next/server";
import { setSessionStartedCookie } from "@/lib/auth/session";
import { enforceAuthCallbackRateLimit } from "@/lib/security/abuse-protection";
import { logSecurityEvent } from "@/lib/security/audit-log";
import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));
  const redirectUrl = new URL(next, requestUrl.origin);

  try {
    enforceAuthCallbackRateLimit(request);
  } catch {
    return NextResponse.redirect(new URL("/auth?error=rate_limited", requestUrl.origin));
  }

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = supabase
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("Auth unavailable") };

    if (!error) {
      logSecurityEvent({
        type: "auth_success",
        request,
        status: 302,
        reason: "auth_callback_success"
      });
      const response = NextResponse.redirect(redirectUrl);
      setSessionStartedCookie(response);
      return response;
    }

    logSecurityEvent({
      type: "auth_failure",
      severity: "warning",
      request,
      status: 302,
      reason: "auth_callback_exchange_failed"
    });
  } else {
    logSecurityEvent({
      type: "auth_failure",
      severity: "warning",
      request,
      status: 302,
      reason: "auth_callback_missing_code"
    });
  }

  return NextResponse.redirect(new URL("/auth?error=callback", requestUrl.origin));
}

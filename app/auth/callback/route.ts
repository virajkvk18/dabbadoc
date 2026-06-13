import { NextResponse, type NextRequest } from "next/server";
import { setSessionStartedCookie } from "@/lib/auth/session";
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

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = supabase
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("Auth unavailable") };

    if (!error) {
      const response = NextResponse.redirect(redirectUrl);
      setSessionStartedCookie(response);
      return response;
    }
  }

  return NextResponse.redirect(new URL("/auth?error=callback", requestUrl.origin));
}

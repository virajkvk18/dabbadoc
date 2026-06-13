import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  clearSessionStartedCookie,
  getSessionStartedAt,
  isAppSessionExpired,
  setSessionStartedCookie
} from "@/lib/auth/session";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "./config";

const protectedPrefixes = ["/dashboard", "/settings"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function redirectToAuth(request: NextRequest, reason?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/auth";
  url.search = "";
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  if (reason) url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}

function copyResponseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return isProtectedPath(request.nextUrl.pathname)
      ? redirectToAuth(request, "unavailable")
      : NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options: CookieOptions;
        }>
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user && isAppSessionExpired(request)) {
    await supabase.auth.signOut();
    const redirect = isProtectedPath(request.nextUrl.pathname)
      ? redirectToAuth(request, "session_expired")
      : NextResponse.next({ request });
    copyResponseCookies(supabaseResponse, redirect);
    clearSessionStartedCookie(redirect);
    return redirect;
  }

  if (user?.email && !user.email_confirmed_at) {
    await supabase.auth.signOut();
    const redirect = isProtectedPath(request.nextUrl.pathname)
      ? redirectToAuth(request, "email_unverified")
      : NextResponse.next({ request });
    copyResponseCookies(supabaseResponse, redirect);
    clearSessionStartedCookie(redirect);
    return redirect;
  }

  if (user && !getSessionStartedAt(request)) {
    setSessionStartedCookie(supabaseResponse);
  }

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    return redirectToAuth(request);
  }

  return supabaseResponse;
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const AUTH_SESSION_STARTED_COOKIE = "dd_session_started_at";
const DEFAULT_MAX_SESSION_AGE_SECONDS = 60 * 60 * 12;

export function getMaxSessionAgeSeconds() {
  const configured = Number(process.env.AUTH_MAX_SESSION_AGE_SECONDS);
  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_MAX_SESSION_AGE_SECONDS;
  }

  return Math.min(configured, 60 * 60 * 24 * 30);
}

export function getSessionStartedAt(request: NextRequest) {
  const raw = request.cookies.get(AUTH_SESSION_STARTED_COOKIE)?.value;
  const startedAt = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(startedAt) ? startedAt : null;
}

export function isAppSessionExpired(request: NextRequest) {
  const startedAt = getSessionStartedAt(request);
  if (!startedAt) return false;

  return Date.now() - startedAt > getMaxSessionAgeSeconds() * 1000;
}

export function setSessionStartedCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_SESSION_STARTED_COOKIE,
    value: String(Date.now()),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getMaxSessionAgeSeconds()
  });
}

export function clearSessionStartedCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_SESSION_STARTED_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

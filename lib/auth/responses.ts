import { NextResponse } from "next/server";

export function authJson(
  body: Record<string, unknown>,
  init?: ResponseInit
) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export function getRequestOrigin(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}

export function sanitizeAuthError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "");
    if (/rate limit|too many/i.test(message)) {
      return "Too many attempts. Please wait before trying again.";
    }
  }

  return "Could not complete secure account request.";
}

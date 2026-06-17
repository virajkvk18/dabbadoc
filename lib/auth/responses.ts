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
  const fallbackOrigin = new URL(request.url).origin;
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!configuredAppUrl) return fallbackOrigin;

  try {
    const configuredOrigin = new URL(configuredAppUrl).origin;
    if (
      process.env.NODE_ENV === "production" &&
      configuredOrigin.startsWith("http://")
    ) {
      return fallbackOrigin;
    }

    return configuredOrigin;
  } catch {
    return fallbackOrigin;
  }
}

type AuthProviderError = {
  code?: unknown;
  message?: unknown;
  name?: unknown;
  status?: unknown;
};

function getAuthProviderError(error: unknown) {
  return error && typeof error === "object" ? (error as AuthProviderError) : null;
}

function redactAuthMessage(message: string) {
  return message.replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    "[email]"
  );
}

function providerMessage(error: unknown) {
  const providerError = getAuthProviderError(error);
  return redactAuthMessage(String(providerError?.message ?? ""));
}

export function getAuthErrorMetadata(error: unknown) {
  const providerError = getAuthProviderError(error);
  if (!providerError) return undefined;

  return {
    providerCode:
      typeof providerError.code === "string" ? providerError.code : undefined,
    providerName:
      typeof providerError.name === "string" ? providerError.name : undefined,
    providerStatus:
      typeof providerError.status === "number" ? providerError.status : undefined,
    providerMessage: providerMessage(error) || undefined
  };
}

export function sanitizeAuthError(error: unknown) {
  const message = providerMessage(error);

  if (message) {
    if (/rate limit|too many|too many.*email|email.*rate/i.test(message)) {
      return "Too many attempts. Please wait before trying again.";
    }

    if (/already registered|already exists|user already exists|email exists/i.test(message)) {
      return "This email is already registered. Please log in or use forgot password.";
    }

    if (/redirect|not allowed|url.*not.*allow/i.test(message)) {
      return "Auth redirect URL is not allowed. Check Supabase URL Configuration.";
    }

    if (/signup.*disabled|signups.*disabled|registration.*disabled/i.test(message)) {
      return "New account signup is disabled in Supabase Auth settings.";
    }

    if (/smtp|send.*email|email.*send|confirmation.*email|error sending/i.test(message)) {
      return "Confirmation email could not be sent. Check Supabase email/SMTP settings or email rate limits.";
    }

    if (/database|saving new user|trigger|profiles/i.test(message)) {
      return "Account could not be created because Supabase database setup failed. Check Auth logs and profile trigger/table setup.";
    }
  }

  return "Could not complete secure account request.";
}

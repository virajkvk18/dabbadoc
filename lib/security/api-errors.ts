import { NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/security/audit-log";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly headers?: HeadersInit
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiErrorResponse(
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 400,
  context?: {
    request?: Request;
    userId?: string | null;
    route?: string;
  }
) {
  if (error instanceof ApiError) {
    logSecurityEvent({
      type: "api_error",
      severity: error.status >= 500 ? "error" : "warning",
      request: context?.request,
      userId: context?.userId,
      status: error.status,
      reason: error.message,
      metadata: { route: context?.route }
    });

    return NextResponse.json(
      { error: error.message },
      { status: error.status, headers: error.headers }
    );
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  logSecurityEvent({
    type: "api_error",
    severity: fallbackStatus >= 500 ? "error" : "warning",
    request: context?.request,
    userId: context?.userId,
    status: fallbackStatus,
    reason: message,
    metadata: { route: context?.route }
  });

  return NextResponse.json({ error: fallbackMessage }, { status: fallbackStatus });
}

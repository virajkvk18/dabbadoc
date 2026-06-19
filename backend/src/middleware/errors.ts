import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { isProduction } from "../config.js";
import { logEvent } from "../utils/log.js";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new ApiError(`Route not found: ${request.method} ${request.path}`, 404));
};

export const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  void next;
  const zodMessage =
    error instanceof ZodError
      ? error.errors.map((issue) => issue.message).join(", ")
      : null;
  const status =
    error instanceof ApiError
      ? error.status
      : error instanceof ZodError
        ? 400
        : 500;
  const message =
    zodMessage ||
    (error instanceof Error ? error.message : "Backend request failed.");

  logEvent(status >= 500 ? "error" : "warn", "backend_request_error", {
    requestId: request.requestId,
    path: request.path,
    method: request.method,
    status,
    message
  });

  response.status(status).json({
    error: status >= 500 && isProduction() ? "Internal backend error." : message,
    requestId: request.requestId
  });
};

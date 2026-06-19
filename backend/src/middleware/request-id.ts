import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const attachRequestId: RequestHandler = (request, response, next) => {
  const existing = request.header("x-request-id")?.trim();
  request.requestId = existing || randomUUID();
  response.setHeader("X-Request-Id", request.requestId);
  next();
};

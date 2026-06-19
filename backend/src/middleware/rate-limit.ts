import type { Request, RequestHandler } from "express";
import { logEvent } from "../utils/log.js";

type Rule = {
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const maxBuckets = 12000;

function clientIp(request: Request) {
  const forwarded = request.header("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.ip || "unknown";
}

function prune(now: number) {
  if (buckets.size < maxBuckets / 2) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  while (buckets.size > maxBuckets) {
    const oldest = buckets.keys().next().value as string | undefined;
    if (!oldest) break;
    buckets.delete(oldest);
  }
}

function hashKey(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function rateLimit(
  rule: Rule,
  scope: string,
  keyFactory: (request: Request) => string = clientIp
): RequestHandler {
  return (request, response, next) => {
    const now = Date.now();
    prune(now);

    const key = hashKey(`${scope}:${keyFactory(request)}`);
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      const resetAt = now + rule.windowMs;
      buckets.set(key, { count: 1, resetAt });
      response.setHeader("X-RateLimit-Limit", String(rule.limit));
      response.setHeader("X-RateLimit-Remaining", String(rule.limit - 1));
      response.setHeader("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
      next();
      return;
    }

    current.count += 1;
    const remaining = Math.max(0, rule.limit - current.count);
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));

    response.setHeader("X-RateLimit-Limit", String(rule.limit));
    response.setHeader("X-RateLimit-Remaining", String(remaining));
    response.setHeader("X-RateLimit-Reset", String(Math.ceil(current.resetAt / 1000)));

    if (current.count > rule.limit) {
      response.setHeader("Retry-After", String(retryAfter));
      logEvent("warn", "rate_limit_block", {
        requestId: request.requestId,
        scope,
        path: request.path,
        method: request.method
      });
      response.status(429).json({
        error: "Too many requests. Please wait before trying again.",
        requestId: request.requestId
      });
      return;
    }

    next();
  };
}

export const globalRateLimit = rateLimit(
  { limit: 240, windowMs: 60 * 1000 },
  "global"
);

export const aiRateLimit = rateLimit(
  { limit: 24, windowMs: 10 * 60 * 1000 },
  "ai",
  (request) => request.user?.id || clientIp(request)
);

export const integrationRateLimit = rateLimit(
  { limit: 60, windowMs: 10 * 60 * 1000 },
  "integration",
  (request) => request.user?.id || clientIp(request)
);

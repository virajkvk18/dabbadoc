import { NextResponse, type NextRequest } from "next/server";
import { logSecurityEvent } from "@/lib/security/audit-log";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isHttpsEnforced() {
  return process.env.ENFORCE_HTTPS === "true" || process.env.NODE_ENV === "production";
}

function isSecurityHeadersEnabled() {
  return process.env.SECURITY_HEADERS_ENABLED !== "false";
}

function getHostWithoutPort(host: string) {
  if (host.startsWith("[")) {
    return host.slice(1, host.indexOf("]"));
  }

  const parts = host.split(":");
  return parts.length === 2 ? parts[0] ?? host : host;
}

function isLocalHost(host: string) {
  return LOCAL_HOSTS.has(getHostWithoutPort(host));
}

function getRequestProtocol(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    request.nextUrl.protocol.replace(":", "")
  );
}

function getCsp({ production, https }: { production: boolean; https: boolean }) {
  const scriptSrc = production
    ? "'self' 'unsafe-inline' https://checkout.razorpay.com"
    : "'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com";
  const connectSrc = production
    ? "'self' https://*.supabase.co https://api.razorpay.com https://checkout.razorpay.com"
    : "'self' ws: wss: http: https:";
  const upgrade = production && https ? "upgrade-insecure-requests" : "";

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `${upgrade.trim()}`
  ]
    .filter(Boolean)
    .join("; ");
}

export function enforceHttps(request: NextRequest) {
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const protocol = getRequestProtocol(request);

  if (!isHttpsEnforced() || isLocalHost(host) || protocol === "https") {
    return null;
  }

  const secureUrl = request.nextUrl.clone();
  secureUrl.protocol = "https:";

  logSecurityEvent({
    type: "https_redirect",
    severity: "warning",
    request,
    status: 308,
    reason: "insecure_http_request"
  });

  return NextResponse.redirect(secureUrl, 308);
}

export function addSecureDeploymentHeaders(
  request: NextRequest,
  response: NextResponse
) {
  if (!isSecurityHeadersEnabled()) return response;

  const host = request.headers.get("host") ?? request.nextUrl.host;
  const protocol = getRequestProtocol(request);
  const production = process.env.NODE_ENV === "production";
  const https = protocol === "https";

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), payment=(self)"
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Content-Security-Policy", getCsp({ production, https }));

  if (https && !isLocalHost(host)) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

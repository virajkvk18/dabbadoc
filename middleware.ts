import type { NextRequest } from "next/server";
import {
  addAbuseProtectionHeaders,
  protectRequestFromAbuse
} from "@/lib/security/abuse-protection";
import {
  addSecureDeploymentHeaders,
  enforceHttps,
  rejectUntrustedApiOrigin
} from "@/lib/security/secure-transport";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const httpsResponse = enforceHttps(request);
  if (httpsResponse) {
    return addSecureDeploymentHeaders(
      request,
      addAbuseProtectionHeaders(request, httpsResponse)
    );
  }

  const untrustedOriginResponse = rejectUntrustedApiOrigin(request);
  if (untrustedOriginResponse) {
    return addSecureDeploymentHeaders(
      request,
      addAbuseProtectionHeaders(request, untrustedOriginResponse)
    );
  }

  const abuseResponse = protectRequestFromAbuse(request);
  if (abuseResponse) {
    return addSecureDeploymentHeaders(
      request,
      addAbuseProtectionHeaders(request, abuseResponse)
    );
  }

  const response = await updateSession(request);
  return addSecureDeploymentHeaders(
    request,
    addAbuseProtectionHeaders(request, response)
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};

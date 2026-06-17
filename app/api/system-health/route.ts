import { NextResponse } from "next/server";
import { isDabbaAgentConfigured } from "@/lib/agents/dabbaAgentClient";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { isGroqConfigured } from "@/lib/groq/client";
import { isRazorpayConfigured } from "@/lib/payments/razorpay";
import { apiErrorResponse } from "@/lib/security/api-errors";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin-config";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type HealthStatus = "ready" | "missing" | "warning";

function status(configured: boolean): HealthStatus {
  return configured ? "ready" : "missing";
}

async function checkDabbaAgentReachable() {
  const url = process.env.DABBA_AGENT_URL?.replace(/\/$/, "");
  if (!isDabbaAgentConfigured() || !url) return "missing" as const;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${url}/health`, {
      signal: controller.signal,
      cache: "no-store"
    });
    return response.ok ? "ready" as const : "warning" as const;
  } catch {
    return "warning" as const;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  try {
    await requireVerifiedUser();

    const dabbaAgentStatus = await checkDabbaAgentReachable();

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      services: [
        {
          name: "Supabase client",
          status: status(isSupabaseConfigured()),
          detail: isSupabaseConfigured()
            ? "Auth and browser/server clients are configured."
            : "Add NEXT_PUBLIC_SUPABASE_URL and anon/publishable key."
        },
        {
          name: "Supabase admin/storage",
          status: status(isSupabaseAdminConfigured()),
          detail: isSupabaseAdminConfigured()
            ? "Service role key is available for protected storage/database writes."
            : "Add SUPABASE_SERVICE_ROLE_KEY for upload/history persistence."
        },
        {
          name: "Gemini AI",
          status: status(isGeminiConfigured()),
          detail: isGeminiConfigured()
            ? "Primary AI/OCR key is configured."
            : "Add GEMINI_API_KEY for primary AI analysis."
        },
        {
          name: "Groq fallback",
          status: status(isGroqConfigured()),
          detail: isGroqConfigured()
            ? "Fallback text/vision model is configured."
            : "Optional fallback is missing; Gemini/local fallback will be used."
        },
        {
          name: "Dabba Agent",
          status: dabbaAgentStatus,
          detail:
            dabbaAgentStatus === "ready"
              ? "Python agent service is reachable."
              : dabbaAgentStatus === "warning"
                ? "Configured, but /health did not respond successfully."
                : "Optional Python agent service is not configured."
        },
        {
          name: "Razorpay",
          status: status(isRazorpayConfigured()),
          detail: isRazorpayConfigured()
            ? "Payment server keys are configured."
            : "Payment keys are missing; premium checkout may use mock/dev behavior."
        }
      ]
    });
  } catch (error) {
    return apiErrorResponse(error, "Could not load system health", 400, {
      route: "/api/system-health"
    });
  }
}

import { Activity, AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDabbaAgentConfigured } from "@/lib/agents/dabbaAgentClient";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { isGroqConfigured } from "@/lib/groq/client";
import { isRazorpayConfigured } from "@/lib/payments/razorpay";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin-config";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

type ServiceHealth = {
  name: string;
  status: "ready" | "missing" | "warning";
  detail: string;
};

const statusMeta = {
  ready: {
    label: "Ready",
    icon: CheckCircle2,
    className: "border-primary/30 bg-primary/10 text-primary"
  },
  missing: {
    label: "Missing",
    icon: CircleDashed,
    className: "border-white/15 bg-white/10 text-muted-foreground"
  },
  warning: {
    label: "Check",
    icon: AlertTriangle,
    className: "border-secondary/30 bg-secondary/10 text-orange-100"
  }
};

function configuredStatus(configured: boolean): ServiceHealth["status"] {
  return configured ? "ready" : "missing";
}

async function checkDabbaAgentReachable(): Promise<ServiceHealth["status"]> {
  const url = process.env.DABBA_AGENT_URL?.replace(/\/$/, "");
  if (!isDabbaAgentConfigured() || !url) return "missing";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${url}/health`, {
      signal: controller.signal,
      cache: "no-store"
    });
    return response.ok ? "ready" : "warning";
  } catch {
    return "warning";
  } finally {
    clearTimeout(timeout);
  }
}

async function getHealth(): Promise<ServiceHealth[]> {
  const dabbaAgentStatus = await checkDabbaAgentReachable();

  return [
    {
      name: "Supabase client",
      status: configuredStatus(isSupabaseConfigured()),
      detail: isSupabaseConfigured()
        ? "Auth and browser/server clients are configured."
        : "Add NEXT_PUBLIC_SUPABASE_URL and anon/publishable key."
    },
    {
      name: "Supabase admin/storage",
      status: configuredStatus(isSupabaseAdminConfigured()),
      detail: isSupabaseAdminConfigured()
        ? "Service role key is available for protected storage/database writes."
        : "Add SUPABASE_SERVICE_ROLE_KEY for upload/history persistence."
    },
    {
      name: "Gemini AI",
      status: configuredStatus(isGeminiConfigured()),
      detail: isGeminiConfigured()
        ? "Primary AI/OCR key is configured."
        : "Add GEMINI_API_KEY for primary AI analysis."
    },
    {
      name: "Groq fallback",
      status: configuredStatus(isGroqConfigured()),
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
      status: configuredStatus(isRazorpayConfigured()),
      detail: isRazorpayConfigured()
        ? "Payment server keys are configured."
        : "Payment keys are missing; premium checkout may use mock/dev behavior."
    }
  ];
}

export default async function DiagnosticsPage() {
  const services = await getHealth();

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="System status"
        title="AI diagnostics"
        description="Check whether auth, storage, AI providers, Dabba Agent, and payments are configured for this deployment."
        icon={Activity}
        accent="tertiary"
        stats={[
          { label: "Services", value: String(services.length || 6) },
          {
            label: "Ready",
            value: String(services.filter((service) => service.status === "ready").length)
          },
          {
            label: "Needs check",
            value: String(services.filter((service) => service.status !== "ready").length)
          }
        ]}
      />

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Deployment services</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {services.length > 0 ? (
            services.map((service) => {
              const meta = statusMeta[service.status];
              const Icon = meta.icon;
              return (
                <div key={service.name} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{service.name}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {service.detail}
                      </p>
                    </div>
                    <Badge className={cn("shrink-0 gap-1", meta.className)}>
                      <Icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </Badge>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              Diagnostics could not be loaded. Refresh after signing in again.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

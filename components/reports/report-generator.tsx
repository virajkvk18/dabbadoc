"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { DabbaDocLogo } from "@/components/brand/dabbadoc-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ReportGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: "Demo Family",
          dateRange: "Last 30 days",
          reportData: { healthScore: 72 }
        })
      });

      if (!response.ok) throw new Error("Report service failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "dabbadoc-health-report.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="glass-panel neon-bloom-primary overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            PDF health report
          </CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Branded summary for sharing and personal tracking.
          </p>
        </div>
        <DabbaDocLogo size="sm" showText={false} />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Premium reports include score trend, receipt summary, LabelScan findings,
          risky foods, swaps, cost comparison, action plan, and disclaimer.
        </p>
        <Button onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Generate PDF
        </Button>
        {error ? <p className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

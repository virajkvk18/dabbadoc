import { FileText } from "lucide-react";
import { ReportGenerator } from "@/components/reports/report-generator";
import { MonthlyHealthInsights } from "@/components/reports/monthly-health-insights";
import { Disclaimer } from "@/components/common/disclaimer";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccountOverview } from "@/lib/supabase/account-overview";
import { getMyDiaryOverview } from "@/lib/supabase/my-diary";

export default async function ReportsPage() {
  const [account, diary] = await Promise.all([
    getAccountOverview(),
    getMyDiaryOverview()
  ]);

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Export center"
        title="PDF reports"
        description="Generate a report with score, receipt analysis, LabelScan summary, risky foods, swaps, cost comparison, and 7-day action plan."
        icon={FileText}
        accent="tertiary"
        stats={[
          { label: "Format", value: "PDF" },
          { label: "Weekly index", value: `${diary.weeklyAverage}/100` },
          { label: "Use", value: "Track / share" }
        ]}
      />
      <ReportGenerator
        userName={account.profile.fullName}
        healthScore={diary.today?.score ?? account.score.current}
      />
      <MonthlyHealthInsights
        activities={account.allActivities}
        userName={account.profile.fullName}
        healthScore={account.score.current}
      />
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Report sections</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[
            "User name and date range",
            "Dabba Health Index",
            "Receipt analysis summary",
            "Label scan summary",
            "Risky foods and healthy swaps",
            "Diary patterns and predictive alerts",
            "Cost comparison",
            "7-day action plan",
            "Disclaimer"
          ].map((section) => (
            <div key={section} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
              {section}
            </div>
          ))}
        </CardContent>
      </Card>
      <Disclaimer />
    </div>
  );
}

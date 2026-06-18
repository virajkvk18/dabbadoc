import { notFound } from "next/navigation";
import { Activity, AlertTriangle, HeartPulse, ShieldCheck, UserRound } from "lucide-react";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RemoveFamilyConnectionButton } from "@/components/family/family-actions";
import { getFamilyMemberSummary } from "@/lib/supabase/family";
import { formatDisplayDate, getAccountOverview } from "@/lib/supabase/account-overview";

const metricLabels = {
  weight: "Weight",
  bmi: "BMI",
  bloodPressureStatus: "Blood Pressure Status",
  bloodSugarStatus: "Blood Sugar Status",
  activityScore: "Activity Score",
  sleepScore: "Sleep Score"
};

export default async function FamilyMemberSummaryPage({
  params
}: {
  params: Promise<{ connectionId: string }>;
}) {
  const { connectionId } = await params;
  const account = await getAccountOverview();
  if (account.profile.plan !== "premium_plus") {
    notFound();
  }

  let summary: Awaited<ReturnType<typeof getFamilyMemberSummary>>;

  try {
    summary = await getFamilyMemberSummary(connectionId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Family summary"
        title={summary.personal.name}
        description={`Read-only summary for ${summary.personal.relationship}. Detailed private records are not shared here.`}
        icon={UserRound}
        accent="primary"
        actions={<RemoveFamilyConnectionButton connectionId={connectionId} />}
        stats={[
          {
            label: "Health Score",
            value: summary.summary.healthScore === null ? "--" : `${summary.summary.healthScore}/100`
          },
          { label: "Trend", value: summary.summary.scoreTrend },
          { label: "Reports", value: `${summary.summary.reportsCount}` }
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Personal information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Name", summary.personal.name],
              ["Relationship", summary.personal.relationship],
              ["Age", summary.personal.age],
              ["Gender", summary.personal.gender]
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-primary" />
              Health summary
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ["Overall Health Score", summary.summary.healthScore === null ? "--" : `${summary.summary.healthScore}/100`],
              ["Score Trend", summary.summary.scoreTrend],
              ["Last Checkup Date", summary.summary.lastCheckupDate ? formatDisplayDate(summary.summary.lastCheckupDate) : "Not available"],
              ["Number of Reports", String(summary.summary.reportsCount)],
              ["Tracking Streak", `${summary.summary.streakDays} days`],
              ["Saved Activity", `${summary.summary.scansCount} scans/diaries`]
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="mono-label text-[10px] text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Health metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {Object.entries(metricLabels).map(([key, label]) => (
            <div key={key} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="mono-label text-[10px] text-muted-foreground">{label}</p>
              <p className="mt-1 text-sm font-bold text-white">
                {summary.metrics[key as keyof typeof summary.metrics]}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-secondary" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.alerts.length === 0 ? (
            <p className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
              No important family alerts right now.
            </p>
          ) : (
            summary.alerts.map((alert) => (
              <div key={alert} className="flex items-start gap-3 rounded-xl border border-secondary/25 bg-secondary/10 p-3">
                <Badge variant="secondary">Alert</Badge>
                <p className="text-sm leading-6 text-orange-100">{alert}</p>
              </div>
            ))
          )}
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-muted-foreground">
            This page intentionally shows only high-level family summaries. Private detailed scans, reports, OCR text, settings, and uploads remain hidden.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

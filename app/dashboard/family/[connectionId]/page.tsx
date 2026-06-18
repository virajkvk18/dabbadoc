import { notFound } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  HeartPulse,
  ReceiptText,
  ShieldCheck,
  Utensils,
  UserRound
} from "lucide-react";
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

const scoreSourceLabels = {
  health_index: "Health index",
  receipt: "Receipt scan",
  label: "Label scan",
  diary: "Food diary"
};

function ScoreBadge({ score }: { score: number | null }) {
  return score === null ? (
    <Badge variant="outline">No score</Badge>
  ) : (
    <Badge variant={score >= 70 ? "default" : score >= 50 ? "secondary" : "danger"}>
      {score}/100
    </Badge>
  );
}

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
              ["Latest Score Source", summary.summary.scoreSource ? scoreSourceLabels[summary.summary.scoreSource] : "No score yet"],
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
            <Utensils className="h-5 w-5 text-primary" />
            Food history summary
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            High-level food patterns only. Full scans, OCR text, uploads, and private notes stay hidden.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-semibold text-white">
                <ReceiptText className="h-4 w-4 text-primary" />
                Latest receipt
              </p>
              <ScoreBadge score={summary.foodHistory.latestReceipt?.score ?? null} />
            </div>
            {summary.foodHistory.latestReceipt ? (
              <div className="mt-3 space-y-3">
                <p className="text-xs font-semibold text-primary">
                  {formatDisplayDate(summary.foodHistory.latestReceipt.date)}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Items: {summary.foodHistory.latestReceipt.items.length ? summary.foodHistory.latestReceipt.items.join(", ") : "No clear items"}
                </p>
                <p className="rounded-xl border border-secondary/25 bg-secondary/10 p-3 text-sm text-orange-100">
                  Watch: {summary.foodHistory.latestReceipt.watch.length ? summary.foodHistory.latestReceipt.watch.join(", ") : "No major watch signal"}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No receipt scans shared in summary yet.</p>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-semibold text-white">
                <ClipboardList className="h-4 w-4 text-primary" />
                Latest label
              </p>
              <ScoreBadge score={summary.foodHistory.latestLabel?.score ?? null} />
            </div>
            {summary.foodHistory.latestLabel ? (
              <div className="mt-3 space-y-3">
                <p className="text-xs font-semibold text-primary">
                  {formatDisplayDate(summary.foodHistory.latestLabel.date)}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Product: {summary.foodHistory.latestLabel.product}
                </p>
                <p className="rounded-xl border border-secondary/25 bg-secondary/10 p-3 text-sm text-orange-100">
                  Warnings: {summary.foodHistory.latestLabel.warnings.length ? summary.foodHistory.latestLabel.warnings.join(", ") : "No major warning"}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No label scans shared in summary yet.</p>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-semibold text-white">
                <Utensils className="h-4 w-4 text-primary" />
                Latest diary
              </p>
              <ScoreBadge score={summary.foodHistory.latestDiary?.score ?? null} />
            </div>
            {summary.foodHistory.latestDiary ? (
              <div className="mt-3 space-y-3">
                <p className="text-xs font-semibold text-primary">
                  {formatDisplayDate(summary.foodHistory.latestDiary.date)}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {summary.foodHistory.latestDiary.summary ?? "Diary summary available"}
                </p>
                <p className="rounded-xl border border-secondary/25 bg-secondary/10 p-3 text-sm text-orange-100">
                  Watch: {summary.foodHistory.latestDiary.watchItems.length ? summary.foodHistory.latestDiary.watchItems.join(", ") : "No major watch item"}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No diary entries shared in summary yet.</p>
            )}
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 lg:col-span-3">
            <p className="font-semibold text-white">Repeated watch items</p>
            {summary.foodHistory.repeatedWatch.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {summary.foodHistory.repeatedWatch.map((item) => (
                  <Badge key={item.item} variant="outline">
                    {item.item} x{item.count}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                More scans or diary entries are needed to find repeated food patterns.
              </p>
            )}
          </div>
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

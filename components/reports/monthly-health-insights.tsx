"use client";

import { BarChart3, MessageCircle, Share2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Activity = {
  id: string;
  type: string;
  title: string;
  detail: string;
  description: string;
  createdAt: string;
  score?: number;
  metrics: string[];
  tags: string[];
  resultSections: Array<{ title: string; items: string[] }>;
};

const patternRules = [
  {
    key: "highSugar",
    label: "High sugar",
    match: /sugar|sweet|dessert|chocolate|cold drink|juice|added sugar/i,
    color: "bg-red-300"
  },
  {
    key: "highSodium",
    label: "High sodium",
    match: /sodium|salt|namkeen|chips|processed|msg/i,
    color: "bg-orange-300"
  },
  {
    key: "lowProtein",
    label: "Low protein",
    match: /low protein|protein/i,
    color: "bg-yellow-200"
  },
  {
    key: "friedPackaged",
    label: "Fried/packaged",
    match: /fried|oil|palm|packaged|maida|refined|chips|biscuit/i,
    color: "bg-primary"
  }
];

function activityText(activity: Activity) {
  return [
    activity.title,
    activity.detail,
    activity.description,
    ...activity.tags,
    ...activity.metrics,
    ...activity.resultSections.flatMap((section) => section.items)
  ].join(" ");
}

function monthlySummary(activities: Activity[]) {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = activities.filter((activity) => new Date(activity.createdAt).getTime() >= cutoff);
  const counts = patternRules.map((rule) => ({
    ...rule,
    count: recent.filter((activity) => rule.match.test(activityText(activity))).length
  }));
  const scores = recent
    .filter((activity) => typeof activity.score === "number")
    .map((activity) => activity.score as number);
  const averageScore = scores.length
    ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
    : 0;
  const firstScore = scores.at(-1) ?? averageScore;
  const latestScore = scores[0] ?? averageScore;
  const trend = latestScore - firstScore;
  const topPattern = [...counts].sort((a, b) => b.count - a.count)[0];

  return { recent, counts, averageScore, trend, topPattern };
}

export function MonthlyHealthInsights({
  activities,
  userName,
  healthScore
}: {
  activities: Activity[];
  userName: string;
  healthScore: number;
}) {
  const summary = monthlySummary(activities);
  const maxCount = Math.max(1, ...summary.counts.map((item) => item.count));
  const shareText = `DabbaDoc monthly summary for ${userName}: score ${healthScore}/100. Last 30 days: high sugar ${summary.counts[0].count} times, sodium ${summary.counts[1].count} times, low protein ${summary.counts[2].count} times, fried/packaged ${summary.counts[3].count} times. Top focus: ${summary.topPattern?.label ?? "build more scans"}. Not medical advice.`;

  async function shareSummary() {
    if (navigator.share) {
      await navigator.share({
        title: "DabbaDoc monthly health summary",
        text: shareText
      });
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <Card className="glass-panel border-primary/20">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Monthly health report
          </CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Auto-summary from your last 30 days of scans, labels, and diary entries.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={shareSummary} className="shrink-0">
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mono-label text-[10px] text-muted-foreground">Activities</p>
            <p className="mt-1 text-2xl font-black text-white">{summary.recent.length}</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
            <p className="mono-label text-[10px] text-muted-foreground">Avg score</p>
            <p className="mt-1 text-2xl font-black text-primary">
              {summary.averageScore || healthScore}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mono-label text-[10px] text-muted-foreground">Trend</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-black text-white">
              {summary.trend >= 0 ? (
                <TrendingUp className="h-5 w-5 text-primary" />
              ) : (
                <TrendingDown className="h-5 w-5 text-secondary" />
              )}
              {summary.trend > 0 ? "+" : ""}
              {summary.trend}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {summary.counts.map((item) => (
            <div key={item.key} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-white">{item.label}</p>
                <p className="text-sm font-bold text-muted-foreground">{item.count} times</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${Math.max(8, (item.count / maxCount) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <Share2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm leading-6 text-primary">
              {shareText}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

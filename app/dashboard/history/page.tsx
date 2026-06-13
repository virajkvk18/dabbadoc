import {
  CalendarDays,
  CreditCard,
  FileText,
  History,
  ScanLine,
  Upload,
  Utensils
} from "lucide-react";
import { HealthIndexChart } from "@/components/charts/health-index-chart";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDisplayDate,
  getAccountOverview,
  type ActivityType
} from "@/lib/supabase/account-overview";

const activityIcons: Record<ActivityType, typeof Upload> = {
  receipt: Upload,
  label: ScanLine,
  diary: Utensils,
  report: FileText,
  payment: CreditCard
};

const activityTone: Record<ActivityType, string> = {
  receipt: "bg-secondary/15 text-secondary border-secondary/25",
  label: "bg-primary/15 text-primary border-primary/25",
  diary: "bg-sky-400/10 text-sky-200 border-sky-300/25",
  report: "bg-white/10 text-white border-white/15",
  payment: "bg-orange-500/10 text-orange-100 border-orange-300/25"
};

export default async function HistoryPage() {
  const account = await getAccountOverview();

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Activity timeline"
        title="Health history"
        description="Every saved receipt scan, LabelScan, manual food diary, report, and payment event for this account appears here."
        icon={CalendarDays}
        stats={[
          { label: "Trend", value: account.score.trendLabel },
          { label: "Entries", value: `${account.counts.activities}` },
          { label: "Streak", value: `${account.streak.days} days` }
        ]}
      />

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Dabba Health Index trend</CardTitle>
        </CardHeader>
        <CardContent>
          <HealthIndexChart data={account.score.chart} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Receipts", value: account.counts.receipts },
          { label: "LabelScans", value: account.counts.labels },
          { label: "Manual diaries", value: account.counts.diaries },
          { label: "Reports", value: account.counts.reports }
        ].map((stat) => (
          <Card key={stat.label} className="glass-panel">
            <CardContent className="p-4">
              <p className="mono-label text-[10px] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-black text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4">
        {account.allActivities.length === 0 ? (
          <Card className="glass-panel">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                <History className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-white">No history yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload a receipt, scan a packaged label, or add a manual food
                  diary entry to create your first precise timeline record.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {account.allActivities.map((activity) => {
          const Icon = activityIcons[activity.type];
          return (
            <Card key={activity.id} className="glass-panel group">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <span
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition group-hover:scale-105 ${activityTone[activity.type]}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{activity.title}</p>
                        <Badge variant="outline">{activity.type}</Badge>
                        {typeof activity.score === "number" ? (
                          <Badge>Score {activity.score}/100</Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white/90">
                        {activity.detail}
                      </p>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                        {activity.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {activity.metrics.map((metric) => (
                          <Badge key={metric} variant="outline">{metric}</Badge>
                        ))}
                        {activity.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground lg:text-right">
                    {formatDisplayDate(activity.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

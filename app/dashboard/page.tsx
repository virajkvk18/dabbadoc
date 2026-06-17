import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  FileText,
  Flame,
  History,
  ScanLine,
  Sparkles,
  Upload,
  Utensils
} from "lucide-react";
import { BadgeGrid } from "@/components/badges/badge-grid";
import { HealthIndexChart } from "@/components/charts/health-index-chart";
import { Disclaimer } from "@/components/common/disclaimer";
import { HealthScoreGauge } from "@/components/dashboard/health-score-gauge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAccountOverview,
  getGreeting,
  type ActivityType
} from "@/lib/supabase/account-overview";

const quickActions = [
  {
    href: "/dashboard/upload-receipt",
    label: "Upload receipt",
    detail: "Bill, order screenshot, or grocery scan",
    icon: Upload,
    featured: false
  },
  {
    href: "/dashboard/label-scan",
    label: "Scan food label",
    detail: "Nutrition label and ingredients check",
    icon: ScanLine,
    featured: true
  },
  {
    href: "/dashboard/food-diary",
    label: "Add food diary",
    detail: "Home and outside meals with quantity",
    icon: Utensils,
    featured: false
  }
];

const activityIcons: Record<ActivityType, typeof Upload> = {
  receipt: Upload,
  label: ScanLine,
  diary: Utensils,
  report: FileText,
  payment: CreditCard
};

export default async function DashboardPage() {
  const account = await getAccountOverview();
  const greeting = getGreeting();
  const riskCount = account.riskSummary.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="secondary">
            {account.counts.activities > 0 ? "Monitoring active" : "Ready to begin"}
          </Badge>
          <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">
            {greeting}, {account.profile.fullName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Your food health overview is built from your saved scans, label checks,
            diary entries, reports, and streaks.
          </p>
        </div>
        <div className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
          <div>
            <p className="mono-label text-[10px] text-muted-foreground">Status</p>
            <p className="text-sm font-bold text-primary">
              {account.profile.isPremium ? `${account.profile.planLabel} active` : "Ready to scan"}
            </p>
          </div>
        </div>
      </div>

      <Card className="glass-panel overflow-hidden border-l-4 border-l-secondary">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-secondary/25 bg-secondary/15 text-secondary orange-glow">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-white">
                {account.profile.isPremium
                  ? `${account.profile.planLabel} intelligence active`
                  : "Premium intelligence preview"}
              </p>
              <p className="text-sm text-muted-foreground">
                {account.profile.isPremium
                  ? "Your account has paid access for deeper history, reports, and plan-specific insights."
                  : "Upgrade when you need unlimited scans, full history, and family tracking."}
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={account.profile.isPremium ? "/dashboard/profile" : "/pricing"}>
              {account.profile.isPremium ? "View profile" : "View plans"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <HealthScoreGauge
          score={account.score.current}
          category={account.score.category}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Risk signals"
            value={`${riskCount}`}
            detail={riskCount > 0 ? "From your saved analyses" : "No strong risks yet"}
            icon={Sparkles}
          />
          <StatCard
            label="Streak count"
            value={`${account.streak.days} days`}
            detail={account.streak.label}
            icon={Flame}
          />
          <StatCard
            label="Badges earned"
            value={`${account.badges.length}`}
            detail="Based on your account activity"
            icon={BadgeCheck}
          />
          <StatCard
            label="Total scans"
            value={`${account.counts.scans}`}
            detail={`${account.counts.receipts} receipts, ${account.counts.labels} labels, ${account.counts.diaries} diaries`}
            icon={ScanLine}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card
                className={
                  action.featured
                    ? "glass-panel neon-bloom-primary h-full border-primary/40"
                    : "glass-panel h-full"
                }
              >
                <CardContent className="group flex min-h-40 flex-col items-center justify-center gap-4 p-6 text-center">
                  <span
                    className={
                      action.featured
                        ? "grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_22px_rgba(129,247,89,0.42)] transition group-hover:scale-110"
                        : "grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition group-hover:scale-110 group-hover:border-primary/35 group-hover:text-primary"
                    }
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className={action.featured ? "font-black text-primary" : "font-black text-white"}>
                      {action.label}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{action.detail}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">
        <Card className="glass-panel min-h-[360px]">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Index trend</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Latest saved scores from scans, labels, and diary entries
              </p>
            </div>
            <Badge>{account.score.trendLabel}</Badge>
          </CardHeader>
          <CardContent>
            <HealthIndexChart data={account.score.chart} />
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent activity</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/history">
                View all
                <History className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {account.recentActivities.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">No saved activity yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Upload a receipt, scan a label, or add a manual food diary
                      entry to start building your timeline.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            {account.recentActivities.map((activity) => {
              const Icon = activityIcons[activity.type];
              return (
                <div key={activity.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{activity.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {activity.metrics.slice(0, 3).map((metric) => (
                          <Badge key={metric} variant="outline">{metric}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Food risk summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {account.riskSummary.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                No risk summary yet. Run one receipt, label, or diary analysis to
                see personalized signals here.
              </p>
            ) : null}
            {account.riskSummary.map((risk) => (
              <div key={`${risk.label}-${risk.detail}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="font-semibold text-white">{risk.label}</p>
                <p className="text-sm text-muted-foreground">{risk.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Badges earned</CardTitle>
          </CardHeader>
          <CardContent>
            {account.badges.length > 0 ? (
              <BadgeGrid badges={account.badges} />
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                Complete your first analysis to unlock badges.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/dashboard/reports">
            <FileText className="h-4 w-4" />
            Generate PDF report
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/history">Open activity history</Link>
        </Button>
      </div>
      <Disclaimer />
    </div>
  );
}

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  FileText,
  History,
  LockKeyhole,
  PlayCircle,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Utensils
} from "lucide-react";
import { BadgeGrid } from "@/components/badges/badge-grid";
import { HealthIndexChart } from "@/components/charts/health-index-chart";
import { Disclaimer } from "@/components/common/disclaimer";
import { HealthScoreGauge } from "@/components/dashboard/health-score-gauge";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  StreakMomentumCard,
  type StreakDay
} from "@/components/dashboard/streak-momentum-card";
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
    icon: Upload,
    featured: false
  },
  {
    href: "/dashboard/label-scan",
    label: "Scan food label",
    icon: ScanLine,
    featured: true
  },
  {
    href: "/dashboard/food-diary",
    label: "Add food diary",
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

const weekdayFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  timeZone: "Asia/Kolkata"
});

const dateLabelFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata"
});

const dateKeyFormatter = new Intl.DateTimeFormat("en-IN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Kolkata"
});

function getDateKey(value: string | Date) {
  const parts = dateKeyFormatter.formatToParts(
    typeof value === "string" ? new Date(value) : value
  );
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

function buildActivityWeek(activityDates: string[]): StreakDay[] {
  const activeDates = new Set(activityDates.map((date) => getDateKey(date)));
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getTime() - (6 - index) * 24 * 60 * 60 * 1000);
    return {
      label: weekdayFormatter.format(date).slice(0, 2),
      dateLabel: dateLabelFormatter.format(date),
      active: activeDates.has(getDateKey(date)),
      today: index === 6
    };
  });
}

export default async function DashboardPage() {
  const account = await getAccountOverview();
  const greeting = getGreeting();
  const riskCount = account.riskSummary.length;
  const activityWeek = buildActivityWeek(
    account.allActivities.map((activity) => activity.createdAt)
  );
  const nextStep =
    account.counts.diaries === 0
      ? {
          title: "Log your first meal",
          detail: "Start today's food timeline and begin building a consistent daily rhythm.",
          href: "/dashboard/food-diary",
          action: "Add a meal"
        }
      : account.counts.labels === 0
        ? {
            title: "Check one food label",
            detail: "Review the ingredients and nutrition signals before your next packaged snack.",
            href: "/dashboard/label-scan",
            action: "Scan a label"
          }
        : account.counts.receipts === 0
          ? {
              title: "Add a recent food bill",
              detail: "Upload a receipt or order screenshot to complete your purchase history.",
              href: "/dashboard/upload-receipt",
              action: "Upload receipt"
            }
          : {
              title: "Review your latest pattern",
              detail: `You have ${account.counts.activities} saved activities ready to compare.`,
              href: "/dashboard/history",
              action: "Open history"
            };

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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mono-label text-[10px] text-primary">Quick capture</p>
              <h2 className="mt-1 text-xl font-black text-white">What are you logging?</h2>
            </div>
            <p className="text-sm text-muted-foreground">Choose a capture flow</p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={
                    action.featured
                      ? "glass-panel neon-bloom-primary group flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border-primary/40 p-3 text-center transition duration-300 hover:-translate-y-1 sm:min-h-20 sm:flex-row sm:justify-start sm:text-left"
                      : "glass-panel group flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl p-3 text-center transition duration-300 hover:-translate-y-1 sm:min-h-20 sm:flex-row sm:justify-start sm:text-left"
                  }
                >
                  <span
                    className={
                      action.featured
                        ? "grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_18px_rgba(129,247,89,0.32)] transition duration-300 group-hover:scale-105"
                        : "grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-white transition duration-300 group-hover:scale-105 group-hover:border-primary/35 group-hover:text-primary"
                    }
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={
                      action.featured
                        ? "text-xs font-black leading-4 text-primary sm:text-sm"
                        : "text-xs font-black leading-4 text-white sm:text-sm"
                    }
                  >
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <StreakMomentumCard days={account.streak.days} week={activityWeek} />
        </div>

        <div className="space-y-4 xl:sticky xl:top-5">
          <Card className="glass-panel overflow-hidden border-primary/20">
            <CardHeader className="flex-row items-start justify-between space-y-0 p-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  DabbaDoc in action
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">A quick product walkthrough</p>
              </div>
              <Badge variant="outline">Guide</Badge>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
                <video
                  className="aspect-video w-full bg-black object-contain"
                  src="/videos/dabbadoc-explainer.mp4"
                  aria-label="DabbaDoc product walkthrough"
                  controls
                  muted
                  autoPlay
                  loop
                  playsInline
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-white">Scan Before You Eat</span>
                <span className="text-muted-foreground">Product tour</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel overflow-hidden border-secondary/25">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-secondary/25 bg-secondary/15 text-secondary">
                  <Target className="h-5 w-5" />
                </span>
                <Badge variant="secondary">Recommended</Badge>
              </div>
              <p className="mt-4 font-black text-white">{nextStep.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{nextStep.detail}</p>
              <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
                <Link href={nextStep.href}>
                  {nextStep.action}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid items-stretch gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <HealthScoreGauge
          score={account.score.current}
          category={account.score.category}
          className="h-full"
          fillHeight
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Risk signals"
            value={`${riskCount}`}
            detail={riskCount > 0 ? "From your saved analyses" : "No strong risks yet"}
            icon={Sparkles}
            variant="secondary"
            className="h-full items-center"
          />
          <StatCard
            label="Badges earned"
            value={`${account.badges.length}`}
            detail="Based on your account activity"
            icon={BadgeCheck}
            variant="primary"
            className="h-full items-center"
          />
          <StatCard
            label="Total scans"
            value={`${account.counts.scans}`}
            detail={`${account.counts.receipts} receipts, ${account.counts.labels} labels, ${account.counts.diaries} diaries`}
            icon={ScanLine}
            className="h-full items-center"
          />
        </div>
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
        <Card className="glass-panel min-h-[360px]">
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
              <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-primary/25 bg-primary/5 p-6 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary motion-safe:animate-pulse">
                  <CalendarDays className="h-6 w-6" />
                </span>
                <p className="mt-4 font-semibold text-white">Your timeline starts with one entry</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  Save today&apos;s meal to begin your streak and build a useful food-health history.
                </p>
                <Button asChild size="sm" className="mt-5">
                  <Link href="/dashboard/food-diary">
                    Add today&apos;s meal
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
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
        <Card className="glass-panel h-full">
          <CardHeader>
            <CardTitle>Food risk summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {account.riskSummary.length === 0 ? (
              <div className="flex min-h-44 flex-col justify-center rounded-xl border border-dashed border-primary/20 bg-primary/5 p-5">
                <ShieldCheck className="h-7 w-7 text-primary" />
                <p className="mt-3 font-semibold text-white">No saved risk signals yet</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  A label check is the quickest way to start your personalized summary.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4 w-fit">
                  <Link href="/dashboard/label-scan">Check a food label</Link>
                </Button>
              </div>
            ) : null}
            {account.riskSummary.map((risk) => (
              <div key={`${risk.label}-${risk.detail}`} className="rounded-xl border border-white/10 bg-white/5 p-3 transition-transform duration-200 hover:translate-x-1">
                <p className="font-semibold text-white">{risk.label}</p>
                <p className="text-sm text-muted-foreground">{risk.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="glass-panel h-full">
          <CardHeader>
            <CardTitle>Badges earned</CardTitle>
          </CardHeader>
          <CardContent>
            {account.badges.length > 0 ? (
              <BadgeGrid badges={account.badges} />
            ) : (
              <div className="grid gap-2">
                {["Complete first scan", "Reach a 3-day streak", "Review a food label"].map(
                  (goal) => (
                    <div
                      key={goal}
                      className="flex min-h-14 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-muted-foreground">
                        <LockKeyhole className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{goal}</p>
                        <p className="text-xs text-muted-foreground">Badge locked</p>
                      </div>
                    </div>
                  )
                )}
              </div>
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

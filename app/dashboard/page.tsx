import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  AlertTriangle,
  BadgeCheck,
  BookOpenText,
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
import { ControlledLoopVideo } from "@/components/common/controlled-loop-video";
import { Disclaimer } from "@/components/common/disclaimer";
import { LiveGreeting } from "@/components/common/live-date-time";
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
  appDateKeyToDate,
  formatAppMonthDay,
  formatAppWeekday,
  getAppDateKey,
  shiftAppDateKey
} from "@/lib/date-time";
import {
  formatDisplayDate,
  getAccountOverview,
  type ActivityType
} from "@/lib/supabase/account-overview";
import { getMyDiaryOverview } from "@/lib/supabase/my-diary";

const quickActions = [
  {
    href: "/dashboard/upload-receipt",
    label: "Upload receipt",
    description: "Analyze a grocery or restaurant bill",
    icon: Upload,
    featured: false
  },
  {
    href: "/dashboard/label-scan",
    label: "Scan food label",
    description: "Check ingredients before you eat",
    icon: ScanLine,
    featured: true
  },
  {
    href: "/dashboard/food-diary",
    label: "Add food diary",
    description: "Log a meal in under a minute",
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

function buildActivityWeek(activityDates: string[], now: Date): StreakDay[] {
  const activeDates = new Set(activityDates.map((date) => getAppDateKey(date)));
  const todayKey = getAppDateKey(now);

  return Array.from({ length: 7 }, (_, index) => {
    const dateKey = shiftAppDateKey(todayKey, index - 6);
    const date = appDateKeyToDate(dateKey);
    return {
      label: formatAppWeekday(date).slice(0, 2),
      dateLabel: formatAppMonthDay(date),
      active: activeDates.has(dateKey),
      today: dateKey === todayKey
    };
  });
}

function OverviewSectionHeading({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="mono-label text-[10px] text-primary">{eyebrow}</p>
        <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white">{title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type Challenge = {
  title: string;
  detail: string;
  progress: number;
  badge: string;
  href: string;
  action: string;
  status: "active" | "earned" | "suggested";
};

function buildDabbaChallenges(params: {
  riskSummary: Array<{ label: string; detail: string; severity: string }>;
  streakDays: number;
  badges: string[];
  scans: number;
}): Challenge[] {
  const riskText = params.riskSummary
    .map((risk) => `${risk.label} ${risk.detail}`)
    .join(" ")
    .toLowerCase();
  const hasSugar = /sugar|sweet|cold drink|soft drink|juice|dessert/.test(riskText);
  const hasProteinGap = /protein/.test(riskText) || params.scans < 3;
  const hasPackaged = /sodium|chips|namkeen|processed|maida|fried|instant/.test(riskText);

  return [
    {
      title: "7-Day No Soft Drink Challenge",
      detail: hasSugar
        ? "Your history has sugar signals. Avoid soft drinks and sweet packaged drinks for 7 days."
        : "Keep sugar signals low by avoiding soft drinks this week.",
      progress: Math.min(100, Math.round((params.streakDays / 7) * 100)),
      badge: "Sugar control badge",
      href: "/dashboard/food-diary",
      action: "Log drink-free day",
      status: params.badges.includes("Sugar control badge") ? "earned" : hasSugar ? "active" : "suggested"
    },
    {
      title: "10-Day Protein Boost",
      detail: "Add one protein anchor daily: dal, curd, paneer, tofu, eggs, chana, sprouts, or soy.",
      progress: Math.min(100, Math.round((params.streakDays / 10) * 100)),
      badge: "Protein improvement badge",
      href: "/dashboard/food-diary",
      action: "Add protein entry",
      status: params.badges.includes("Protein improvement badge") ? "earned" : hasProteinGap ? "active" : "suggested"
    },
    {
      title: "Healthy Breakfast Streak",
      detail: "Track breakfast for 5 days and keep it home-style with protein or fiber.",
      progress: Math.min(100, Math.round((params.streakDays / 5) * 100)),
      badge: "Healthy breakfast badge",
      href: "/dashboard/food-diary",
      action: "Log breakfast",
      status: params.streakDays >= 5 ? "earned" : "active"
    },
    {
      title: "Packaged Snack Swap",
      detail: hasPackaged
        ? "Swap chips, namkeen, instant noodles, or cookies with roasted chana, makhana, sprouts, or curd."
        : "Build a smarter snack shelf before packaged cravings hit.",
      progress: Math.min(100, params.scans * 20),
      badge: "Smart swap badge",
      href: "/dashboard/label-scan",
      action: "Scan snack label",
      status: params.badges.includes("Smart swap badge") ? "earned" : hasPackaged ? "active" : "suggested"
    }
  ];
}

export default async function DashboardPage() {
  const [account, diary] = await Promise.all([
    getAccountOverview(),
    getMyDiaryOverview()
  ]);
  const now = new Date();
  const activityWeek = buildActivityWeek(
    account.allActivities.map((activity) => activity.createdAt),
    now
  );
  const challenges = buildDabbaChallenges({
    riskSummary: account.riskSummary,
    streakDays: account.streak.days,
    badges: account.badges,
    scans: account.counts.scans
  });

  return (
    <div className="space-y-8 pb-4 sm:space-y-10">
      <section className="glass-panel scan-frame relative overflow-hidden rounded-3xl border-primary/20 p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary">Daily health overview</Badge>
            <LiveGreeting name={account.profile.fullName} initialNow={now.toISOString()} />
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              See today&apos;s food-health position, understand the pattern behind it,
              and take the next useful action without digging through reports.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[430px]">
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.07] p-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                <p className="mono-label text-[10px] text-primary">Account status</p>
              </div>
              <p className="mt-2 text-sm font-bold text-white">
                {account.counts.activities > 0 ? "Monitoring active" : "Ready for your first scan"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-secondary" />
                <p className="mono-label text-[10px] text-muted-foreground">Current plan</p>
              </div>
              <p className="mt-2 text-sm font-bold text-white">{account.profile.planLabel}</p>
            </div>
            <Button asChild className="sm:col-span-1">
              <Link href="/my-diary">
                <BookOpenText className="h-4 w-4" />
                Open My Diary
              </Link>
            </Button>
            <Button asChild variant="outline" className="sm:col-span-1">
              <Link href={account.profile.isPremium ? "/dashboard/profile" : "/pricing"}>
                {account.profile.isPremium ? "Manage profile" : "Explore plans"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <OverviewSectionHeading
          eyebrow="Today"
          title="Your health at a glance"
          description="The essentials first: today&apos;s index, your weekly direction, and the consistency behind it."
        />
        <div className="grid items-stretch gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <HealthScoreGauge
            score={diary.today?.score ?? account.score.current}
            category={diary.today?.status ?? "Add today's first meal"}
            className="h-full"
            fillHeight
          />
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Weekly average"
                value={`${diary.weeklyAverage}`}
                suffix="/100"
                detail="Across active diary days"
                icon={Sparkles}
                variant="secondary"
              />
              <StatCard
                label="Predictive alerts"
                value={`${diary.weeklyAlerts.length}`}
                detail={diary.weeklyAlerts.length ? "Patterns worth reviewing" : "No repeated pattern yet"}
                icon={AlertTriangle}
                variant="primary"
              />
              <StatCard
                label="Diary streak"
                value={`${diary.currentStreak}`}
                suffix="days"
                detail={`${diary.totalLoggedDays} total logged days`}
                icon={CalendarDays}
              />
            </div>

            <Card className="glass-panel overflow-hidden border-white/10">
              <CardContent className="p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">Quick capture</p>
                    <p className="mt-1 text-xs text-muted-foreground">Choose the fastest way to add food evidence</p>
                  </div>
                  <Badge variant="outline">3 actions</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.href}
                        href={action.href}
                        className={
                          action.featured
                            ? "group flex min-h-24 items-center gap-3 rounded-xl border border-primary/35 bg-primary/[0.09] p-3.5 transition hover:border-primary/60 hover:bg-primary/[0.13]"
                            : "group flex min-h-24 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 transition hover:border-primary/30 hover:bg-white/[0.07]"
                        }
                      >
                        <span className={action.featured ? "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_18px_rgba(129,247,89,0.25)]" : "grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white transition group-hover:text-primary"}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-black text-white">{action.label}</span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{action.description}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <OverviewSectionHeading
          eyebrow="Consistency"
          title="Build momentum, one entry at a time"
          description="Your streak and weekly rhythm turn isolated scans into a useful health pattern."
        />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
          <StreakMomentumCard days={account.streak.days} week={activityWeek} />

          <Card className="glass-panel overflow-hidden border-primary/20">
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-4 sm:p-5">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  Product guide
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">A 60-second DabbaDoc walkthrough</p>
              </div>
              <Badge variant="outline">Guide</Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
                <ControlledLoopVideo
                  src="/videos/dabbadoc-explainer.mp4"
                  ariaLabel="DabbaDoc product walkthrough"
                  videoClassName="aspect-video w-full bg-black object-contain"
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Capture", "Understand", "Improve"].map((step, index) => (
                  <div key={step} className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-center">
                    <p className="mono-label text-[9px] text-primary">0{index + 1}</p>
                    <p className="mt-1 text-[11px] font-bold text-white">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <OverviewSectionHeading
          eyebrow="Goals"
          title="Focused challenges, measurable progress"
          description="Short food missions turn recommendations into actions you can repeat and track."
          action={<Badge variant="secondary">{challenges.length} available</Badge>}
        />
        <Card className="glass-panel border-primary/20">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            {challenges.map((challenge) => (
              <div
                key={challenge.title}
                className="flex h-full flex-col rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-primary/30 hover:bg-primary/[0.05]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Target className="h-4 w-4" />
                  </span>
                  <Badge
                    variant={
                      challenge.status === "earned"
                        ? "default"
                        : challenge.status === "active"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {challenge.status}
                  </Badge>
                </div>
                <p className="mt-3 font-bold text-white">{challenge.title}</p>
                <p className="mt-1.5 flex-1 text-sm leading-6 text-muted-foreground">
                  {challenge.detail}
                </p>
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-semibold text-muted-foreground">{challenge.badge}</span>
                    <span className="font-black text-white">{challenge.progress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full border border-white/10 bg-black/20">
                    <div
                      className="h-full rounded-full bg-primary shadow-[0_0_12px_rgba(129,247,89,0.32)]"
                      style={{ width: `${Math.max(8, challenge.progress)}%` }}
                    />
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-4 w-full sm:w-fit">
                  <Link href={challenge.href}>
                    {challenge.action}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <OverviewSectionHeading
          eyebrow="Intelligence"
          title="Trends, risks, and recent evidence"
          description="Review the signal behind your score, then open the full history only when you need detail."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/history">
                View full history
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <div className="grid gap-5 xl:grid-cols-[1fr_1.05fr] xl:items-start">
        <div className="grid gap-6">
          <Card className="glass-panel">
            <CardHeader className="flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Weekly Food Index</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Daily scores from meals, receipts, labels, and barcode scans
                </p>
              </div>
              <Badge>{diary.weeklyAverage}/100 avg</Badge>
            </CardHeader>
            <CardContent>
              <HealthIndexChart data={diary.chart} />
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["Today", `${diary.today?.score ?? 0}/100`],
                  ["Logged days", `${diary.totalLoggedDays}`],
                  ["Alerts", `${diary.weeklyAlerts.length}`]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-black text-white">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Most improved habit</p>
                  <p className="mt-1 text-sm font-semibold text-white">{diary.mostImprovedHabit}</p>
                </div>
                <div className="rounded-xl border border-secondary/20 bg-secondary/[0.06] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-secondary">Needs attention</p>
                  <p className="mt-1 text-sm font-semibold text-white">{diary.needsAttention}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Predictive health alerts</CardTitle>
                <Badge variant="outline">{diary.topPattern}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  ["Sugar", diary.weeklyRiskCounts.sugar],
                  ["Sodium", diary.weeklyRiskCounts.sodium],
                  ["Fried", diary.weeklyRiskCounts.fried],
                  ["Packaged", diary.weeklyRiskCounts.packaged],
                  ["Outside", diary.weeklyRiskCounts.outside],
                  ["Low protein", diary.weeklyRiskCounts.lowProtein]
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                    <p className="text-lg font-black text-white">{value}</p>
                  </div>
                ))}
              </div>
              {diary.weeklyAlerts.length === 0 ? (
                <div className="flex min-h-44 flex-col justify-center rounded-xl border border-dashed border-primary/20 bg-primary/5 p-5">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                  <p className="mt-3 font-semibold text-white">No repeated weekly pattern yet</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Add meals and scans across a few days to build a clearer early-warning summary.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-4 w-fit">
                    <Link href="/my-diary">Open My Diary</Link>
                  </Button>
                </div>
              ) : null}
              {diary.weeklyAlerts.map((risk) => (
                <div key={risk.key} className="rounded-xl border border-secondary/15 bg-secondary/[0.04] p-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-secondary" />
                    <p className="font-semibold text-white">{risk.title}</p>
                    <Badge variant="secondary">{risk.level} possible risk</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{risk.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
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
              {account.recentActivities.slice(0, 3).map((activity) => {
                const Icon = activityIcons[activity.type];
                return (
                  <div key={activity.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-primary/20">
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{activity.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{activity.description}</p>
                        <time
                          className="mt-2 block text-xs font-semibold text-primary"
                          dateTime={activity.createdAt}
                        >
                          {formatDisplayDate(activity.createdAt)}
                        </time>
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

          <Card className="glass-panel">
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
        </div>
      </section>

      <Card className="glass-panel border-white/10">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="font-bold text-white">Need a deeper view?</p>
            <p className="mt-1 text-sm text-muted-foreground">Open the diary, generate a report, or review every saved activity.</p>
          </div>
          <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <Button asChild size="sm">
              <Link href="/my-diary"><BookOpenText className="h-4 w-4" />My Diary</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/reports"><FileText className="h-4 w-4" />Generate report</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/history"><History className="h-4 w-4" />Activity history</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <Disclaimer />
    </div>
  );
}

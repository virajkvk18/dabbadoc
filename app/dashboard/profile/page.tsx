import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  FileText,
  History,
  LockKeyhole,
  ReceiptText,
  ScanLine,
  ShieldCheck,
  Upload,
  Utensils
} from "lucide-react";
import { BadgeGrid } from "@/components/badges/badge-grid";
import { HealthIndexChart } from "@/components/charts/health-index-chart";
import { ProfileActivityMix } from "@/components/profile/profile-activity-mix";
import { ProfileHeroCard } from "@/components/profile/profile-hero-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDisplayDate,
  getAccountOverview,
  type ActivityType
} from "@/lib/supabase/account-overview";

const activityIcons: Record<ActivityType, typeof Upload> = {
  receipt: ReceiptText,
  label: ScanLine,
  diary: Utensils,
  report: FileText,
  payment: CreditCard
};

const activityLabels: Record<ActivityType, string> = {
  receipt: "Receipt",
  label: "Label",
  diary: "Diary",
  report: "Report",
  payment: "Plan"
};

const lockedBadgeGoals = [
  "Complete your first food scan",
  "Build a 3-day activity streak",
  "Review a packaged food label"
];

export default async function ProfilePage() {
  const account = await getAccountOverview();
  const memberSince = formatDisplayDate(account.profile.createdAt);

  return (
    <div className="space-y-6">
      <ProfileHeroCard
        fullName={account.profile.fullName}
        email={account.profile.email}
        initials={account.profile.initials}
        planLabel={account.profile.planLabel}
        isPremium={account.profile.isPremium}
        memberSince={memberSince}
        score={account.score.current}
        scoreCategory={account.score.category}
        streakDays={account.streak.days}
        savedActivities={account.counts.activities}
        badges={account.badges.length}
        reports={account.counts.reports}
      />

      <div className="grid items-stretch gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="glass-panel min-h-[380px] overflow-hidden">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Health journey</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Your latest saved Dabba Health Index movement
              </p>
            </div>
            <Badge variant="outline">{account.score.trendLabel}</Badge>
          </CardHeader>
          <CardContent>
            <HealthIndexChart data={account.score.chart} />
            <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mono-label text-[10px] text-muted-foreground">Current reading</p>
                <p className="mt-1 text-lg font-black text-white">
                  {account.score.current}/100 - {account.score.category}
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  Open overview
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <ProfileActivityMix
          receipts={account.counts.receipts}
          labels={account.counts.labels}
          diaries={account.counts.diaries}
          reports={account.counts.reports}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="glass-panel overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Recent profile activity
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Your latest saved scans, diary entries, reports, and plan updates
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/dashboard/history">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {account.recentActivities.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-primary/25 bg-primary/5 p-6 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary motion-safe:animate-pulse">
                  <History className="h-6 w-6" />
                </span>
                <p className="mt-4 font-semibold text-white">No saved activity yet</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  Add today&apos;s meal to begin your personal food-health timeline.
                </p>
                <Button asChild size="sm" className="mt-5">
                  <Link href="/dashboard/food-diary">
                    Add a diary entry
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : null}

            {account.recentActivities.map((activity) => {
              const Icon = activityIcons[activity.type];
              return (
                <div
                  key={activity.id}
                  className="group flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition duration-200 hover:translate-x-1 hover:border-primary/25 hover:bg-primary/5"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{activity.title}</p>
                          <Badge variant="outline">{activityLabels[activity.type]}</Badge>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {activity.detail}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs text-muted-foreground">
                        {formatDisplayDate(activity.createdAt)}
                      </p>
                    </div>
                    {activity.metrics.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {activity.metrics.slice(0, 3).map((metric) => (
                          <Badge key={metric} variant="secondary">{metric}</Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            <Button asChild variant="outline" size="sm" className="w-full sm:hidden">
              <Link href="/dashboard/history">Open complete history</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-panel overflow-hidden border-secondary/25">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-secondary" />
                Achievements
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Milestones earned from consistent food tracking
              </p>
            </div>
            <Badge variant="secondary">{account.badges.length} earned</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4 border-y border-white/10 py-4">
              <div>
                <p className="mono-label text-[10px] text-muted-foreground">Current streak</p>
                <p className="mt-1 text-2xl font-black text-white">{account.streak.label}</p>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href="/dashboard/food-diary">Log today</Link>
              </Button>
            </div>

            {account.badges.length > 0 ? (
              <BadgeGrid badges={account.badges} />
            ) : (
              <div className="space-y-2">
                {lockedBadgeGoals.map((goal) => (
                  <div key={goal} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-muted-foreground">
                      <LockKeyhole className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{goal}</p>
                      <p className="text-xs text-muted-foreground">Badge locked</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Account protection
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Your profile and saved food history remain private to your account
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/settings">Security settings</Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: CheckCircle2,
              title: "Verified email",
              detail: "Your account email is confirmed for secure access."
            },
            {
              icon: LockKeyhole,
              title: "Private history",
              detail: "Only your signed-in account can access saved activity."
            },
            {
              icon: ShieldCheck,
              title: "Protected sessions",
              detail: "Account sessions use secure sign-in and expiry controls."
            }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-3 border-t border-white/10 py-4 md:border-l md:border-t-0 md:px-4 md:py-1 first:border-0 first:pt-0 md:first:pl-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            );
          })}
          <Button asChild variant="outline" size="sm" className="w-full sm:hidden md:col-span-3">
            <Link href="/settings">Open security settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

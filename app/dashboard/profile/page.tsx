import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  FileText,
  Flame,
  History,
  Mail,
  ShieldCheck,
  UserRound,
  Utensils
} from "lucide-react";
import { BadgeGrid } from "@/components/badges/badge-grid";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDisplayDate,
  getAccountOverview
} from "@/lib/supabase/account-overview";

export default async function ProfilePage() {
  const account = await getAccountOverview();

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="User profile"
        title={account.profile.fullName}
        description="Your DabbaDoc account, saved activity, streaks, badges, and plan details in one place."
        icon={UserRound}
        stats={[
          { label: "Plan", value: account.profile.planLabel },
          { label: "Streak", value: `${account.streak.days} days` },
          { label: "Saved activity", value: `${account.counts.activities}` }
        ]}
        actions={(
          <Button asChild variant="outline">
            <Link href="/settings">
              Settings
              <ShieldCheck className="h-4 w-4" />
            </Link>
          </Button>
        )}
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="glass-panel neon-bloom-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              Account details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/15 text-xl font-black text-primary brand-glow">
                {account.profile.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xl font-black text-white">
                  {account.profile.fullName}
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {account.profile.email}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mono-label text-[11px] text-muted-foreground">Email</p>
                <p className="mt-2 break-all font-semibold text-white">
                  {account.profile.email}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mono-label text-[11px] text-muted-foreground">Member since</p>
                <p className="mt-2 font-semibold text-white">
                  {formatDisplayDate(account.profile.createdAt)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mono-label text-[11px] text-muted-foreground">Plan</p>
                <p className="mt-2 font-semibold capitalize text-white">
                  {account.profile.planLabel}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mono-label text-[11px] text-muted-foreground">Email status</p>
                <p className="mt-2 font-semibold text-primary">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="glass-panel">
            <CardContent className="flex min-h-36 items-start justify-between p-5">
              <div>
                <p className="mono-label text-[11px] text-muted-foreground">Current score</p>
                <p className="mt-3 text-3xl font-black text-white">
                  {account.score.current}/100
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {account.score.category}
                </p>
              </div>
              <BadgeCheck className="h-9 w-9 text-primary" />
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardContent className="flex min-h-36 items-start justify-between p-5">
              <div>
                <p className="mono-label text-[11px] text-muted-foreground">Streak</p>
                <p className="mt-3 text-3xl font-black text-white">
                  {account.streak.days} days
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Based on saved scan/diary days
                </p>
              </div>
              <Flame className="h-9 w-9 text-secondary" />
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardContent className="flex min-h-36 items-start justify-between p-5">
              <div>
                <p className="mono-label text-[11px] text-muted-foreground">Scans</p>
                <p className="mt-3 text-3xl font-black text-white">
                  {account.counts.scans}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Receipts, labels, and diaries
                </p>
              </div>
              <Utensils className="h-9 w-9 text-primary" />
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardContent className="flex min-h-36 items-start justify-between p-5">
              <div>
                <p className="mono-label text-[11px] text-muted-foreground">Reports</p>
                <p className="mt-3 text-3xl font-black text-white">
                  {account.counts.reports}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Generated PDFs
                </p>
              </div>
              <FileText className="h-9 w-9 text-sky-200" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="glass-panel">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Latest account activity
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/history">Open history</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {account.recentActivities.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                No saved activity yet. Your scans, diary entries, reports, and
                payment updates will appear here.
              </p>
            ) : null}
            {account.recentActivities.map((activity) => (
              <div key={activity.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{activity.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activity.detail}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activity.metrics.slice(0, 3).map((metric) => (
                        <Badge key={metric} variant="outline">{metric}</Badge>
                      ))}
                    </div>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatDisplayDate(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel border-secondary/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-secondary" />
              Badges and streaks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="mono-label text-[11px] text-muted-foreground">Active streak</p>
              <p className="mt-2 text-2xl font-black text-white">
                {account.streak.label}
              </p>
            </div>
            {account.badges.length > 0 ? (
              <BadgeGrid badges={account.badges} />
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                Finish your first analysis to unlock badges.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Account privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            "Your profile data is tied to your verified login.",
            "History queries are filtered to your user ID and protected by Supabase RLS.",
            "Secret API keys are used only on server routes, not in your profile page."
          ].map((item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

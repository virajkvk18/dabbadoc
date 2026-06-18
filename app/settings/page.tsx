import {
  BadgeCheck,
  Bell,
  Download,
  LockKeyhole,
  Mail,
  ShieldCheck,
  SlidersHorizontal,
  User
} from "lucide-react";
import Link from "next/link";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDisplayDate,
  getAccountOverview
} from "@/lib/supabase/account-overview";

const preferences = [
  "Weekly report reminders",
  "High sugar and sodium alerts",
  "Family diary nudges",
  "Monthly progress summary"
];

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const account = await getAccountOverview();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="bg-grid-pattern mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        <AppPageHeader
          eyebrow="Account center"
          title="Settings"
          description="Manage profile, privacy, notifications, and plan preferences."
          icon={SlidersHorizontal}
          stats={[
            { label: "Profile", value: account.profile.fullName },
            { label: "Plan", value: account.profile.isPremium ? "Premium" : "Free" },
            { label: "Privacy", value: "Protected" }
          ]}
          actions={(
            <Button variant="outline">
            <Download className="h-4 w-4" />
            Export my data
            </Button>
          )}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="glass-panel neon-bloom-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mono-label text-[11px] text-muted-foreground">Name</p>
                <p className="mt-2 font-semibold text-white">{account.profile.fullName}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mono-label text-[11px] text-muted-foreground">Email</p>
                <p className="mt-2 break-all font-semibold text-white">{account.profile.email}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mono-label text-[11px] text-muted-foreground">Member since</p>
                <time
                  className="mt-2 block font-semibold text-white"
                  dateTime={account.profile.createdAt}
                >
                  {formatDisplayDate(account.profile.createdAt)}
                </time>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mono-label text-[11px] text-muted-foreground">Streak</p>
                <p className="mt-2 font-semibold text-white">
                  {account.streak.days} days
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                <p className="mono-label text-[11px] text-muted-foreground">Family profile</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Household food scans, diary entries, and reports are grouped under
                  this account for a single family health view.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-secondary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-secondary" />
                Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant={account.profile.isPremium ? "default" : "secondary"}>
                {account.profile.isPremium ? "Premium active" : "Free trial"}
              </Badge>
              <p className="text-sm leading-6 text-muted-foreground">
                Upgrade when you need unlimited scans, full history, family tracking,
                and downloadable reports.
              </p>
              <Button asChild className="w-full" variant="secondary">
                <Link href={account.profile.isPremium ? "/dashboard/profile" : "/pricing"}>
                  Manage plan
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {preferences.map((preference) => (
                <label
                  key={preference}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground"
                >
                  <span>{preference}</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                  />
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Privacy and security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: LockKeyhole, title: "Secure account access", detail: "Password protected sign-in for saved history." },
                { icon: Mail, title: "Email verification", detail: "Use email checks when enabled for your account." },
                { icon: SlidersHorizontal, title: "Data controls", detail: "Choose what gets saved after scans and diary entries." }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

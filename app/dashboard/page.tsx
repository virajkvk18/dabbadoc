import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
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
import { analyzeFoodDiary } from "@/lib/agents/foodDiaryAgent";
import { analyzeLabel } from "@/lib/agents/labelScanAgent";
import { analyzeReceipt } from "@/lib/agents/receiptScanAgent";

export default async function DashboardPage() {
  const [receipt, label, diary] = await Promise.all([
    analyzeReceipt({ demoMode: true }),
    analyzeLabel({ demoMode: true }),
    analyzeFoodDiary({
      diaryText:
        "Aaj breakfast me poha, lunch me dal chawal, evening me samosa, dinner me roti sabzi khayi.",
      demoMode: true
    })
  ]);

  const history = [
    { date: "Mon", score: 58 },
    { date: "Tue", score: 61 },
    { date: "Wed", score: 63 },
    { date: "Thu", score: 67 },
    { date: "Fri", score: receipt.healthScore }
  ];

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="secondary">Monitoring active</Badge>
          <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">
            Good morning, Demo Family
          </h1>
          <p className="mt-1 text-muted-foreground">
            Your food health overview is ready across scans, diary entries, and reports.
          </p>
        </div>
        <div className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
          <div>
            <p className="mono-label text-[10px] text-muted-foreground">Status</p>
            <p className="text-sm font-bold text-primary">Ready to scan</p>
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
              <p className="font-bold text-white">Premium intelligence preview</p>
              <p className="text-sm text-muted-foreground">
                Unlock deeper reports, full history, and family tracking when ready.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/pricing">
              View plans
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <HealthScoreGauge score={receipt.healthScore} category={receipt.scoreCategory} />
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Weekly risk" value="Low" detail="Sodium slightly elevated" icon={Sparkles} />
          <StatCard label="Streak count" value={`${diary.streakCount} days`} detail="Diary tracking" icon={Flame} />
          <StatCard label="Badges earned" value={`${diary.badgesEarned.length}`} detail="Healthy habits unlocked" icon={BadgeCheck} />
          <StatCard label="Total scans" value="14" detail="Receipts, labels, diaries" icon={ScanLine} />
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
              <p className="mt-2 text-sm text-muted-foreground">Last 5 logged days</p>
            </div>
            <Badge>+5%</Badge>
          </CardHeader>
          <CardContent>
            <HealthIndexChart data={history} />
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
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary/15 text-secondary">
                  <Upload className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-white">Receipt scan summary</p>
                  <p className="mt-1 text-sm text-muted-foreground">{receipt.aiSummary}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <ScanLine className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-white">LabelScan result</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {label.productName}: {label.safetyLevel}, score {label.labelTruthScore}/100.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-tertiary/15 text-sky-200">
                  <Utensils className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-white">Food diary insight</p>
                  <p className="mt-1 text-sm text-muted-foreground">{diary.aiSummary}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Weekly food risk summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {receipt.riskFlags.slice(0, 4).map((risk) => (
              <div key={risk.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="font-semibold text-white">{risk.label}</p>
                <p className="text-sm text-muted-foreground">{risk.possibleConcern}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Badges earned</CardTitle>
          </CardHeader>
          <CardContent>
            <BadgeGrid badges={diary.badgesEarned} />
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

import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  Flame,
  ScanLine,
  Trophy,
  Utensils
} from "lucide-react";
import { HealthIndexChart } from "@/components/charts/health-index-chart";
import { Disclaimer } from "@/components/common/disclaimer";
import { HealthScoreGauge } from "@/components/dashboard/health-score-gauge";
import { StatCard } from "@/components/dashboard/stat-card";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyDiaryOverview } from "@/lib/supabase/my-diary";

export default async function MyDiaryPage() {
  const diary = await getMyDiaryOverview();

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Day-wise food history"
        title="My Diary"
        description="Your manual meals, outside food, receipts, labels, and barcode scans are grouped into one daily health timeline."
        icon={BookOpenText}
        actions={
          <>
            <Button asChild>
              <Link href="/dashboard/food-diary"><Utensils className="h-4 w-4" />Add food</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/label-scan"><ScanLine className="h-4 w-4" />Attach scan</Link>
            </Button>
          </>
        }
        stats={[
          { label: "Current streak", value: `${diary.currentStreak} days` },
          { label: "Best streak", value: `${diary.bestStreak} days` },
          { label: "Logged days", value: `${diary.totalLoggedDays}` }
        ]}
      />

      <div className="grid items-stretch gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <HealthScoreGauge
          score={diary.today?.score ?? 0}
          category={diary.today?.status ?? "Add today's first meal"}
          className="h-full"
          fillHeight
        />
        <Card className="glass-panel">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Weekly Food Index</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">Daily scores from all attached food evidence</p>
            </div>
            <Badge>{diary.weeklyAverage}/100 avg</Badge>
          </CardHeader>
          <CardContent><HealthIndexChart data={diary.chart} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Current streak" value={diary.currentStreak} suffix="days" detail="Consecutive active diary days" icon={Flame} variant="secondary" />
        <StatCard label="Best streak" value={diary.bestStreak} suffix="days" detail="Your longest logging run" icon={Trophy} variant="primary" />
        <StatCard label="Milestones" value={diary.milestones.length} detail="Progress earned from real activity" icon={CheckCircle2} />
      </div>

      {diary.milestones.length > 0 ? (
        <Card className="glass-panel">
          <CardHeader><CardTitle>Milestones achieved</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {diary.milestones.map((milestone) => <Badge key={milestone} variant="secondary">{milestone}</Badge>)}
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mono-label text-[10px] text-primary">Daily timeline</p>
            <h2 className="mt-1 text-2xl font-black text-white">Food history by day</h2>
          </div>
          <p className="text-sm text-muted-foreground">Newest day first</p>
        </div>

        {diary.days.length === 0 ? (
          <Card className="glass-panel">
            <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary"><CalendarDays className="h-6 w-6" /></span>
              <p className="mt-4 font-bold text-white">Your diary starts with one food action</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Add a manual meal or complete a receipt, label, or barcode scan. DabbaDoc will place it on the correct day automatically.</p>
              <Button asChild className="mt-5"><Link href="/dashboard/food-diary">Add today&apos;s meal</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {diary.days.map((day) => (
              <Link key={day.date} href={`/my-diary/${day.date}`} className="group block">
                <Card className="glass-panel h-full transition duration-200 group-hover:-translate-y-1 group-hover:border-primary/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-black text-white">{day.dateLabel}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{day.dayName}</p>
                      </div>
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-lg font-black text-primary">{day.score}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge>{day.status}</Badge>
                      <Badge variant="outline">{day.totalFoodEntries} food items</Badge>
                      <Badge variant="outline">{day.attachedScans} scans</Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {["Morning", "Afternoon", "Evening", "Dinner / Snacks"].map((slot) => (
                        <div key={slot} className={day.mealSlots.includes(slot as (typeof day.mealSlots)[number]) ? "rounded-xl border border-primary/25 bg-primary/10 p-2 text-center text-[11px] font-bold text-primary" : "rounded-xl border border-white/10 bg-white/5 p-2 text-center text-[11px] font-bold text-muted-foreground"}>{slot}</div>
                      ))}
                    </div>
                    <div className="mt-4 min-h-16 space-y-1.5">
                      {day.warnings.length ? day.warnings.map((warning) => <p key={warning} className="text-sm text-orange-100">- {warning}</p>) : <p className="text-sm text-primary">No strong warning pattern detected.</p>}
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/10 pt-4 text-sm font-bold text-primary">Open full day <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
      <Disclaimer />
    </div>
  );
}

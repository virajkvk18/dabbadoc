import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenText,
  Clock3,
  IndianRupee,
  ReceiptText,
  ScanLine,
  Utensils
} from "lucide-react";
import { Disclaimer } from "@/components/common/disclaimer";
import { HealthScoreGauge } from "@/components/dashboard/health-score-gauge";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDiaryEntryTime,
  getMyDiaryOverview,
  type DiaryMealSlot
} from "@/lib/supabase/my-diary";

const slots: DiaryMealSlot[] = ["Morning", "Afternoon", "Evening", "Dinner / Snacks"];

export default async function DiaryDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const diary = await getMyDiaryOverview();
  const day = diary.days.find((candidate) => candidate.date === date);
  if (!day) notFound();

  const mealEntries = day.entries.filter((entry) => ["manual", "outside_food"].includes(entry.source));
  const scans = day.entries.filter((entry) => !["manual", "outside_food"].includes(entry.source));

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Full day history"
        title={day.dateLabel}
        description="One timeline for manual meals, outside food, receipts, labels, barcode scans, and explainable early-warning patterns."
        icon={BookOpenText}
        actions={
          <>
            <Button asChild variant="outline"><Link href="/my-diary"><ArrowLeft className="h-4 w-4" />All days</Link></Button>
            <Button asChild><Link href="/dashboard/food-diary"><Utensils className="h-4 w-4" />Add food</Link></Button>
          </>
        }
        stats={[
          { label: "Food entries", value: `${day.totalFoodEntries}` },
          { label: "Attached scans", value: `${day.attachedScans}` },
          { label: "Day status", value: day.status }
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <HealthScoreGauge score={day.score} category={day.status} />
        <Card className="glass-panel">
          <CardHeader><CardTitle>Dabba Health Index breakdown</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Meal slots", `${day.mealSlots.length}/4`],
              ["Sugar signals", day.riskCounts.sugar],
              ["Sodium signals", day.riskCounts.sodium],
              ["Fried signals", day.riskCounts.fried],
              ["Packaged food", day.riskCounts.packaged],
              ["Outside food", day.riskCounts.outside]
            ].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="mono-label text-[10px] text-muted-foreground">{label}</p><p className="mt-1 text-xl font-black text-white">{value}</p></div>)}
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        {slots.map((slot) => {
          const entries = mealEntries.filter((entry) => entry.mealSlot === slot);
          return (
            <Card key={slot} className="glass-panel">
              <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle>{slot}</CardTitle><Badge variant={entries.length ? "default" : "outline"}>{entries.length} entries</Badge></CardHeader>
              <CardContent className="space-y-3">
                {entries.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-muted-foreground">No manual food logged in this slot.</p> : entries.map((entry) => <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold text-white">{entry.title}</p><p className="mt-1 text-sm text-muted-foreground">{entry.detail}</p></div><Badge variant={entry.source === "outside_food" ? "secondary" : "outline"}>{entry.sourceLabel}</Badge></div><time dateTime={entry.createdAt} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary"><Clock3 className="h-3.5 w-3.5" />{formatDiaryEntryTime(entry.createdAt)}</time></div>)}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="glass-panel">
        <CardHeader><CardTitle className="flex items-center gap-2"><ScanLine className="h-5 w-5 text-primary" />Attached scans and receipts</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {scans.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-muted-foreground md:col-span-2">No receipt, label, or barcode scan is attached to this day.</p> : scans.map((entry) => <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-white">{entry.title}</p><p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{entry.detail}</p></div><Badge variant="outline">{entry.sourceLabel}</Badge></div><div className="mt-3 flex items-center justify-between text-xs"><span className="text-primary">{formatDiaryEntryTime(entry.createdAt)}</span>{typeof entry.score === "number" ? <span className="font-bold text-white">Score {entry.score}/100</span> : null}</div></div>)}
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-secondary" />Predictive health insights</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {day.predictiveInsights.length === 0 ? <p className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary">No strong predictive risk pattern was detected from the available entries.</p> : day.predictiveInsights.map((insight) => <article key={insight.key} className="rounded-xl border border-secondary/20 bg-secondary/[0.06] p-4"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-white">{insight.title}</p><Badge variant="secondary">{insight.level} possible risk</Badge></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{insight.reason}</p><p className="mt-2 text-sm font-semibold text-primary">Try: {insight.recommendation}</p>{insight.relatedItems.length ? <p className="mt-2 text-xs text-orange-100">Related: {insight.relatedItems.join(", ")}</p> : null}<p className="mt-3 border-t border-white/10 pt-3 text-xs text-muted-foreground">{insight.disclaimer}</p></article>)}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader><CardTitle className="flex items-center gap-2"><Utensils className="h-5 w-5 text-primary" />Healthy Indian swaps</CardTitle></CardHeader>
          <CardContent className="space-y-3">{day.swaps.length === 0 ? <p className="text-sm text-muted-foreground">No specific swap was saved for this day.</p> : day.swaps.map((swap) => <div key={`${swap.original}-${swap.swap}`} className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="font-bold text-white">{swap.original} -&gt; {swap.swap}</p><p className="mt-1 text-sm text-muted-foreground">{swap.reason}</p></div>)}</CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader><CardTitle className="flex items-center gap-2"><IndianRupee className="h-5 w-5 text-secondary" />Cost comparison</CardTitle></CardHeader>
          <CardContent>{day.cost ? <div className="grid gap-3 sm:grid-cols-3">{[["Current estimate", day.cost.current], ["Healthier estimate", day.cost.healthier], ["Possible savings", day.cost.savings]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-black text-white">INR {value}</p></div>)}</div> : <p className="text-sm text-muted-foreground">Cost data becomes available when an attached receipt analysis includes a comparison.</p>}</CardContent>
        </Card>
      </div>

      <Card className="glass-panel">
        <CardHeader><CardTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-primary" />Food timeline</CardTitle></CardHeader>
        <CardContent className="space-y-0">{day.entries.map((entry, index) => <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0"><div className="flex w-8 shrink-0 flex-col items-center"><span className="mt-1 h-3 w-3 rounded-full border-2 border-primary bg-[#071018]" />{index < day.entries.length - 1 ? <span className="mt-1 h-full w-px bg-white/10" /> : null}</div><div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-white">{entry.title}</p><time dateTime={entry.createdAt} className="text-xs text-primary">{formatDiaryEntryTime(entry.createdAt)}</time></div><p className="mt-1 text-sm text-muted-foreground">{entry.sourceLabel} | {entry.mealSlot}</p></div></div>)}</CardContent>
      </Card>
      <Disclaimer />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  Clock3,
  Home,
  Loader2,
  Plus,
  Store,
  Trash2,
  Utensils,
  WandSparkles
} from "lucide-react";
import { Disclaimer } from "@/components/common/disclaimer";
import { BadgeGrid } from "@/components/badges/badge-grid";
import { HealthScoreGauge } from "@/components/dashboard/health-score-gauge";
import { RiskFlags, SwapList } from "@/components/upload/analysis-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FoodDiaryAnalysis, ManualMealEntry, MealTime, SpiceLevel } from "@/types";
import { cn } from "@/lib/utils";

type DiaryResponse = {
  analysis: FoodDiaryAnalysis;
  saved: boolean;
  error?: string;
};

const mealTimes: Array<{ value: MealTime; label: string }> = [
  { value: "breakfast", label: "Morning" },
  { value: "lunch", label: "Lunch" },
  { value: "evening_snack", label: "Evening" },
  { value: "dinner", label: "Dinner" },
  { value: "late_night", label: "Late night" }
];

const spiceLevels: Array<{ value: SpiceLevel; label: string }> = [
  { value: "none", label: "No spice" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" }
];

const defaultEntry: Omit<ManualMealEntry, "id"> = {
  source: "home",
  mealTime: "breakfast",
  itemName: "",
  quantity: "",
  spiceLevel: "medium",
  notes: ""
};

function entrySummary(entry: ManualMealEntry) {
  const source = entry.source === "home" ? "Home" : "Outside";
  const meal = mealTimes.find((time) => time.value === entry.mealTime)?.label;
  const cleanSummary = [source, meal, entry.quantity, `${entry.spiceLevel} spice`]
    .filter(Boolean)
    .join(" | ");
  if (cleanSummary) return cleanSummary;
  return `${source} • ${meal} • ${entry.quantity} • ${entry.spiceLevel} spice`;
}

export function FoodDiaryForm() {
  const [currentEntry, setCurrentEntry] =
    useState<Omit<ManualMealEntry, "id">>(defaultEntry);
  const [entries, setEntries] = useState<ManualMealEntry[]>([]);
  const [analysis, setAnalysis] = useState<FoodDiaryAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdd =
    currentEntry.itemName.trim().length > 1 && currentEntry.quantity.trim().length > 0;

  const dayTextPreview = useMemo(
    () =>
      entries
        .map((entry) => `${entry.itemName} (${entrySummary(entry)})`)
        .join(", "),
    [entries]
  );

  function updateEntry<Key extends keyof Omit<ManualMealEntry, "id">>(
    key: Key,
    value: Omit<ManualMealEntry, "id">[Key]
  ) {
    setCurrentEntry((entry) => ({ ...entry, [key]: value }));
    setError(null);
  }

  function addEntry() {
    if (!canAdd) {
      setError("Add food item and quantity first.");
      return;
    }

    setEntries((items) => [
      ...items,
      {
        ...currentEntry,
        itemName: currentEntry.itemName.trim(),
        quantity: currentEntry.quantity.trim(),
        notes: currentEntry.notes?.trim(),
        id: crypto.randomUUID()
      }
    ]);
    setCurrentEntry({
      ...defaultEntry,
      mealTime: currentEntry.mealTime
    });
  }

  function removeEntry(id?: string) {
    setEntries((items) => items.filter((entry) => entry.id !== id));
  }

  async function submit() {
    const entriesToAnalyze = [...entries];

    if (canAdd) {
      entriesToAnalyze.push({
        ...currentEntry,
        itemName: currentEntry.itemName.trim(),
        quantity: currentEntry.quantity.trim(),
        notes: currentEntry.notes?.trim(),
        id: crypto.randomUUID()
      });
    }

    if (entriesToAnalyze.length === 0) {
      setError("Add at least one meal item before analyzing.");
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch("/api/food-diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: entriesToAnalyze, demoMode: false })
    });
    const payload = (await response.json()) as DiaryResponse;

    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not analyze diary.");
      return;
    }

    setEntries(entriesToAnalyze);
    setCurrentEntry(defaultEntry);
    setAnalysis(payload.analysis);
  }

  return (
    <div className="space-y-6">
      <Card className="glass-panel scan-frame overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-secondary" />
            Manual daily food entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-white">Step 1: Where did you eat?</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { value: "home" as const, label: "Home food", icon: Home },
                { value: "outside" as const, label: "Outside food", icon: Store }
              ].map((option) => {
                const Icon = option.icon;
                const active = currentEntry.source === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateEntry("source", option.value)}
                    className={cn(
                      "flex min-h-16 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-bold transition",
                      active
                        ? "border-primary/50 bg-primary/15 text-primary brand-glow"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meal-time">Step 2: Meal time</Label>
              <select
                id="meal-time"
                value={currentEntry.mealTime}
                onChange={(event) => updateEntry("mealTime", event.target.value as MealTime)}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0a0e16]/80 px-3 text-sm text-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.22)] focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {mealTimes.map((meal) => (
                  <option key={meal.value} value={meal.value}>
                    {meal.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="food-item">What did you eat?</Label>
              <Input
                id="food-item"
                value={currentEntry.itemName}
                placeholder="Pasta, momos, dal chawal, paneer roll"
                onChange={(event) => updateEntry("itemName", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                value={currentEntry.quantity}
                placeholder="1 bowl, 5 pcs, 2 roti, 1 plate"
                onChange={(event) => updateEntry("quantity", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={currentEntry.notes ?? ""}
                placeholder="cheese, chutney, fried, less oil"
                onChange={(event) => updateEntry("notes", event.target.value)}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Spice level</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {spiceLevels.map((spice) => {
                const active = currentEntry.spiceLevel === spice.value;
                return (
                  <button
                    key={spice.value}
                    type="button"
                    onClick={() => updateEntry("spiceLevel", spice.value)}
                    className={cn(
                      "h-10 rounded-xl border text-sm font-bold transition",
                      active
                        ? "border-secondary/50 bg-secondary/15 text-orange-100 orange-glow"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {spice.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Button className="w-full sm:w-auto" onClick={addEntry} variant="outline">
              <Plus className="h-4 w-4" />
              Add item and choose next
            </Button>
            <Button className="w-full sm:w-auto" onClick={submit} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <WandSparkles className="h-4 w-4" />
              )}
              Analyze full day
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-primary" />
            Today&apos;s entries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
              No items added yet. Add breakfast, lunch, snack, or dinner one by one.
            </p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{entry.itemName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{entrySummary(entry)}</p>
                  {entry.notes ? (
                    <p className="mt-1 text-xs text-orange-100">{entry.notes}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${entry.itemName}`}
                  onClick={() => removeEntry(entry.id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
          {dayTextPreview ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Preview: {dayTextPreview}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {analysis ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <HealthScoreGauge
              score={analysis.dailyScore}
              category={`Streak ${analysis.streakCount} days`}
            />
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Diary insight</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{analysis.aiSummary}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="mono-label text-[10px] text-muted-foreground">Rough calories</p>
                    <p className="text-xl font-bold text-white">
                      {analysis.caloriesEstimate}
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                    <p className="mono-label text-[10px] text-muted-foreground">Rough protein</p>
                    <p className="text-xl font-bold text-white">
                      {analysis.proteinEstimate}g
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {analysis.entries && analysis.entries.length > 0 ? (
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Manual entries analyzed</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {analysis.entries.map((entry) => (
                  <div
                    key={entry.id ?? `${entry.itemName}-${entry.quantity}`}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="font-semibold text-white">{entry.itemName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entrySummary(entry)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <RiskFlags
            risks={analysis.riskyFoods.map((item) => ({
              label: `${item.name} watch`,
              severity: item.flags?.includes("high_sodium") ? "high" : "medium",
              reason: `${item.name} may add ${item.flags?.join(", ")} load when frequent.`,
              possibleConcern: "Possible lifestyle concern if this becomes a daily pattern."
            }))}
          />
          <SwapList swaps={analysis.healthierSwaps} />
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Missing nutrients and tips</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-semibold text-white">Missing nutrients</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {analysis.missingNutrients.map((nutrient) => (
                    <span
                      key={nutrient}
                      className="rounded-full border border-orange-300/20 bg-orange-500/15 px-3 py-1 text-sm text-orange-100"
                    >
                      {nutrient}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {analysis.improvementTips.map((tip) => (
                  <p
                    key={tip}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground"
                  >
                    {tip}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
          <BadgeGrid badges={analysis.badgesEarned} />
          <Disclaimer />
        </div>
      ) : null}
    </div>
  );
}

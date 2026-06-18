"use client";

import { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Home,
  Loader2,
  Mic,
  MicOff,
  Plus,
  Store,
  Trash2,
  Utensils,
  WandSparkles
} from "lucide-react";
import { Disclaimer } from "@/components/common/disclaimer";
import { LiveDateTime } from "@/components/common/live-date-time";
import { ProcessingSteps } from "@/components/common/processing-steps";
import { BadgeGrid } from "@/components/badges/badge-grid";
import { HealthScoreGauge } from "@/components/dashboard/health-score-gauge";
import { HealthGoalSelector } from "@/components/upload/health-goal-selector";
import { RiskFlags, SmartGroceryList, SwapList } from "@/components/upload/analysis-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FoodDiaryAnalysis, ManualMealEntry, MealTime, SpiceLevel } from "@/types";
import { formatAppDateTime } from "@/lib/date-time";
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

type SpeechRecognitionResultItem = {
  transcript: string;
};

type SpeechRecognitionResultListItem = {
  0: SpeechRecognitionResultItem;
};

type SpeechRecognitionEventLike = {
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultListItem;
  };
};

type SpeechRecognitionErrorEventLike = {
  error:
    | "aborted"
    | "audio-capture"
    | "bad-grammar"
    | "language-not-supported"
    | "network"
    | "no-speech"
    | "not-allowed"
    | "service-not-allowed";
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
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

function cleanVoiceText(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(aaj|maine|meine|khaya|khayi|khaya hai|piya|pi|liya|li|tha|thi|hai|aur|and)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function voiceItems(value: string) {
  const normalized = value
    .replace(/\b(aur|and|with|plus)\b/gi, ",")
    .split(/[,\n]+/)
    .map(cleanVoiceText)
    .filter((item) => item.length > 1);
  return Array.from(new Set(normalized)).slice(0, 6);
}

function voiceErrorMessage(error: SpeechRecognitionErrorEventLike["error"]) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Voice recognition was not allowed by the browser. If mic permission is already on, try Chrome and make sure the page is opened on HTTPS.";
  }
  if (error === "audio-capture") {
    return "No microphone was detected. Check your mic/camera permission or use manual entry.";
  }
  if (error === "network") {
    return "Voice recognition needs network access in this browser. Please try again or type the entry.";
  }
  if (error === "language-not-supported") {
    return "This browser could not start Indian English voice recognition. Try Chrome or use manual entry.";
  }
  if (error === "no-speech") {
    return "I did not catch any words. Tap again and speak after the Listening status appears.";
  }
  return "Voice entry stopped. Please try again or type the meal manually.";
}

function mealPlanFromAnalysis(analysis: FoodDiaryAnalysis) {
  const riskyText = analysis.riskyFoods.map((item) => item.name.toLowerCase()).join(" ");
  const missing = analysis.missingNutrients.map((item) => item.toLowerCase());
  const needsProtein = missing.includes("protein") || analysis.proteinEstimate < 45;
  const hasSugar = /sweet|sugar|chai|cold drink|juice|chocolate|dessert/.test(riskyText);
  const hasFried = /fried|chips|momos|samosa|pakora|bhujia|namkeen/.test(riskyText);

  return [
    {
      meal: "Breakfast",
      idea: needsProtein ? "Poha/upma + sprouts or curd" : "Poha/upma with peanuts and fruit",
      reason: "Keeps breakfast familiar but adds protein/fiber."
    },
    {
      meal: "Lunch",
      idea: "Dal chawal or roti sabzi + salad + curd",
      reason: "Balanced Indian plate with protein, carbs, and cooling sides."
    },
    {
      meal: "Evening",
      idea: hasFried ? "Makhana, roasted chana, peanuts, or sprouts chaat" : "Fruit + curd or roasted chana",
      reason: hasFried ? "Replaces fried/packaged snack habit." : "Keeps snack light and filling."
    },
    {
      meal: "Dinner",
      idea: hasSugar ? "Paneer/tofu/egg/dal + roti + sabzi, skip sweet drink" : "Khichdi/dal + sabzi + curd",
      reason: hasSugar ? "Reduces late sugar load." : "Simple dinner that supports recovery."
    }
  ];
}

export function FoodDiaryForm({ initialNow }: { initialNow: string }) {
  const [currentEntry, setCurrentEntry] =
    useState<Omit<ManualMealEntry, "id">>(defaultEntry);
  const [entries, setEntries] = useState<ManualMealEntry[]>([]);
  const [analysis, setAnalysis] = useState<FoodDiaryAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthGoals, setHealthGoals] = useState<string[]>([]);
  const [voiceText, setVoiceText] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState("Tap and speak after the browser allows microphone access.");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const heardSpeechRef = useRef(false);

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
        id: crypto.randomUUID(),
        loggedAt: new Date().toISOString()
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

  function addVoiceEntries(text: string) {
    const spokenItems = voiceItems(text);
    if (spokenItems.length === 0) {
      setError("Could not understand food items. Try saying: aaj poha aur chai pi.");
      return;
    }

    setEntries((items) => [
      ...items,
      ...spokenItems.map((item) => ({
        ...defaultEntry,
        source: currentEntry.source,
        mealTime: currentEntry.mealTime,
        itemName: item,
        quantity: "spoken entry",
        notes: text,
        id: crypto.randomUUID(),
        loggedAt: new Date().toISOString()
      }))
    ]);
    setVoiceText(text);
    setError(null);
  }

  async function startVoiceEntry() {
    const SpeechRecognition =
      (window as SpeechWindow).SpeechRecognition ||
      (window as SpeechWindow).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setError("Voice diary is not supported in this browser. Please type the entry.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    heardSpeechRef.current = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length })
        .map((_, index) => event.results[index]?.[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) {
        heardSpeechRef.current = true;
        addVoiceEntries(transcript);
        setVoiceStatus("Voice entry added. You can edit/remove it before analysis.");
      }
    };
    recognition.onerror = (event) => {
      setError(voiceErrorMessage(event.error));
      setVoiceStatus("Voice entry stopped.");
      setListening(false);
    };
    recognition.onstart = () => {
      setListening(true);
      setVoiceStatus("Listening now. Say your food entry clearly.");
    };
    recognition.onend = () => {
      setListening(false);
      if (!heardSpeechRef.current) {
        setVoiceStatus("Tap again when ready. Speak after Listening appears.");
      }
    };

    recognitionRef.current = recognition;
    setError(null);
    setVoiceStatus("Starting microphone...");

    try {
      recognition.start();
    } catch {
      setError("Voice entry could not start. Please wait a second and try again.");
      setVoiceStatus("Voice entry stopped.");
      setListening(false);
    }
  }

  async function submit() {
    const entriesToAnalyze = [...entries];

    if (canAdd) {
      entriesToAnalyze.push({
        ...currentEntry,
        itemName: currentEntry.itemName.trim(),
        quantity: currentEntry.quantity.trim(),
        notes: currentEntry.notes?.trim(),
        id: crypto.randomUUID(),
        loggedAt: new Date().toISOString()
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
      body: JSON.stringify({ entries: entriesToAnalyze, healthGoals, demoMode: false })
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

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-white">Voice food diary</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Allow microphone access, wait for Listening, then say: aaj poha aur chai pi.
                </p>
              </div>
              <Button
                type="button"
                variant={listening ? "secondary" : "outline"}
                onClick={startVoiceEntry}
                className="w-full sm:w-auto"
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {listening ? "Stop listening" : "Speak entry"}
              </Button>
            </div>
            <p className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-muted-foreground">
              {voiceStatus}
            </p>
            {!voiceSupported ? (
              <p className="mt-3 text-sm text-orange-100">
                Your browser does not support speech recognition yet. Manual entry still works.
              </p>
            ) : null}
            {voiceText ? (
              <p className="mt-3 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
                Heard: {voiceText}
              </p>
            ) : null}
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

          <HealthGoalSelector selectedGoals={healthGoals} onChange={setHealthGoals} />

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

      {loading ? (
        <ProcessingSteps
          title="Building your daily food insight"
          steps={[
            "Reading meal entries",
            "Estimating balance",
            "Preparing tips and badges"
          ]}
        />
      ) : null}

      <Card className="glass-panel">
        <CardHeader className="gap-3">
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-primary" />
            Today&apos;s entries
          </CardTitle>
          <LiveDateTime initialNow={initialNow} />
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
                  {entry.loggedAt ? (
                    <time
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary"
                      dateTime={entry.loggedAt}
                    >
                      <Clock3 className="h-3.5 w-3.5" />
                      Logged {formatAppDateTime(entry.loggedAt)}
                    </time>
                  ) : null}
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
                    {entry.loggedAt ? (
                      <time
                        className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary"
                        dateTime={entry.loggedAt}
                      >
                        <Clock3 className="h-3.5 w-3.5" />
                        Logged {formatAppDateTime(entry.loggedAt)}
                      </time>
                    ) : null}
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
          <Card className="glass-panel border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Tomorrow meal plan suggestion
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {mealPlanFromAnalysis(analysis).map((plan) => (
                <div key={plan.meal} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="mono-label text-[10px] text-muted-foreground">{plan.meal}</p>
                  <p className="mt-1 font-semibold text-white">{plan.idea}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <SmartGroceryList
            swaps={analysis.healthierSwaps}
            risks={analysis.riskyFoods.map((item) => ({
              label: `${item.name} watch`,
              severity: item.flags?.includes("high_sodium") ? "high" : "medium",
              reason: `${item.name} appeared in today's diary.`,
              possibleConcern: "Useful to replace if it becomes a frequent pattern."
            }))}
            title="Buy for tomorrow"
          />
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

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  Droplets,
  HeartPulse,
  Loader2,
  LockKeyhole,
  Moon,
  Save,
  Scale,
  Sparkles
} from "lucide-react";
import type { UserHealthProfile, WellnessLog } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type HealthProfileManagerProps = {
  initialProfile: UserHealthProfile;
  initialLogs: WellnessLog[];
  setupRequired: boolean;
  isLocked: boolean;
};

const suggestedGoals = [
  "Weight loss",
  "Diabetes-friendly",
  "High protein",
  "Low sodium",
  "Kids lunchbox",
  "Heart-friendly",
  "PCOS-friendly",
  "Pregnancy nutrition",
  "Better sleep",
  "Reduce junk cravings"
];

const commonConditions = [
  "Diabetes",
  "High BP",
  "PCOS",
  "Thyroid",
  "High cholesterol",
  "Acidity",
  "Anemia"
];

const moods = ["Happy", "Stressed", "Tired", "Anxious", "Low energy", "Focused"];
const cravings = ["Sweet", "Salty", "Spicy", "Chocolate", "Fried", "Tea/coffee"];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function listToText(values?: string[]) {
  return values?.join(", ") ?? "";
}

function textToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value].slice(0, 12);
}

function numberValue(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function HealthProfileManager({
  initialProfile,
  initialLogs,
  setupRequired,
  isLocked
}: HealthProfileManagerProps) {
  const [profile, setProfile] = useState<UserHealthProfile>(initialProfile);
  const [logs, setLogs] = useState<WellnessLog[]>(initialLogs);
  const [customGoalsText, setCustomGoalsText] = useState(listToText(initialProfile.customGoals));
  const [allergiesText, setAllergiesText] = useState(listToText(initialProfile.allergies));
  const [womenCravingsText, setWomenCravingsText] = useState(listToText(initialProfile.womenHealth.cravings));
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logDraft, setLogDraft] = useState<WellnessLog>({
    logDate: todayDate(),
    cravings: []
  });

  const profileCompletion = useMemo(() => {
    const checks = [
      profile.age,
      profile.gender,
      profile.heightCm,
      profile.weightKg,
      profile.activityLevel,
      profile.sleepHours,
      profile.dietaryPreference,
      profile.healthGoals.length + profile.customGoals.length,
      profile.medicalConditions.length
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile]);

  function updateProfile(next: Partial<UserHealthProfile>) {
    setProfile((current) => ({ ...current, ...next }));
    setError(null);
    setStatus(null);
  }

  async function saveProfile() {
    setSavingProfile(true);
    setError(null);
    setStatus(null);

    const nextProfile: UserHealthProfile = {
      ...profile,
      customGoals: textToList(customGoalsText),
      allergies: textToList(allergiesText),
      womenHealth: {
        ...profile.womenHealth,
        cravings: textToList(womenCravingsText)
      }
    };

    try {
      const response = await fetch("/api/profile/health-context", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextProfile)
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; profile?: UserHealthProfile };
      if (!response.ok) {
        setError(payload.error ?? "Could not save health profile.");
        return;
      }

      setProfile(payload.profile ?? nextProfile);
      setStatus("Health profile saved. New scans will use this context.");
    } catch {
      setError("Could not save health profile. Please check your connection.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveLog() {
    setSavingLog(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch("/api/profile/wellness-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logDraft)
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; logs?: WellnessLog[] };
      if (!response.ok) {
        setError(payload.error ?? "Could not save wellness log.");
        return;
      }

      setLogs(payload.logs ?? logs);
      setStatus("Daily wellness log saved.");
    } catch {
      setError("Could not save wellness log. Please check your connection.");
    } finally {
      setSavingLog(false);
    }
  }

  if (isLocked) {
    return (
      <Card className="glass-panel border-secondary/25">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-secondary/30 bg-secondary/15 text-secondary">
                <LockKeyhole className="h-6 w-6" />
              </span>
              <div>
                <Badge variant="secondary">Premium</Badge>
                <p className="mt-3 text-xl font-black text-white">Personalization is locked</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Upgrade to Premium to customize food advice with your health goals, diseases, weight, sleep, mood, women health mode, and wellness patterns.
                </p>
              </div>
            </div>
            <Button asChild variant="secondary" className="shrink-0">
              <Link href="/pricing">Unlock Premium</Link>
            </Button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              "Personal health context",
              "Women health mode",
              "Profile readiness",
              "Daily wellness log",
              "Recent wellness pattern",
              "Personalized scan guidance"
            ].map((feature) => (
              <div key={feature} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-semibold text-muted-foreground">
                {feature}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {setupRequired ? (
        <Card className="glass-panel border-secondary/30">
          <CardContent className="p-4 text-sm text-orange-100">
            Health profile tables are not ready yet. Run the latest Supabase schema and policies, then this section will start saving data.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="glass-panel neon-bloom-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-primary" />
              Personal health context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  inputMode="numeric"
                  value={profile.age ?? ""}
                  onChange={(event) => updateProfile({ age: numberValue(event.target.value) })}
                  placeholder="24"
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <select
                  value={profile.gender ?? ""}
                  onChange={(event) => updateProfile({ gender: event.target.value || undefined })}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition focus:border-primary/50"
                >
                  <option value="">Select</option>
                  <option>Woman</option>
                  <option>Man</option>
                  <option>Non-binary</option>
                  <option>Prefer not to say</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Height cm</Label>
                <Input
                  inputMode="decimal"
                  value={profile.heightCm ?? ""}
                  onChange={(event) => updateProfile({ heightCm: numberValue(event.target.value) })}
                  placeholder="165"
                />
              </div>
              <div className="space-y-2">
                <Label>Weight kg</Label>
                <Input
                  inputMode="decimal"
                  value={profile.weightKg ?? ""}
                  onChange={(event) => updateProfile({ weightKg: numberValue(event.target.value) })}
                  placeholder="62"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Activity</Label>
                <select
                  value={profile.activityLevel ?? ""}
                  onChange={(event) => updateProfile({ activityLevel: event.target.value || undefined })}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition focus:border-primary/50"
                >
                  <option value="">Select</option>
                  <option>Sedentary</option>
                  <option>Lightly active</option>
                  <option>Active</option>
                  <option>Very active</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Sleep hours</Label>
                <Input
                  inputMode="decimal"
                  value={profile.sleepHours ?? ""}
                  onChange={(event) => updateProfile({ sleepHours: numberValue(event.target.value) })}
                  placeholder="7"
                />
              </div>
              <div className="space-y-2">
                <Label>Sleep quality</Label>
                <select
                  value={profile.sleepQuality ?? ""}
                  onChange={(event) => updateProfile({ sleepQuality: event.target.value || undefined })}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition focus:border-primary/50"
                >
                  <option value="">Select</option>
                  <option>Poor</option>
                  <option>Okay</option>
                  <option>Good</option>
                  <option>Excellent</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Water glasses</Label>
                <Input
                  inputMode="numeric"
                  value={profile.waterGlasses ?? ""}
                  onChange={(event) => updateProfile({ waterGlasses: numberValue(event.target.value) })}
                  placeholder="8"
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-2">
                <Label>Diet preference</Label>
                <select
                  value={profile.dietaryPreference ?? ""}
                  onChange={(event) => updateProfile({ dietaryPreference: event.target.value || undefined })}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition focus:border-primary/50"
                >
                  <option value="">Select</option>
                  <option>Vegetarian</option>
                  <option>Non-vegetarian</option>
                  <option>Eggetarian</option>
                  <option>Vegan</option>
                  <option>Jain</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Allergies</Label>
                <Input
                  value={allergiesText}
                  onChange={(event) => setAllergiesText(event.target.value)}
                  placeholder="peanut, lactose, gluten"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Suggested goals</Label>
              <div className="flex flex-wrap gap-2">
                {suggestedGoals.map((goal) => {
                  const active = profile.healthGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => updateProfile({ healthGoals: toggleValue(profile.healthGoals, goal) })}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                        active
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                      }`}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom goals</Label>
              <Input
                value={customGoalsText}
                onChange={(event) => setCustomGoalsText(event.target.value)}
                placeholder="reduce cravings, improve iron, office lunch control"
              />
            </div>

            <div className="space-y-3">
              <Label>Health conditions</Label>
              <div className="flex flex-wrap gap-2">
                {commonConditions.map((condition) => {
                  const active = profile.medicalConditions.includes(condition);
                  return (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => updateProfile({ medicalConditions: toggleValue(profile.medicalConditions, condition) })}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                        active
                          ? "border-secondary/40 bg-secondary/15 text-orange-100"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                      }`}
                    >
                      {condition}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-secondary" />
                Women health mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <span>
                  <span className="block font-semibold text-white">Enable cycle/pregnancy food context</span>
                  <span className="mt-1 block text-sm text-muted-foreground">Optional and private to this account.</span>
                </span>
                <input
                  type="checkbox"
                  checked={profile.womenHealth.enabled}
                  onChange={(event) => updateProfile({
                    womenHealth: { ...profile.womenHealth, enabled: event.target.checked }
                  })}
                  className="h-5 w-5 accent-primary"
                />
              </label>

              {profile.womenHealth.enabled ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Pregnancy status</Label>
                      <select
                        value={profile.womenHealth.pregnancyStatus ?? "not_applicable"}
                        onChange={(event) => updateProfile({
                          womenHealth: {
                            ...profile.womenHealth,
                            pregnancyStatus: event.target.value as UserHealthProfile["womenHealth"]["pregnancyStatus"]
                          }
                        })}
                        className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition focus:border-primary/50"
                      >
                        <option value="not_applicable">Not applicable</option>
                        <option value="trying">Trying</option>
                        <option value="pregnant">Pregnant</option>
                        <option value="postpartum">Postpartum</option>
                        <option value="breastfeeding">Breastfeeding</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cycle phase</Label>
                      <select
                        value={profile.womenHealth.cyclePhase ?? "not_tracking"}
                        onChange={(event) => updateProfile({
                          womenHealth: {
                            ...profile.womenHealth,
                            cyclePhase: event.target.value as UserHealthProfile["womenHealth"]["cyclePhase"]
                          }
                        })}
                        className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition focus:border-primary/50"
                      >
                        <option value="not_tracking">Not tracking</option>
                        <option value="period">Period</option>
                        <option value="follicular">Follicular</option>
                        <option value="ovulation">Ovulation</option>
                        <option value="luteal">Luteal</option>
                        <option value="pms">PMS</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Typical cravings</Label>
                    <Input
                      value={womenCravingsText}
                      onChange={(event) => setWomenCravingsText(event.target.value)}
                      placeholder="sweet, salty, chocolate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={profile.womenHealth.notes ?? ""}
                      onChange={(event) => updateProfile({
                        womenHealth: { ...profile.womenHealth, notes: event.target.value }
                      })}
                      placeholder="Food comfort, nausea triggers, cravings, or doctor-advised food restrictions"
                      className="min-h-24"
                    />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Profile readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mono-label text-[11px] text-muted-foreground">Personalization</p>
                <p className="mt-2 text-3xl font-black text-white">{profileCompletion}%</p>
                <p className="mt-1 text-sm text-muted-foreground">Used by scans, diary analysis, and DabbaBot food guidance.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <Badge variant="outline" className="justify-center gap-2 py-2">
                  <Scale className="h-3.5 w-3.5" />
                  {profile.weightKg ? `${profile.weightKg} kg` : "Weight"}
                </Badge>
                <Badge variant="outline" className="justify-center gap-2 py-2">
                  <Moon className="h-3.5 w-3.5" />
                  {profile.sleepHours ? `${profile.sleepHours}h sleep` : "Sleep"}
                </Badge>
                <Badge variant="outline" className="justify-center gap-2 py-2">
                  <Droplets className="h-3.5 w-3.5" />
                  {profile.waterGlasses ? `${profile.waterGlasses} glasses` : "Water"}
                </Badge>
              </div>
              {status ? <p className="text-sm text-primary">{status}</p> : null}
              {error ? <p className="text-sm text-red-200">{error}</p> : null}
              <Button type="button" className="w-full" onClick={saveProfile} disabled={savingProfile || setupRequired}>
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save health profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary" />
              Daily wellness log
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={logDraft.logDate}
                  onChange={(event) => setLogDraft({ ...logDraft, logDate: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Weight kg</Label>
                <Input
                  inputMode="decimal"
                  value={logDraft.weightKg ?? ""}
                  onChange={(event) => setLogDraft({ ...logDraft, weightKg: numberValue(event.target.value) })}
                  placeholder="62"
                />
              </div>
              <div className="space-y-2">
                <Label>Sleep hours</Label>
                <Input
                  inputMode="decimal"
                  value={logDraft.sleepHours ?? ""}
                  onChange={(event) => setLogDraft({ ...logDraft, sleepHours: numberValue(event.target.value) })}
                  placeholder="7"
                />
              </div>
              <div className="space-y-2">
                <Label>Energy</Label>
                <select
                  value={logDraft.energyLevel ?? ""}
                  onChange={(event) => setLogDraft({ ...logDraft, energyLevel: event.target.value || undefined })}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition focus:border-primary/50"
                >
                  <option value="">Select</option>
                  <option>Low</option>
                  <option>Okay</option>
                  <option>Good</option>
                  <option>High</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Mood</Label>
              <div className="flex flex-wrap gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setLogDraft({ ...logDraft, mood })}
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                      logDraft.mood === mood
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Cravings</Label>
              <div className="flex flex-wrap gap-2">
                {cravings.map((craving) => {
                  const active = logDraft.cravings.includes(craving);
                  return (
                    <button
                      key={craving}
                      type="button"
                      onClick={() => setLogDraft({ ...logDraft, cravings: toggleValue(logDraft.cravings, craving) })}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                        active
                          ? "border-secondary/40 bg-secondary/15 text-orange-100"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                      }`}
                    >
                      {craving}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={logDraft.notes ?? ""}
                onChange={(event) => setLogDraft({ ...logDraft, notes: event.target.value })}
                placeholder="Late-night snack, period cravings, stress eating, workout, or anything food-related"
                className="min-h-24"
              />
            </div>

            <Button type="button" className="w-full" onClick={saveLog} disabled={savingLog || setupRequired}>
              {savingLog ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save daily log
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Recent wellness pattern</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {logs.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                No wellness logs yet. Add today&apos;s mood, sleep, weight, and cravings to start finding patterns.
              </p>
            ) : null}
            {logs.slice(0, 7).map((log) => (
              <div key={log.id ?? log.logDate} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{log.logDate}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[log.mood, log.energyLevel ? `${log.energyLevel} energy` : null, log.sleepHours ? `${log.sleepHours}h sleep` : null]
                        .filter(Boolean)
                        .join(" • ") || "Wellness log"}
                    </p>
                  </div>
                  {log.weightKg ? <Badge variant="outline">{log.weightKg} kg</Badge> : null}
                </div>
                {log.cravings.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {log.cravings.map((craving) => (
                      <Badge key={craving} variant="secondary">{craving}</Badge>
                    ))}
                  </div>
                ) : null}
                {log.notes ? <p className="mt-3 text-sm text-muted-foreground">{log.notes}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

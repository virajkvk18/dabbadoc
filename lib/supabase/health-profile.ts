import "server-only";

import type { UserHealthProfile, WellnessLog, WomenHealthContext } from "@/types";
import { ApiError } from "@/lib/security/api-errors";
import { createSupabaseAdmin } from "./admin";
import { createSupabaseServer } from "./server";

type HealthProfileRow = {
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  sleep_hours: number | null;
  sleep_quality: string | null;
  water_glasses: number | null;
  dietary_preference: string | null;
  allergies: unknown;
  medical_conditions: unknown;
  health_goals: unknown;
  custom_goals: unknown;
  women_health: unknown;
  updated_at: string | null;
};

type WellnessLogRow = {
  id: string;
  log_date: string;
  weight_kg: number | null;
  mood: string | null;
  energy_level: string | null;
  sleep_hours: number | null;
  cravings: unknown;
  cycle_phase: string | null;
  notes: string | null;
  created_at: string | null;
};

export type HealthProfileDashboard = {
  profile: UserHealthProfile;
  logs: WellnessLog[];
  setupRequired: boolean;
};

export const EMPTY_HEALTH_PROFILE: UserHealthProfile = {
  allergies: [],
  medicalConditions: [],
  healthGoals: [],
  customGoals: [],
  womenHealth: {
    enabled: false,
    pregnancyStatus: "not_applicable",
    cyclePhase: "not_tracking",
    cravings: []
  }
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : [];
}

function asWomenHealth(value: unknown): WomenHealthContext {
  const row = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  return {
    enabled: Boolean(row.enabled),
    pregnancyStatus: typeof row.pregnancyStatus === "string"
      ? row.pregnancyStatus as WomenHealthContext["pregnancyStatus"]
      : "not_applicable",
    cyclePhase: typeof row.cyclePhase === "string"
      ? row.cyclePhase as WomenHealthContext["cyclePhase"]
      : "not_tracking",
    cravings: asStringArray(row.cravings),
    notes: typeof row.notes === "string" ? row.notes : undefined
  };
}

function mapProfile(row?: HealthProfileRow | null): UserHealthProfile {
  if (!row) return EMPTY_HEALTH_PROFILE;

  return {
    age: row.age ?? undefined,
    gender: row.gender ?? undefined,
    heightCm: row.height_cm ?? undefined,
    weightKg: row.weight_kg ?? undefined,
    activityLevel: row.activity_level ?? undefined,
    sleepHours: row.sleep_hours ?? undefined,
    sleepQuality: row.sleep_quality ?? undefined,
    waterGlasses: row.water_glasses ?? undefined,
    dietaryPreference: row.dietary_preference ?? undefined,
    allergies: asStringArray(row.allergies),
    medicalConditions: asStringArray(row.medical_conditions),
    healthGoals: asStringArray(row.health_goals),
    customGoals: asStringArray(row.custom_goals),
    womenHealth: asWomenHealth(row.women_health),
    updatedAt: row.updated_at ?? undefined
  };
}

function mapLog(row: WellnessLogRow): WellnessLog {
  return {
    id: row.id,
    logDate: row.log_date,
    weightKg: row.weight_kg ?? undefined,
    mood: row.mood ?? undefined,
    energyLevel: row.energy_level ?? undefined,
    sleepHours: row.sleep_hours ?? undefined,
    cravings: asStringArray(row.cravings),
    cyclePhase: row.cycle_phase ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at ?? undefined
  };
}

function isMissingTable(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "42P01";
}

export function profileToDbRow(userId: string, profile: UserHealthProfile) {
  return {
    user_id: userId,
    age: profile.age ?? null,
    gender: profile.gender ?? null,
    height_cm: profile.heightCm ?? null,
    weight_kg: profile.weightKg ?? null,
    activity_level: profile.activityLevel ?? null,
    sleep_hours: profile.sleepHours ?? null,
    sleep_quality: profile.sleepQuality ?? null,
    water_glasses: profile.waterGlasses ?? null,
    dietary_preference: profile.dietaryPreference ?? null,
    allergies: profile.allergies,
    medical_conditions: profile.medicalConditions,
    health_goals: profile.healthGoals,
    custom_goals: profile.customGoals,
    women_health: profile.womenHealth,
    updated_at: new Date().toISOString()
  };
}

export function wellnessLogToDbRow(userId: string, log: WellnessLog) {
  return {
    user_id: userId,
    log_date: log.logDate,
    weight_kg: log.weightKg ?? null,
    mood: log.mood ?? null,
    energy_level: log.energyLevel ?? null,
    sleep_hours: log.sleepHours ?? null,
    cravings: log.cravings,
    cycle_phase: log.cyclePhase ?? null,
    notes: log.notes ?? null,
    updated_at: new Date().toISOString()
  };
}

export async function getHealthProfileDashboard(userId: string): Promise<HealthProfileDashboard> {
  const supabase = await createSupabaseServer();
  if (!supabase) {
    return { profile: EMPTY_HEALTH_PROFILE, logs: [], setupRequired: true };
  }

  const [profileResponse, logsResponse] = await Promise.all([
    supabase
      .from("health_profiles")
      .select("age, gender, height_cm, weight_kg, activity_level, sleep_hours, sleep_quality, water_glasses, dietary_preference, allergies, medical_conditions, health_goals, custom_goals, women_health, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("wellness_logs")
      .select("id, log_date, weight_kg, mood, energy_level, sleep_hours, cravings, cycle_phase, notes, created_at")
      .eq("user_id", userId)
      .order("log_date", { ascending: false })
      .limit(14)
  ]);

  if (isMissingTable(profileResponse.error) || isMissingTable(logsResponse.error)) {
    return { profile: EMPTY_HEALTH_PROFILE, logs: [], setupRequired: true };
  }

  return {
    profile: mapProfile(profileResponse.data as HealthProfileRow | null),
    logs: ((logsResponse.data ?? []) as WellnessLogRow[]).map(mapLog),
    setupRequired: false
  };
}

export async function getHealthContextForUser(userId: string) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return { goals: [] as string[], context: "" };

  const { data, error } = await supabase
    .from("health_profiles")
    .select("age, gender, height_cm, weight_kg, activity_level, sleep_hours, sleep_quality, water_glasses, dietary_preference, allergies, medical_conditions, health_goals, custom_goals, women_health, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return { goals: [] as string[], context: "" };

  const profile = mapProfile(data as HealthProfileRow);
  const goals = Array.from(new Set([...profile.healthGoals, ...profile.customGoals]));
  const women = profile.womenHealth;
  const parts = [
    profile.age ? `Age ${profile.age}` : null,
    profile.gender ? `Gender ${profile.gender}` : null,
    profile.weightKg ? `Weight ${profile.weightKg} kg` : null,
    profile.heightCm ? `Height ${profile.heightCm} cm` : null,
    profile.activityLevel ? `Activity ${profile.activityLevel}` : null,
    profile.sleepHours ? `Usual sleep ${profile.sleepHours} hours` : null,
    profile.sleepQuality ? `Sleep quality ${profile.sleepQuality}` : null,
    profile.dietaryPreference ? `Diet ${profile.dietaryPreference}` : null,
    profile.medicalConditions.length ? `Health conditions: ${profile.medicalConditions.join(", ")}` : null,
    profile.allergies.length ? `Allergies: ${profile.allergies.join(", ")}` : null,
    goals.length ? `Goals: ${goals.join(", ")}` : null,
    women.enabled
      ? `Women health context: ${[
          women.pregnancyStatus,
          women.cyclePhase,
          women.cravings?.length ? `cravings ${women.cravings.join(", ")}` : null,
          women.notes
        ].filter(Boolean).join(", ")}`
      : null
  ].filter(Boolean);

  return {
    goals,
    context: parts.join(". ")
  };
}

export async function saveHealthProfileForUser(userId: string, profile: UserHealthProfile) {
  const supabase = createSupabaseAdmin();
  if (!supabase) throw new ApiError("Health profile storage is unavailable.", 503);

  const { error } = await supabase
    .from("health_profiles")
    .upsert(profileToDbRow(userId, profile), { onConflict: "user_id" });

  if (error) {
    throw new ApiError("Could not save health profile. Please run the latest Supabase schema.", 500);
  }
}

export async function saveWellnessLogForUser(userId: string, log: WellnessLog) {
  const supabase = createSupabaseAdmin();
  if (!supabase) throw new ApiError("Wellness log storage is unavailable.", 503);

  const { error } = await supabase
    .from("wellness_logs")
    .upsert(wellnessLogToDbRow(userId, log), { onConflict: "user_id,log_date" });

  if (error) {
    throw new ApiError("Could not save wellness log. Please run the latest Supabase schema.", 500);
  }
}

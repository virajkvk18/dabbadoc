import "server-only";

import type { User } from "@supabase/supabase-js";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { ApiError } from "@/lib/security/api-errors";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";

export type FamilyConnectionStatus = "pending" | "accepted" | "rejected" | "revoked";

type FamilyConnectionRow = {
  id: string;
  owner_user_id: string;
  family_member_user_id: string | null;
  invited_email: string;
  relationship: string;
  status: FamilyConnectionStatus;
  created_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  revoked_at: string | null;
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string | null;
};

type ScoreRow = {
  score: number;
  streak_count: number | null;
  created_at: string;
};

type ActivityRow = {
  created_at: string;
};

type ScoredActivityRow = ActivityRow & {
  health_score?: number | null;
  label_truth_score?: number | null;
  daily_score?: number | null;
  detected_items?: unknown;
  product_name?: string | null;
  diary_text?: string | null;
  good_items?: unknown;
  risk_flags?: unknown;
  warnings?: unknown;
  risky_items?: unknown;
};

type ReportRow = {
  created_at: string;
};

type HealthProfileRow = {
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  sleep_hours: number | null;
  sleep_quality: string | null;
  medical_conditions: unknown;
  health_goals: unknown;
  custom_goals: unknown;
  updated_at: string | null;
};

type WellnessLogRow = {
  log_date: string;
  weight_kg: number | null;
  mood: string | null;
  energy_level: string | null;
  sleep_hours: number | null;
  created_at: string;
};

type ScoreEvent = {
  score: number;
  created_at: string;
  source: "health_index" | "receipt" | "label" | "diary";
  streak_count?: number | null;
};

type NamedFoodItem = {
  name?: string;
  flags?: string[];
};

type NamedRisk = {
  label?: string;
  severity?: string;
};

function adminClient() {
  const supabase = createSupabaseAdmin();
  if (!supabase) {
    throw new ApiError("Family access is temporarily unavailable.", 503);
  }
  return supabase;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function initials(nameOrEmail: string) {
  const name = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
  const parts = name.replace(/[._-]+/g, " ").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "FM";
}

function relativeDate(value?: string | null) {
  if (!value) return "Not updated yet";
  const diffMs = Date.now() - new Date(value).getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / 86_400_000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asStringArray(value: unknown) {
  return asArray<unknown>(value)
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function validScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function latestScoreEvents(params: {
  scores?: ScoreRow[];
  receipts?: ScoredActivityRow[];
  labels?: ScoredActivityRow[];
  diaries?: ScoredActivityRow[];
}): ScoreEvent[] {
  const events: ScoreEvent[] = [
    ...(params.scores ?? [])
      .filter((row) => validScore(row.score))
      .map((row) => ({
        score: row.score,
        created_at: row.created_at,
        source: "health_index" as const,
        streak_count: row.streak_count
      })),
    ...(params.receipts ?? [])
      .filter((row) => validScore(row.health_score))
      .map((row) => ({
        score: row.health_score as number,
        created_at: row.created_at,
        source: "receipt" as const
      })),
    ...(params.labels ?? [])
      .filter((row) => validScore(row.label_truth_score))
      .map((row) => ({
        score: row.label_truth_score as number,
        created_at: row.created_at,
        source: "label" as const
      })),
    ...(params.diaries ?? [])
      .filter((row) => validScore(row.daily_score))
      .map((row) => ({
        score: row.daily_score as number,
        created_at: row.created_at,
        source: "diary" as const
      }))
  ];

  return events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function trendFromEvents(events: ScoreEvent[]) {
  if (events.length < 2) return "Stable";
  const latest = events[0].score;
  const previous = events[1].score;
  if (latest >= previous + 4) return "Improving";
  if (latest <= previous - 4) return "Declining";
  return "Stable";
}

function latestDate(values: Array<string | null | undefined>) {
  return values
    .filter(Boolean)
    .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0] ?? null;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function calculateBmi(weightKg?: number | null, heightCm?: number | null) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function foodNames(value: unknown, limit = 4) {
  return asArray<NamedFoodItem>(value)
    .map((item) => item.name?.trim())
    .filter((item): item is string => Boolean(item))
    .slice(0, limit);
}

function riskLabels(value: unknown, limit = 4) {
  return asArray<NamedRisk>(value)
    .map((risk) => risk.label?.trim())
    .filter((item): item is string => Boolean(item))
    .slice(0, limit);
}

function shortText(value?: string | null, max = 90) {
  const clean = value?.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}...` : clean;
}

function repeatedWatchItems(params: {
  receipts: ScoredActivityRow[];
  labels: ScoredActivityRow[];
  diaries: ScoredActivityRow[];
}) {
  const counts = new Map<string, number>();
  const add = (value?: string | null) => {
    const clean = value?.trim();
    if (!clean) return;
    counts.set(clean, (counts.get(clean) ?? 0) + 1);
  };

  params.receipts.forEach((receipt) => {
    riskLabels(receipt.risk_flags, 6).forEach(add);
    foodNames(receipt.detected_items, 6).forEach(add);
  });
  params.labels.forEach((label) => {
    riskLabels(label.warnings, 6).forEach(add);
    add(label.product_name);
  });
  params.diaries.forEach((diary) => {
    foodNames(diary.risky_items, 6).forEach(add);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([item, count]) => ({ item, count }));
}

function foodHistorySummary(params: {
  receipts: ScoredActivityRow[];
  labels: ScoredActivityRow[];
  diaries: ScoredActivityRow[];
}) {
  const latestReceipt = params.receipts[0];
  const latestLabel = params.labels[0];
  const latestDiary = params.diaries[0];

  return {
    latestReceipt: latestReceipt
      ? {
          date: latestReceipt.created_at,
          score: latestReceipt.health_score ?? null,
          items: foodNames(latestReceipt.detected_items),
          watch: riskLabels(latestReceipt.risk_flags)
        }
      : null,
    latestLabel: latestLabel
      ? {
          date: latestLabel.created_at,
          score: latestLabel.label_truth_score ?? null,
          product: latestLabel.product_name || "Packaged food",
          warnings: riskLabels(latestLabel.warnings)
        }
      : null,
    latestDiary: latestDiary
      ? {
          date: latestDiary.created_at,
          score: latestDiary.daily_score ?? null,
          summary: shortText(latestDiary.diary_text, 100),
          goodItems: foodNames(latestDiary.good_items),
          watchItems: foodNames(latestDiary.risky_items)
        }
      : null,
    repeatedWatch: repeatedWatchItems(params)
  };
}

async function getCurrentUserAndServer() {
  const user = await requireVerifiedUser();
  const supabase = await createSupabaseServer();
  if (!supabase) throw new ApiError("Secure account access is temporarily unavailable.", 503);
  return { user, supabase };
}

async function findProfileById(userId: string) {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new ApiError("Could not load family profile.", 500);
  return data as ProfileRow | null;
}

async function verifyAcceptedOwnerConnection(user: User, connectionId: string) {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("family_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("owner_user_id", user.id)
    .eq("status", "accepted")
    .maybeSingle();

  if (error) throw new ApiError("Could not verify family access.", 500);
  if (!data?.family_member_user_id) {
    throw new ApiError("Family member summary is not available.", 404);
  }

  return data as FamilyConnectionRow;
}

export async function inviteFamilyMember(params: {
  email: string;
  relationship: string;
}) {
  const user = await requireVerifiedUser();
  const email = normalizeEmail(params.email);
  if (email === normalizeEmail(user.email ?? "")) {
    throw new ApiError("You cannot invite your own account.", 400);
  }

  const supabase = adminClient();
  const { data: existing, error: existingError } = await supabase
    .from("family_connections")
    .select("id, status")
    .eq("owner_user_id", user.id)
    .eq("invited_email", email)
    .in("status", ["pending", "accepted"])
    .maybeSingle();

  if (existingError) throw new ApiError("Could not check existing family invite.", 500);
  if (existing) throw new ApiError("This family member is already invited or connected.", 409);

  const { data, error } = await supabase
    .from("family_connections")
    .insert({
      owner_user_id: user.id,
      invited_email: email,
      relationship: params.relationship,
      status: "pending"
    })
    .select("id")
    .single();

  if (error) throw new ApiError("Could not create family invite.", 500);
  return data as { id: string };
}

export async function respondToFamilyInvite(params: {
  connectionId: string;
  action: "accept" | "reject";
}) {
  const { user } = await getCurrentUserAndServer();
  const email = normalizeEmail(user.email ?? "");
  const supabase = adminClient();

  const { data: invite, error: inviteError } = await supabase
    .from("family_connections")
    .select("*")
    .eq("id", params.connectionId)
    .eq("status", "pending")
    .maybeSingle();

  if (inviteError) throw new ApiError("Could not load family invite.", 500);
  if (!invite || normalizeEmail(invite.invited_email) !== email) {
    throw new ApiError("Family invite not found for this account.", 404);
  }
  if (invite.owner_user_id === user.id) {
    throw new ApiError("You cannot accept your own family invite.", 400);
  }

  const update =
    params.action === "accept"
      ? {
          family_member_user_id: user.id,
          status: "accepted",
          accepted_at: new Date().toISOString()
        }
      : {
          status: "rejected",
          rejected_at: new Date().toISOString()
        };

  const { error } = await supabase
    .from("family_connections")
    .update(update)
    .eq("id", params.connectionId);

  if (error) throw new ApiError("Could not update family invite.", 500);
  return { ok: true };
}

async function memberCard(row: FamilyConnectionRow) {
  const profile = row.family_member_user_id
    ? await findProfileById(row.family_member_user_id)
    : null;
  const memberId = row.family_member_user_id;
  const supabase = adminClient();
  const [scoresResponse, receiptsResponse, labelsResponse, diariesResponse] = memberId
    ? await Promise.all([
        supabase
          .from("health_index")
          .select("score, streak_count, created_at")
          .eq("user_id", memberId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("receipt_analyses")
          .select("created_at, health_score")
          .eq("user_id", memberId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("label_analyses")
          .select("created_at, label_truth_score")
          .eq("user_id", memberId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("food_diaries")
          .select("created_at, daily_score")
          .eq("user_id", memberId)
          .order("created_at", { ascending: false })
          .limit(10)
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null }
      ];

  if (
    scoresResponse.error ||
    receiptsResponse.error ||
    labelsResponse.error ||
    diariesResponse.error
  ) {
    throw new ApiError("Could not load family member score.", 500);
  }

  const scoreEvents = latestScoreEvents({
    scores: (scoresResponse.data ?? []) as ScoreRow[],
    receipts: (receiptsResponse.data ?? []) as ScoredActivityRow[],
    labels: (labelsResponse.data ?? []) as ScoredActivityRow[],
    diaries: (diariesResponse.data ?? []) as ScoredActivityRow[]
  });
  const latestScore = scoreEvents[0];
  const score = latestScore?.score;
  const lastUpdated = latestScore?.created_at ?? row.accepted_at ?? row.created_at;
  const displayName = profile?.full_name || profile?.email || row.invited_email;

  return {
    id: row.id,
    name: displayName,
    initials: initials(displayName),
    email: row.invited_email,
    relationship: row.relationship,
    status: row.status,
    healthScore: typeof score === "number" ? score : null,
    lastUpdated,
    lastUpdatedLabel: row.status === "accepted" ? relativeDate(lastUpdated) : "Invite pending"
  };
}

export async function getFamilyOverview() {
  const { user, supabase } = await getCurrentUserAndServer();
  const email = normalizeEmail(user.email ?? "");

  const [{ data: ownedRows, error: ownedError }, { data: incomingRows, error: incomingError }] =
    await Promise.all([
      supabase
        .from("family_connections")
        .select("*")
        .eq("owner_user_id", user.id)
        .in("status", ["pending", "accepted"]),
      supabase
        .from("family_connections")
        .select("*")
        .eq("invited_email", email)
        .eq("status", "pending")
    ]);

  if (ownedError || incomingError) {
    throw new ApiError("Could not load family connections.", 500);
  }

  return {
    members: await Promise.all(((ownedRows ?? []) as FamilyConnectionRow[]).map(memberCard)),
    incomingInvites: ((incomingRows ?? []) as FamilyConnectionRow[]).map((row) => ({
      id: row.id,
      relationship: row.relationship,
      invitedEmail: row.invited_email,
      createdAt: row.created_at
    }))
  };
}

export async function getFamilyMemberSummary(connectionId: string) {
  const user = await requireVerifiedUser();
  const connection = await verifyAcceptedOwnerConnection(user, connectionId);
  const memberId = connection.family_member_user_id as string;
  const profile = await findProfileById(memberId);
  const supabase = adminClient();

  const [
    scoresResponse,
    receiptsResponse,
    labelsResponse,
    diariesResponse,
    reportsResponse,
    healthProfileResponse,
    wellnessResponse
  ] = await Promise.all([
    supabase
      .from("health_index")
      .select("score, streak_count, created_at")
      .eq("user_id", memberId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("receipt_analyses")
      .select("created_at, health_score, detected_items, risk_flags", { count: "exact" })
      .eq("user_id", memberId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("label_analyses")
      .select("created_at, product_name, label_truth_score, warnings", { count: "exact" })
      .eq("user_id", memberId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("food_diaries")
      .select("created_at, diary_text, daily_score, good_items, risky_items", { count: "exact" })
      .eq("user_id", memberId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("reports")
      .select("created_at", { count: "exact" })
      .eq("user_id", memberId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("health_profiles")
      .select("age, gender, height_cm, weight_kg, activity_level, sleep_hours, sleep_quality, medical_conditions, health_goals, custom_goals, updated_at")
      .eq("user_id", memberId)
      .maybeSingle(),
    supabase
      .from("wellness_logs")
      .select("log_date, weight_kg, mood, energy_level, sleep_hours, created_at")
      .eq("user_id", memberId)
      .order("log_date", { ascending: false })
      .limit(7)
  ]);

  if (
    scoresResponse.error ||
    receiptsResponse.error ||
    labelsResponse.error ||
    diariesResponse.error ||
    reportsResponse.error ||
    healthProfileResponse.error ||
    wellnessResponse.error
  ) {
    throw new ApiError("Could not load family member summary.", 500);
  }

  const scores = (scoresResponse.data ?? []) as ScoreRow[];
  const receipts = (receiptsResponse.data ?? []) as ScoredActivityRow[];
  const labels = (labelsResponse.data ?? []) as ScoredActivityRow[];
  const diaries = (diariesResponse.data ?? []) as ScoredActivityRow[];
  const reports = (reportsResponse.data ?? []) as ReportRow[];
  const healthProfile = (healthProfileResponse.data ?? null) as HealthProfileRow | null;
  const wellnessLogs = (wellnessResponse.data ?? []) as WellnessLogRow[];
  const scoreEvents = latestScoreEvents({ scores, receipts, labels, diaries });
  const latestScore = scoreEvents[0];
  const currentScore = latestScore?.score ?? null;
  const latestWellness = wellnessLogs[0];
  const latestActivity = latestDate([
    latestScore?.created_at,
    reports[0]?.created_at,
    healthProfile?.updated_at,
    latestWellness?.created_at
  ]);
  const dropped =
    scoreEvents.length >= 2 && scoreEvents[0].score <= scoreEvents[1].score - 10;
  const stale = !latestActivity || Date.now() - new Date(latestActivity).getTime() > 14 * 86_400_000;
  const latestWeight = latestWellness?.weight_kg ?? healthProfile?.weight_kg ?? null;
  const latestSleep = latestWellness?.sleep_hours ?? healthProfile?.sleep_hours ?? null;
  const bmi = calculateBmi(latestWeight, healthProfile?.height_cm);
  const healthGoals = [
    ...asStringArray(healthProfile?.health_goals),
    ...asStringArray(healthProfile?.custom_goals)
  ];
  const medicalConditions = asStringArray(healthProfile?.medical_conditions);
  const bpContext = [...medicalConditions, ...healthGoals].find((item) =>
    /bp|blood pressure|hypertension|heart|low sodium/i.test(item)
  );
  const sugarContext = [...medicalConditions, ...healthGoals].find((item) =>
    /diabetes|blood sugar|sugar/i.test(item)
  );
  const latestStreak =
    scoreEvents.find((event) => typeof event.streak_count === "number")?.streak_count ?? 0;
  const scanCount =
    (receiptsResponse.count ?? receipts.length) +
    (labelsResponse.count ?? labels.length) +
    (diariesResponse.count ?? diaries.length);
  const reportsCount = reportsResponse.count ?? reports.length;

  return {
    connectionId: connection.id,
    personal: {
      name: profile?.full_name || profile?.email || connection.invited_email,
      initials: initials(profile?.full_name || profile?.email || connection.invited_email),
      email: connection.invited_email,
      relationship: connection.relationship,
      age: typeof healthProfile?.age === "number" ? `${healthProfile.age}` : "Not shared",
      gender: healthProfile?.gender ? titleCase(healthProfile.gender) : "Not shared"
    },
    summary: {
      healthScore: currentScore,
      scoreTrend: trendFromEvents(scoreEvents),
      lastCheckupDate: latestActivity ?? null,
      lastUpdatedLabel: relativeDate(latestActivity),
      reportsCount,
      streakDays: latestStreak,
      scansCount: scanCount,
      scoreSource: latestScore?.source ?? null
    },
    foodHistory: foodHistorySummary({ receipts, labels, diaries }),
    metrics: {
      weight: latestWeight ? `${formatNumber(latestWeight)} kg` : "Not shared",
      bmi: bmi ? `${formatNumber(bmi)}` : "Not shared",
      bloodPressureStatus: bpContext ? `${titleCase(bpContext)} context saved` : "Not shared",
      bloodSugarStatus: sugarContext ? `${titleCase(sugarContext)} context saved` : "Not shared",
      activityScore:
        healthProfile?.activity_level
          ? titleCase(healthProfile.activity_level)
          : diaries.length > 0
            ? "Active food tracking"
            : "Not shared",
      sleepScore: latestSleep
        ? `${formatNumber(latestSleep)}h${healthProfile?.sleep_quality ? `, ${titleCase(healthProfile.sleep_quality)}` : ""}`
        : "Not shared"
    },
    alerts: [
      dropped ? "Health score dropped significantly" : null,
      stale ? "No recent health check-in or scan" : null,
      reportsCount > 0 ? "Latest report summary is available" : null,
      latestStreak && latestStreak >= 3
        ? `${latestStreak}-day tracking streak active`
        : null
    ].filter(Boolean) as string[]
  };
}

export async function removeFamilyConnection(connectionId: string) {
  const user = await requireVerifiedUser();
  const supabase = adminClient();
  const { data, error: loadError } = await supabase
    .from("family_connections")
    .select("id, owner_user_id, family_member_user_id, status")
    .eq("id", connectionId)
    .maybeSingle();

  if (loadError) throw new ApiError("Could not load family connection.", 500);
  if (!data || (data.owner_user_id !== user.id && data.family_member_user_id !== user.id)) {
    throw new ApiError("Family connection not found for this account.", 404);
  }

  const { error } = await supabase
    .from("family_connections")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString()
    })
    .eq("id", connectionId);

  if (error) throw new ApiError("Could not remove family connection.", 500);
  return { ok: true };
}

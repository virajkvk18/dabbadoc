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

type ReportRow = {
  created_at: string;
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

function trendFromScores(scores: ScoreRow[]) {
  if (scores.length < 2) return "Stable";
  const latest = scores[0].score;
  const previous = scores[1].score;
  if (latest >= previous + 4) return "Improving";
  if (latest <= previous - 4) return "Declining";
  return "Stable";
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
  const latestScore = memberId
    ? await supabase
        .from("health_index")
        .select("score, streak_count, created_at")
        .eq("user_id", memberId)
        .order("created_at", { ascending: false })
        .limit(1)
    : { data: [], error: null };

  const score = (latestScore.data?.[0] as ScoreRow | undefined)?.score;
  const lastUpdated = (latestScore.data?.[0] as ScoreRow | undefined)?.created_at ?? row.created_at;
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
    reportsResponse
  ] = await Promise.all([
    supabase
      .from("health_index")
      .select("score, streak_count, created_at")
      .eq("user_id", memberId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("receipt_analyses")
      .select("created_at, health_score, risk_flags")
      .eq("user_id", memberId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("label_analyses")
      .select("created_at, label_truth_score, warnings")
      .eq("user_id", memberId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("food_diaries")
      .select("created_at, daily_score, risky_items")
      .eq("user_id", memberId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("reports")
      .select("created_at")
      .eq("user_id", memberId)
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  if (
    scoresResponse.error ||
    receiptsResponse.error ||
    labelsResponse.error ||
    diariesResponse.error ||
    reportsResponse.error
  ) {
    throw new ApiError("Could not load family member summary.", 500);
  }

  const scores = (scoresResponse.data ?? []) as ScoreRow[];
  const receipts = (receiptsResponse.data ?? []) as Array<ActivityRow & { health_score?: number; risk_flags?: unknown }>;
  const labels = (labelsResponse.data ?? []) as Array<ActivityRow & { label_truth_score?: number; warnings?: unknown }>;
  const diaries = (diariesResponse.data ?? []) as Array<ActivityRow & { daily_score?: number; risky_items?: unknown }>;
  const reports = (reportsResponse.data ?? []) as ReportRow[];
  const latestDates = [
    scores[0]?.created_at,
    receipts[0]?.created_at,
    labels[0]?.created_at,
    diaries[0]?.created_at,
    reports[0]?.created_at
  ].filter(Boolean) as string[];
  const latestActivity = latestDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  const currentScore =
    scores[0]?.score ??
    receipts[0]?.health_score ??
    labels[0]?.label_truth_score ??
    diaries[0]?.daily_score ??
    null;
  const dropped = scores.length >= 2 && scores[0].score <= scores[1].score - 10;
  const stale = !latestActivity || Date.now() - new Date(latestActivity).getTime() > 14 * 86_400_000;

  return {
    connectionId: connection.id,
    personal: {
      name: profile?.full_name || profile?.email || connection.invited_email,
      initials: initials(profile?.full_name || profile?.email || connection.invited_email),
      email: connection.invited_email,
      relationship: connection.relationship,
      age: "Not shared",
      gender: "Not shared"
    },
    summary: {
      healthScore: currentScore,
      scoreTrend: trendFromScores(scores),
      lastCheckupDate: latestActivity ?? null,
      lastUpdatedLabel: relativeDate(latestActivity),
      reportsCount: reports.length,
      streakDays: scores[0]?.streak_count ?? 0,
      scansCount: receipts.length + labels.length + diaries.length
    },
    metrics: {
      weight: "Not tracked",
      bmi: "Not tracked",
      bloodPressureStatus: "Not tracked",
      bloodSugarStatus: "Not tracked",
      activityScore: diaries.length > 0 ? "Active food tracking" : "Not tracked",
      sleepScore: "Not tracked"
    },
    alerts: [
      dropped ? "Health score dropped significantly" : null,
      stale ? "No recent health check-in or scan" : null,
      reports.length > 0 ? "Latest report summary is available" : null,
      scores[0]?.streak_count && scores[0].streak_count >= 3
        ? `${scores[0].streak_count}-day tracking streak active`
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

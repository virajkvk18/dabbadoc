import type { PlanType } from "@/types";
import { isPaidPlan } from "@/lib/plans";

const CREATOR_EMAILS = new Set([
  "aanya1407.jain@gmail.com",
  "jainaanya1407@gmail.com",
  "virajvishwakarma672@gmail.com"
]);

export function isCreatorEmail(email?: string | null) {
  return Boolean(email && CREATOR_EMAILS.has(email.trim().toLowerCase()));
}

export function getEffectivePlan(params: {
  email?: string | null;
  plan?: string | null;
  isPremium?: boolean | null;
}): PlanType {
  if (isCreatorEmail(params.email)) return "premium_plus";
  if (params.plan === "premium_plus") return "premium_plus";
  if (params.plan === "premium" || params.isPremium) return "premium";
  return "free";
}

export function hasPremiumAccess(plan?: string | null) {
  return isPaidPlan(plan);
}

export function hasPremiumPlusAccess(plan?: string | null) {
  return plan === "premium_plus";
}

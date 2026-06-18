import type { PaidPlanType, PlanType } from "@/types";

export const PAID_PLANS = {
  premium: {
    id: "premium",
    name: "Premium",
    amountPaise: 29900,
    priceLabel: "Rs 299 / month",
    checkoutDescription: "Premium monthly plan"
  },
  premium_plus: {
    id: "premium_plus",
    name: "Premium Plus",
    amountPaise: 49900,
    priceLabel: "Rs 499 / month",
    checkoutDescription: "Premium Plus monthly plan"
  }
} satisfies Record<
  PaidPlanType,
  {
    id: PaidPlanType;
    name: string;
    amountPaise: number;
    priceLabel: string;
    checkoutDescription: string;
  }
>;

export function isPaidPlan(value: unknown): value is PaidPlanType {
  return value === "premium" || value === "premium_plus";
}

export function getPaidPlan(plan: PaidPlanType) {
  return PAID_PLANS[plan];
}

export function getPlanDisplayName(plan?: PlanType | string | null) {
  if (isPaidPlan(plan)) return PAID_PLANS[plan].name;
  return "Free";
}

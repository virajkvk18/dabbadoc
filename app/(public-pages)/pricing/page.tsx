import { PricingCard } from "@/components/pricing/pricing-card";
import { SiteHeader } from "@/components/layout/site-header";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { PAID_PLANS } from "@/lib/plans";
import { getCurrentUser } from "@/lib/supabase/server";
import { BadgeIndianRupee } from "lucide-react";

const freeFeatures = [
  "7-day trial",
  "Limited receipt scans",
  "Limited LabelScans",
  "Limited food diary entries",
  "Basic health score",
  "Basic swaps"
];

const premiumFeatures = [
  "Unlimited uploads",
  "Advanced health analysis",
  "Cost comparison",
  "PDF reports",
  "Family health tracking",
  "Advanced streaks and badges",
  "Full history",
  "Premium food insights"
];

const premiumPlusFeatures = [
  "Everything in Premium",
  "Deeper family food-risk trends",
  "Goal-focused insights for diabetes, protein, sodium, and weight",
  "Priority PDF report generation",
  "Premium Plus health history summaries",
  "Advanced Dabba Health Index context",
  "Early access to new DabbaBot guidance flows",
  "Best suited for families tracking food daily"
];

export default async function PricingPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="bg-grid-pattern mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <AppPageHeader
          eyebrow="DabbaDoc plans"
          title="Choose your food-health intelligence level"
          description="Start free, upgrade to Premium for full tracking, or choose Premium Plus for deeper family-focused insights."
          icon={BadgeIndianRupee}
          accent="secondary"
          stats={[
            { label: "Trial", value: "7 days" },
            { label: "Premium", value: "Rs 299" },
            { label: "Plus", value: "Rs 499" },
            { label: "Reports", value: "Included" }
          ]}
        />
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-3">
          <PricingCard plan="Free" price="Rs 0 / trial" features={freeFeatures} />
          <PricingCard
            plan={PAID_PLANS.premium.name}
            price={PAID_PLANS.premium.priceLabel}
            features={premiumFeatures}
            checkoutPlan="premium"
            authenticated={Boolean(user)}
          />
          <PricingCard
            plan={PAID_PLANS.premium_plus.name}
            price={PAID_PLANS.premium_plus.priceLabel}
            features={premiumPlusFeatures}
            checkoutPlan="premium_plus"
            featured
            badgeLabel="Best value"
            authenticated={Boolean(user)}
          />
        </div>
      </main>
    </div>
  );
}

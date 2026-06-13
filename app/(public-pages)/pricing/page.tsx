import { PricingCard } from "@/components/pricing/pricing-card";
import { SiteHeader } from "@/components/layout/site-header";
import { AppPageHeader } from "@/components/layout/app-page-header";
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

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="bg-grid-pattern mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <AppPageHeader
          eyebrow="Premium plan"
          title="Premium food-health intelligence"
          description="Free trial for exploration, premium for full family tracking and reports."
          icon={BadgeIndianRupee}
          accent="secondary"
          stats={[
            { label: "Trial", value: "7 days" },
            { label: "Premium", value: "Rs 299" },
            { label: "Reports", value: "Included" }
          ]}
        />
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
          <PricingCard plan="Free" price="Rs 0 / trial" features={freeFeatures} />
          <PricingCard plan="Premium" price="Rs 299 / month" features={premiumFeatures} premium />
        </div>
      </main>
    </div>
  );
}

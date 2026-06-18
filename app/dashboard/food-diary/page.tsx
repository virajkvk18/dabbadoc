import { Utensils } from "lucide-react";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { FoodDiaryForm } from "@/components/upload/food-diary-form";

export default function FoodDiaryPage() {
  const initialNow = new Date().toISOString();

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Manual entry"
        title="Daily food diary"
        description="Add each item by source, quantity, meal time, and spice level, then get daily score, swaps, and streak updates."
        icon={Utensils}
        accent="secondary"
        stats={[
          { label: "Sources", value: "Home / outside" },
          { label: "Spice", value: "Low to high" },
          { label: "Flow", value: "Add one by one" }
        ]}
      />
      <FoodDiaryForm initialNow={initialNow} />
    </div>
  );
}

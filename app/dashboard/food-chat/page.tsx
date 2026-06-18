import { Bot } from "lucide-react";
import { FoodHistoryChat } from "@/components/chat/food-history-chat";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { getAccountOverview } from "@/lib/supabase/account-overview";

export const dynamic = "force-dynamic";

export default async function FoodChatPage() {
  const account = await getAccountOverview();

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="AI food coach"
        title="Food history chat"
        description="Ask DabbaDoc about your saved scans, diary patterns, repeated items, cheaper swaps, and this week's next change."
        icon={Bot}
        accent="primary"
        stats={[
          { label: "Saved entries", value: `${account.counts.activities}` },
          { label: "Score", value: `${account.score.current}/100` },
          { label: "Trend", value: account.score.trendLabel }
        ]}
      />
      <FoodHistoryChat />
    </div>
  );
}

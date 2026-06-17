import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateGeminiText } from "@/lib/gemini/client";
import { generateGroqText } from "@/lib/groq/client";
import { apiErrorResponse, ApiError } from "@/lib/security/api-errors";
import {
  enforceAiGenerationRateLimit,
  enforceRequestSizeLimit,
  MAX_JSON_BYTES
} from "@/lib/security/abuse-protection";
import { getAccountOverview } from "@/lib/supabase/account-overview";

export const runtime = "nodejs";

function activityLine(activity: Awaited<ReturnType<typeof getAccountOverview>>["allActivities"][number]) {
  const summary = activity.resultSections
    .flatMap((section) => section.items)
    .slice(0, 4)
    .join(" ");
  return [
    activity.title,
    activity.detail,
    typeof activity.score === "number" ? `score ${activity.score}/100` : null,
    activity.tags.length ? `tags ${activity.tags.join(", ")}` : null,
    summary
  ]
    .filter(Boolean)
    .join(" | ");
}

function fallbackAnswer(question: string, account: Awaited<ReturnType<typeof getAccountOverview>>) {
  const activities = account.allActivities.slice(0, 8);
  const repeated = new Map<string, number>();
  activities.forEach((activity) => {
    activity.tags.forEach((tag) => repeated.set(tag, (repeated.get(tag) ?? 0) + 1));
  });
  const repeatedItems = Array.from(repeated.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([item]) => item);
  const latest = activities[0];

  if (/repeat|most|again|frequent/i.test(question)) {
    return repeatedItems.length
      ? `Most repeated watch items look like: ${repeatedItems.join(", ")}. Start by reducing one of these this week.`
      : "I need more saved scans or diary entries to find repeated items.";
  }

  if (/cheap|cost|grocery|list/i.test(question)) {
    return "Cheaper healthy list: dal/chana/rajma, curd, seasonal sabzi, poha/dalia/oats, eggs or paneer/tofu, roasted chana/makhana, fruits in season. Keep packaged snacks occasional.";
  }

  if (/score|low|why/i.test(question)) {
    return latest
      ? `Your latest score signal is from ${latest.title}: ${latest.detail}. Main watch tags: ${latest.tags.slice(0, 3).join(", ") || "not enough risk tags yet"}.`
      : "No saved analysis yet. Run a receipt, label, or diary analysis first.";
  }

  return "This week, pick one simple change: reduce one repeated packaged/fried/sugary item, add one protein anchor, and choose one home-style swap.";
}

export async function POST(request: NextRequest) {
  try {
    enforceRequestSizeLimit(request, MAX_JSON_BYTES);
    const body = (await request.json()) as { question?: string };
    const question = body.question?.trim();
    if (!question || question.length < 3) {
      throw new ApiError("Ask a food-history question first.", 400);
    }
    if (question.length > 500) {
      throw new ApiError("Keep the question under 500 characters.", 400);
    }

    const account = await getAccountOverview();
    enforceAiGenerationRateLimit(request, account.user.id, "food-history-chat");

    const context = account.allActivities.slice(0, 12).map(activityLine).join("\n");
    const prompt = `
You are DabbaDoc food-history chat.
Answer only from the user's saved DabbaDoc history below.
Be concise, practical, and Hinglish-friendly.
Do not diagnose disease.
If the data is insufficient, say what scan/diary the user should add next.

User question: ${question}

Account summary:
Current score: ${account.score.current}/100 (${account.score.category})
Trend: ${account.score.trendLabel}
Streak: ${account.streak.label}
Badges: ${account.badges.join(", ") || "none"}

Recent saved food history:
${context || "No saved activity yet."}

Return 3-5 short bullet points maximum.
`;

    const answer =
      (await generateGeminiText(prompt)) ??
      (await generateGroqText(prompt)) ??
      fallbackAnswer(question, account);

    return NextResponse.json({ answer });
  } catch (error) {
    return apiErrorResponse(error, "Food history chat failed", 400, {
      request,
      route: "/api/food-history-chat"
    });
  }
}

import { Router } from "express";
import { z } from "zod";
import { requireSupabaseUser } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/rate-limit.js";
import { asyncHandler } from "../middleware/errors.js";
import { generateFoodText } from "../services/ai-providers.js";

const monthlySummarySchema = z.object({
  monthLabel: z.string().trim().min(3).max(40),
  activities: z
    .array(
      z.object({
        title: z.string().trim().max(120),
        score: z.number().min(0).max(100).optional(),
        tags: z.array(z.string().trim().max(40)).max(12).default([]),
        detail: z.string().trim().max(300).optional()
      })
    )
    .max(80)
});

function fallbackSummary(body: z.infer<typeof monthlySummarySchema>) {
  const scores = body.activities
    .map((activity) => activity.score)
    .filter((score): score is number => typeof score === "number");
  const average = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null;
  const repeated = new Map<string, number>();
  body.activities.forEach((activity) => {
    activity.tags.forEach((tag) => repeated.set(tag, (repeated.get(tag) ?? 0) + 1));
  });
  const topTags = Array.from(repeated.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  return {
    monthLabel: body.monthLabel,
    averageScore: average,
    highlights: average === null ? ["Not enough scored activity yet."] : [`Average score was ${average}/100.`],
    repeatedPatterns: topTags,
    nextActions: [
      "Add one protein source daily.",
      "Reduce one repeated sugary/fried/packaged item.",
      "Log home meals and outside food separately."
    ],
    provider: "local"
  };
}

export const reportsRouter = Router();

reportsRouter.post(
  "/monthly-summary",
  requireSupabaseUser,
  aiRateLimit,
  asyncHandler(async (request, response) => {
    const body = monthlySummarySchema.parse(request.body);
    const prompt = `
Create a concise monthly DabbaDoc food-health report.
Return valid JSON only with: monthLabel, averageScore, highlights, repeatedPatterns, nextActions, disclaimer.
Do not diagnose disease.

Month: ${body.monthLabel}
Activities:
${JSON.stringify(body.activities.slice(0, 60))}
`;

    const result = await generateFoodText(prompt);
    if (!result) {
      response.json(fallbackSummary(body));
      return;
    }

    response.json({
      monthLabel: body.monthLabel,
      rawAiJson: result.text,
      provider: result.provider
    });
  })
);

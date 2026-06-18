import "server-only";

import { generateGeminiJson } from "@/lib/gemini/client";
import { generateGroqText } from "@/lib/groq/client";
import { safeJsonParse } from "@/lib/utils";
import type { FoodItem, SwapRecommendation } from "@/types";
import {
  filterContextualSwaps,
  isSwapEligibleItem,
  normalizeFoodName
} from "./swapPolicy";

type AiSwap = {
  original?: string;
  swap?: string;
  reason?: string;
  costDelta?: number;
  scoreImpact?: number;
};

type AiSwapResponse = {
  swaps?: AiSwap[];
};

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clampScoreImpact(value: unknown) {
  return Math.min(Math.max(Math.round(finiteNumber(value, 8)), 1), 12);
}

function buildSwapPrompt(items: FoodItem[]) {
  const candidates = items.map((item) => ({
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    flags: item.flags ?? [],
    price: item.price
  }));

  return `Generate contextual healthy Indian food swaps for DabbaDoc.

Very important rules:
- Recommend swaps ONLY for the candidate foods listed below.
- The "original" field must exactly match one candidate food name.
- Do not swap normal healthy homemade Indian staples like roti, chapati, dal, poha, upma, idli, dosa, sabzi, curd, khichdi, sprouts, salad, or home food unless the item name itself clearly says it is fried, sugary, packaged, instant, maida-based, palm-oil based, or ultra-processed.
- If an item is already balanced or only has positive flags like whole_food, fiber, protein, vegetable, return no swap for it.
- Do not replace an item just because it is low in protein. That should become an "add protein on the side" tip elsewhere, not a food swap.
- Keep swaps practical for Indian households and explain the reason in one short Hinglish-friendly sentence.
- Do not give medical advice or disease diagnosis.

Candidate foods:
${JSON.stringify(candidates, null, 2)}

Return this JSON shape:
{
  "swaps": [
    {
      "original": "exact candidate food name",
      "swap": "specific better option",
      "reason": "short reason",
      "costDelta": -50,
      "scoreImpact": 8
    }
  ]
}`;
}

function sanitizeAiSwaps(response: AiSwapResponse, candidates: FoodItem[]) {
  const candidateByName = new Map(
    candidates.map((item) => [normalizeFoodName(item.name), item])
  );

  const swaps = (response.swaps ?? [])
    .filter((swap) => swap.original?.trim() && swap.swap?.trim())
    .map((swap): SwapRecommendation | null => {
      const original = swap.original?.trim() ?? "";
      const candidate = candidateByName.get(normalizeFoodName(original));
      if (!candidate) return null;

      return {
        original: candidate.name,
        swap: swap.swap?.trim() ?? "",
        reason:
          swap.reason?.trim() ||
          "Better fit for everyday food habits with lower risk load.",
        costDelta: Math.round(finiteNumber(swap.costDelta, 0)),
        scoreImpact: clampScoreImpact(swap.scoreImpact)
      };
    })
    .filter(Boolean) as SwapRecommendation[];

  return filterContextualSwaps(swaps, candidates);
}

export async function recommendSwaps(items: FoodItem[]) {
  const candidates = items.filter(isSwapEligibleItem).slice(0, 8);
  if (candidates.length === 0) return [];

  const prompt = buildSwapPrompt(candidates);
  const groqText = await generateGroqText(`${prompt}\n\nReturn only valid JSON. Do not include markdown.`);
  if (groqText) {
    const groqSwaps = sanitizeAiSwaps(
      safeJsonParse<AiSwapResponse>(groqText, { swaps: [] }),
      candidates
    );
    if (groqSwaps.length > 0) return groqSwaps;
  }

  const geminiResponse = await generateGeminiJson<AiSwapResponse>(prompt, { swaps: [] });
  return sanitizeAiSwaps(geminiResponse, candidates);
}

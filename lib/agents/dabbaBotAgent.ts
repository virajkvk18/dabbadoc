import "server-only";

import { generateGeminiText } from "@/lib/gemini/client";
import { generateGroqText } from "@/lib/groq/client";
import {
  DABBADOC_DISCLAIMER,
  type FoodItem,
  type RiskFlag,
  type SwapRecommendation
} from "@/types";

export async function explainWithDabbaBot(params: {
  score: number;
  riskFlags: RiskFlag[];
  swaps: SwapRecommendation[];
  context: string;
  items?: FoodItem[];
}) {
  const riskText =
    params.riskFlags.length > 0
      ? `${params.riskFlags
          .slice(0, 2)
          .map((risk) => risk.label.toLowerCase())
          .join(" aur ")} ka signal dikh raha hai`
      : "koi strong packaged-food risk signal nahi dikh raha";
  const firstSwap = params.swaps[0];
  const swapText = firstSwap
    ? `${firstSwap.original} ko ${firstSwap.swap} se replace karke dekhiye`
    : "portion balance rakhiye aur meal me protein/fiber side add kijiye";
  const itemText = params.items?.length
    ? `Detected items: ${params.items.map((item) => item.name).join(", ")}`
    : "Detected items: none";
  const fallback = `Aapka Dabba Health Score ${params.score}/100 hai. Is scan me ${riskText}. Start simple: ${swapText}. ${DABBADOC_DISCLAIMER}`;

  const prompt = `
Explain this DabbaDoc result in friendly Hinglish.
Score: ${params.score}
${itemText}
Risks: ${params.riskFlags.map((risk) => risk.label).join(", ")}
Swaps: ${params.swaps.map((swap) => `${swap.original} to ${swap.swap}`).join(", ")}
Context: ${params.context}

Rules:
- Do not diagnose.
- Use "may increase risk" or "possible lifestyle concern".
- Keep it under 90 words.
- Include the disclaimer sentence.
`;

  return (await generateGeminiText(prompt)) ?? (await generateGroqText(prompt)) ?? fallback;
}

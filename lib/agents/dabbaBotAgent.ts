import { generateGeminiText } from "@/lib/gemini/client";
import { generateGroqText } from "@/lib/groq/client";
import { DABBADOC_DISCLAIMER, type RiskFlag, type SwapRecommendation } from "@/types";

export async function explainWithDabbaBot(params: {
  score: number;
  riskFlags: RiskFlag[];
  swaps: SwapRecommendation[];
  context: string;
}) {
  const fallback = `Aapka Dabba Health Score ${params.score}/100 hai. Pattern me ${params.riskFlags
    .slice(0, 2)
    .map((risk) => risk.label.toLowerCase())
    .join(" aur ")} ka signal dikh raha hai. Start simple: ${params.swaps[0]?.original ?? "one packaged item"} ko ${params.swaps[0]?.swap ?? "home-style option"} se replace karke dekhiye. ${DABBADOC_DISCLAIMER}`;

  const prompt = `
Explain this DabbaDoc result in friendly Hinglish.
Score: ${params.score}
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

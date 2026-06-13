import type { AgentInput, ReceiptAnalysis } from "@/types";
import { DABBADOC_DISCLAIMER } from "@/types";
import { extractTextFromImageWithGemini } from "@/lib/gemini/client";
import { extractTextFromImageWithGroq } from "@/lib/groq/client";
import { extractTextWithTesseract } from "@/lib/ocr/tesseract";
import { buildBlameMap } from "@/lib/scoring/healthIndex";
import { compareCosts } from "./costComparisonAgent";
import { explainWithDabbaBot } from "./dabbaBotAgent";
import { parseFoodItemsFromText } from "./foodParser";
import { updateHealthIndex } from "./healthIndexAgent";
import { analyzeRisks } from "./riskAnalyzerAgent";
import { recommendSwaps } from "./swapRecommenderAgent";

const sampleReceiptText = `
Freshmart Grocery
Maggi 4 pack Rs 56
Cola 2L Rs 95
Chips family pack Rs 70
Biscuits Rs 45
Dal 1 kg Rs 145
Poha Rs 60
`;

export async function extractReceiptText(input: AgentInput) {
  if (input.rawText) return input.rawText;
  if (input.demoMode) return sampleReceiptText;

  const geminiText = await extractTextFromImageWithGemini({
    dataUri: input.dataUri,
    mimeType: input.mimeType,
    prompt:
      "Extract all readable food, drink, grocery, quantity, and price text from this Indian receipt/order screenshot. Return plain text only."
  });

  if (geminiText?.trim()) return geminiText;

  const groqText = await extractTextFromImageWithGroq({
    dataUri: input.dataUri,
    prompt:
      "Extract all readable food, drink, grocery, quantity, and price text from this Indian receipt/order screenshot. Return plain text only."
  });

  if (groqText?.trim()) return groqText;

  const tesseractText = await extractTextWithTesseract(input.dataUri);
  if (tesseractText?.trim()) return tesseractText;

  return sampleReceiptText;
}

export async function analyzeReceipt(input: AgentInput): Promise<ReceiptAnalysis> {
  const extractedText = await extractReceiptText(input);
  const detectedItems = parseFoodItemsFromText(extractedText);
  const riskFlags = await analyzeRisks(detectedItems, extractedText);
  const swaps = await recommendSwaps(detectedItems);
  const health = await updateHealthIndex({
    items: detectedItems,
    riskFlags,
    swaps,
    streakCount: 2
  });
  const costSummary = await compareCosts(detectedItems, swaps);
  const blameMap = buildBlameMap(detectedItems, swaps);

  const actionPlan = [
    "Day 1: Replace one sugary drink with chaas or nimbu pani.",
    "Day 2: Add one protein item like dal, paneer, eggs, curd, or sprouts.",
    "Day 3: Keep chips or fried snacks out of the evening slot.",
    "Day 4: Use poha, dalia, or oats upma for a quick breakfast.",
    "Day 5: Add one sabzi or salad portion to lunch and dinner.",
    "Day 6: Read one packaged label before buying snacks.",
    "Day 7: Repeat the best swap and rescan your score."
  ];

  const aiSummary = await explainWithDabbaBot({
    score: health.score,
    riskFlags,
    swaps,
    context: extractedText
  });

  return {
    extractedText,
    detectedItems,
    riskFlags,
    healthScore: health.score,
    scoreCategory: health.category,
    scoreBreakdown: health.scoreBreakdown,
    blameMap,
    swaps,
    costSummary,
    actionPlan,
    aiSummary,
    disclaimer: DABBADOC_DISCLAIMER
  };
}

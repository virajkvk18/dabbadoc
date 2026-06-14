import "server-only";

import type { AgentInput, ReceiptAnalysis } from "@/types";
import { DABBADOC_DISCLAIMER } from "@/types";
import { extractTextFromImageWithGemini } from "@/lib/gemini/client";
import { extractTextFromImageWithGroq } from "@/lib/groq/client";
import { extractTextWithTesseract } from "@/lib/ocr/tesseract";
import { buildBlameMap } from "@/lib/scoring/healthIndex";
import {
  buildFutureHealthRisks,
  buildItemHealthInsights,
  buildReceiptCoverageSummary
} from "./receiptNarrative";
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

const receiptExtractionPrompt = `
You are DabbaDoc's receipt OCR agent for Indian grocery, restaurant, food delivery, and quick-commerce receipts.

Extract ONLY what is visible in the uploaded receipt/order image.
Return plain text, one item or line per row.
Include every visible food line item, brand name, quantity, unit, price, total, and store/order text if visible.
Keep uncertain but readable food lines instead of dropping them; mark unclear text with [?].
Do not summarize the receipt and do not merge multiple items into one line.
Do not invent Maggi, cola, chips, or any other example items.
If the image is unreadable, return exactly: READ_FAILED
`;

export class ReceiptExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReceiptExtractionError";
  }
}

function cleanExtraction(text: string) {
  return text
    .replace(/```(?:text)?/gi, "")
    .replace(/```/g, "")
    .replace(/^extracted text:\s*/i, "")
    .trim();
}

function isReadableReceiptText(text?: string | null) {
  if (!text) return false;

  const cleaned = cleanExtraction(text);
  if (cleaned.length < 8) return false;
  if (/^read_failed$/i.test(cleaned)) return false;
  if (/unable to (read|extract|identify)|can't (read|extract)|cannot (read|extract)/i.test(cleaned)) {
    return false;
  }

  return /[a-zA-Z]/.test(cleaned);
}

export async function extractReceiptText(input: AgentInput) {
  if (input.rawText) return input.rawText;
  if (input.demoMode) return sampleReceiptText;

  const geminiText = await extractTextFromImageWithGemini({
    dataUri: input.dataUri,
    mimeType: input.mimeType,
    prompt: receiptExtractionPrompt
  });

  if (isReadableReceiptText(geminiText)) return cleanExtraction(geminiText ?? "");

  const groqText = await extractTextFromImageWithGroq({
    dataUri: input.dataUri,
    prompt: receiptExtractionPrompt
  });

  if (isReadableReceiptText(groqText)) return cleanExtraction(groqText ?? "");

  const tesseractText = await extractTextWithTesseract(input.dataUri);
  if (isReadableReceiptText(tesseractText)) return cleanExtraction(tesseractText ?? "");

  throw new ReceiptExtractionError(
    "Could not read this receipt clearly. Please upload a sharper image, crop only the bill area, or use live capture in better light."
  );
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
  const futureHealthRisks = buildFutureHealthRisks(detectedItems, riskFlags);
  const itemInsights = buildItemHealthInsights(detectedItems, riskFlags, swaps);
  const coverageSummary = buildReceiptCoverageSummary(detectedItems, swaps);

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
    context: extractedText,
    items: detectedItems
  });

  return {
    extractedText,
    detectedItems,
    riskFlags,
    futureHealthRisks,
    itemInsights,
    coverageSummary,
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

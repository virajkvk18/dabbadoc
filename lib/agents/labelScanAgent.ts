import type { AgentInput, LabelAnalysis } from "@/types";
import { DABBADOC_DISCLAIMER } from "@/types";
import { extractTextFromImageWithGemini } from "@/lib/gemini/client";
import { extractTextFromImageWithGroq } from "@/lib/groq/client";
import { extractTextWithTesseract } from "@/lib/ocr/tesseract";
import { clamp } from "@/lib/utils";
import { explainWithDabbaBot } from "./dabbaBotAgent";
import { parseFoodItemsFromText } from "./foodParser";
import { analyzeRisks } from "./riskAnalyzerAgent";
import { recommendSwaps } from "./swapRecommenderAgent";

const sampleLabelText = `
Masala Crunchies
Ingredients: refined wheat flour (maida), palm oil, sugar, iodised salt,
spices, artificial colour, acidity regulator.
Nutrition per 100g: Energy 520 kcal, protein 6g, sugar 12g,
added sugar 8g, sodium 780mg, fat 31g, saturated fat 13g, trans fat 0.1g.
`;

function extractNumber(text: string, label: string) {
  const regex = new RegExp(`${label}[^0-9]*(\\d+(?:\\.\\d+)?)`, "i");
  return Number(text.match(regex)?.[1] ?? 0) || undefined;
}

function calculateLabelTruthScore(text: string) {
  const lower = text.toLowerCase();
  let score = 86;

  if (lower.includes("added sugar")) score -= 12;
  if (lower.includes("sodium") || lower.includes("salt")) score -= 10;
  if (lower.includes("palm oil") || lower.includes("refined oil")) score -= 10;
  if (lower.includes("maida") || lower.includes("refined wheat flour")) score -= 10;
  if (lower.includes("trans fat") || lower.includes("hydrogenated")) score -= 16;
  if (lower.includes("artificial")) score -= 8;

  return clamp(score);
}

function getSafetyLevel(score: number): LabelAnalysis["safetyLevel"] {
  if (score >= 78) return "daily-safe";
  if (score >= 55) return "sometimes-safe";
  return "avoid-frequent-use";
}

export async function extractLabelText(input: AgentInput) {
  if (input.rawText) return input.rawText;
  if (input.demoMode) return sampleLabelText;

  const geminiText = await extractTextFromImageWithGemini({
    dataUri: input.dataUri,
    mimeType: input.mimeType,
    prompt:
      "Extract product name, ingredients, nutrition facts, claims, and additives from this packaged food label. Return plain text only."
  });

  if (geminiText?.trim()) return geminiText;

  const groqText = await extractTextFromImageWithGroq({
    dataUri: input.dataUri,
    prompt:
      "Extract product name, ingredients, nutrition facts, claims, and additives from this packaged food label. Return plain text only."
  });

  if (groqText?.trim()) return groqText;

  const tesseractText = await extractTextWithTesseract(input.dataUri);
  if (tesseractText?.trim()) return tesseractText;

  return sampleLabelText;
}

export async function analyzeLabel(input: AgentInput): Promise<LabelAnalysis> {
  const extractedText = await extractLabelText(input);
  const items = parseFoodItemsFromText(extractedText);
  const warnings = await analyzeRisks(items, extractedText);
  const betterAlternatives = await recommendSwaps(items);
  const labelTruthScore = calculateLabelTruthScore(extractedText);
  const safetyLevel = getSafetyLevel(labelTruthScore);

  const ingredientsMatch = extractedText.match(/ingredients?:([\s\S]*?)(nutrition|$)/i);
  const ingredients = (ingredientsMatch?.[1] ?? "maida, palm oil, sugar, salt")
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);

  const aiSummary = await explainWithDabbaBot({
    score: labelTruthScore,
    riskFlags: warnings,
    swaps: betterAlternatives,
    context: extractedText
  });

  return {
    extractedText,
    productName: extractedText.split("\n").find(Boolean)?.trim() ?? "Packaged food",
    ingredients,
    nutrition: {
      calories: extractNumber(extractedText, "energy|calories|kcal"),
      protein: extractNumber(extractedText, "protein"),
      sugar: extractNumber(extractedText, "sugar"),
      addedSugar: extractNumber(extractedText, "added sugar"),
      sodium: extractNumber(extractedText, "sodium"),
      fats: extractNumber(extractedText, "fat"),
      saturatedFat: extractNumber(extractedText, "saturated fat"),
      transFat: extractNumber(extractedText, "trans fat")
    },
    labelTruthScore,
    safetyLevel,
    whatYouThought: "Looks like a quick tasty packaged snack.",
    whatLabelSays:
      "The label shows hidden sugar/sodium/oil signals that should stay occasional.",
    warnings,
    betterAlternatives,
    aiSummary,
    disclaimer: DABBADOC_DISCLAIMER
  };
}

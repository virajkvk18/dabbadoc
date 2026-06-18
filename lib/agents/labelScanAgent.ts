import "server-only";

import type { AgentInput, LabelAnalysis } from "@/types";
import { DABBADOC_DISCLAIMER } from "@/types";
import { extractTextFromImageWithGemini } from "@/lib/gemini/client";
import { extractTextFromImageWithGroq } from "@/lib/groq/client";
import { extractTextWithTesseract } from "@/lib/ocr/tesseract";
import { clamp } from "@/lib/utils";
import { explainWithDabbaBot } from "./dabbaBotAgent";
import { parseFoodItemsFromText } from "./foodParser";
import {
  buildIngredientInsights,
  buildLabelCoverageSummary,
  buildLabelSwaps,
  buildLabelWarnings,
  buildRegularLabelUseRisks,
  extractIngredientsFromLabel,
  extractNutritionFacts
} from "./labelNarrative";
import { analyzeRisks } from "./riskAnalyzerAgent";
import { recommendSwaps } from "./swapRecommenderAgent";

const sampleLabelText = `
Masala Crunchies
Ingredients: refined wheat flour (maida), palm oil, sugar, iodised salt,
spices, artificial colour, acidity regulator.
Nutrition per 100g: Energy 520 kcal, protein 6g, sugar 12g,
added sugar 8g, sodium 780mg, fat 31g, saturated fat 13g, trans fat 0.1g.
`;

const labelExtractionPrompt = `
You are DabbaDoc's packaged-food label OCR agent for Indian products.

Extract ONLY visible product label text from the uploaded image.
Prioritize product name, complete ingredients list, every nutrition fact, serving size, claims, allergens, additives, sugar, sodium, fat, oil, protein, fiber, preservatives, colours, flavour enhancers, and INS/E numbers.
Preserve nutrition rows line by line with value and unit when visible.
Preserve the full ingredients list in original order when visible.
Return plain text only.
Do not invent ingredients or nutrition values.
If the image is unreadable, return exactly: READ_FAILED
`;

export class LabelExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LabelExtractionError";
  }
}

function cleanExtraction(text: string) {
  return text
    .replace(/```(?:text)?/gi, "")
    .replace(/```/g, "")
    .replace(/^extracted text:\s*/i, "")
    .trim();
}

function isReadableLabelText(text?: string | null) {
  if (!text) return false;

  const cleaned = cleanExtraction(text);
  if (cleaned.length < 8) return false;
  if (/^read_failed$/i.test(cleaned)) return false;
  if (/unable to (read|extract|identify)|can't (read|extract)|cannot (read|extract)/i.test(cleaned)) {
    return false;
  }

  return /[a-zA-Z]/.test(cleaned);
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

function goalLabelContext(goals?: string[]) {
  if (!goals?.length) return "";

  const notes: Record<string, string> = {
    "Weight loss": "For weight-loss goals, watch calories, refined flour, and high-fat snack frequency.",
    "Diabetes-friendly": "For diabetes-friendly goals, added sugar and refined carbs need extra attention.",
    "High protein": "For high-protein goals, compare protein per serving before choosing packaged foods.",
    "Low sodium": "For low-sodium goals, sodium/salt values should be checked closely.",
    "Kids lunchbox": "For kids lunchbox goals, prefer shorter ingredient lists and lower sugar/sodium.",
    "Heart-friendly": "For heart-friendly goals, saturated fat, trans fat, palm oil, and sodium matter."
  };

  return goals.map((goal) => notes[goal]).filter(Boolean).join(" ");
}

function profileLabelContext(healthContext?: string) {
  return healthContext ? `User health profile: ${healthContext}` : "";
}

export async function extractLabelText(input: AgentInput) {
  if (input.rawText) return input.rawText;
  if (input.demoMode) return sampleLabelText;

  const groqText = await extractTextFromImageWithGroq({
    dataUri: input.dataUri,
    prompt: labelExtractionPrompt
  });

  if (isReadableLabelText(groqText)) return cleanExtraction(groqText ?? "");

  const geminiText = await extractTextFromImageWithGemini({
    dataUri: input.dataUri,
    mimeType: input.mimeType,
    prompt: labelExtractionPrompt
  });

  if (isReadableLabelText(geminiText)) return cleanExtraction(geminiText ?? "");

  const tesseractText = await extractTextWithTesseract(input.dataUri);
  if (isReadableLabelText(tesseractText)) return cleanExtraction(tesseractText ?? "");

  throw new LabelExtractionError(
    "Could not read this food label clearly. Please capture the ingredients/nutrition panel closer, in better light, and without blur."
  );
}

export async function analyzeLabel(input: AgentInput): Promise<LabelAnalysis> {
  const extractedText = await extractLabelText(input);
  const personalizedText = [extractedText, goalLabelContext(input.healthGoals), profileLabelContext(input.healthContext)]
    .filter(Boolean)
    .join("\n");
  const items = parseFoodItemsFromText(extractedText);
  const warnings = await analyzeRisks(items, personalizedText);
  const labelTruthScore = calculateLabelTruthScore(extractedText);
  const safetyLevel = getSafetyLevel(labelTruthScore);
  const ingredients = extractIngredientsFromLabel(extractedText);
  const ingredientInsights = buildIngredientInsights(ingredients);
  const nutritionDetails = extractNutritionFacts(extractedText);
  const nutritionByKey = nutritionDetails.byKey as Partial<Record<
    | "calories"
    | "protein"
    | "sugar"
    | "addedSugar"
    | "sodium"
    | "fats"
    | "saturatedFat"
    | "transFat"
    | "carbohydrates"
    | "fiber",
    number
  >>;
  const mergedWarnings = buildLabelWarnings({
    baseWarnings: warnings,
    ingredientInsights,
    nutritionFacts: nutritionDetails.facts
  });
  const betterAlternatives = buildLabelSwaps(await recommendSwaps(items), ingredients);
  const regularUseRisks = buildRegularLabelUseRisks({
    nutritionFacts: nutritionDetails.facts,
    ingredientInsights,
    ingredients
  });
  const labelCoverage = buildLabelCoverageSummary({
    ingredients,
    ingredientInsights,
    nutritionFacts: nutritionDetails.facts
  });

  const aiSummary = await explainWithDabbaBot({
    score: labelTruthScore,
    riskFlags: mergedWarnings,
    swaps: betterAlternatives,
    context: personalizedText,
    items,
    healthGoals: input.healthGoals
  });

  const hasWarnings = mergedWarnings.length > 0;

  return {
    extractedText,
    productName: extractedText.split("\n").find(Boolean)?.trim() ?? "Packaged food",
    ingredients,
    nutrition: {
      calories: nutritionByKey.calories,
      protein: nutritionByKey.protein,
      sugar: nutritionByKey.sugar,
      addedSugar: nutritionByKey.addedSugar,
      sodium: nutritionByKey.sodium,
      fats: nutritionByKey.fats,
      saturatedFat: nutritionByKey.saturatedFat,
      transFat: nutritionByKey.transFat,
      carbohydrates: nutritionByKey.carbohydrates,
      fiber: nutritionByKey.fiber,
      servingSize: nutritionDetails.servingSize,
      facts: nutritionDetails.facts
    },
    ingredientInsights,
    regularUseRisks,
    labelCoverage,
    labelTruthScore,
    safetyLevel,
    whatYouThought: "The front of pack may look convenient or healthy.",
    whatLabelSays: hasWarnings
      ? `Readable label shows ${ingredients.length} ingredients and ${nutritionDetails.facts.length} nutrition facts. Some signals should stay occasional, especially if eaten regularly.`
      : "No strong hidden sugar/sodium/oil signal was detected from the readable label text.",
    warnings: mergedWarnings,
    betterAlternatives,
    aiSummary,
    disclaimer: DABBADOC_DISCLAIMER
  };
}

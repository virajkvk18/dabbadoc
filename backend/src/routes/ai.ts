import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { requireSupabaseUser } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/rate-limit.js";
import { ApiError, asyncHandler } from "../middleware/errors.js";
import { generateFoodText } from "../services/ai-providers.js";
import {
  analyzeRestaurantText,
  detectBackendReceiptType
} from "../services/restaurant-text-analysis.js";

const foodChatSchema = z.object({
  question: z.string().trim().min(2).max(600),
  userName: z.string().trim().max(80).optional(),
  context: z.string().trim().max(9000).optional()
});

const analyzeTextSchema = z.object({
  text: z.string().trim().min(10).max(20000),
  mode: z.enum(["receipt", "label", "auto"]).default("auto")
});

function isGreeting(question: string) {
  return /^(hi|hello|hey|hii|namaste|namaskar|good morning|good afternoon|good evening|good night)\b[!. ]*$/i.test(
    question.trim()
  );
}

export const aiRouter = Router();

aiRouter.get("/status", (_request, response) => {
  response.json({
    groq: Boolean(config.groqApiKey),
    gemini: Boolean(config.geminiApiKey),
    preferredProvider: config.groqApiKey ? "groq" : config.geminiApiKey ? "gemini" : "none"
  });
});

aiRouter.post(
  "/food-chat",
  requireSupabaseUser,
  aiRateLimit,
  asyncHandler(async (request, response) => {
    const body = foodChatSchema.parse(request.body);
    const name = body.userName || request.user?.email?.split("@")[0] || "there";

    if (isGreeting(body.question)) {
      response.json({
        answer: `Hello ${name}, I'm DabbaBot, your food-talking agent. Ask me about meals, labels, receipts, grocery swaps, or your Dabba Health score.`,
        provider: "local"
      });
      return;
    }

    const prompt = `
Answer as DabbaBot, a friendly Indian food intelligence agent.
Be concise, practical, Hinglish-friendly, and food-specific.
Do not diagnose disease. Do not claim exact nutrition unless data is present.

User question:
${body.question}

Optional DabbaDoc context:
${body.context || "No extra context sent to backend."}
`;

    const result = await generateFoodText(prompt);
    if (!result) {
      throw new ApiError("AI providers are not configured or did not respond.", 503);
    }

    response.json({
      answer: result.text,
      provider: result.provider
    });
  })
);

aiRouter.post(
  "/analyze-text",
  requireSupabaseUser,
  aiRateLimit,
  asyncHandler(async (request, response) => {
    const body = analyzeTextSchema.parse(request.body);
    const receiptType = detectBackendReceiptType(body.text);

    if (receiptType === "restaurant_bill") {
      response.json(analyzeRestaurantText(body.text));
      return;
    }

    const prompt = `
You are DabbaDoc AI, an Indian food receipt and label analyzer.
Classify this text as grocery_receipt, restaurant_bill, packaged_food_label, or unknown.
If exact nutrition is missing, mention uncertainty instead of giving zero score.
Return valid JSON only with keys:
receiptType, healthScore, riskLevel, positives, concerns, mealBalanceSummary, suggestions, disclaimer.

Text:
${body.text}
`;
    const result = await generateFoodText(prompt);
    if (!result) {
      response.json({
        receiptType,
        healthScore: null,
        riskLevel: "unknown",
        positives: [],
        concerns: ["AI providers are unavailable for deeper analysis."],
        mealBalanceSummary: "Text was received, but deeper AI analysis is unavailable.",
        suggestions: ["Try again when Groq or Gemini backend keys are configured."],
        disclaimer: "This is general wellness guidance, not medical advice.",
        provider: "local"
      });
      return;
    }

    response.json({
      receiptType,
      rawAiJson: result.text,
      provider: result.provider
    });
  })
);

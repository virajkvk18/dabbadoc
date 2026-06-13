import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { parseFoodItemsFromText } from "./foodParser";
import { analyzeRisks } from "./riskAnalyzerAgent";
import { recommendSwaps } from "./swapRecommenderAgent";

export function createFoodParserTool() {
  return new DynamicStructuredTool({
    name: "food_item_parser",
    description: "Parse Indian food items from receipt, label, or diary text.",
    schema: z.object({
      text: z.string()
    }),
    func: async ({ text }) => JSON.stringify(parseFoodItemsFromText(text))
  });
}

export function createRiskAnalyzerTool() {
  return new DynamicStructuredTool({
    name: "risk_analyzer",
    description: "Detect possible lifestyle risk patterns from parsed foods.",
    schema: z.object({
      text: z.string()
    }),
    func: async ({ text }) => {
      const items = parseFoodItemsFromText(text);
      return JSON.stringify(await analyzeRisks(items, text));
    }
  });
}

export function createSwapTool() {
  return new DynamicStructuredTool({
    name: "indian_swap_recommender",
    description: "Recommend healthier Indian food replacements.",
    schema: z.object({
      text: z.string()
    }),
    func: async ({ text }) => {
      const items = parseFoodItemsFromText(text);
      return JSON.stringify(await recommendSwaps(items));
    }
  });
}

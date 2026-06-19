import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

type AiResult = {
  text: string;
  provider: "groq" | "gemini";
};

async function generateGroq(prompt: string): Promise<AiResult | null> {
  if (!config.groqApiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.groqApiKey}`
      },
      body: JSON.stringify({
        model: config.groqTextModel,
        messages: [
          {
            role: "system",
            content:
              "You are DabbaBot for DabbaDoc. Give practical food and wellness guidance only. Do not diagnose disease."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.35,
        max_tokens: 900
      }),
      signal: controller.signal
    });

    if (!response.ok) return null;
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text ? { text, provider: "groq" } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateGemini(prompt: string): Promise<AiResult | null> {
  if (!config.geminiApiKey) return null;

  try {
    const client = new GoogleGenerativeAI(config.geminiApiKey);
    const model = client.getGenerativeModel({
      model: config.geminiModel,
      systemInstruction:
        "You are DabbaBot for DabbaDoc. Give practical food and wellness guidance only. Do not diagnose disease."
    });
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 18_000);
      })
    ]);
    const text = result?.response.text().trim();
    return text ? { text, provider: "gemini" } : null;
  } catch {
    return null;
  }
}

export async function generateFoodText(prompt: string): Promise<AiResult | null> {
  return (await generateGroq(prompt)) ?? (await generateGemini(prompt));
}

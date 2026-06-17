import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { safeJsonParse } from "@/lib/utils";

const GEMINI_TIMEOUT_MS = 18_000;

async function withTimeout<T>(work: Promise<T>, timeoutMs = GEMINI_TIMEOUT_MS) {
  let timeout: ReturnType<typeof setTimeout>;
  const timer = new Promise<null>((resolve) => {
    timeout = setTimeout(() => resolve(null), timeoutMs);
  });

  const result = await Promise.race([work, timer]);
  clearTimeout(timeout!);
  return result as T | null;
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

function getGeminiModelName() {
  return process.env.GEMINI_MODEL || "gemini-3.5-flash";
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateGeminiText(prompt: string) {
  const client = getGeminiClient();
  if (!client) return null;

  try {
    const model = client.getGenerativeModel({
      model: getGeminiModelName(),
      systemInstruction:
        "You are DabbaBot for DabbaDoc. Give general wellness insight only. Never diagnose disease. Use simple Hinglish-friendly wording."
    });

    const result = await withTimeout(model.generateContent(prompt));
    if (!result) return null;
    return result.response.text();
  } catch {
    return null;
  }
}

export async function generateGeminiJson<T>(prompt: string, fallback: T): Promise<T> {
  const text = await generateGeminiText(
    `${prompt}\n\nReturn only valid JSON. Do not include markdown.`
  );

  if (!text) return fallback;
  return safeJsonParse<T>(text, fallback);
}

export async function extractTextFromImageWithGemini(params: {
  dataUri?: string;
  mimeType?: string;
  prompt: string;
}) {
  const client = getGeminiClient();
  if (!client || !params.dataUri) return null;

  const base64Data = params.dataUri.split(",")[1];
  if (!base64Data) return null;

  try {
    const model = client.getGenerativeModel({
      model: getGeminiModelName()
    });

    const result = await withTimeout(model.generateContent([
      params.prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: params.mimeType ?? "image/jpeg"
        }
      }
    ]));
    if (!result) return null;

    return result.response.text();
  } catch {
    return null;
  }
}

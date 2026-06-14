import "server-only";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

function getGroqApiKey() {
  return process.env.GROQ_API_KEY || "";
}

export function isGroqConfigured() {
  return Boolean(getGroqApiKey());
}

async function callGroq(messages: unknown[], model: string, maxTokens = 600) {
  const apiKey = getGroqApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.35,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export async function generateGroqText(prompt: string) {
  return callGroq(
    [
      {
        role: "system",
        content:
          "You are DabbaBot for DabbaDoc. Give general wellness insight only. Never diagnose disease. Use simple Hinglish-friendly wording."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    process.env.GROQ_TEXT_MODEL || "llama-3.3-70b-versatile",
    700
  );
}

export async function extractTextFromImageWithGroq(params: {
  dataUri?: string;
  prompt: string;
}) {
  if (!params.dataUri) return null;

  return callGroq(
    [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: params.prompt
          },
          {
            type: "image_url",
            image_url: {
              url: params.dataUri
            }
          }
        ]
      }
    ],
    process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
    1200
  );
}

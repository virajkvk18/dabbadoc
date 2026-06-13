// Node/Express/Next backend client example.
// Use this from your server route, not directly from frontend, if you want auth.

const DABBA_AGENT_URL = process.env.DABBA_AGENT_URL || "http://localhost:8000";
const DABBA_AGENT_TOKEN = process.env.DABBA_AGENT_TOKEN || "";

type AnalyzePayload = Record<string, unknown>;

async function callDabbaAgent(path: string, payload: AnalyzePayload) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (DABBA_AGENT_TOKEN) headers.Authorization = `Bearer ${DABBA_AGENT_TOKEN}`;

  const res = await fetch(`${DABBA_AGENT_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Dabba Agent failed: ${res.status} ${detail}`);
  }
  return res.json();
}

export async function analyzeFoodOrder(rawText: string) {
  return callDabbaAgent("/api/v1/analyze/receipt", {
    language: "hinglish",
    source_type: "food_delivery",
    raw_text: rawText,
    image_base64: null,
    mime_type: "image/jpeg",
  });
}

export async function analyzePackagedLabel(rawText: string, productName?: string) {
  return callDabbaAgent("/api/v1/analyze/label", {
    language: "hinglish",
    product_name: productName,
    raw_text: rawText,
    image_base64: null,
    mime_type: "image/jpeg",
  });
}

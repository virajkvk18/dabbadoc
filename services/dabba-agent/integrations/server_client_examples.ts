// Server-only Next.js/Node fetch examples for Dabba Agent.
// Do not import this file from browser/client components. Browser UI should call
// your own app API routes so the private Dabba Agent token never reaches users.

const DABBA_AGENT_URL = process.env.DABBA_AGENT_URL || "http://localhost:8000";
const DABBA_AGENT_TOKEN = process.env.DABBA_AGENT_TOKEN || "";

type AgentAnalysis = Record<string, unknown>;

function privateJsonHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${DABBA_AGENT_TOKEN}`
  };
}

export async function analyzeManualMeal() {
  const response = await fetch(`${DABBA_AGENT_URL}/api/v1/analyze/manual`, {
    method: "POST",
    headers: privateJsonHeaders(),
    body: JSON.stringify({
      language: "hinglish",
      user_profile: {
        age_group: "family",
        diet_type: "mixed",
        goals: ["better food choices", "reduce junk"]
      },
      meals: [
        {
          meal_name: "Dinner",
          items: ["2 samosa", "cold drink", "chowmein"],
          quantity_note: "medium portion",
          spice_level: "medium",
          meal_source: "outside"
        }
      ]
    })
  });

  if (!response.ok) throw new Error("Manual meal analysis failed.");
  return response.json();
}

export async function analyzeReceiptText(rawText: string) {
  const response = await fetch(`${DABBA_AGENT_URL}/api/v1/analyze/receipt`, {
    method: "POST",
    headers: privateJsonHeaders(),
    body: JSON.stringify({
      language: "hinglish",
      source_type: "food_delivery",
      raw_text: rawText,
      image_base64: null,
      mime_type: "image/jpeg"
    })
  });

  if (!response.ok) throw new Error("Receipt analysis failed.");
  return response.json();
}

export async function analyzeLabelUpload(file: File, productName?: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("language", "hinglish");
  if (productName) form.append("product_name", productName);

  const response = await fetch(`${DABBA_AGENT_URL}/api/v1/analyze/label-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DABBA_AGENT_TOKEN}`
    },
    body: form
  });

  if (!response.ok) throw new Error("Label upload analysis failed.");
  return response.json();
}

export async function generatePdfReport(analysis: AgentAnalysis) {
  const response = await fetch(`${DABBA_AGENT_URL}/api/v1/report/pdf`, {
    method: "POST",
    headers: privateJsonHeaders(),
    body: JSON.stringify({
      title: "DabbaDoc Food Health Report",
      analysis
    })
  });

  if (!response.ok) throw new Error("PDF report failed.");
  return response.json();
}

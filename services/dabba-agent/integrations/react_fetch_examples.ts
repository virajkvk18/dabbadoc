// Next.js server-side fetch examples for Dabba Agent.
// Keep tokens only on the backend. Browser components should call your own
// Next.js API routes instead of calling this private service directly.

const DABBA_AGENT_URL = process.env.DABBA_AGENT_URL || "http://localhost:8000";
const DABBA_AGENT_TOKEN = process.env.DABBA_AGENT_TOKEN || "";

type AgentAnalysis = Record<string, unknown>;

function privateHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${DABBA_AGENT_TOKEN}`,
  };
}

export async function analyzeManualMeal() {
  const res = await fetch(`${DABBA_AGENT_URL}/api/v1/analyze/manual`, {
    method: "POST",
    headers: privateHeaders(),
    body: JSON.stringify({
      language: "hinglish",
      user_profile: {
        age_group: "family",
        diet_type: "mixed",
        goals: ["better food choices", "reduce junk"],
      },
      meals: [
        {
          meal_name: "Dinner",
          items: ["2 samosa", "cold drink", "chowmein"],
          quantity_note: "medium portion",
          spice_level: "medium",
          meal_source: "outside",
        },
      ],
    }),
  });

  if (!res.ok) throw new Error("Manual meal analysis failed");
  return res.json();
}

export async function analyzeReceiptText(rawText: string) {
  const res = await fetch(`${DABBA_AGENT_URL}/api/v1/analyze/receipt`, {
    method: "POST",
    headers: privateHeaders(),
    body: JSON.stringify({
      language: "hinglish",
      source_type: "food_delivery",
      raw_text: rawText,
      image_base64: null,
      mime_type: "image/jpeg",
    }),
  });

  if (!res.ok) throw new Error("Receipt analysis failed");
  return res.json();
}

export async function analyzeLabelUpload(file: File, productName?: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("language", "hinglish");
  if (productName) form.append("product_name", productName);

  const res = await fetch(`${DABBA_AGENT_URL}/api/v1/analyze/label-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DABBA_AGENT_TOKEN}`,
    },
    body: form,
  });

  if (!res.ok) throw new Error("Label upload analysis failed");
  return res.json();
}

export async function generatePdfReport(analysis: AgentAnalysis) {
  const res = await fetch(`${DABBA_AGENT_URL}/api/v1/report/pdf`, {
    method: "POST",
    headers: privateHeaders(),
    body: JSON.stringify({
      title: "DabbaDoc Food Health Report",
      analysis,
    }),
  });

  if (!res.ok) throw new Error("PDF report failed");
  const data = await res.json();

  // Convert base64 PDF to browser download.
  const link = document.createElement("a");
  link.href = `data:application/pdf;base64,${data.base64_pdf}`;
  link.download = data.filename || "dabbadoc-report.pdf";
  link.click();

  return data;
}

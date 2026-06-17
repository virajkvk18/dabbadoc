# Dabba Agent

**Dabba Agent** is a LangGraph-powered AI agent backend for **DabbaDoc**, a food health intelligence app for Indian families.

It analyzes:

- Manual meal entries: home food, outside food, quantity, spice level, frequency.
- Grocery receipts and restaurant/food-delivery bills: Swiggy, Zomato, Blinkit, Zepto, restaurant bills, grocery bills.
- Packaged food labels and ingredient panels: ingredients, additives, preservatives, sugar/sodium/fat signals.

It returns:

- Dabba Health Index score.
- Detected food items / ingredients.
- Hidden food-risk warnings.
- Simple Hinglish explanations.
- Healthier Indian swaps.
- Cost comparison.
- 7-day action plan.
- Structured JSON for your frontend dashboard.
- Optional PDF report generation.

> Medical safety note: this project gives educational food-pattern insights. It does **not** diagnose disease or replace doctors/dietitians.

---

## Architecture

```txt
DabbaDoc Frontend / Backend
        |
        | HTTP API
        v
FastAPI API Layer
        |
        v
LangGraph Agent Workflow
        |
        +--> Preprocess input
        +--> Extract food/ingredient data using Gemini Vision/Text
        +--> Fallback to Grok if Gemini fails
        +--> Apply Dabba Health Index rules
        +--> Generate Hinglish explanation + swaps + plan
        +--> Return structured JSON
```

---

## Why LangGraph?

LangGraph lets the agent run as a controlled workflow instead of one giant prompt. Each step is separated:

1. **Preprocess** input.
2. **Extract** foods/ingredients.
3. **Score** and detect risks.
4. **Explain** in Hinglish.
5. **Finalize** safe structured output.

This makes the agent easier to debug, extend, and connect to your app.

---

## Folder Structure

```txt
Dabba_Agent/
├── app/
│   ├── main.py                  # FastAPI app and endpoints
│   ├── core/
│   │   ├── config.py            # Environment and model config
│   │   └── schemas.py           # Request/response models
│   ├── agent/
│   │   ├── graph.py             # LangGraph workflow
│   │   ├── llm_clients.py       # Gemini primary + Grok fallback
│   │   ├── prompts.py           # Prompt templates
│   │   ├── scoring.py           # Dabba Health Index rules
│   │   ├── knowledge_base.py    # Indian food + additive knowledge
│   │   ├── state.py             # Agent state
│   │   └── utils.py             # JSON/image helpers
│   └── services/
│       └── pdf_report.py        # PDF report generation
├── examples/
│   ├── manual_entry.json
│   ├── receipt_scan.json
│   └── label_scan.json
├── integrations/
│   ├── server_client_examples.ts
│   └── node_client.ts
├── scripts/
│   └── run_demo.py
├── tests/
│   └── test_scoring.py
├── .env.example
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## Setup

### 1. Create environment

```bash
cd Dabba_Agent
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Add API keys and private API token

```bash
cp .env.example .env
```

Update `.env`:

```env
API_AUTH_TOKEN=your-long-random-token-at-least-32-chars
CORS_ORIGINS=http://localhost:3000
GEMINI_API_KEY=your_gemini_key_here
GROK_API_KEY=your_xai_grok_key_here
GEMINI_MODEL=gemini-2.5-flash
GROK_MODEL=grok-4
```

`API_AUTH_TOKEN` is required for analysis and report endpoints. The Next.js
backend sends it as `Authorization: Bearer <token>`. Do not expose it to the
frontend.

### 4. Run the API

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open:

```txt
http://localhost:8000/docs
```

For production, deploy this as a private backend service, restrict
`CORS_ORIGINS` to your real app domain, set a long random `API_AUTH_TOKEN`
of at least 32 characters, and keep Gemini/Grok keys only in backend
environment variables.

---

## API Endpoints

### Health check

```http
GET /health
```

### Manual meal analysis

```http
POST /api/v1/analyze/manual
```

Example body:

```json
{
  "language": "hinglish",
  "user_profile": {
    "age_group": "family",
    "diet_type": "mixed",
    "goals": ["better daily choices", "reduce junk"]
  },
  "meals": [
    {
      "meal_name": "Dinner",
      "items": ["2 samosa", "1 plate chowmein", "cold drink"],
      "quantity_note": "medium portion",
      "spice_level": "medium",
      "meal_source": "outside"
    }
  ]
}
```

### Receipt / order / grocery analysis

```http
POST /api/v1/analyze/receipt
```

Body can contain OCR text, image base64, or both.

```json
{
  "language": "hinglish",
  "source_type": "food_delivery",
  "raw_text": "McAloo Tikki Burger, French Fries, Coke, Chocolate Sundae",
  "image_base64": null,
  "mime_type": "image/jpeg"
}
```

### Receipt upload endpoint

```http
POST /api/v1/analyze/receipt-upload
```

Use `multipart/form-data`:

- `file`: image file
- `source_type`: `grocery`, `restaurant`, `food_delivery`, or `unknown`
- `language`: `hinglish`, `english`, or `hindi`

### Packaged food label analysis

```http
POST /api/v1/analyze/label
```

```json
{
  "language": "hinglish",
  "product_name": "Masala instant noodles",
  "raw_text": "Ingredients: refined wheat flour, palm oil, salt, sugar, acidity regulator, flavour enhancer 621, colour 150d, permitted preservatives",
  "image_base64": null,
  "mime_type": "image/jpeg"
}
```

### Label upload endpoint

```http
POST /api/v1/analyze/label-upload
```

Use `multipart/form-data`:

- `file`: label image
- `product_name`: optional
- `language`: `hinglish`, `english`, or `hindi`

### PDF report

```http
POST /api/v1/report/pdf
```

Accepts an analysis response JSON and returns a base64 PDF.

---

## Output Format

The agent returns frontend-ready JSON like:

```json
{
  "request_id": "...",
  "analysis_type": "receipt",
  "model_provider": "gemini",
  "fallback_used": false,
  "dabba_health_index": {
    "score": 58,
    "grade": "Needs Attention",
    "summary": "Meal pattern has high sodium, refined carbs, and sugary drink signals."
  },
  "detected_items": [],
  "risk_flags": [],
  "future_health_risks": [],
  "hinglish_explanation": "...",
  "healthier_swaps": [],
  "cost_comparison": [],
  "seven_day_action_plan": [],
  "family_tip": "...",
  "disclaimer": "Educational food insight only, not medical diagnosis."
}
```

---

## Connect With Your React / Next.js App

Use these server-only examples from Next.js route handlers or another backend:

```txt
integrations/server_client_examples.ts
integrations/node_client.ts
```

Typical frontend flow:

```txt
User uploads receipt/label/manual entry
        ↓
Frontend sends request to your Next.js API route
        ↓
Next.js server calls Dabba Agent with the private token
        ↓
API returns structured JSON
        ↓
Dashboard shows score, warnings, swaps, plan, PDF download
```

---

## Production Notes

Before going live:

- Add authentication between your app backend and this agent.
- Store user history in your existing database.
- Never store API keys on frontend.
- Add rate limits.
- Save uploaded images securely or delete them after processing.
- Add user consent for food history and family reports.
- Add doctor/dietitian review mode for premium family plans.

---

## Recommended Environment Variables

```env
APP_ENV=development
API_AUTH_TOKEN=your-long-random-token-at-least-32-chars
GEMINI_API_KEY=
GROK_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GROK_MODEL=grok-4
ENABLE_GROK_FALLBACK=true
DEFAULT_LANGUAGE=hinglish
MAX_IMAGE_MB=7
```

---

## Important Prompt Behavior

The agent is instructed to:

- Speak in simple Hinglish for Indian families.
- Avoid medical jargon.
- Avoid fear-based diagnosis.
- Use terms like “risk may increase over time” instead of “this will cause disease”.
- Explain ingredients and additives in simple language.
- Suggest Indian alternatives that are realistic and affordable.
- Return strict JSON so your frontend does not break.

---

## Demo

```bash
python scripts/run_demo.py
```

---

## License

MIT — use freely for your hackathon/project.

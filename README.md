# DabbaDoc

**Label Padhega India**

DabbaDoc is an AI Food Health Intelligence app for Indian families. It analyzes grocery receipts, food delivery screenshots, quick-commerce order history, packaged food labels, and daily food diary text. The app returns general wellness insights, a Dabba Health Index, risky pattern flags, healthy Indian swaps, cost comparison, streaks, badges, and PDF reports.

> DabbaDoc is not a medical diagnosis tool. Please consult a doctor/dietitian for medical advice.

## Features

- Landing page with premium dark AI-health theme.
- Supabase Auth login/signup.
- Dashboard with Dabba Health Index, risk summary, streaks, badges, scans, premium status, and Recharts trend chart.
- Receipt/order scanner using Gemini Vision with Tesseract.js fallback and demo fallback data.
- Packaged Food LabelScan for nutrition, ingredients, warnings, alternatives, and Label Truth Score.
- Daily Food Diary Agent for Hinglish meal text, calories/protein estimates, nutrients, tips, swaps, daily score, and streak updates.
- Modular AI agents under `lib/agents`.
- LangChain tools and LangGraph workflow for receipt analysis.
- Indian food seed data, healthy swaps, and risk rules.
- Free vs premium plan logic.
- Razorpay order, signature verify, and webhook route with development mock order fallback.
- PDF health report generation with jsPDF.
- Zod validation and safe API error handling.
- Supabase PostgreSQL schema, policies, and seed scripts.

## Tech Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- UI: shadcn/ui-style components, Framer Motion, Lucide Icons, Recharts
- Backend: Next.js Route Handlers plus optional Node.js/Express service under `backend/`
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- Storage: Supabase Storage bucket `dabbadoc-uploads`
- OCR: Tesseract.js fallback
- AI Vision + Text: Google Gemini API
- Optional AI fallback: Groq API with vision-capable Llama models
- Agents: LangChain JS and LangGraph JS
- Reports: jsPDF
- Payments: Razorpay
- Deployment: Vercel

## Folder Structure

```txt
app/
  (public-pages)/
    page.tsx
    auth/page.tsx
    pricing/page.tsx
  dashboard/
    page.tsx
    upload-receipt/page.tsx
    label-scan/page.tsx
    food-diary/page.tsx
    history/page.tsx
    reports/page.tsx
  settings/page.tsx
  api/
    analyze-receipt/route.ts
    analyze-label/route.ts
    food-diary/route.ts
    health-index/route.ts
    generate-report/route.ts
    razorpay/route.ts
    razorpay/verify/route.ts
    webhooks/razorpay/route.ts
components/
  auth/
  badges/
  charts/
  common/
  dashboard/
  layout/
  pricing/
  reports/
  ui/
  upload/
lib/
  agents/
  gemini/
  ocr/
  payments/
  reports/
  scoring/
  supabase/
  validators/
data/
  indian-food-db.json
  healthy-swaps.json
  risk-rules.json
types/
  index.ts
backend/
  src/
    routes/
    services/
    middleware/
    app.ts
    server.ts
supabase/
  schema.sql
  policies.sql
  seed.sql
```

## Install

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app runs in demo mode without keys. Add real credentials for auth, storage, AI, persistence, and live payments.

## Environment Variables

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_MAX_SESSION_AGE_SECONDS=43200
ENFORCE_HTTPS=true
SECURITY_HEADERS_ENABLED=true
SECURITY_AUDIT_LOGS_ENABLED=true
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
GROQ_API_KEY=
GROQ_TEXT_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
DABBA_AGENT_URL=http://localhost:8000
DABBA_AGENT_TOKEN=
DABBA_AGENT_TIMEOUT_MS=45000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000
EXPRESS_API_PORT=4000
EXPRESS_CORS_ORIGINS=http://localhost:3000
DABBADOC_APP_URL=http://localhost:3000
```

Where to add each key:

1. Supabase URL and publishable key come from Supabase project settings and can be used by the frontend. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is kept for legacy compatibility.
2. Supabase service role key is server-only and must be used only in backend route handlers/server functions.
3. `AUTH_MAX_SESSION_AGE_SECONDS` controls the app-level maximum session age. The default is 12 hours.
4. `ENFORCE_HTTPS=true` redirects production HTTP requests to HTTPS.
5. `SECURITY_HEADERS_ENABLED=true` enables HSTS, CSP, frame protection, permissions policy, and related browser hardening headers.
6. `SECURITY_AUDIT_LOGS_ENABLED=true` keeps structured auth/API/traffic security logs enabled.
7. Gemini API key is server-only and powers receipt, label, and food diary AI analysis.
8. Groq API key is optional and is used as an AI fallback if Gemini is not configured or fails. Keep it as server-only `GROQ_API_KEY`.
9. `DABBA_AGENT_URL` and `DABBA_AGENT_TOKEN` connect the Next.js backend to the optional secured Python Dabba Agent service in `services/dabba-agent`. Keep the token server-only.
10. Cloudinary keys are optional and make receipt/label images upload to Cloudinary first. If they are missing or Cloudinary fails, the app falls back to Supabase Storage.
11. Razorpay key ID, secret, and webhook secret power premium plan payments.
12. `EXPRESS_API_PORT`, `EXPRESS_CORS_ORIGINS`, and `DABBADOC_APP_URL` configure the optional Node.js/Express backend.
13. Never expose secret keys on the frontend. Only `NEXT_PUBLIC_*` values are browser-visible.

## Optional Node.js + Express Backend

The repo includes a separate Express backend in `backend/` for heavier server-side work without disturbing the existing Vercel/Next.js flow. It is useful for AI orchestration, restaurant receipt text analysis, barcode lookup, monthly report summaries, centralized logging, JWT verification, and rate-limited integrations.

Run it locally:

```bash
npm run backend:dev
```

Build it:

```bash
npm run backend:build
npm run backend:start
```

Important routes:

- `GET /api/v1/health`
- `GET /api/v1/ai/status`
- `POST /api/v1/ai/food-chat`
- `POST /api/v1/ai/analyze-text`
- `GET /api/v1/barcode/product/:barcode`
- `POST /api/v1/reports/monthly-summary`

Protected Express routes use Supabase JWT auth through `Authorization: Bearer <supabase_access_token>`. Recommended deployment: keep the frontend on Vercel and deploy this backend separately on Render, Railway, Fly.io, AWS, or DigitalOcean when you want dedicated backend capacity.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/policies.sql`.
5. Optional: run `supabase/seed.sql` after creating a test user.
6. Confirm the `dabbadoc-uploads` storage bucket exists.
7. Add Supabase URL, publishable key, and service role key to `.env.local`.

## Auth Security Setup

The app routes login, signup, password reset, password update, and logout through server-side endpoints under `/api/auth/*`. These routes add Zod validation, generic auth errors, app-level rate limiting, no-store responses, strong password rules for signup/reset, verified-email checks on login, and a 12-hour app session cap by default.

Configure these provider-side controls in Supabase before production:

1. Authentication > Providers > Email: enable email confirmations.
2. Authentication > URL Configuration: set Site URL to `NEXT_PUBLIC_APP_URL` and add redirect URLs for `/auth/callback` and `/auth/update-password`.
3. Authentication > Providers > Email: set OTP/token expiry to 3600 seconds or less.
4. Authentication > Sessions: set access token expiry to 1 hour or less and configure refresh token/session limits appropriate for your risk level.
5. Authentication > Rate Limits: keep or tighten login, signup, recovery, OTP, and token refresh limits.
6. Configure custom SMTP for production so confirmation and password reset emails are reliable.
7. Keep `SUPABASE_SERVICE_ROLE_KEY` only in server/deployment environment variables. Never prefix it with `NEXT_PUBLIC_`.

## Gemini Setup

1. Create a Gemini API key in Google AI Studio.
2. Add it as `GEMINI_API_KEY` in `.env.local`.
3. Restart the dev server.

If Gemini fails or no key exists, receipt and label scans fall back to Tesseract.js and then a demo sample result.

## Groq Optional Fallback

If you already have a Groq key from the old MVP, move it to `.env.local` as a server-only key:

```env
GROQ_API_KEY=your_groq_key
GROQ_TEXT_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

The server tries Gemini first, then Groq, then Tesseract/demo fallback.

## Dabba Agent Service

The project includes an optional secured Python agent backend under `services/dabba-agent`. The existing Next.js API routes still own authentication, upload storage, rate limiting, and database writes. When `DABBA_AGENT_URL` and `DABBA_AGENT_TOKEN` are configured, those routes call the Python service server-to-server for richer receipt, label, and manual diary analysis. If the service is unavailable, the app falls back to the built-in Next.js agents so the UI still works.

Local setup:

```bash
cd services/dabba-agent
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Set the same private token in both places:

```env
# services/dabba-agent/.env
API_AUTH_TOKEN=your-long-random-token
CORS_ORIGINS=http://localhost:3000
GEMINI_API_KEY=your_gemini_key
GROK_API_KEY=your_xai_grok_key
```

```env
# .env.local for the Next.js app
DABBA_AGENT_URL=http://localhost:8000
DABBA_AGENT_TOKEN=your-long-random-token
```

Run the service:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Production notes:

- Deploy `services/dabba-agent` as a private backend service, not as browser-facing frontend code.
- Set a long random `API_AUTH_TOKEN` and keep the same value in the Next.js server env as `DABBA_AGENT_TOKEN`.
- Restrict `CORS_ORIGINS` to your real app domain.
- Do not place Gemini, Grok, or agent tokens in any `NEXT_PUBLIC_*` variable.
- Keep `/health` public for uptime checks; analysis and report endpoints require the bearer token.

## Razorpay Setup

1. Create Razorpay test/live API keys.
2. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
3. Configure webhook URL:

```txt
https://your-domain.com/api/webhooks/razorpay
```

4. Add `RAZORPAY_WEBHOOK_SECRET`.

Without Razorpay keys, `/api/razorpay` returns a development mock order so the premium flow is demoable.

## Run Checks

```bash
npm run typecheck
npm run build
```

## Deploy to Vercel

1. Push the project to GitHub.
2. Import it in Vercel.
3. Add all environment variables in Vercel Project Settings.
4. Deploy.
5. Update `NEXT_PUBLIC_APP_URL` to the deployed URL.
6. Update Razorpay webhook URL to the Vercel deployment.

## Secure Deployment

The app includes deployment hardening in middleware:

- Production HTTP requests are redirected to HTTPS when `ENFORCE_HTTPS=true`.
- HTTPS responses receive `Strict-Transport-Security`.
- API and protected pages receive `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow, noarchive`.
- Browser hardening headers include CSP, frame protection, referrer policy, permissions policy, COOP, CORP, and `nosniff`.
- Auth attempts, auth failures, rate-limit blocks, API errors, HTTPS redirects, and suspicious traffic are logged as structured JSON security events. Raw IPs, user agents, user IDs, and email addresses are hashed before logging.

Production provider checklist:

1. Vercel > Project > Settings > Environment Variables: add secrets there, not in source control. Vercel environment variables are stored outside the repo; sensitive values should not be prefixed with `NEXT_PUBLIC_`. Reference: https://vercel.com/docs/environment-variables
2. Vercel > Team Settings > Drains: send deployment logs to your monitoring/SIEM tool so security events are searchable and alertable. Reference: https://vercel.com/docs/drains/reference/logs
3. Supabase > Authentication: keep email confirmation, short OTP expiry, and provider rate limits enabled.
4. Supabase > Database > Settings > SSL Configuration: turn on SSL enforcement.
5. Supabase > Database > Settings > Network Restrictions: allow only trusted admin/deployment IP ranges to connect directly to Postgres and the pooler. Reference: https://supabase.com/docs/guides/platform/network-restrictions
6. Do not set `DATABASE_URL`, `POSTGRES_URL`, `PGPASSWORD`, or direct database credentials in Vercel unless you have a specific server-only migration job. This app uses Supabase HTTPS APIs and RLS policies instead of direct browser/database connections.
7. Apply `supabase/schema.sql` and `supabase/policies.sql` before production, then verify RLS is enabled on all app tables.
8. Rotate any secret that was ever pasted into chat, committed, shared in screenshots, or placed in a public-prefixed env var.

Useful log query patterns:

```txt
"event":"security" +"type":"auth_failure"
+"event":"security" +"type":"auth_rate_limited"
+"event":"security" +"type":"rate_limit_block"
+"event":"security" +"type":"suspicious_traffic"
+"event":"security" +"severity":"error"
```

## Safety

DabbaDoc uses safe language such as "may increase risk", "possible lifestyle concern", and "general wellness insight". It does not provide medical diagnosis or treatment advice.

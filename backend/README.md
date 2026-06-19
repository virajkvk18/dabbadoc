# DabbaDoc Express Backend

This is an optional Node.js + Express backend for heavier DabbaDoc services. The existing Next.js app still works exactly as before; this service can be deployed separately when you want a dedicated backend for AI orchestration, barcode lookup, monthly summaries, logging, and rate-limited integrations.

## Local Run

```bash
npm run backend:dev
```

The service starts on `http://localhost:4000` by default.

## Build

```bash
npm run backend:build
npm run backend:start
```

## Useful Endpoints

- `GET /api/v1/health` checks backend health and configured integrations.
- `GET /api/v1/ai/status` checks whether Groq/Gemini are configured.
- `POST /api/v1/ai/food-chat` answers food questions with Supabase JWT auth.
- `POST /api/v1/ai/analyze-text` analyzes extracted receipt/label text with restaurant intelligence.
- `GET /api/v1/barcode/product/:barcode` fetches Open Food Facts product data with Supabase JWT auth.
- `POST /api/v1/reports/monthly-summary` generates a concise monthly wellness summary with Supabase JWT auth.

Protected routes expect:

```txt
Authorization: Bearer <supabase_access_token>
```

## Deployment Shape

Recommended production setup:

- Frontend + current Next.js API routes: Vercel
- Express backend: Render, Railway, Fly.io, AWS, or DigitalOcean
- Auth/database/storage: Supabase

Keep secret values server-only. Do not expose `GROQ_API_KEY`, `GEMINI_API_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` to the browser.

# Security Deployment Checklist

## Authentication

- DabbaDoc uses Supabase Auth for passwords, password hashing, email verification, sessions, and reset tokens. Do not store raw passwords or password hashes in application tables.
- In Supabase Auth settings, enable email confirmations for signups.
- Set password reset and magic-link OTP expiry to a short window, ideally 15 to 30 minutes.
- Keep `AUTH_MAX_SESSION_AGE_SECONDS` set in Vercel. The app defaults to 12 hours and rejects values above 30 days.
- Keep custom auth routes rate limited. Login, signup, reset password, update password, and auth callback requests are protected.

## Secrets

- Store these only as server-side environment variables in Vercel:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY`
  - `GROQ_API_KEY`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`
  - `DABBA_AGENT_TOKEN`
- Only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` should be exposed to browser code.
- Run `npm run security:secrets` before pushing code. It checks for common committed API keys, service role keys, JWTs, and private keys.

## Authorization

- Every protected API route must load the logged-in user with `requireVerifiedUser()` or `getAccountOverview()`.
- Any endpoint that reads, changes, or deletes a resource must verify the resource belongs to the current user before touching it.
- Admin Supabase clients may bypass RLS, so server helpers must always receive and check the current `user.id`.
- Family access is read-only and must go through accepted `family_connections` records. Family owners cannot edit another member's profile, reports, logs, or settings.

## Abuse Protection

- Global API traffic is protected in middleware.
- AI analysis, report generation, payment actions, profile updates, family actions, and auth flows have route-specific rate limits.
- Upload and JSON body size limits are enforced server-side. Do not trust browser-side file checks.
- Keep `SECURITY_AUDIT_LOGS_ENABLED=true` in production so auth failures, rate-limit blocks, API errors, HTTPS redirects, and suspicious traffic are visible in Vercel logs.

## Deployment

- Set `ENFORCE_HTTPS=true` in production.
- Keep `SECURITY_HEADERS_ENABLED=true` so HSTS, CSP, frame protection, and no-sniff headers are applied.
- Keep Supabase Row Level Security enabled using `supabase/policies.sql`.
- Restrict database administration to Supabase dashboard/service-role server code. Never place the service role key in client components or `NEXT_PUBLIC_*` variables.
- Configure Razorpay webhook secret validation before enabling paid-plan automation.

## Pre-Deploy Checks

Run these before opening or merging a pull request:

```bash
npm run lint
npm run typecheck
npm run security:secrets
```

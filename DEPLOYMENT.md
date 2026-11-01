# RealtyPilot Production Deployment Guide & Security Runbook

This runbook guides the production deployment of **RealtyPilot** (Next.js 14 + Supabase + Google Gemini 1.5 + Meta WhatsApp Cloud API) for residential real estate sales in Bhopal, Madhya Pradesh.

---

## 1. Prerequisites & Services

1. **Vercel Account**: For Next.js 14 App Router hosting.
2. **Supabase Project**: Managed PostgreSQL database with Auth and Row Level Security (RLS).
3. **Google AI Studio Account**: For server-side Gemini 1.5 Flash API key.
4. **Meta for Developers Account**: WhatsApp Cloud API App with verified business number.
5. **Domain & SSL**: Production domain (e.g., `app.realtypilot.in`) with automated SSL.

---

## 2. Environment Variables Checklist

Configure the following variables in the **Vercel Project Settings > Environment Variables** (Production & Preview):

| Variable Name | Exposure | Description / Sample Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Browser | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Browser | `eyJhbGciOi...` (Supabase Anon Key) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | `eyJhbGciOi...` (Admin bypass for webhooks & cron) |
| `GEMINI_API_KEY` | **Server-Only** | `AIzaSy...` (Google Gemini 1.5 Flash Key) |
| `META_WA_PHONE_NUMBER_ID` | **Server-Only** | `100657...` (Meta WhatsApp Phone Number ID) |
| `META_WA_ACCESS_TOKEN` | **Server-Only** | `EAAG...` (System User Permanent Token) |
| `WHATSAPP_APP_SECRET` | **Server-Only** | `c2a8f...` (App Secret for HMAC SHA-256 Webhook Verification) |
| `META_WA_WEBHOOK_VERIFY_TOKEN` | **Server-Only** | `realtypilot_wa_webhook_secure_2026` |
| `CRON_SECRET` | **Server-Only** | `rp_cron_sec_32char_token_bhopal_2026` |
| `NEXT_PUBLIC_APP_URL` | Public / Browser | `https://app.realtypilot.in` |

> [!CAUTION]
> Never prefix `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, or `WHATSAPP_APP_SECRET` with `NEXT_PUBLIC_`. The security engine (`/api/security/audit`) automatically fails if private secrets are detected in public environment namespaces.

---

## 3. Database Migration & RLS Execution

1. Open your Supabase Dashboard > **SQL Editor**.
2. Run the migration script located at `src/lib/supabase/schema.sql`:
   - Creates 8 tables: `profiles`, `projects`, `plots`, `leads`, `messages`, `visits`, `activities`, `consents`.
   - Enables Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) on all 8 tables.
   - Creates authenticated staff RLS policies.
   - Creates triggers for `updated_at` timestamps.
3. Seed initial Bhopal real estate projects & baseline data:
   ```bash
   # Via API seed endpoint (local or authenticated production with CRON_SECRET)
   curl -X POST https://app.realtypilot.in/api/seed \
     -H "Authorization: Bearer <CRON_SECRET>" \
     -H "Content-Type: application/json"
   ```

---

## 4. Meta WhatsApp Cloud API Webhook Setup

1. In the **Meta App Dashboard**:
   - Go to **WhatsApp > Configuration**.
   - **Callback URL**: `https://app.realtypilot.in/api/whatsapp/webhook`
   - **Verify Token**: Enter the exact string configured in `META_WA_WEBHOOK_VERIFY_TOKEN`.
   - Click **Verify and Save**.
2. **Webhook Fields Subscription**:
   - Subscribe to the `messages` field under WhatsApp Webhook subscriptions.
3. **HMAC Signature Verification**:
   - Meta signs every webhook payload with the SHA-256 HMAC of your `WHATSAPP_APP_SECRET` in the `X-Hub-Signature-256` header.
   - RealtyPilot verifies this signature with constant-time equality check (`crypto.timingSafeEqual`).

---

## 5. Automated Reminder Cron Setup

RealtyPilot includes automated visit reminders (24 hours prior and 2 hours prior):
- Endpoint: `https://app.realtypilot.in/api/reminders`
- Trigger Schedule: Every 15 minutes (`*/15 * * * *`)
- Header: `Authorization: Bearer <CRON_SECRET>`

### Option A: Vercel Cron (`vercel.json`)
Create or verify `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/reminders",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### Option B: External Cron (cron-job.org / GitHub Actions)
```bash
curl -X POST https://app.realtypilot.in/api/reminders \
  -H "Authorization: Bearer rp_cron_sec_32char_token_bhopal_2026"
```

---

## 6. DPDP Act 2023 Compliance & Audit Runbook

1. **Opt-Out Handling**:
   - When a buyer texts `STOP`, `UNSUBSCRIBE`, or toggles opt-out in CRM, `opted_out` is set to `true`.
   - Outbound reminders, marketing, and follow-ups are hard-blocked immediately.
2. **Lead Scoring Ceiling**:
   - Opted-out leads have their score capped at maximum 20 points (`cold` tier).
3. **Live Security Verification**:
   - Staff can navigate to `/dashboard/security` to see real-time posture, DPDP compliance metrics, and run on-demand security scans.

---

## 7. Pre-Flight Verification Commands

Run locally before deploying:
```bash
# 1. Run automated test suite (15/15 tests)
npm test

# 2. Production build verification
npm run build

# 3. Security audit probe
curl http://localhost:3000/api/security/audit
```
All commands must exit with code 0.

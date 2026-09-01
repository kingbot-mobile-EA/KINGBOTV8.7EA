# KingBot V8.7 Platform — Backend

Production backend for the **KingBot V8.7 MICRO-FLIP** EA platform. Handles
authentication (email verification + phone SMS OTP), subscription billing with
per-account license keys, the mobile EA bridge (connect MT5 without a PC), live
analytics, an AI support assistant trained on the official EA guide, and gated
guidance documents delivered after subscription.

Powered by GIBSONFX TECH • v8.7.0

## Stack

- **Runtime:** Node.js 18+ (ES modules)
- **Framework:** Express 4
- **Auth:** JWT + bcrypt + email verification + SMS OTP
- **Security:** helmet, CORS allow-list, rate limiting
- **Store:** lightweight JSON file store (zero-config) — swap for Postgres in production
- **AI:** rule-based assistant (built-in, trained on the EA guide) or any OpenAI-compatible API
- **Deploy:** Render (free/starter), also runs on Railway, Fly.io, or any Node host

## Quick start (local)

```bash
cd kingbot-platform/backend
cp .env.example .env       # adjust secrets
npm install
npm start                  # http://localhost:8080
```

Health check: `GET /health`

### Auth flow (dev mode)

With `EMAIL_ENABLED=false` and `SMS_ENABLED=false`, verification links and OTP
codes are printed to the console so you can test end-to-end without a provider.

```bash
# 1. Signup
curl -X POST localhost:8080/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"secret123","phone":"+12025551234","displayName":"Trader"}'

# → check console for the email link + OTP

# 2. Verify email (open the link printed in console)
curl "localhost:8080/api/auth/verify-email?token=...&email=a@b.com"

# 3. Verify phone
curl -X POST localhost:8080/api/auth/verify-otp \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","otp":"123456"}'

# 4. Login → get JWT
curl -X POST localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"secret123"}'
```

## Deploy to Render

1. Push this repo to GitHub.
2. In Render: **New → Blueprint** → select the repo → Render reads
   `kingbot-platform/backend/render.yaml`.
3. In the service **Environment** tab, set:
   - `CORS_ORIGIN` → your GitHub Pages frontend URL
   - `JWT_SECRET` → Render auto-generates one
   - Flip `EMAIL_ENABLED`, `SMS_ENABLED`, `PAYMENTS_ENABLED` to `true` and add
     your provider credentials when going live.
4. Deploy. Health check on `/health` confirms it's up.

The free tier uses an ephemeral disk — the JSON store resets on redeploy. For
persistent production data, add a **Postgres** addon and replace
`src/utils/store.mjs` with a Postgres-backed implementation (the interface is
small: `readCollection`, `writeCollection`, `insertOne`, `findOne`, `updateOne`,
`findMany`).

## API surface

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/signup` | – | Create account (sends email link + SMS OTP) |
| GET  | `/api/auth/verify-email` | – | Verify email from link |
| POST | `/api/auth/verify-otp` | – | Verify phone with OTP |
| POST | `/api/auth/resend-verification` | – | Resend email + OTP |
| POST | `/api/auth/login` | – | Login → JWT |
| GET  | `/api/auth/me` | JWT | Current user |
| GET  | `/api/subscriptions/plans` | – | List 4 plans ($300/$550/$1000/$2500) |
| POST | `/api/subscriptions/subscribe` | JWT | Subscribe → license keys + guidance unlock |
| POST | `/api/subscriptions/license/validate` | – | EA validates its license key |
| GET  | `/api/subscriptions/me/subscription` | JWT | My subscription |
| POST | `/api/subscriptions/me/subscription/cancel` | JWT | Cancel |
| POST | `/api/ea/connect` | JWT | Connect MT5 from mobile (no PC) |
| GET  | `/api/ea/accounts` | JWT | Connected accounts |
| GET  | `/api/ea/accounts/:id` | JWT | Live status |
| PATCH| `/api/ea/accounts/:id/settings` | JWT | Change EA settings from phone |
| POST | `/api/ea/accounts/:id/pause` | JWT | Pause EA |
| POST | `/api/ea/accounts/:id/resume` | JWT | Resume EA |
| POST | `/api/ea/accounts/:id/disconnect` | JWT | Disconnect |
| GET  | `/api/analytics/account/:id` | JWT | Equity curve + trades |
| GET  | `/api/analytics/account/:id/performance` | JWT | Win rate, PF, drawdown |
| POST | `/api/ai/chat` | JWT | AI support assistant |
| GET  | `/api/ai/suggestions` | – | Suggested prompts |
| GET  | `/api/guidance/index` | JWT | Guidance docs list (locked flags) |
| GET  | `/api/guidance/:docId` | JWT | Read a guidance doc (plan-gated) |
| GET/PATCH | `/api/profile/me` | JWT | Profile + theme + notifications |
| POST | `/api/profile/me/change-password` | JWT | Change password |
| POST | `/api/profile/me/reverify-phone` | JWT | Re-send phone OTP |
| GET  | `/api/profile/me/activity` | JWT | Activity log |

## Subscription plans & strategy mapping

| Plan | Price | EA Profiles | Strategy categories |
|------|-------|-------------|---------------------|
| BASIC | $300/mo | A | Micro-Flip, SMC, Trend, Momentum |
| PRO | $550/mo | A, B, C, D | + Flip Sniper |
| ELITE | $1000/mo | A–E | + High-Risk Engine, Grid, Martingale, Fibonacci |
| QUANTUM | $2500/mo | A–E + Custom | All 9 modes, all 5 risk profiles, unlimited accounts |

## Disclaimer

Trading forex involves substantial risk of loss. Small-account flipping,
martingale, grid and extreme modes may cause rapid and significant losses. Past
performance does not guarantee future results. KINGBOT is software and does not
guarantee profits. Never trade with money you cannot afford to lose.

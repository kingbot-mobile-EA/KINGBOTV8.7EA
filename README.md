# KingBot V8.7 MICRO-FLIP — High-Tech Mobile Platform

The complete, mobile-first web platform for the **KingBot V8.7 MICRO-FLIP** MetaTrader 5 Expert Advisor. Connect, monitor, and tune your EA from your phone — **no PC, no Windows required**.

Built by **GIBSONFX TECH**.

---

## What's Inside

| Folder | Stack | Host on |
|--------|-------|---------|
| `frontend/` | Vanilla JS PWA (mobile-first, 4 themes, canvas charts, AI chat) | **GitHub Pages** |
| `backend/` | Node.js 18+ / Express 4 (ES modules, JWT, bcrypt, JSON store) | **Render** |

```
kingbot-platform/
├── frontend/          # Static PWA — push to GitHub, enable Pages
│   ├── index.html         # Landing page
│   ├── signup.html        # Email + phone OTP registration
│   ├── login.html         # Login (blocks unverified emails)
│   ├── verify-email.html  # Email verification landing
│   ├── pricing.html       # 4 subscription tiers ($300 / $550 / $1000 / $2500)
│   ├── dashboard.html     # EA control center (connect, stats, settings, protection)
│   ├── analytics.html     # Equity curve, win rate, drawdown, daily P/L, trades
│   ├── profile.html       # Theme picker, notifications, security, password
│   ├── strategies.html    # Strategy categories + profiles A–E + 9 modes
│   ├── guides.html        # Plan-gated guidance documents
│   ├── pages/             # privacy, terms, security, risk
│   ├── css/theme.css      # 4 themes: Neo Cyber, Matrix, Blood Moon, Void
│   ├── js/config.js       # API base URL (point to your Render backend)
│   ├── js/app.js          # API client, auth, themes, AI chat, UI shell
│   ├── manifest/          # PWA manifest
│   ├── sw.js              # Service worker (offline cache)
│   └── assets/            # Favicon, app icons
│
└── backend/           # API server — deploy to Render
    ├── src/
    │   ├── server.js          # Express entrypoint
    │   ├── routes/            # auth, subscriptions, ea, analytics, ai, guidance, profile
    │   ├── services/          # EA bridge (mock / real HTTP bridge)
    │   ├── middleware/        # JWT auth, plan gating
    │   ├── utils/             # config, store, verify (email/SMS), AI, license
    │   └── data/              # plans, strategy categories, EA profiles, pairs
    ├── package.json
    ├── render.yaml           # Render blueprint
    ├── .env.example          # All env vars documented
    └── README.md             # Backend-specific docs
```

---

## Subscription Tiers

| Tier | Price | Profiles | Accounts | Key Features |
|------|-------|----------|----------|--------------|
| **BASIC** | $300/mo | A | 1 | Micro-Flip engine, 2-of-3 confluence, profit-lock, 10-layer protection |
| **PRO** | $550/mo | A–D | 3 | + Steady Growth, Aggressive Flip, FLIP SNIPER, 3-of-3 high win-rate |
| **ELITE** | $1000/mo | A–E | 10 | + Extreme/Gambler engine, Grid + Martingale, Fibonacci, pyramid |
| **QUANTUM** | $2500/mo | A–E + custom | ∞ | + AI copilot, custom presets, unlimited licenses, institutional |

Each subscription generates **license keys** (per-account) that are entered in the Dashboard to connect an EA.

---

## Quick Start (Local Development)

### 1. Backend

```bash
cd backend
cp .env.example .env       # edit secrets (JWT, SMTP, SMS, OpenAI key)
npm install
npm run dev                 # starts on http://localhost:8787
```

In dev mode, email verification links and SMS OTP codes are **printed to the console** (no real SMTP/SMS needed). Look for:
```
Action link: /pages/verify-email.html?token=XXX&email=YYY
Your KingBot verification code: 123456
```

### 2. Frontend

```bash
cd frontend
# Edit js/config.js → set apiBase to "http://localhost:8787"
python3 -m http.server 8090
# Open http://localhost:8090
```

### 3. Test the Full Flow

1. Open `signup.html` → create account (email + phone)
2. Check backend console for verification link + OTP
3. Enter them on the signup page → email + phone verified → auto-login
4. Go to `pricing.html` → choose a tier → subscribe (mock payment)
5. Go to `dashboard.html` → connect EA (enter server, login, license key, profile)
6. View live stats, equity curve, settings, 10-layer protection grid
7. Check `analytics.html` for performance metrics
8. Open `guides.html` for unlocked strategy documents
9. Try the AI chat widget (bottom-right) — ask about pairs, risk, profiles

---

## Deploy the Backend to Render

### Option A: Blueprint (recommended)

1. Push the `backend/` folder to a GitHub repo
2. In Render Dashboard → **New → Blueprint**
3. Select your repo → Render reads `render.yaml` and creates the service
4. Set environment variables (from `.env.example`):
   - `JWT_SECRET` — random 32+ char string
   - `JWT_EXPIRES_IN` — `7d`
   - `NODE_ENV` — `production`
   - `EA_BRIDGE_MODE` — `mock` (or `http` when you have a real bridge)
   - `OPENAI_API_KEY` — (optional, for AI chat; falls back to rule-based)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — (email verification)
   - `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER` — (phone OTP)
   - `STRIPE_SECRET_KEY` — (optional; mock payments work without it)
5. Deploy → your API will be at `https://your-service.onrender.com`

### Option B: Manual

1. **New → Web Service** → connect your GitHub repo
2. Root: `backend/` · Build: `npm install` · Start: `npm start`
3. Add all env vars from `.env.example`
4. Deploy

---

## Deploy the Frontend to GitHub Pages

1. Push the `frontend/` folder to a GitHub repo (or a `docs/` folder in your main repo)
2. **Settings → Pages → Source: Deploy from branch → main / (root or /docs)**
3. Your site goes live at `https://yourusername.github.io/your-repo/`
4. **Edit `js/config.js`** → set `apiBase` to your Render backend URL:
   ```js
   apiBase: "https://your-service.onrender.com",
   ```
5. If using a subpath (e.g. `/your-repo/`), ensure all links are relative (they already are)

### Custom domain (optional)

GitHub Pages → Settings → Pages → Custom domain → add your domain + CNAME.

---

## API Surface

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | — | Service health + stats |
| POST | `/api/auth/signup` | — | Register (email + phone) |
| GET | `/api/auth/verify-email` | — | Verify email (token + email query) |
| POST | `/api/auth/verify-otp` | — | Verify phone (email + OTP) |
| POST | `/api/auth/resend-verification` | — | Resend email link + OTP |
| POST | `/api/auth/login` | — | Login (requires email verified) |
| GET | `/api/auth/me` | JWT | Current user profile |
| GET | `/api/subscriptions/plans` | — | List 4 plans |
| POST | `/api/subscriptions/subscribe` | JWT | Subscribe (mock/Stripe) |
| GET | `/api/subscriptions/me` | JWT | Current subscription + licenses |
| POST | `/api/subscriptions/license/validate` | JWT | Validate a license key |
| DELETE | `/api/subscriptions/me` | JWT | Cancel subscription |
| POST | `/api/ea/connect` | JWT | Connect an MT5 account |
| GET | `/api/ea/accounts` | JWT | List connected accounts |
| GET | `/api/ea/accounts/:id/status` | JWT | Live EA status + equity curve |
| PATCH | `/api/ea/accounts/:id/settings` | JWT | Push EA settings |
| POST | `/api/ea/accounts/:id/pause` | JWT | Pause EA |
| POST | `/api/ea/accounts/:id/resume` | JWT | Resume EA |
| POST | `/api/ea/accounts/:id/disconnect` | JWT | Disconnect EA |
| GET | `/api/analytics/accounts/:id` | JWT | Account summary + trades |
| GET | `/api/analytics/accounts/:id/performance` | JWT | Performance metrics |
| POST | `/api/ai/chat` | JWT | AI strategy assistant |
| GET | `/api/ai/suggestions` | — | Chat starter prompts |
| GET | `/api/guidance` | JWT | Guidance document index |
| GET | `/api/guidance/:docId` | JWT | Specific document (plan-gated) |
| GET | `/api/profile/me` | JWT | Profile + settings |
| PATCH | `/api/profile/me` | JWT | Update profile (theme, name, notifications) |
| POST | `/api/profile/change-password` | JWT | Change password |
| GET | `/api/profile/activity` | JWT | Activity log |

---

## Features

- **Mobile-first PWA** — installable, offline-capable, responsive
- **4 high-tech themes** — Neo Cyber, Matrix, Blood Moon, Void (persisted per user)
- **Email + phone OTP authentication** — bank-grade security
- **EA mobile bridge** — connect MT5 without a PC; sync status, stats, settings
- **Live analytics** — equity curve, win rate, profit factor, drawdown, daily P/L, trade history (canvas charts, no external deps)
- **10-layer blow-up protection** — confluence filter, H1 trend, ATR floor, spread filter, SL≤TP, profit-lock, loss reduction, consecutive-loss pause, max drawdown stop, max lot cap
- **AI strategy assistant** — trained on the official V8.7 guide; rule-based + OpenAI-compatible
- **Plan-gated guidance documents** — 11 docs unlocked based on subscription tier
- **Subscription system** — 4 tiers, license keys, mock/Stripe payments
- **Trust pages** — privacy, terms, security, risk disclosure

---

## Tech Stack

**Frontend:** Vanilla JS (no framework), CSS custom properties, Canvas 2D charts, PWA (manifest + service worker), mobile-first responsive

**Backend:** Node.js 18+ ES modules, Express 4, JWT (jsonwebtoken), bcryptjs, helmet, CORS, express-rate-limit, JSON file store (swap for PostgreSQL/Redis in production), rule-based AI + OpenAI-compatible fallback

---

## Security Notes

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens (7-day expiry, configurable)
- Helmet security headers
- CORS restricted to your frontend origin in production
- Rate limiting on auth + API routes
- Email verification required before login
- Phone OTP for additional verification
- License keys per-account (anti-sharing)

**For production:** swap the JSON file store for a real database (PostgreSQL recommended), enable real SMTP (SendGrid/Mailgun) and SMS (Twilio), and configure Stripe for real payments.

---

## EA Setup Profiles

| Profile | Balance | Mode | Risk | Key Settings |
|---------|---------|------|------|--------------|
| **A** | $20–$500 | MODE_MICRO_FLIP | 5% | 2-of-3 confluence, 1.5:1 R:R, profit-lock, martingale OFF |
| **B** | $100–$500 | MODE_MICRO_FLIP | 3% | Steady growth, 3-of-3 confluence, 1.5:1 R:R |
| **C** | $1000–$5000 | MODE_FULL_AUTO | 5% | Aggressive flip, equity-tier lot scaling |
| **D** | $500–$5000 | MODE_FLIP_SNIPER | 4% | Rapid flipping sniper entries |
| **E** | $1000–$30000+ | MODE_MARTINGALE | 2%–10% | Extreme/gambler, recovery boost, pyramid |

---

## 9 Trading Modes

`MODE_MICRO_FLIP` · `MODE_FLIP_SNIPER` · `MODE_FULL_AUTO` · `MODE_SMC_ONLY` · `MODE_SCALP_ONLY` · `MODE_MOMENTUM` · `MODE_HYBRID_SMC` · `MODE_GRID` · `MODE_MARTINGALE`

## 3 Confluence Strategies

- **SMC Sniper** — order blocks, fair value gaps, liquidity sweeps
- **Trend Scalper** — 3-EMA (8/21/50) alignment
- **Momentum Scalper** — RSI + Stochastic confluence

---

## License

Proprietary — © 2026 GIBSONFX TECH. All rights reserved.

KingBot V8.7 MICRO-FLIP is a trading tool. Trading involves substantial risk of loss. Past performance does not guarantee future results. Never trade with money you cannot afford to lose.

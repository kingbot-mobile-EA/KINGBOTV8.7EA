# KingBot V8.7 Platform — Frontend (PWA)

Mobile-first PWA for the KingBot V8.7 MICRO-FLIP MT5 EA. Host on **GitHub Pages**.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository
2. Go to **Settings → Pages**
3. Source: **Deploy from branch** → select `main` → folder: `/` (root) or `/docs`
4. Save → your site is live at `https://YOUR_USERNAME.github.io/YOUR_REPO/`
5. **Important:** edit `js/config.js` and set `apiBase` to your Render backend URL:
   ```js
   window.KINGBOT_CONFIG = {
     apiBase: "https://your-render-service.onrender.com",
     ...
   };
   ```

## Local Development

```bash
# Start the backend first (see ../backend/README.md)
cd ../backend && npm install && npm run dev

# Then serve the frontend
cd ../frontend
# Edit js/config.js → apiBase: "http://localhost:8787"
python3 -m http.server 8090
# Open http://localhost:8090
```

## Pages

| Page | Purpose |
|------|---------|
| `index.html` | Landing page (hero, features, pricing preview, trust) |
| `signup.html` | Registration with email + phone OTP verification |
| `login.html` | Login (blocks unverified emails) |
| `verify-email.html` | Email verification landing (reads token from URL) |
| `pricing.html` | 4 subscription tiers with feature comparison |
| `dashboard.html` | EA control center (connect, stats, settings, protection) |
| `analytics.html` | Performance charts (equity, drawdown, daily P/L, trades) |
| `profile.html` | Theme picker, notifications, security, password |
| `strategies.html` | Strategy categories, profiles A–E, 9 trading modes |
| `guides.html` | Plan-gated guidance documents |
| `pages/security.html` | Security overview |
| `pages/risk.html` | Risk disclosure |
| `pages/privacy.html` | Privacy policy |
| `pages/terms.html` | Terms of service |

## Themes

4 high-tech themes (switchable from nav or profile, persisted per user):
- **Neo Cyber** — cyan on black (default)
- **Matrix** — green on black
- **Blood Moon** — red on black
- **Void** — purple on black

## PWA

- `manifest/manifest.webmanifest` — app manifest (standalone display, icons, shortcuts)
- `sw.js` — service worker (caches static assets, network-first for API)
- `assets/` — favicon.svg, icon-192.png, icon-512.png

Install on mobile: open the site → browser menu → "Add to Home Screen".

## Configuration

All runtime config is in `js/config.js`:
```js
window.KINGBOT_CONFIG = {
  apiBase: "https://your-render-backend.onrender.com",  // ← EDIT THIS
  brand: "KingBot V8.7",
  company: "GIBSONFX TECH",
  eaVersion: "8.7.0",
  eaName: "MICRO-FLIP",
  features: { aiChat: true, emailVerification: true, phoneOtp: true, matrixTheme: true },
};
```

## Tech

- Vanilla JS (no framework, no build step)
- CSS custom properties for theming
- Canvas 2D for all charts (no chart library dependency)
- Mobile-first responsive design
- PWA (installable, offline-capable)

© 2026 GIBSONFX TECH.

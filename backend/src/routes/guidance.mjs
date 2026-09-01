// Guidance documents routes — unlocked after subscription. Returns the strategy
// category docs, setup guides and EA profile settings.
import { Router } from "express";
import { authRequired } from "../middleware/auth.mjs";
import {
  STRATEGY_CATEGORIES,
  EA_PROFILES,
  RECOMMENDED_PAIRS,
  PROTECTION_LAYERS,
  getProfilesForPlan,
} from "../data/plans.mjs";

const router = Router();

// Root index — same as /index (frontend calls KB.api.get("/api/guidance"))
async function buildDocIndex(req, res) {
  const planId = req.user.subscription?.planId;
  const docs = [
    { id: "getting-started", title: "Getting Started — Mobile EA Connection", locked: !planId },
    { id: "micro-flip-strategy", title: "The $20 Micro-Account Flip Strategy", locked: !planId },
    { id: "profiles-reference", title: "Setup Profiles A–E Reference", locked: !planId },
    { id: "recommended-pairs", title: "Recommended Pairs, Timeframes & Brokers", locked: !planId },
    { id: "safety-protection", title: "Safety, Drawdown & 10-Layer Blow-Up Protection", locked: !planId },
    { id: "troubleshooting", title: "Troubleshooting & FAQ", locked: !planId },
    { id: "strategy-categories", title: "Strategy Categories Catalog", locked: !planId },
    { id: "high-risk-engine", title: "High-Risk / Extreme / Gambler Engine", locked: !["elite", "quantum"].includes(planId) },
    { id: "grid-martingale", title: "Grid & Martingale Recovery Guide", locked: !["elite", "quantum"].includes(planId) },
    { id: "fibonacci-guide", title: "Fibonacci Strategy Deep Guide", locked: !["elite", "quantum"].includes(planId) },
    { id: "quantum-copilot", title: "Quantum AI Copilot — Strategy Co-Design", locked: planId !== "quantum" },
  ];
  res.json({ documents: docs, planId });
}

router.get("/", authRequired, buildDocIndex);

// Public teaser (no auth) — list of available docs with locked flags
router.get("/index", authRequired, buildDocIndex);

// Get a specific document (gated by plan)
router.get("/:docId", authRequired, async (req, res) => {
  const planId = req.user.subscription?.planId;
  const { docId } = req.params;

  const gated = {
    "high-risk-engine": ["elite", "quantum"],
    "grid-martingale": ["elite", "quantum"],
    "fibonacci-guide": ["elite", "quantum"],
    "quantum-copilot": ["quantum"],
  };

  if (!planId) return res.status(403).json({ error: "Subscription required", code: "PLAN_UPGRADE_REQUIRED" });
  if (gated[docId] && !gated[docId].includes(planId)) {
    return res.status(403).json({ error: `This document requires ${gated[docId].join(" or ")} plan`, code: "PLAN_UPGRADE_REQUIRED" });
  }

  const profiles = getProfilesForPlan(planId);

  const docs = {
    "getting-started": {
      title: "Getting Started — Mobile EA Connection",
      body: "Welcome to KingBot V8.7. You can connect your MetaTrader 5 terminal from your phone — no PC or Windows required. Steps: 1) Install the KingBot V8.7 EA on your MT5 (desktop, MT5 Web, or a broker-hosted MT5). 2) In the Dashboard, tap 'Connect EA' and enter your broker, account number, server, and the license key from your subscription. 3) The KingBot HTTP bridge syncs your EA status and live stats to your phone in real time. 4) Choose your setup profile (A for $20 accounts) and the EA begins trading. You can pause, resume, and change settings from your phone at any time.",
    },
    "micro-flip-strategy": {
      title: "The $20 Micro-Account Flip Strategy",
      body: "The golden rule: a $20 account cannot survive martingale or grid drawdown. The only sound way to grow a tiny account is to risk a fixed % of current balance per trade, keep win rate above 60%, and maintain R:R of at least 1.3:1. KingBot implements exactly this. Defaults (Profile A): 5% risk, 2-of-3 confluence, H1 trend filter, 1.5:1 R:R (10-pip TP / 6-pip SL), risk halves after each loss, pauses after 5 consecutive losses. The profit-lock engine moves SL into profit after 3 pips. Martingale and grid are OFF.",
    },
    "profiles-reference": {
      title: "Setup Profiles A–E Reference",
      body: "See the full settings JSON in the 'profiles' field of this response.",
      profiles: profiles,
    },
    "recommended-pairs": {
      title: "Recommended Pairs, Timeframes & Brokers",
      body: "Best pairs: EURUSD (tightest spread, best for $20), GBPUSD, USDJPY, AUDUSD, USDCAD. Avoid Gold (spread too wide for 6-pip SL), exotics, crypto. Timeframe: M1 entries + H1 trend filter. Broker: nano lots (0.01), $10–20 min deposit, EURUSD spread under 1.5 pips, zero/low commission, fast ECN/STP execution. Cent accounts are excellent (2000 cents = $20).",
      pairs: RECOMMENDED_PAIRS,
    },
    "safety-protection": {
      title: "Safety, Drawdown & 10-Layer Blow-Up Protection",
      body: "KingBot has 10 layers: confluence filter, H1 trend filter, ATR volatility floor, spread filter, SL≤TP enforcement, profit-lock engine, anti-blowup loss reduction, consecutive-loss pause, max drawdown hard stop, max lot cap. The most likely failure mode is the account slowly grinding down with ever-smaller risk (by design) rather than a sudden blow-up.",
      layers: PROTECTION_LAYERS,
    },
    "troubleshooting": {
      title: "Troubleshooting & FAQ",
      body: "Not taking trades → check dashboard reason (SPREAD/TREND/CONFLUENCE/ATR/SESSION/PAUSED/DD). SL closing in loss → check profit-lock inputs. Lot always 0.01 → normal until account grows past ~$100. License → paste key into InpLicenseKey or set InpEnableSecurity=false to test. MT4 not supported (MT5 only). Works on Mac. Reset after pause → re-attach EA or change timeframe.",
    },
    "strategy-categories": {
      title: "Strategy Categories Catalog",
      body: "All EA strategy categories and their key inputs.",
      categories: STRATEGY_CATEGORIES,
    },
    "high-risk-engine": {
      title: "High-Risk / Extreme / Gambler Engine",
      body: "For $1,000+ experienced traders. Equity-tier lot scaling, recovery boost, martingale boost, optional pyramid. Risk profiles: Conservative, Balanced, Aggressive, Extreme, Gambler. WARNING: can double or blow an account quickly. Never use money you cannot lose.",
      profiles: EA_PROFILES.filter((p) => ["E"].includes(p.id)),
    },
    "grid-martingale": {
      title: "Grid & Martingale Recovery Guide",
      body: "Grid: 8 levels, 15-pip spacing, 1.3x lot mult. Martingale: 2.0x after each loss, max 4 steps, reset on win. Both OFF by default — only on accounts that can absorb the drawdown sequences. Never on a $20 account.",
    },
    "fibonacci-guide": {
      title: "Fibonacci Strategy Deep Guide",
      body: "Entries at 61.8% golden-ratio retracement, TP at 161.8% extension. Modes: Standard, Reversed, Both. Optional entry gating within a pip tolerance. Supplementary to the main strategies.",
    },
    "quantum-copilot": {
      title: "Quantum AI Copilot — Strategy Co-Design",
      body: "Quantum subscribers get a dedicated AI copilot that co-designs custom strategy presets: it reads your account size, risk tolerance and goals, then proposes a full set of EA inputs which you can save as a custom profile and push to your connected accounts from your phone.",
    },
  };

  const doc = docs[docId];
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json({ ...doc, docId, planId, unlocked: true });
});

export default router;

// ============================================================================
//  KingBot V8.7 — Subscription Plans & Strategy Category Mapping
//  Each tier maps to specific EA strategy profiles from the official guide.
// ============================================================================

export const PLANS = [
  {
    id: "basic",
    name: "BASIC",
    priceUSD: 300,
    cycle: "monthly",
    tagline: "Micro-Account Flipper — Start small, flip smart",
    accent: "cyan",
    badge: null,
    strategies: [
      "MODE_MICRO_FLIP",
      "SMC Sniper (confluence input)",
      "Trend Scalper (confluence input)",
      "Momentum Scalper (confluence input)",
    ],
    features: [
      "Micro-Flip engine ($20–$500 accounts)",
      "2-of-3 confluence entries",
      "H1 trend filter + ATR floor",
      "Profit-Lock engine (SL moves to profit)",
      "Anti-blowup loss reduction (halve after loss)",
      "10-layer account protection",
      "Mobile EA bridge (1 connected account)",
      "Live analytics dashboard",
      "Email + phone OTP auth",
      "Basic guidance documents",
    ],
    limits: {
      connectedAccounts: 1,
      eaProfiles: ["A"],            // Profile A — $20 Micro Flip (defaults)
      maxDrawdownPct: 30,
      aiSupport: "basic",
      prioritySupport: false,
    },
    recommendedAccount: "$20 – $500",
  },
  {
    id: "pro",
    name: "PRO",
    priceUSD: 550,
    cycle: "monthly",
    tagline: "Steady Growth + Aggressive Flip — The balanced edge",
    accent: "green",
    badge: "MOST POPULAR",
    strategies: [
      "MODE_MICRO_FLIP (tuned)",
      "MODE_FLIP_SNIPER (rapid flip)",
      "SMC + Trend + Momentum (3/3 confluence)",
      "Conservative & Balanced presets",
    ],
    features: [
      "Everything in BASIC",
      "Profile B (Steady Growth) + Profile C (Aggressive Flip)",
      "Profile D (FLIP SNIPER rapid flipping)",
      "3-of-3 confluence high win-rate mode",
      "Adjustable R:R up to 2:1",
      "Mobile EA bridge (up to 3 connected accounts)",
      "Advanced analytics (equity curve, win-rate, drawdown)",
      "AI strategy assistant (Pro)",
      "Priority email support",
      "Full guidance document pack",
    ],
    limits: {
      connectedAccounts: 3,
      eaProfiles: ["A", "B", "C", "D"],
      maxDrawdownPct: 35,
      aiSupport: "pro",
      prioritySupport: true,
    },
    recommendedAccount: "$100 – $5,000",
  },
  {
    id: "elite",
    name: "ELITE",
    priceUSD: 1000,
    cycle: "monthly",
    tagline: "High-Risk Engine + Full Strategy Arsenal",
    accent: "gold",
    badge: "HIGH PERFORMANCE",
    strategies: [
      "MODE_FULL_AUTO (all strategies)",
      "MODE_HYBRID_SMC (SMC + Momentum)",
      "MODE_GRID / MODE_MARTINGALE",
      "High-Risk equity-tier scaling engine",
    ],
    features: [
      "Everything in PRO",
      "Profile E (EXTREME / GAMBLER high-risk engine)",
      "Risk Profiles: Conservative, Balanced, Aggressive, Extreme",
      "High-Risk recovery boost + pyramid",
      "Grid + Martingale recovery engines",
      "Fibonacci entry gating (standard + reversed)",
      "Mobile EA bridge (up to 10 connected accounts)",
      "Real-time analytics + heatmap",
      "AI strategy assistant (Elite — deep tuning)",
      "Priority support + 1:1 onboarding call",
      "Premium guidance + video walkthroughs",
    ],
    limits: {
      connectedAccounts: 10,
      eaProfiles: ["A", "B", "C", "D", "E"],
      maxDrawdownPct: 50,
      aiSupport: "elite",
      prioritySupport: true,
    },
    recommendedAccount: "$1,000 – $30,000",
  },
  {
    id: "quantum",
    name: "QUANTUM",
    priceUSD: 2500,
    cycle: "monthly",
    tagline: "Institutional-Grade — All engines, no limits",
    accent: "violet",
    badge: "ENTERPRISE",
    strategies: [
      "All 9 trading modes unlocked",
      "All 5 risk profiles",
      "All 6 lot-sizing modes",
      "All 6 TP models + 7 close models",
    ],
    features: [
      "Everything in ELITE",
      "RISK_GAMBLER profile (max lot, max mart, max positions)",
      "Unlimited connected accounts",
      "Per-account license keys (anti-reverse + code-hide security)",
      "Custom strategy presets (save/load your own profiles)",
      "News filter + session filter full control",
      "Dedicated AI copilot (Quantum — strategy co-design)",
      "White-glove support + dedicated account manager",
      "API access for custom integrations",
      "Full source guidance + priority EA updates",
      "Quarterly strategy review session",
    ],
    limits: {
      connectedAccounts: -1, // unlimited
      eaProfiles: ["A", "B", "C", "D", "E", "CUSTOM"],
      maxDrawdownPct: 100, // user-controlled
      aiSupport: "quantum",
      prioritySupport: true,
    },
    recommendedAccount: "$5,000+",
  },
];

// EA Strategy Categories (from the EA's ENUM_TRADE_MODE)
export const STRATEGY_CATEGORIES = [
  {
    id: "micro_flip",
    name: "Micro-Flip Engine",
    mode: "MODE_MICRO_FLIP",
    value: 8,
    description:
      "Small-account flipper combining SMC Sniper, Trend Scalper and Momentum Scalper with confluence, H1 trend filter and anti-blowup loss reduction.",
    bestFor: "$20 – $500 accounts",
    plans: ["basic", "pro", "elite", "quantum"],
    keyInputs: {
      InpMicroFlipEnable: true,
      InpMicroFlipRiskPercent: 5.0,
      InpMicroFlipRequireConfluence: 2,
      InpMicroFlipTrendFilter: true,
      InpMicroFlipRR: 1.5,
      InpMicroFlipLossReduce: 0.5,
      InpMicroFlipMaxConsecLoss: 5,
      InpUseMartingale: false,
      InpUseGrid: false,
    },
  },
  {
    id: "flip_sniper",
    name: "Flip Sniper",
    mode: "MODE_FLIP_SNIPER",
    value: 7,
    description:
      "Rapid direction-flipping engine that closes and re-enters on opposite sniper signals. Always in the market, bypasses session/news filters, boosts lot per flip.",
    bestFor: "$1,000+ accounts",
    plans: ["pro", "elite", "quantum"],
    keyInputs: {
      InpFlipEnable: true,
      InpFlipCloseOpposite: true,
      InpFlipForceEntry: true,
      InpFlipBypassFilters: true,
      InpFlipLotBoost: 1.2,
      InpFlipMaxPerBar: 8,
      InpMicroFlipEnable: false,
    },
  },
  {
    id: "smc_sniper",
    name: "SMC Sniper",
    mode: "MODE_SMC_ONLY",
    value: 1,
    description:
      "Smart Money Concepts strategy — order blocks, fair value gaps and liquidity sweeps. The institutional footprint engine.",
    bestFor: "All accounts",
    plans: ["basic", "pro", "elite", "quantum"],
    keyInputs: {
      InpUseSMC: true,
      InpSMC_SwingLookback: 3,
      InpSMC_OBLookback: 15,
      InpSMC_UseFVG: true,
      InpSMC_UseLiquidity: true,
      InpSMC_MinScore: 2,
    },
  },
  {
    id: "trend_scalper",
    name: "Trend Scalper",
    mode: "MODE_SCALP_ONLY",
    value: 2,
    description:
      "3-EMA system (8/21/50) for trend direction and pullback entries with an ATR volatility filter.",
    bestFor: "All accounts",
    plans: ["basic", "pro", "elite", "quantum"],
    keyInputs: {
      InpTrend_EMA_Fast: 8,
      InpTrend_EMA_Slow: 21,
      InpTrend_EMA_Trend: 50,
      InpTrend_ATR_Filt: 1.0,
    },
  },
  {
    id: "momentum_scalper",
    name: "Momentum Scalper",
    mode: "MODE_MOMENTUM",
    value: 3,
    description:
      "RSI + Stochastic overbought/oversold reversal scalper with momentum confirmation. Fast 7-period RSI on M1.",
    bestFor: "All accounts",
    plans: ["basic", "pro", "elite", "quantum"],
    keyInputs: {
      InpMOM_RSI_Period: 7,
      InpMOM_RSI_Oversold: 25.0,
      InpMOM_RSI_Overbought: 75.0,
      InpMOM_Stoch_K: 5,
      InpMOM_Stoch_D: 3,
      InpMOM_Stoch_Slow: 3,
    },
  },
  {
    id: "high_risk_engine",
    name: "High-Risk Engine",
    mode: "MODE_FULL_AUTO",
    value: 0,
    description:
      "Level-based aggressive lot scaling with equity-tier boosts, drawdown recovery, martingale boost and optional pyramiding. For experienced traders on larger accounts.",
    bestFor: "$1,000 – $30,000+",
    plans: ["elite", "quantum"],
    keyInputs: {
      InpLotMode: "LOT_HIGH_RISK",
      InpRiskProfile: "RISK_AGGRESSIVE",
      InpUseHighRiskStrategy: true,
      InpHighRiskBaseLot: 0.50,
      InpHighRiskMaxPositions: 6,
      InpHighRiskRecoveryBoost: 1.5,
      InpHighRiskPyramid: false,
    },
  },
  {
    id: "grid_martingale",
    name: "Grid & Martingale Recovery",
    mode: "MODE_GRID",
    value: 4,
    description:
      "Grid placement and martingale lot-doubling recovery engines. High drawdown potential — use only on accounts that can absorb the sequences.",
    bestFor: "$5,000+ (advanced)",
    plans: ["elite", "quantum"],
    keyInputs: {
      InpUseGrid: false,
      InpGrid_Steps: 8,
      InpGrid_SpacingPips: 15.0,
      InpGrid_LotMult: 1.3,
      InpUseMartingale: false,
      InpMart_Mult: 2.0,
      InpMart_MaxSteps: 4,
    },
  },
  {
    id: "fibonacci",
    name: "Fibonacci Strategy",
    mode: null,
    value: null,
    description:
      "Retracement entries (61.8% golden ratio) and extension targets (161.8%). Standard, reversed or both modes. Optional entry gating.",
    bestFor: "Supplementary",
    plans: ["elite", "quantum"],
    keyInputs: {
      InpFibMode: "FIB_STANDARD",
      InpFib_SwingBars: 50,
      InpFib_Entry: 61.8,
      InpFib_TP: 161.8,
      InpFibGateEntries: false,
    },
  },
];

// EA Setup Profiles (from guide sections 3 & 6)
export const EA_PROFILES = [
  {
    id: "A",
    name: "Profile A — $20 Micro Flip",
    plan: "basic",
    summary: "The defaults — just load and go. 5% risk, 2/3 confluence, H1 trend filter, martingale OFF.",
    settings: {
      InpTradeMode: "MODE_MICRO_FLIP",
      InpMicroFlipEnable: true,
      InpMicroFlipStartBalance: 20.0,
      InpMicroFlipRiskPercent: 5.0,
      InpMicroFlipRR: 1.5,
      InpMicroFlipRequireConfluence: 2,
      InpMicroFlipTrendFilter: true,
      InpUseMartingale: false,
      InpUseGrid: false,
      InpHardStopOnDD: true,
      InpMaxDrawdownPct: 30.0,
    },
  },
  {
    id: "B",
    name: "Profile B — $100–$500 Steady Growth",
    plan: "pro",
    summary: "Lower risk, slower but safer. 3% risk, all 3 strategies must agree, 20% max drawdown.",
    settings: {
      InpMicroFlipStartBalance: 100.0,
      InpMicroFlipRiskPercent: 3.0,
      InpMicroFlipRequireConfluence: 3,
      InpMicroFlipRR: 1.5,
      InpMaxDrawdownPct: 20.0,
    },
  },
  {
    id: "C",
    name: "Profile C — Aggressive Flip ($1,000+)",
    plan: "pro",
    summary: "Higher risk, faster growth. 7% risk, 2:1 R:R, larger drawdown tolerance.",
    settings: {
      InpTradeMode: "MODE_MICRO_FLIP",
      InpMicroFlipStartBalance: 1000.0,
      InpMicroFlipRiskPercent: 7.0,
      InpMicroFlipRequireConfluence: 2,
      InpMicroFlipRR: 2.0,
      InpFixedTP_Pips: 12.0,
      InpMicroFlipMaxConsecLoss: 7,
      InpMaxDrawdownPct: 35.0,
    },
  },
  {
    id: "D",
    name: "Profile D — FLIP SNIPER (rapid flipping)",
    plan: "pro",
    summary: "Rapid direction-flipping, always in market. Lot boost 1.2, martingale OFF.",
    settings: {
      InpTradeMode: "MODE_FLIP_SNIPER",
      InpFlipEnable: true,
      InpFlipLotBoost: 1.2,
      InpFlipForceEntry: true,
      InpMaxOpenTrades: 20,
      InpUseMartingale: false,
      InpMicroFlipEnable: false,
    },
  },
  {
    id: "E",
    name: "Profile E — EXTREME / GAMBLER High-Risk ($5,000+)",
    plan: "elite",
    summary: "Max aggression — high-risk engine, martingale ON, pyramid ON. Can double or blow an account. Experienced traders only.",
    settings: {
      InpTradeMode: "MODE_FULL_AUTO",
      InpLotMode: "LOT_HIGH_RISK",
      InpRiskProfile: "RISK_EXTREME",
      InpUseHighRiskStrategy: true,
      InpHighRiskBaseLot: 0.50,
      InpHighRiskMaxPositions: 6,
      InpUseMartingale: true,
      InpMart_Mult: 2.0,
      InpHighRiskMartBoost: 1.5,
      InpHighRiskPyramid: true,
      InpMicroFlipEnable: false,
      InpMaxDrawdownPct: 50.0,
    },
  },
];

// Recommended pairs (from guide section 9)
export const RECOMMENDED_PAIRS = [
  { symbol: "EURUSD", spread: "0.5–1 pip", note: "Tightest spread, best for $20 accounts", tier: 1 },
  { symbol: "GBPUSD", spread: "1–1.5 pip", note: "Excellent volatility + trend behavior", tier: 1 },
  { symbol: "USDJPY", spread: "0.8–1.2 pip", note: "Good Asian-session movement", tier: 2 },
  { symbol: "AUDUSD", spread: "1–1.5 pip", note: "Smooth trends, decent spread", tier: 2 },
  { symbol: "USDCAD", spread: "1.2–2 pip", note: "Oil-correlated moves", tier: 2 },
];

// 10-layer blow-up protection (from guide section 10)
export const PROTECTION_LAYERS = [
  "Confluence filter — 2+ strategies must agree",
  "Trend filter — only trade with the H1 trend",
  "Volatility filter — ATR floor skips dead markets",
  "Spread filter — prevents entries when spread eats SL",
  "SL ≤ TP enforcement — each loss is smaller than each win",
  "Profit-Lock engine — SL moves into profit after 3 pips",
  "Anti-blowup loss reduction — risk halves after each loss",
  "Consecutive-loss pause — stops after 5 losses in a row",
  "Max drawdown hard stop — closes all at 30% DD",
  "Max lot cap — lot never exceeds a sane ceiling",
];

export function getPlanById(id) {
  return PLANS.find((p) => p.id === id);
}
export function getProfilesForPlan(planId) {
  return EA_PROFILES.filter((p) => p.id === planId || p.plan === planId || (planId === "quantum"));
}

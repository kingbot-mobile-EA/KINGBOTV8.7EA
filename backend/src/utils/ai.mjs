// AI support service. Two modes:
//  - "rule": a built-in assistant trained on the KingBot V8.7 guide (no API key needed)
//  - "openai": forwards to an OpenAI-compatible chat completions endpoint
import { config } from "./config.mjs";

// Knowledge base distilled from the official KingBot guide — used by the rule engine.
const KNOWLEDGE = [
  {
    q: ["micro flip", "20 account", "small account", "flip $20", "20 dollar"],
    a: "For a $20 account use MODE_MICRO_FLIP (Profile A — the defaults). It risks 5% of current balance per trade, requires 2 of 3 strategies (SMC + Trend + Momentum) to agree, trades only with the H1 trend, uses a 1.5:1 R:R (10-pip TP / 6-pip SL), halves risk after each loss, and pauses after 5 consecutive losses. Martingale and grid are OFF. The profit-lock engine moves your SL into profit after 3 pips. Do not use martingale on a $20 account — it will blow within a few losses.",
  },
  {
    q: ["risk percent", "how much risk", "risk per trade", "risk percent set"],
    a: "5% is the sweet spot for a $20 flip. Use 3% for safer/slower growth, 7–10% for faster but riskier. Never set above 10% on a micro account. After a loss, InpMicroFlipLossReduce (default 0.5) halves the risk — so a losing streak shrinks exposure exponentially instead of draining the account linearly.",
  },
  {
    q: ["best pair", "which pair", "recommended pair", "eurusd", "spread"],
    a: "Best pairs for micro-flip (tight spreads + good M1 volatility): 1) EURUSD (tightest spread, best for $20), 2) GBPUSD (excellent volatility), 3) USDJPY, 4) AUDUSD, 5) USDCAD. Avoid Gold (XAUUSD) — spread 20–40 points is too wide for a 6-pip SL. Avoid exotic crosses and crypto. Raise InpMaxSpread to 40–60 only if trading gold with a wider SL.",
  },
  {
    q: ["not taking trades", "no trades", "ea not trading", "why no trade"],
    a: "Check the dashboard reason: SPREAD → raise InpMaxSpread or switch pairs; TREND → no clear H1 trend, wait; CONFLUENCE → lower InpMicroFlipRequireConfluence from 2 to 1 or wait; ATR → market too quiet, lower InpMicroFlipMinATRPips; SESSION → outside London/NY, set InpMicroFlipSessionOnly=false or wait; PAUSED → hit max consec losses, reset; DD → hit max drawdown, reset.",
  },
  {
    q: ["sl closing in loss", "stop loss loss", "profit lock", "sl in profit"],
    a: "Ensure InpUseProfitLock=true, InpProfitLockTriggerPips=3.0 (not too high), and InpProfitLockPips=0.8 (positive). The profit-lock only engages after 3 pips of favorable movement — if price reverses before that, the original SL (in loss) hits. If this happens often your SL may be too tight or the pair too volatile for a 6-pip SL.",
  },
  {
    q: ["martingale", "should i use martingale", "double after loss"],
    a: "No — not on a $20 account. Martingale will blow it within a few losing trades. Leave InpUseMartingale=false. The micro-flip loss-reduction (halving risk after each loss) is the correct recovery mechanism for small accounts. Martingale is only for larger accounts ($1,000+) with the high-risk engine and only if you understand the drawdown risk.",
  },
  {
    q: ["connect", "mobile", "no pc", "no windows", "phone connect"],
    a: "You can connect your MT5 terminal from your phone without a PC. After subscribing, open the Dashboard → 'Connect EA', enter your broker, account number and the KingBot HTTP bridge URL provided in your subscription. The bridge syncs your EA status, settings and live stats to your phone in real time. No Windows, no PC required.",
  },
  {
    q: ["profile b", "steady growth", "100 account", "500 account"],
    a: "Profile B is for $100–$500 steady growth: set InpMicroFlipStartBalance to your balance, InpMicroFlipRiskPercent=3.0, InpMicroFlipRequireConfluence=3 (all 3 strategies must agree — highest win rate), InpMaxDrawdownPct=20.0. Fewer trades but safer.",
  },
  {
    q: ["profile c", "aggressive", "1000 account", "2000 account"],
    a: "Profile C — Aggressive Flip ($1,000+): InpMicroFlipStartBalance=1000, InpMicroFlipRiskPercent=7.0, InpMicroFlipRequireConfluence=2, InpMicroFlipRR=2.0, InpFixedTP_Pips=12.0, InpMicroFlipMaxConsecLoss=7, InpMaxDrawdownPct=35.0.",
  },
  {
    q: ["flip sniper", "profile d", "rapid flip", "always in market"],
    a: "Profile D — FLIP SNIPER: InpTradeMode=MODE_FLIP_SNIPER, InpFlipEnable=true, InpFlipLotBoost=1.2, InpFlipForceEntry=true, InpMaxOpenTrades=20, InpUseMartingale=false, InpMicroFlipEnable=false. The EA closes and re-enters on opposite sniper signals, always in market. For $1,000+ accounts.",
  },
  {
    q: ["extreme", "gambler", "profile e", "5000 account", "high risk"],
    a: "Profile E — EXTREME/GAMBLER ($5,000+, experienced only): InpTradeMode=MODE_FULL_AUTO, InpLotMode=LOT_HIGH_RISK, InpRiskProfile=RISK_EXTREME, InpUseHighRiskStrategy=true, InpHighRiskBaseLot=0.50, InpHighRiskMaxPositions=6, InpUseMartingale=true, InpMart_Mult=2.0, InpHighRiskMartBoost=1.5, InpHighRiskPyramid=true, InpMicroFlipEnable=false, InpMaxDrawdownPct=50.0. WARNING: can double or blow an account quickly. Never use money you cannot lose.",
  },
  {
    q: ["drawdown", "max drawdown", "blow up", "protection"],
    a: "KingBot has 10 layers of blow-up protection: (1) confluence filter, (2) H1 trend filter, (3) ATR volatility floor, (4) spread filter, (5) SL≤TP enforcement, (6) profit-lock engine, (7) anti-blowup loss reduction, (8) consecutive-loss pause at 5, (9) max drawdown hard stop (30% default), (10) max lot cap. InpHardStopOnDD=true closes all positions on max DD.",
  },
  {
    q: ["timeframe", "m1", "best timeframe", "h1 trend"],
    a: "M1 (1-minute) is the recommended signal timeframe for micro-flip (InpBarTimeframe=PERIOD_M1). Pair it with the H1 trend filter (InpMicroFlipTrendTF=PERIOD_H1) so M1 entries only fire with the hourly trend. If M1 is too noisy, use M5.",
  },
  {
    q: ["broker", "which broker", "cent account", "nano lot"],
    a: "For a $20 account you need a broker with: nano/micro lots (0.01 min), low minimum deposit ($10–20), tight spreads (EURUSD under 1.5 pips), zero or low commission, and fast ECN/STP execution. Cent accounts are excellent — balance in cents (2000 cents = $20). Set InpMicroFlipStartBalance=2000 if using a cent account.",
  },
  {
    q: ["subscription", "plan", "price", "tier", "basic pro elite quantum"],
    a: "Plans: BASIC $300/mo (Micro-Flip, Profile A, 1 account), PRO $550/mo (+ Profiles B/C/D, Flip Sniper, 3 accounts), ELITE $1000/mo (+ Profile E, high-risk engine, grid/martingale, 10 accounts), QUANTUM $2500/mo (all modes, unlimited accounts, per-account license keys, AI copilot). After subscribing you get your license keys and full guidance documents.",
  },
  {
    q: ["license", "license key", "activation", "security"],
    a: "Each subscription tier grants per-account license keys. Paste your key into InpLicenseKey in the EA inputs. With InpEnableSecurity=true the EA will not trade without a valid key. Keys are tied to your account number (anti-reverse engineered). Quantum tier includes anti-reverse + code-hide security.",
  },
];

function ruleAnswer(message) {
  const m = message.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const item of KNOWLEDGE) {
    let score = 0;
    for (const kw of item.q) if (m.includes(kw)) score += kw.split(" ").length;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  if (best && bestScore > 0) return best.a;
  return "I'm the KingBot V8.7 assistant. I can help with: micro-flip setup for $20 accounts, risk %, best pairs/timeframes, the 10-layer blow-up protection, profiles A–E (from $20 flip to extreme high-risk), connecting your EA from mobile without a PC, license keys, and the 4 subscription tiers. Ask me about any EA input or strategy and I'll guide you. Tip: for a $20 account use MODE_MICRO_FLIP with the defaults — Profile A.";
}

export async function aiChat(messages, userId) {
  const last = messages[messages.length - 1]?.content || "";

  if (config.ai.provider === "rule" || !config.ai.apiKey) {
    return {
      role: "assistant",
      content: ruleAnswer(last),
      provider: "rule",
    };
  }

  // OpenAI-compatible provider
  try {
    const system =
      "You are the KingBot V8.7 MICRO-FLIP EA assistant, powered by GIBSONFX TECH. " +
      "You help traders configure the EA for their account size and goal. " +
      "Always give concrete input values. Reference the 5 profiles (A: $20 micro flip, " +
      "B: $100-500 steady, C: $1000+ aggressive, D: flip sniper, E: extreme/gambler $5000+). " +
      "Warn about martingale/grid on small accounts. Mention the 10-layer blow-up protection. " +
      "Be concise and specific. Include a risk disclaimer when discussing aggressive modes.";
    const res = await fetch(`${config.ai.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.ai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        messages: [
          { role: "system", content: system },
          ...messages.slice(-8),
        ],
      }),
    });
    const data = await res.json();
    return {
      role: "assistant",
      content: data.choices?.[0]?.message?.content || ruleAnswer(last),
      provider: config.ai.provider,
    };
  } catch (e) {
    console.error("[ai] provider error, falling back to rule engine:", e.message);
    return { role: "assistant", content: ruleAnswer(last), provider: "rule-fallback" };
  }
}

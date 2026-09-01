// Analytics routes — equity curve, win rate, drawdown, trade history.
import { Router } from "express";
import { authRequired } from "../middleware/auth.mjs";
import { getStatus } from "../services/eaBridge.mjs";

const router = Router();

router.get(["/account/:accountId", "/accounts/:accountId"], authRequired, async (req, res) => {
  const s = await getStatus(req.params.accountId);
  if (!s) return res.status(404).json({ error: "Not found" });
  res.json({
    summary: s.stats,
    equityCurve: s.equityCurve,
    recentTrades: s.recentTrades,
    status: s.status,
    mode: s.mode,
    profile: s.profile,
  });
});

router.get(["/account/:accountId/performance", "/accounts/:accountId/performance"], authRequired, async (req, res) => {
  const s = await getStatus(req.params.accountId);
  if (!s) return res.status(404).json({ error: "Not found" });
  const st = s.stats;
  const profitFactor = st.losses > 0
    ? +(st.wins / st.losses).toFixed(2)
    : st.wins;
  res.json({
    performance: {
      winRate: st.winRate,
      profitFactor,
      totalTrades: st.totalTrades,
      wins: st.wins,
      losses: st.losses,
      maxDrawdownPct: st.maxDrawdownPct,
      profitToday: st.profitToday,
      profitTotal: st.profitTotal,
      consecutiveLosses: st.consecutiveLosses,
      expectancy: +(((st.winRate / 100) * 1.5 - (1 - st.winRate / 100) * 1.0)).toFixed(2),
    },
  });
});

export default router;

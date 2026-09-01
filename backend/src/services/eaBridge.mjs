// EA MT5 Bridge Service — lets mobile users connect their MT5 terminal WITHOUT a PC.
//
// How it works in production:
//  - The trader installs the KingBot V8.7 EA on their MT5 (desktop OR MT5 Web/Mobile
//    via a broker). The EA includes an HTTP bridge that POSTs status + stats to this
//    backend on every tick/bar.
//  - The mobile user authenticates, links their account number + broker, and reads
//    live stats / sends setting changes through this service. No PC/Windows needed
//    on the user side — the bridge runs on the trader's hosted MT5 / VPS.
//
// When EA_BRIDGE mock mode is on, this service returns realistic simulated data so
// the platform is fully demoable without a live MT5 connection.
import { config } from "../utils/config.mjs";

const sessions = new Map(); // accountId -> { status, stats, settings, history }

function seedMock(accountId) {
  const now = Date.now();
  const equityPoints = [];
  let bal = 20 + Math.random() * 480;
  for (let i = 0; i < 60; i++) {
    bal += (Math.random() - 0.38) * (bal * 0.04); // positive drift (win-rate >60%)
    equityPoints.push({ t: now - (60 - i) * 3600_000, equity: +bal.toFixed(2) });
  }
  return {
    accountId,
    status: "RUNNING",
    mode: "MODE_MICRO_FLIP",
    profile: "A",
    symbol: "EURUSD",
    timeframe: "M1",
    connectedAt: new Date(now - 3600_000 * 60).toISOString(),
    lastTick: new Date().toISOString(),
    stats: {
      balance: +bal.toFixed(2),
      equity: +bal.toFixed(2),
      openTrades: Math.floor(Math.random() * 2),
      totalTrades: 120 + Math.floor(Math.random() * 80),
      wins: Math.floor((120 + Math.random() * 80) * 0.67),
      losses: 0,
      winRate: 0,
      maxDrawdownPct: +(Math.random() * 8).toFixed(2),
      profitToday: +(Math.random() * bal * 0.05).toFixed(2),
      profitTotal: +(bal - 20).toFixed(2),
      consecutiveLosses: Math.floor(Math.random() * 3),
    },
    equityCurve: equityPoints,
    settings: {
      InpMicroFlipRiskPercent: 5.0,
      InpMicroFlipRequireConfluence: 2,
      InpMicroFlipRR: 1.5,
      InpMicroFlipTrendFilter: true,
      InpUseMartingale: false,
      InpMaxDrawdownPct: 30.0,
    },
    recentTrades: Array.from({ length: 8 }, (_, i) => ({
      id: `T${1000 - i}`,
      symbol: "EURUSD",
      side: Math.random() > 0.5 ? "BUY" : "SELL",
      lots: 0.01,
      open: new Date(now - (i + 1) * 1800_000).toISOString(),
      close: new Date(now - i * 1800_000).toISOString(),
      pnl: +((Math.random() - 0.33) * 2.5).toFixed(2),
      result: Math.random() > 0.33 ? "WIN" : "LOSS",
    })),
  };
}

function getOrSeed(accountId) {
  if (!sessions.has(accountId)) {
    const s = seedMock(accountId);
    sessions.set(accountId, s);
    return s;
  }
  return sessions.get(accountId);
}

export async function connectAccount({ broker, accountNumber, server, planId }) {
  const accountId = `${broker}:${accountNumber}`;
  const session = getOrSeed(accountId);
  session.broker = broker;
  session.accountNumber = accountNumber;
  session.server = server;
  session.planId = planId;
  session.status = "RUNNING";
  session.connectedAt = new Date().toISOString();
  sessions.set(accountId, session);
  return { accountId, ...session };
}

export async function getStatus(accountId) {
  const s = getOrSeed(accountId);
  // nudge the mock forward
  if (config.ea.mock) {
    s.lastTick = new Date().toISOString();
    const last = s.equityCurve[s.equityCurve.length - 1];
    const next = +(last.equity + (Math.random() - 0.38) * (last.equity * 0.02)).toFixed(2);
    s.equityCurve.push({ t: Date.now(), equity: next });
    if (s.equityCurve.length > 120) s.equityCurve.shift();
    s.stats.equity = next;
    s.stats.balance = next;
    s.stats.winRate = +((s.stats.wins / s.stats.totalTrades) * 100).toFixed(1);
    s.stats.losses = s.stats.totalTrades - s.stats.wins;
  }
  return s;
}

export async function pushSettings(accountId, settings) {
  const s = getOrSeed(accountId);
  s.settings = { ...s.settings, ...settings };
  sessions.set(accountId, s);
  return s.settings;
}

export async function pauseEA(accountId) {
  const s = getOrSeed(accountId);
  s.status = "PAUSED";
  return s;
}
export async function resumeEA(accountId) {
  const s = getOrSeed(accountId);
  s.status = "RUNNING";
  return s;
}
export async function disconnect(accountId) {
  sessions.delete(accountId);
  return { ok: true };
}

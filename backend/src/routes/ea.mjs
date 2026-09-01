// EA bridge routes — mobile users connect their MT5 terminal without a PC.
import { Router } from "express";
import { authRequired } from "../middleware/auth.mjs";
import {
  connectAccount,
  getStatus,
  pushSettings,
  pauseEA,
  resumeEA,
  disconnect,
} from "../services/eaBridge.mjs";
import { updateOne } from "../utils/store.mjs";

const router = Router();

// ---- Connect an MT5 account (mobile, no PC needed)
router.post("/connect", authRequired, async (req, res) => {
  try {
    const { broker, accountNumber, server, login, nickname, licenseKey, profileId } = req.body || {};
    // Accept both broker/accountNumber (EA-native) and server/login (mobile-friendly)
    const brokerName = broker || server || "unknown";
    const acctNum = accountNumber || login || "";
    if (!brokerName || !acctNum)
      return res.status(400).json({ error: "server (broker) and login (account number) required" });
    const planId = req.user.subscription?.planId;
    if (!planId) return res.status(403).json({ error: "Active subscription required to connect EA", code: "PLAN_UPGRADE_REQUIRED" });
    const session = await connectAccount({ broker: brokerName, accountNumber: acctNum, server: brokerName, planId, licenseKey });
    // link to user
    const connected = req.user.connectedAccounts || [];
    if (!connected.includes(session.accountId)) connected.push(session.accountId);
    await updateOne("users", (u) => u.id === req.user.id, { connectedAccounts: connected });
    // Return in a frontend-friendly format: { account: { id, server, login, nickname, status } }
    res.status(201).json({
      account: {
        id: session.accountId,
        server: brokerName,
        login: acctNum,
        nickname: nickname || `Account ${acctNum}`,
        status: "running",
        profileId: profileId || null,
      },
      session,
    });
  } catch (e) {
    console.error("[ea connect]", e);
    res.status(500).json({ error: "Connection failed" });
  }
});

// ---- List connected accounts (frontend-friendly: array of account objects)
router.get("/accounts", authRequired, async (req, res) => {
  const ids = req.user.connectedAccounts || [];
  const statuses = await Promise.all(ids.map((id) => getStatus(id).catch(() => null)));
  const accounts = statuses.filter(Boolean).map((s) => ({
    id: s.accountId || s.id,
    server: s.server || s.broker || "—",
    login: s.accountNumber || s.login || "—",
    nickname: s.nickname || `Account ${s.accountNumber || s.id}`,
    status: s.eaRunning ? "running" : "paused",
  }));
  res.json({ accounts });
});

// ---- Get live status for an account
// Supports both /accounts/:id and /accounts/:id/status (frontend uses /status)
router.get(["/accounts/:accountId", "/accounts/:accountId/status"], authRequired, async (req, res) => {
  const status = await getStatus(req.params.accountId);
  if (!status) return res.status(404).json({ error: "Account not connected" });
  res.json({ status });
});

// ---- Update EA settings from mobile
router.patch("/accounts/:accountId/settings", authRequired, async (req, res) => {
  const settings = await pushSettings(req.params.accountId, req.body || {});
  res.json({ settings });
});

// ---- Pause / resume / disconnect
router.post("/accounts/:accountId/pause", authRequired, async (req, res) => res.json(await pauseEA(req.params.accountId)));
router.post("/accounts/:accountId/resume", authRequired, async (req, res) => res.json(await resumeEA(req.params.accountId)));
router.post("/accounts/:accountId/disconnect", authRequired, async (req, res) => {
  await disconnect(req.params.accountId);
  const connected = (req.user.connectedAccounts || []).filter((id) => id !== req.params.accountId);
  await updateOne("users", (u) => u.id === req.user.id, { connectedAccounts: connected });
  res.json({ ok: true });
});

export default router;

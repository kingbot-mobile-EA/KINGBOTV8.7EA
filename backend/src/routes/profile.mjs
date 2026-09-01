// User profile & settings routes — theme, notifications, security, password change.
import { Router } from "express";
import bcrypt from "bcryptjs";
import { authRequired } from "../middleware/auth.mjs";
import { updateOne, insertOne } from "../utils/store.mjs";
import { config } from "../utils/config.mjs";
import { generateOtp, sendOtpSms } from "../utils/verify.mjs";

const router = Router();

const THEMES = ["neo-cyber", "matrix", "blood-moon", "void"];

router.get("/me", authRequired, async (req, res) => {
  const { passwordHash, emailVerifyToken, otp, ...safe } = req.user;
  res.json({ user: safe });
});

router.patch("/me", authRequired, async (req, res) => {
  const allowed = ["displayName", "theme", "notifications"];
  const patch = {};
  for (const k of allowed) if (req.body[k] !== undefined) patch[k] = req.body[k];
  if (patch.theme && !THEMES.includes(patch.theme))
    return res.status(400).json({ error: `theme must be one of: ${THEMES.join(", ")}` });
  const updated = await updateOne("users", (u) => u.id === req.user.id, patch);
  const { passwordHash, emailVerifyToken, otp, ...safe } = updated;
  res.json({ user: safe });
});

router.post("/me/change-password", authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "currentPassword and newPassword required" });
  if (newPassword.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters" });
  const ok = await bcrypt.compare(currentPassword, req.user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Current password incorrect" });
  const hash = await bcrypt.hash(newPassword, config.bcryptRounds);
  await updateOne("users", (u) => u.id === req.user.id, { passwordHash: hash });
  res.json({ message: "Password changed" });
});

// Re-verify phone (security step before sensitive actions)
router.post("/me/reverify-phone", authRequired, async (req, res) => {
  const otp = generateOtp();
  await updateOne("users", (u) => u.id === req.user.id, {
    otp,
    otpExpires: new Date(Date.now() + 10 * 60_000).toISOString(),
    otpAttempts: 0,
  });
  await sendOtpSms(req.user.phone, otp);
  res.json({ message: "OTP sent to your phone" });
});

// Activity log (lightweight)
router.get("/me/activity", authRequired, async (req, res) => {
  const { findMany } = await import("../utils/store.mjs");
  const chats = await findMany("ai_chats", (c) => c.userId === req.user.id);
  const activity = chats.slice(-10).map((c) => ({
    type: "ai_chat",
    at: c.at,
    summary: c.messages?.slice(-1)[0]?.content?.slice(0, 80),
  }));
  res.json({ activity });
});

export default router;

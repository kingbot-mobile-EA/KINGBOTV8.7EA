// Auth routes: signup (email + phone + OTP), login, verify-email, verify-otp,
// resend, password reset, me, logout.
import { Router } from "express";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { config } from "../utils/config.mjs";
import { signToken } from "../middleware/auth.mjs";
import { authRequired } from "../middleware/auth.mjs";
import {
  insertOne,
  findOne,
  updateOne,
  readCollection,
} from "../utils/store.mjs";
import { sendVerificationEmail, generateOtp, sendOtpSms } from "../utils/verify.mjs";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[1-9]\d{6,14}$/;

// ---- Signup: collects email, password, phone. Sends email verify link + SMS OTP.
router.post("/signup", async (req, res) => {
  try {
    const { email, password, phone, displayName } = req.body || {};
    if (!email || !password || !phone)
      return res.status(400).json({ error: "email, password and phone are required" });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Invalid email" });
    if (!PHONE_RE.test(phone)) return res.status(400).json({ error: "Invalid phone number (use international format, e.g. +12025551234)" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const existing = await findOne("users", (u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, config.bcryptRounds);
    const verifyToken = nanoid(32);
    const otp = generateOtp();

    const user = await insertOne("users", {
      id: nanoid(16),
      email: email.toLowerCase(),
      phone,
      displayName: displayName || email.split("@")[0],
      passwordHash: hash,
      emailVerified: false,
      phoneVerified: false,
      emailVerifyToken: verifyToken,
      emailVerifyExpires: new Date(Date.now() + 24 * 3600_000).toISOString(),
      otp,
      otpExpires: new Date(Date.now() + 10 * 60_000).toISOString(),
      otpAttempts: 0,
      subscription: null,
      connectedAccounts: [],
      theme: "matrix",
      notifications: { email: true, sms: false, push: true },
      createdAt: new Date().toISOString(),
    });

    await sendVerificationEmail(user.email, verifyToken);
    await sendOtpSms(user.phone, otp);

    res.status(201).json({
      message: "Account created. Verify your email (link sent) and phone (OTP sent).",
      userId: user.id,
      emailVerifyRequired: true,
      phoneVerifyRequired: true,
    });
  } catch (e) {
    console.error("[signup]", e);
    res.status(500).json({ error: "Signup failed" });
  }
});

// ---- Verify email via token (from email link)
router.get("/verify-email", async (req, res) => {
  try {
    const { token, email } = req.query;
    if (!token || !email) return res.status(400).json({ error: "token and email required" });
    const user = await findOne("users", (u) => u.email === email.toLowerCase() && u.emailVerifyToken === token);
    if (!user) return res.status(400).json({ error: "Invalid or already used verification link" });
    if (new Date(user.emailVerifyExpires) < new Date())
      return res.status(400).json({ error: "Verification link expired — request a new one" });
    await updateOne("users", (u) => u.id === user.id, {
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    });
    res.json({ message: "Email verified successfully" });
  } catch (e) {
    res.status(500).json({ error: "Verification failed" });
  }
});

// ---- Verify phone via OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const user = await findOne("users", (u) => u.email === email.toLowerCase());
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.phoneVerified) return res.json({ message: "Phone already verified" });
    if (new Date(user.otpExpires) < new Date())
      return res.status(400).json({ error: "OTP expired — request a new one" });
    if (user.otpAttempts >= 5) return res.status(429).json({ error: "Too many attempts — request a new OTP" });
    if (user.otp !== String(otp)) {
      await updateOne("users", (u) => u.id === user.id, { otpAttempts: user.otpAttempts + 1 });
      return res.status(400).json({ error: "Invalid OTP" });
    }
    await updateOne("users", (u) => u.id === user.id, {
      phoneVerified: true,
      otp: null,
      otpExpires: null,
      otpAttempts: 0,
    });
    res.json({ message: "Phone verified successfully" });
  } catch (e) {
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// ---- Resend email verification + OTP
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body || {};
    const user = await findOne("users", (u) => u.email === email.toLowerCase());
    if (!user) return res.status(404).json({ error: "User not found" });
    const verifyToken = nanoid(32);
    const otp = generateOtp();
    await updateOne("users", (u) => u.id === user.id, {
      emailVerifyToken: verifyToken,
      emailVerifyExpires: new Date(Date.now() + 24 * 3600_000).toISOString(),
      otp,
      otpExpires: new Date(Date.now() + 10 * 60_000).toISOString(),
      otpAttempts: 0,
    });
    await sendVerificationEmail(user.email, verifyToken);
    await sendOtpSms(user.phone, otp);
    res.json({ message: "Verification email and OTP resent" });
  } catch (e) {
    res.status(500).json({ error: "Resend failed" });
  }
});

// ---- Login (requires email verified; phone optional at login but enforced for trading)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const user = await findOne("users", (u) => u.email === email.toLowerCase());
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.emailVerified)
      return res.status(403).json({ error: "Email not verified", code: "EMAIL_NOT_VERIFIED" });
    const token = signToken(user.id);
    const { passwordHash, emailVerifyToken, otp, ...safe } = user;
    res.json({ token, user: safe });
  } catch (e) {
    res.status(500).json({ error: "Login failed" });
  }
});

// ---- Current user
router.get("/me", authRequired, async (req, res) => {
  const { passwordHash, emailVerifyToken, otp, ...safe } = req.user;
  res.json({ user: safe });
});

export default router;

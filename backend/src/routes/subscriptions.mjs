// Subscriptions & billing routes: list plans, subscribe (generates license keys),
// webhook, license key validation, cancel.
import { Router } from "express";
import { nanoid } from "nanoid";
import { authRequired } from "../middleware/auth.mjs";
import { PLANS, getProfilesForPlan } from "../data/plans.mjs";
import { insertOne, updateOne, findOne } from "../utils/store.mjs";
import { generateLicenseKey } from "../utils/license.mjs";
import { config } from "../utils/config.mjs";

const router = Router();

// ---- Public: list all plans + strategy categories
router.get("/plans", (_req, res) => res.json({ plans: PLANS }));

// ---- Subscribe (mock checkout — in production this is a Stripe checkout session)
router.post("/subscribe", authRequired, async (req, res) => {
  try {
    const { planId, accountNumber } = req.body || {};
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) return res.status(400).json({ error: "Invalid plan" });
    if (plan.priceUSD <= 0) return res.status(400).json({ error: "Invalid plan price" });

    // Generate license keys: one per connected-account slot
    const slots = plan.limits.connectedAccounts === -1 ? 10 : plan.limits.connectedAccounts;
    const licenseKeys = Array.from({ length: Math.max(1, slots) }, () =>
      generateLicenseKey(planId, accountNumber)
    );
    // Also provide frontend-friendly licenses array (objects with key + label)
    const licenses = licenseKeys.map((key, i) => ({ key, label: `Slot ${i + 1}`, active: false }));

    const sub = {
      id: nanoid(16),
      userId: req.user.id,
      planId: plan.id,
      planName: plan.name,
      priceUSD: plan.priceUSD,
      cycle: plan.cycle,
      status: config.payments.enabled ? "pending" : "active", // mock = active immediately
      licenseKeys,
      licenses,
      eaProfiles: getProfilesForPlan(plan.id).map((p) => p.id),
      startedAt: new Date().toISOString(),
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400_000).toISOString(),
      renewsAt: new Date(Date.now() + 30 * 86400_000).toISOString(),
      paymentProvider: config.payments.provider,
      mock: !config.payments.enabled,
    };

    await insertOne("subscriptions", sub);
    await updateOne("users", (u) => u.id === req.user.id, { subscription: sub });

    res.status(201).json({
      message: config.payments.enabled
        ? "Subscription initiated. Complete payment to activate."
        : "Subscription active (mock mode). Your license keys and guidance documents are unlocked.",
      subscription: sub,
      guidanceUnlocked: true,
    });
  } catch (e) {
    console.error("[subscribe]", e);
    res.status(500).json({ error: "Subscription failed" });
  }
});

// ---- Validate a license key (used by the EA itself / mobile bridge)
router.post("/license/validate", async (req, res) => {
  try {
    const { licenseKey, accountNumber } = req.body || {};
    if (!licenseKey) return res.status(400).json({ error: "licenseKey required" });
    const sub = await findOne("subscriptions", (s) => s.licenseKeys.includes(licenseKey));
    if (!sub) return res.status(404).json({ valid: false, error: "License key not found" });
    if (sub.status !== "active")
      return res.status(403).json({ valid: false, error: "Subscription not active" });
    const plan = PLANS.find((p) => p.id === sub.planId);
    res.json({
      valid: true,
      planId: sub.planId,
      planName: sub.planName,
      eaProfiles: sub.eaProfiles,
      limits: plan?.limits,
      renewsAt: sub.renewsAt,
    });
  } catch (e) {
    res.status(500).json({ error: "License validation failed" });
  }
});

// ---- My subscription (frontend uses /me, also keep /me/subscription for compat)
router.get(["/me", "/me/subscription"], authRequired, async (req, res) => {
  res.json({ subscription: req.user.subscription || null, user: req.user });
});

// ---- Cancel (frontend uses DELETE /me, also keep POST /me/subscription/cancel)
router.delete("/me", authRequired, async (req, res) => {
  if (!req.user.subscription) return res.status(404).json({ error: "No active subscription" });
  const sub = await updateOne(
    "subscriptions",
    (s) => s.id === req.user.subscription.id,
    { status: "cancelled", cancelledAt: new Date().toISOString() }
  );
  await updateOne("users", (u) => u.id === req.user.id, { subscription: sub });
  res.json({ message: "Subscription cancelled — access remains until renewal date", subscription: sub });
});

router.post("/me/subscription/cancel", authRequired, async (req, res) => {
  if (!req.user.subscription) return res.status(404).json({ error: "No active subscription" });
  const sub = await updateOne(
    "subscriptions",
    (s) => s.id === req.user.subscription.id,
    { status: "cancelled", cancelledAt: new Date().toISOString() }
  );
  await updateOne("users", (u) => u.id === req.user.id, { subscription: sub });
  res.json({ message: "Subscription cancelled — access remains until renewal date", subscription: sub });
});

// ---- Stripe webhook (raw body — register before json middleware in production)
router.post("/webhook/stripe", (req, res) => {
  // In production: verify signature, handle checkout.session.completed → activate sub.
  res.json({ received: true });
});

export default router;

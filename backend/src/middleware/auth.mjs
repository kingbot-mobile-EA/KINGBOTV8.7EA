// Auth middleware — verifies JWT and attaches the user to req.user.
import jwt from "jsonwebtoken";
import { config } from "../utils/config.mjs";
import { findOne } from "../utils/store.mjs";

export async function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const user = await findOne("users", (u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });
    if (!user.emailVerified && !req.allowUnverified) {
      return res.status(403).json({ error: "Email not verified", code: "EMAIL_NOT_VERIFIED" });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Soft auth — attaches user if token present, does not block.
export async function authOptional(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwt.secret);
      const user = await findOne("users", (u) => u.id === payload.sub);
      if (user) req.user = user;
    } catch {
      /* ignore */
    }
  }
  next();
}

export function requirePlan(...allowedPlans) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    const plan = req.user.subscription?.planId;
    if (!plan || !allowedPlans.includes(plan)) {
      return res.status(403).json({
        error: `This feature requires one of: ${allowedPlans.join(", ")}`,
        code: "PLAN_UPGRADE_REQUIRED",
        requiredPlans: allowedPlans,
      });
    }
    next();
  };
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

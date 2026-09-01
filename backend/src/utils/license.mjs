// License key generation — per-account keys tied to plan tier.
import { nanoid } from "nanoid";

const PLAN_PREFIX = {
  basic: "KB-BSC",
  pro: "KB-PRO",
  elite: "KB-ELT",
  quantum: "KB-QNT",
};

export function generateLicenseKey(planId, accountNumber = null) {
  const prefix = PLAN_PREFIX[planId] || "KB-GEN";
  const seg = () => nanoid(6).toUpperCase().replace(/[^A-Z0-9]/g, "X");
  const accountSuffix = accountNumber ? `-${String(accountNumber).slice(-4)}` : "";
  return `${prefix}-${seg()}-${seg()}${accountSuffix}`;
}

export function validateLicenseFormat(key) {
  if (!key || typeof key !== "string") return false;
  return /^KB-(BSC|PRO|ELT|QNT)-[A-Z0-9]{6}-[A-Z0-9]{6}(-\d{4})?$/.test(key);
}

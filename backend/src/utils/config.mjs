// Config loader — single source of truth for env-based settings.
import dotenv from "dotenv";
dotenv.config();

const bool = (v, def = false) =>
  v === undefined ? def : String(v).toLowerCase() === "true";

export const config = {
  port: parseInt(process.env.PORT || "8080", 10),
  env: process.env.NODE_ENV || "development",
  corsOrigin: (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),

  email: {
    enabled: bool(process.env.EMAIL_ENABLED, false),
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || "KingBot <noreply@kingbot.local>",
  },

  sms: {
    enabled: bool(process.env.SMS_ENABLED, false),
    provider: process.env.SMS_PROVIDER || "twilio",
    sid: process.env.TWILIO_ACCOUNT_SID,
    token: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_FROM,
  },

  payments: {
    enabled: bool(process.env.PAYMENTS_ENABLED, false),
    provider: process.env.PAYMENTS_PROVIDER || "stripe",
    stripeSecret: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: process.env.PAYMENT_CURRENCY || "usd",
  },

  ea: {
    bridgeUrl: process.env.EA_BRIDGE_URL || "http://localhost:3001",
    bridgeToken: process.env.EA_BRIDGE_TOKEN || "dev-bridge",
    mock: bool(process.env.MOCK_EA, true),
  },

  ai: {
    provider: process.env.AI_PROVIDER || "rule",
    apiKey: process.env.AI_API_KEY,
    baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
    model: process.env.AI_MODEL || "gpt-4o-mini",
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || "600", 10),
  },
};

export function mask(s) {
  if (!s) return "";
  return s.slice(0, 4) + "•".repeat(Math.max(4, s.length - 8)) + s.slice(-4);
}

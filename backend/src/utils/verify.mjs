// Email + SMS verification services. In dev mode (EMAIL_ENABLED/SMS_ENABLED=false)
// the codes/links are logged to the console so you can test end-to-end without a
// provider. In production, wire up Resend/SendGrid (email) and Twilio (SMS).
import { config } from "./config.mjs";

// ---- Email ----
export async function sendVerificationEmail(to, token) {
  const link = `${publicAppUrl()}/pages/verify-email.html?token=${token}&email=${encodeURIComponent(to)}`;
  const body = `Welcome to KingBot V8.7 MICRO-FLIP platform.

Verify your email address to activate your account:

${link}

This link expires in 24 hours. If you did not create an account, ignore this email.

— KingBot Platform Security • GIBSONFX TECH`;
  return sendEmail(to, "Verify your KingBot account", body, link);
}

export async function sendEmail(to, subject, text, actionLink) {
  if (!config.email.enabled) {
    console.log("\n──────── EMAIL (dev mode — not sent) ────────");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log(actionLink ? `Action link: ${actionLink}` : text);
    console.log("──────────────────────────────────────────────\n");
    return { ok: true, dev: true };
  }
  // Production: use a provider SDK. Example with node-fetch + Resend API:
  // const res = await fetch("https://api.resend.com/emails", { ... })
  // For simplicity we log. Replace with your provider's API call.
  console.log(`[email] Queued "${subject}" to ${to}`);
  return { ok: true };
}

// ---- SMS / Phone OTP ----
export function generateOtp(length = 6) {
  const digits = "0123456789";
  let out = "";
  for (let i = 0; i < length; i++) out += digits[Math.floor(Math.random() * 10)];
  return out;
}

export async function sendOtpSms(to, code) {
  if (!config.sms.enabled) {
    console.log("\n──────── SMS OTP (dev mode — not sent) ────────");
    console.log("To:", to);
    console.log("Your KingBot verification code:", code);
    console.log("──────────────────────────────────────────────\n");
    return { ok: true, dev: true };
  }
  // Production: Twilio
  // const twilio = await import("twilio");
  // const client = twilio(config.sms.sid, config.sms.token);
  // await client.messages.create({ body: `Your KingBot code: ${code}`, from: config.sms.from, to });
  console.log(`[sms] OTP ${code} queued to ${to}`);
  return { ok: true };
}

export function publicAppUrl() {
  // The public frontend URL used in email links. Defaults to same-origin.
  return process.env.PUBLIC_APP_URL || "";
}

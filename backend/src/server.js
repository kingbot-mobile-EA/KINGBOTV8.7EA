// ============================================================================
//  KingBot V8.7 Platform — Backend entrypoint (ES modules, Render-ready)
// ============================================================================
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { config } from "./utils/config.mjs";
import { readCollection } from "./utils/store.mjs";

import authRoutes from "./routes/auth.mjs";
import subRoutes from "./routes/subscriptions.mjs";
import eaRoutes from "./routes/ea.mjs";
import analyticsRoutes from "./routes/analytics.mjs";
import aiRoutes from "./routes/ai.mjs";
import guidanceRoutes from "./routes/guidance.mjs";
import profileRoutes from "./routes/profile.mjs";

const app = express();

// ---- Security middleware ----
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(
  cors({
    origin: (origin, cb) => {
      // allow same-origin (no origin) and whitelisted origins
      if (!origin || config.corsOrigin.includes("*") || config.corsOrigin.includes(origin)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "256kb" }));
app.use(morgan(config.env === "production" ? "combined" : "dev"));

// ---- Rate limiting ----
const apiLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 30, standardHeaders: true, legacyHeaders: false });
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

// ---- Health check (Render + uptime monitoring) ----
// Note: health check is intentionally public to allow monitoring services (Render, Uptime, etc.)
app.get("/health", async (_req, res) => {
  try {
    // Add timeout to prevent hanging on file operations
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Health check timeout")), 5000)
    );

    const usersPromise = readCollection("users");
    const users = await Promise.race([usersPromise, timeoutPromise]);

    res.json({
      status: "ok",
      service: "kingbot-platform-backend",
      version: "8.7.0",
      env: config.env,
      users: users.length,
      eaMock: config.ea.mock,
      paymentsEnabled: config.payments.enabled,
      aiProvider: config.ai.provider,
      time: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[health check]", err);
    res.status(503).json({
      status: "degraded",
      service: "kingbot-platform-backend",
      version: "8.7.0",
      error: err.message,
    });
  }
});

// ---- API routes ----
app.use("/api/auth", authRoutes);
app.use("/api/subscriptions", subRoutes);
app.use("/api/ea", eaRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/guidance", guidanceRoutes);
app.use("/api/profile", profileRoutes);

// ---- Root ----
app.get("/", (_req, res) => {
  res.json({
    name: "KingBot V8.7 MICRO-FLIP Platform API",
    poweredBy: "GIBSONFX TECH",
    version: "8.7.0",
    docs: "/health, /api/auth, /api/subscriptions/plans, /api/ea, /api/analytics, /api/ai, /api/guidance",
  });
});

// ---- 404 + error handler ----
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error" });
});

const port = config.port;
const server = app.listen(port, () => {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║   KINGBOT V8.7 MICRO-FLIP PLATFORM — BACKEND             ║");
  console.log("║   Powered by GIBSONFX TECH  •  v8.7.0                    ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`▶ Listening on :${port}  (${config.env})`);
  console.log(`▶ EA bridge mock: ${config.ea.mock}  •  AI provider: ${config.ai.provider}`);
  console.log(`▶ Payments: ${config.payments.enabled ? "ENABLED" : "MOCK"}  •  Email: ${config.email.enabled ? "ENABLED" : "LOG"}  •  SMS: ${config.sms.enabled ? "ENABLED" : "LOG"}\n`);
});

// ---- Graceful shutdown for Render deployments ----
process.on("SIGTERM", () => {
  console.log("[shutdown] SIGTERM received, closing server gracefully...");
  server.close(() => {
    console.log("[shutdown] Server closed");
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error("[shutdown] Forced exit after 10s timeout");
    process.exit(1);
  }, 10000);
});

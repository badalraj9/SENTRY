/**
 * SENTRY Backend - Express Application
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/index.js";

export const app = express();

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  }),
);

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (config.isDev) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
  });
}

// =============================================================================
// ROUTES
// =============================================================================

import {
  authRouter,
  userRouter,
  projectRouter,
  chatRouter,
  decisionRouter,
  assistantRouter,
  debugRouter,
  workshopRouter,
  documentRouter,
} from "./routes/index.js";

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth rate limiting (strict)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts, please try again later",
  },
});

// API routes
app.use("/auth", authLimiter, authRouter);
app.use("/users", userRouter);
app.use("/projects", projectRouter);
app.use("/chats", chatRouter);
app.use("/decisions", decisionRouter);
app.use("/assistant", assistantRouter);
if (config.isDev) {
  app.use("/debug", debugRouter);
}
app.use("/workshops", workshopRouter);
app.use("/documents", documentRouter);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("❌ Error:", err);

    res.status(500).json({
      error: config.isDev ? err.message : "Internal server error",
    });
  },
);

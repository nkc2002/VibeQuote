/**
 * Vercel Serverless API Entry Point
 *
 * This handles all /api/* routes for the VibeQuote application.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// CORS - allow all vercel.app domains
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.includes("vercel.app") || origin.includes("localhost")) {
        return callback(null, true);
      }
      const frontendUrl = process.env.FRONTEND_URL;
      if (frontendUrl && origin.startsWith(frontendUrl.replace(/\/$/, ""))) {
        return callback(null, true);
      }
      callback(null, true); // Allow all for now during debugging
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: "vercel",
    config: {
      mongoUri: process.env.MONGODB_URI ? "configured" : "MISSING",
      jwtSecret: process.env.JWT_SECRET ? "configured" : "MISSING",
      frontendUrl: process.env.FRONTEND_URL || "not set",
    },
  });
});

// Lazy load routes to avoid import issues
let authRouter: express.Router | null = null;
let routesLoaded = false;

const loadRoutes = async () => {
  if (routesLoaded) return;

  try {
    // Dynamically import auth router
    const authModule = await import("../server/routes/auth");
    authRouter = authModule.default;

    if (authRouter) {
      app.use("/api/auth", authRouter);
    }

    routesLoaded = true;
    console.log("Routes loaded successfully");
  } catch (error) {
    console.error("Failed to load routes:", error);
  }
};

// Fallback route
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
    routesLoaded,
  });
});

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Server error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
);

// Vercel handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await loadRoutes();
  return app(req as any, res as any);
}

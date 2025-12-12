/**
 * Vercel Serverless API Entry Point
 *
 * This file wraps the Express application for Vercel serverless deployment.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";

// Import routes
import authRouter from "../server/routes/auth";
import imagesRouter from "../server/routes/images";
import videosRouter from "../server/routes/videos";
import generateVideoRouter from "../server/routes/generate-video";
import renderVideoRouter from "../server/routes/render-video";

// Import middleware
import { authMiddleware, apiLimiter } from "../server/middleware";
import {
  connectDB,
  ensureUserIndexes,
  ensurePasswordResetIndexes,
} from "../server/models";

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// CORS - allow all vercel.app domains and configured frontend
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, postman, etc.)
      if (!origin) return callback(null, true);

      // Allow all vercel.app domains (including preview deployments)
      if (origin.includes("vercel.app")) {
        return callback(null, true);
      }

      // Allow configured frontend URL
      const frontendUrl = process.env.FRONTEND_URL;
      if (frontendUrl && origin.startsWith(frontendUrl.replace(/\/$/, ""))) {
        return callback(null, true);
      }

      // Allow localhost for development
      if (origin.includes("localhost")) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Cookie parser
app.use(cookieParser());

// Request size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Database connection (cached for serverless - uses global to persist across invocations)
let dbConnected = false;

const ensureDbConnection = async () => {
  if (!dbConnected && process.env.MONGODB_URI) {
    try {
      await connectDB();
      await ensureUserIndexes();
      await ensurePasswordResetIndexes();
      dbConnected = true;
      console.log("MongoDB connected successfully");
    } catch (error) {
      console.error("Database connection failed:", error);
      throw error; // Re-throw to let the caller know
    }
  }
};

// Middleware to ensure DB connection on every request
app.use(async (_req, _res, next) => {
  try {
    await ensureDbConnection();
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Routes
// ============================================================

// Health check
app.get("/api/health", async (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? "vercel" : "local",
    dbConnected: dbConnected,
    mongoUri: process.env.MONGODB_URI ? "configured" : "missing",
  });
});

// Auth routes (public)
app.use("/api/auth", authRouter);

// Protected routes
app.use("/api/images", authMiddleware, apiLimiter, imagesRouter);
app.use("/api/videos", authMiddleware, apiLimiter, videosRouter);
app.use("/api/generate-video", authMiddleware, apiLimiter, generateVideoRouter);
app.use("/api/render-video", authMiddleware, apiLimiter, renderVideoRouter);

// 404 handler for unmatched API routes
app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Error handling
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
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    });
  }
);

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}

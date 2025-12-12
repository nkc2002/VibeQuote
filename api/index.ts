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

// Get allowed origins from environment
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  "https://vibe-quote.vercel.app",
].filter(Boolean) as string[];

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// CORS with credentials
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.some((allowed) =>
          origin.startsWith(allowed.replace(/\/$/, ""))
        )
      ) {
        return callback(null, true);
      }

      // In production, be more permissive for Vercel preview deployments
      if (origin.includes("vercel.app")) {
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

// Database connection (cached for serverless)
let dbConnected = false;

const ensureDbConnection = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      await ensureUserIndexes();
      await ensurePasswordResetIndexes();
      dbConnected = true;
    } catch (error) {
      console.error("Database connection failed:", error);
    }
  }
};

// ============================================================
// Routes
// ============================================================

// Health check
app.get("/api/health", async (_req, res) => {
  await ensureDbConnection();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? "vercel" : "local",
  });
});

// Auth routes (public)
app.use("/api/auth", authRouter);

// Protected routes
app.use("/api/images", authMiddleware, apiLimiter, imagesRouter);
app.use("/api/videos", authMiddleware, apiLimiter, videosRouter);
app.use("/api/generate-video", authMiddleware, apiLimiter, generateVideoRouter);
app.use("/api/render-video", authMiddleware, apiLimiter, renderVideoRouter);

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
  await ensureDbConnection();
  return app(req as any, res as any);
}

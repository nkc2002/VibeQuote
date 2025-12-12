/**
 * Express.js Server Entry Point
 *
 * Full authentication backend with:
 * - JWT in httpOnly cookies (SameSite=Lax)
 * - bcrypt password hashing (saltRounds=12)
 * - Rate limiting, helmet, CORS
 * - MongoDB Atlas
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";

// Routes
import authRouter from "./routes/auth";
import imagesRouter from "./routes/images";
import videosRouter from "./routes/videos";
import generateVideoRouter from "./routes/generate-video";
import renderVideoRouter from "./routes/render-video";

// Models & Middleware
import {
  connectDB,
  closeDB,
  ensureUserIndexes,
  ensurePasswordResetIndexes,
} from "./models";
import { authMiddleware, apiLimiter } from "./middleware";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for development
  })
);

// CORS with credentials for httpOnly cookies
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Cookie parser
app.use(cookieParser());

// Request size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Static files (for fonts)
app.use("/public", express.static("public"));

// ============================================================
// Public Routes (no auth required)
// ============================================================
app.use("/api/auth", authRouter);

// Health check
app.get("/api/health", async (_req, res) => {
  const mongoConnected = await connectDB()
    .then(() => true)
    .catch(() => false);

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoConnected,
      unsplash: !!process.env.UNSPLASH_ACCESS_KEY,
      s3: !!(process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID),
      ffmpeg: !!process.env.FFMPEG_URL || "system",
    },
  });
});

// ============================================================
// Protected Routes (auth required)
// ============================================================

// Images API - protected
app.use("/api/images", authMiddleware, apiLimiter, imagesRouter);

// Videos CRUD - protected
app.use("/api/videos", authMiddleware, apiLimiter, videosRouter);

// Video generation - protected
app.use("/api/generate-video", authMiddleware, apiLimiter, generateVideoRouter);

// New precise video rendering endpoint - protected
app.use("/api/render-video", authMiddleware, apiLimiter, renderVideoRouter);

// ============================================================
// Error Handling
// ============================================================
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

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down...");
  await closeDB();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start server
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔗 CORS origin: ${FRONTEND_URL}`);

    // Connect to MongoDB and ensure indexes
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        await ensureUserIndexes();
        await ensurePasswordResetIndexes();
        console.log("🍃 MongoDB: ✓ Connected");
      } catch (err) {
        console.log("🍃 MongoDB: ✗ Failed to connect");
      }
    } else {
      console.log("🍃 MongoDB: ✗ NOT CONFIGURED");
    }

    console.log(
      `📸 Unsplash API: ${
        process.env.UNSPLASH_ACCESS_KEY ? "✓ Configured" : "✗ NOT CONFIGURED"
      }`
    );
    console.log(
      `🎬 FFmpeg: ${
        process.env.FFMPEG_URL ? "✓ Will download" : "Using system"
      }`
    );
    console.log(
      `☁️  S3: ${
        process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID
          ? `✓ Configured (${process.env.S3_BUCKET})`
          : "✗ NOT CONFIGURED (videos will be streamed only)"
      }`
    );
  });
}

export default app;

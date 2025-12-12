/**
 * Vercel Serverless API Entry Point
 *
 * This handles all /api/* routes for the VibeQuote application.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { MongoClient, Db, ObjectId } from "mongodb";
import Joi from "joi";

const app = express();

// ============================================================
// MongoDB Setup (inline for Vercel)
// ============================================================
let client: MongoClient | null = null;
let db: Db | null = null;

const connectDB = async (): Promise<Db> => {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI not configured");
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  console.log("[MongoDB] Connected to:", db.databaseName);
  return db;
};

// ============================================================
// Auth Constants
// ============================================================
const JWT_SECRET = process.env.JWT_SECRET || "vibequote-secret";
const COOKIE_NAME = "vibequote_token";
const SALT_ROUNDS = 12;

const getCookieOptions = (remember: boolean) => ({
  httpOnly: true,
  secure: true, // Always secure on Vercel
  sameSite: "none" as const, // Cross-site cookies
  maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  path: "/",
});

// ============================================================
// Validation Schemas
// ============================================================
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    "string.min": "Tên phải có ít nhất 2 ký tự",
    "string.max": "Tên không được quá 50 ký tự",
    "any.required": "Vui lòng nhập tên",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Email không hợp lệ",
    "any.required": "Vui lòng nhập email",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
    "any.required": "Vui lòng nhập mật khẩu",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  remember: Joi.boolean().default(false),
});

// ============================================================
// Middleware
// ============================================================
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
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ============================================================
// Routes
// ============================================================

// Health check
app.get("/api/health", async (_req, res) => {
  let dbStatus = "not tested";
  try {
    const database = await connectDB();
    dbStatus = "connected to " + database.databaseName;
  } catch (err) {
    dbStatus = "failed: " + (err as Error).message;
  }

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    db: dbStatus,
    config: {
      mongoUri: process.env.MONGODB_URI ? "configured" : "MISSING",
      jwtSecret: process.env.JWT_SECRET ? "configured" : "MISSING",
    },
  });
});

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    const { name, email, password } = value;
    const database = await connectDB();
    const users = database.collection("users");

    // Check if user exists
    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        error: "Email exists",
        message: "Email đã được sử dụng",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await users.insertOne({
      name,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date(),
    });

    const userId = result.insertedId.toString();

    // Generate token
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie(COOKIE_NAME, token, getCookieOptions(true));

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      user: {
        id: userId,
        name,
        email: email.toLowerCase(),
      },
    });
  } catch (error) {
    console.error("[Auth] Register error:", error);
    res.status(500).json({
      error: "Registration failed",
      message: "Đăng ký thất bại: " + (error as Error).message,
    });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    const { email, password, remember } = value;
    const database = await connectDB();
    const users = database.collection("users");

    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const userId = user._id.toString();
    const token = jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: remember ? "7d" : "1d",
    });
    res.cookie(COOKIE_NAME, token, getCookieOptions(remember));

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      user: {
        id: userId,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    res.status(500).json({
      error: "Login failed",
      message: "Đăng nhập thất bại",
    });
  }
});

// Get current user
app.get("/api/auth/me", async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({
        error: "Not authenticated",
        message: "Vui lòng đăng nhập",
      });
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
      res.clearCookie(COOKIE_NAME, { path: "/" });
      return res.status(401).json({
        error: "Invalid token",
        message: "Phiên đăng nhập hết hạn",
      });
    }

    const database = await connectDB();
    const users = database.collection("users");
    const user = await users.findOne({ _id: new ObjectId(decoded.userId) });

    if (!user) {
      res.clearCookie(COOKIE_NAME, { path: "/" });
      return res.status(401).json({
        error: "User not found",
        message: "Người dùng không tồn tại",
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[Auth] Me error:", error);
    res.status(500).json({
      error: "Auth check failed",
      message: "Kiểm tra đăng nhập thất bại",
    });
  }
});

// Logout
app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({
    success: true,
    message: "Đăng xuất thành công",
  });
});

// ============================================================
// Images API (Unsplash)
// ============================================================

// Auth middleware for images
const requireAuth = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Search images
app.get("/api/images/search", requireAuth, async (req, res) => {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return res.status(500).json({
        error: "Image search service not configured",
        message: "UNSPLASH_ACCESS_KEY is missing",
      });
    }

    const query = String(req.query.q || req.query.query || "")
      .trim()
      .substring(0, 100);
    const page = Math.max(
      1,
      Math.min(100, parseInt(String(req.query.page)) || 1)
    );
    const perPage = Math.max(
      1,
      Math.min(30, parseInt(String(req.query.per_page)) || 20)
    );
    const orientation = String(req.query.orientation || "");
    const color = String(req.query.color || "");

    if (!query) {
      return res.status(400).json({
        error: "Missing search query",
        message: "Please provide a search query",
      });
    }

    const unsplashUrl = new URL("https://api.unsplash.com/search/photos");
    unsplashUrl.searchParams.set("query", query);
    unsplashUrl.searchParams.set("page", page.toString());
    unsplashUrl.searchParams.set("per_page", perPage.toString());

    if (
      orientation &&
      ["landscape", "portrait", "squarish"].includes(orientation)
    ) {
      unsplashUrl.searchParams.set("orientation", orientation);
    }
    if (color) {
      unsplashUrl.searchParams.set("color", color);
    }

    const response = await fetch(unsplashUrl.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    });

    if (response.status === 429) {
      return res.status(429).json({
        error: "Too many requests",
        message: "Rate limited. Please try again later.",
      });
    }

    if (!response.ok) {
      console.error("Unsplash API error:", response.status);
      return res.status(502).json({
        error: "Image search failed",
        message: "Unable to fetch images",
      });
    }

    const data = await response.json();

    // Transform to our format
    const results = data.results.map((photo: any) => ({
      id: photo.id,
      urls: photo.urls,
      width: photo.width || 1920,
      height: photo.height || 1080,
      color: photo.color || "#000000",
      blur_hash: photo.blur_hash || "",
      description: photo.description || null,
      alt_description: photo.alt_description || null,
      user: {
        name: photo.user.name,
        username: photo.user.username,
        profile_image: photo.user.profile_image || { small: "" },
        links: photo.user.links,
      },
      links: {
        html: photo.links?.html || "",
        download: photo.links?.download_location || "",
      },
    }));

    res.json({
      results,
      total: data.total,
      total_pages: data.total_pages,
    });
  } catch (error) {
    console.error("Image search error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Image search failed",
    });
  }
});

// Random image
app.get("/api/images/random", requireAuth, async (req, res) => {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return res
        .status(500)
        .json({ error: "Image search service not configured" });
    }

    const query = String(req.query.query || "").trim();
    const unsplashUrl = new URL("https://api.unsplash.com/photos/random");

    if (query) {
      unsplashUrl.searchParams.set("query", query);
    }
    unsplashUrl.searchParams.set("orientation", "landscape");

    const response = await fetch(unsplashUrl.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch random image" });
    }

    const photo: any = await response.json();

    res.json({
      id: photo.id,
      urls: photo.urls,
      width: photo.width || 1920,
      height: photo.height || 1080,
      color: photo.color || "#000000",
      blur_hash: photo.blur_hash || "",
      description: photo.description || null,
      alt_description: photo.alt_description || null,
      user: {
        name: photo.user.name,
        username: photo.user.username,
        profile_image: photo.user.profile_image || { small: "" },
        links: photo.user.links,
      },
      links: {
        html: photo.links?.html || "",
        download: photo.links?.download_location || "",
      },
    });
  } catch (error) {
    console.error("Random image error:", error);
    res.status(500).json({ error: "Failed to fetch random image" });
  }
});

// 404 handler
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
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
  return app(req as any, res as any);
}

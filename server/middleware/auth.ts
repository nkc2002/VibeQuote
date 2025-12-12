/**
 * Authentication Middleware
 *
 * Verifies JWT from httpOnly cookie and attaches user to req.
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { findUserById, toUserPublic, UserPublic } from "../models/user";

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: UserPublic;
      userId?: string;
    }
  }
}

const JWT_SECRET =
  process.env.JWT_SECRET || "vibequote-secret-change-in-production";
const COOKIE_NAME = "vibequote_token";

export interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * Auth middleware - verifies JWT and attaches user to request
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Vui lòng đăng nhập",
      });
      return;
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (err) {
      res.clearCookie(COOKIE_NAME, { path: "/" });
      res.status(401).json({
        error: "Invalid token",
        message: "Phiên đăng nhập hết hạn",
      });
      return;
    }

    const user = await findUserById(decoded.userId);

    if (!user) {
      res.clearCookie(COOKIE_NAME, { path: "/" });
      res.status(401).json({
        error: "User not found",
        message: "Người dùng không tồn tại",
      });
      return;
    }

    req.user = toUserPublic(user);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("[Auth] Middleware error:", error);
    res.status(500).json({
      error: "Auth error",
      message: "Lỗi xác thực",
    });
  }
};

/**
 * Optional auth - attaches user if token exists, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        const user = await findUserById(decoded.userId);
        if (user) {
          req.user = toUserPublic(user);
          req.userId = decoded.userId;
        }
      } catch {
        // Invalid token, clear it but continue
        res.clearCookie(COOKIE_NAME, { path: "/" });
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export default authMiddleware;

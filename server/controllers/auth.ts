/**
 * Auth Controller
 *
 * Handles register, login, logout, me, forgot, reset
 */

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByEmail,
  findUserById,
  toUserPublic,
  updateUserPassword,
} from "../models/user";
import {
  createPasswordReset,
  findPasswordReset,
  markResetAsUsed,
} from "../models/password-reset";
import {
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
} from "../validators/auth";
import { sendPasswordResetEmail } from "../services/email";

// Constants
const JWT_SECRET =
  process.env.JWT_SECRET || "vibequote-secret-change-in-production";
const COOKIE_NAME = "vibequote_token";
const SALT_ROUNDS = 12;

// Cookie options
const getCookieOptions = (remember: boolean) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 7 days or 1 day
  path: "/",
});

/**
 * Generate JWT token
 */
const generateToken = (userId: string, remember: boolean): string => {
  const expiresIn = remember ? "7d" : "1d";
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
};

/**
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        message: error.details.map((d) => d.message).join(", "),
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    const { name, email, password } = value;

    // Check if user exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        error: "Email exists",
        message: "Email đã được sử dụng",
      });
    }

    // Hash password with bcrypt (saltRounds = 12)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await createUser(name, email, passwordHash);
    const userPublic = toUserPublic(user);

    // Generate token and set cookie (auto-login after register)
    const token = generateToken(userPublic.id, true);
    res.cookie(COOKIE_NAME, token, getCookieOptions(true));

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      user: userPublic,
    });
  } catch (error) {
    console.error("[Auth] Register error:", error);
    res.status(500).json({
      error: "Registration failed",
      message: "Đăng ký thất bại, vui lòng thử lại",
    });
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    // Validate input
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

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const userPublic = toUserPublic(user);

    // Generate token and set cookie
    const token = generateToken(userPublic.id, remember);
    res.cookie(COOKIE_NAME, token, getCookieOptions(remember));

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      user: userPublic,
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    res.status(500).json({
      error: "Login failed",
      message: "Đăng nhập thất bại, vui lòng thử lại",
    });
  }
};

/**
 * GET /api/auth/me
 */
export const me = async (req: Request, res: Response) => {
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

    const user = await findUserById(decoded.userId);
    if (!user) {
      res.clearCookie(COOKIE_NAME, { path: "/" });
      return res.status(401).json({
        error: "User not found",
        message: "Người dùng không tồn tại",
      });
    }

    res.json({
      success: true,
      user: toUserPublic(user),
    });
  } catch (error) {
    console.error("[Auth] Me error:", error);
    res.status(500).json({
      error: "Auth check failed",
      message: "Kiểm tra đăng nhập thất bại",
    });
  }
};

/**
 * POST /api/auth/logout
 */
export const logout = (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({
    success: true,
    message: "Đăng xuất thành công",
  });
};

/**
 * POST /api/auth/forgot
 */
export const forgot = async (req: Request, res: Response) => {
  try {
    // Validate input
    const { error, value } = forgotSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    const { email } = value;

    // Always return success to avoid user enumeration
    const successResponse = {
      success: true,
      message: "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu",
    };

    // Find user (but don't reveal if exists)
    const user = await findUserByEmail(email);
    if (!user) {
      return res.json(successResponse);
    }

    // Create reset token
    const resetToken = await createPasswordReset(user._id!.toString());

    // Send email
    const emailResult = await sendPasswordResetEmail(
      email,
      resetToken,
      user.name
    );

    // In development, include preview URL
    if (process.env.NODE_ENV !== "production" && emailResult.previewUrl) {
      return res.json({
        ...successResponse,
        _dev_preview_url: emailResult.previewUrl,
      });
    }

    res.json(successResponse);
  } catch (error) {
    console.error("[Auth] Forgot password error:", error);
    res.status(500).json({
      error: "Request failed",
      message: "Yêu cầu thất bại, vui lòng thử lại",
    });
  }
};

/**
 * POST /api/auth/reset
 */
export const reset = async (req: Request, res: Response) => {
  try {
    // Validate input
    const { error, value } = resetSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    const { token, newPassword } = value;

    // Find valid reset token
    const resetRecord = await findPasswordReset(token);
    if (!resetRecord) {
      return res.status(400).json({
        error: "Invalid token",
        message: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user password
    const updated = await updateUserPassword(
      resetRecord.userId.toString(),
      passwordHash
    );

    if (!updated) {
      return res.status(500).json({
        error: "Update failed",
        message: "Không thể cập nhật mật khẩu",
      });
    }

    // Mark token as used
    await markResetAsUsed(token);

    res.json({
      success: true,
      message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
    });
  } catch (error) {
    console.error("[Auth] Reset password error:", error);
    res.status(500).json({
      error: "Reset failed",
      message: "Đặt lại mật khẩu thất bại, vui lòng thử lại",
    });
  }
};

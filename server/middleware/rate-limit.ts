/**
 * Rate Limiting Middleware
 */

import rateLimit from "express-rate-limit";

/**
 * Rate limiter for auth endpoints (login, register, forgot)
 * 5 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: "Too many requests",
    message: "Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter for API endpoints
 * 100 requests per minute
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: "Too many requests",
    message: "Quá nhiều yêu cầu, vui lòng thử lại sau",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for password reset
 * 3 attempts per hour
 */
export const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: "Too many requests",
    message: "Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

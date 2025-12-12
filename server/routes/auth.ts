/**
 * Auth Routes
 *
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/me
 * POST /api/auth/logout
 * POST /api/auth/forgot
 * POST /api/auth/reset
 */

import { Router } from "express";
import * as authController from "../controllers/auth";
import { authLimiter, resetLimiter } from "../middleware";

const router = Router();

// Register - rate limited
router.post("/register", authLimiter, authController.register);

// Login - rate limited
router.post("/login", authLimiter, authController.login);

// Get current user
router.get("/me", authController.me);

// Logout
router.post("/logout", authController.logout);

// Forgot password - stricter rate limit
router.post("/forgot", resetLimiter, authController.forgot);

// Reset password
router.post("/reset", authController.reset);

export default router;

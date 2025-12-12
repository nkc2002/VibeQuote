/**
 * Vercel Serverless API Entry Point
 * Simplified version for debugging
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const url = req.url || "";

  // Health check endpoint
  if (url.includes("/api/health")) {
    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: "vercel",
      config: {
        mongoUri: process.env.MONGODB_URI ? "configured" : "MISSING",
        jwtSecret: process.env.JWT_SECRET ? "configured" : "MISSING",
        frontendUrl: process.env.FRONTEND_URL || "not set",
      },
      path: url,
    });
  }

  // For now, return info about the request for debugging
  return res.status(200).json({
    message: "API is working",
    path: url,
    method: req.method,
    note: "Full API routes are being configured",
  });
}

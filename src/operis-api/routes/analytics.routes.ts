/**
 * Analytics Routes
 * Token usage analytics and statistics endpoints
 */

import { Router } from "express";
import {
  getUserUsage,
  getUserDaily,
  getUserRange,
  getUserHistory,
  getAdminOverview,
  getAdminDaily,
  getAdminRange,
  getAdminUserStats,
  getAdminHistory,
} from "../controllers/analytics.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";

export const analyticsRoutes = Router();

// All analytics endpoints require authentication
analyticsRoutes.use(authMiddleware);

// User endpoints
analyticsRoutes.get("/usage", getUserUsage);
analyticsRoutes.get("/usage/daily", getUserDaily);
analyticsRoutes.get("/usage/range", getUserRange);
analyticsRoutes.get("/usage/history", getUserHistory);

// Admin endpoints
analyticsRoutes.get("/admin/overview", adminMiddleware, getAdminOverview);
analyticsRoutes.get("/admin/daily", adminMiddleware, getAdminDaily);
analyticsRoutes.get("/admin/range", adminMiddleware, getAdminRange);
analyticsRoutes.get("/admin/users/:userId", adminMiddleware, getAdminUserStats);
analyticsRoutes.get("/admin/history", adminMiddleware, getAdminHistory);

export default analyticsRoutes;

/**
 * Cron Routes
 * REST API endpoints for cron job management
 *
 * All routes require admin authentication.
 * These endpoints proxy to the Gateway's WebSocket-based cron scheduler.
 *
 * Endpoints:
 *   GET    /cron/status      - Get scheduler status
 *   GET    /cron             - List all jobs
 *   POST   /cron             - Create new job
 *   GET    /cron/:id         - Get job by ID
 *   PATCH  /cron/:id         - Update job
 *   DELETE /cron/:id         - Delete job
 *   POST   /cron/:id/run     - Run job manually
 *   GET    /cron/:id/runs    - Get run history
 *   POST   /cron/:id/enable  - Enable job
 *   POST   /cron/:id/disable - Disable job
 */

import { Router } from "express";
import { cronController } from "../controllers/cron.controller.js";
import { authMiddleware, adminMiddleware, asyncHandler } from "../middleware/index.js";

const router = Router();

// All cron routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

// Scheduler status
router.get(
  "/status",
  asyncHandler((req, res) => cronController.getStatus(req, res)),
);

// List all jobs
router.get(
  "/",
  asyncHandler((req, res) => cronController.list(req, res)),
);

// Create new job
router.post(
  "/",
  asyncHandler((req, res) => cronController.create(req, res)),
);

// Get job by ID
router.get(
  "/:id",
  asyncHandler((req, res) => cronController.getById(req, res)),
);

// Update job
router.patch(
  "/:id",
  asyncHandler((req, res) => cronController.update(req, res)),
);

// Delete job
router.delete(
  "/:id",
  asyncHandler((req, res) => cronController.remove(req, res)),
);

// Run job manually
router.post(
  "/:id/run",
  asyncHandler((req, res) => cronController.run(req, res)),
);

// Get run history
router.get(
  "/:id/runs",
  asyncHandler((req, res) => cronController.getRuns(req, res)),
);

// Enable job
router.post(
  "/:id/enable",
  asyncHandler((req, res) => cronController.enable(req, res)),
);

// Disable job
router.post(
  "/:id/disable",
  asyncHandler((req, res) => cronController.disable(req, res)),
);

export default router;

/**
 * Cron Controller
 * Handles HTTP requests for cron job management
 *
 * This controller provides a REST API interface to the Gateway's cron
 * scheduler. All operations require admin authentication.
 */

import type { Request, Response } from "express";
import { cronService } from "../services/cron.service.js";
import type { CronJobCreate, CronJobPatch } from "../services/cron.service.js";
import { Errors } from "../core/errors/api-error.js";

/**
 * Extract string param from request (handles string | string[])
 */
function getParamString(param: unknown): string {
  if (typeof param === "string") return param;
  if (Array.isArray(param) && typeof param[0] === "string") return param[0];
  return "";
}

/**
 * Validate cron schedule object
 */
function validateSchedule(schedule: unknown): boolean {
  if (!schedule || typeof schedule !== "object") return false;
  const s = schedule as Record<string, unknown>;

  if (s.kind === "at") {
    return typeof s.atMs === "number" && s.atMs >= 0;
  }
  if (s.kind === "every") {
    return typeof s.everyMs === "number" && s.everyMs >= 1;
  }
  if (s.kind === "cron") {
    return typeof s.expr === "string" && s.expr.trim().length > 0;
  }
  return false;
}

/**
 * Validate cron payload object
 */
function validatePayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;

  if (p.kind === "systemEvent") {
    return typeof p.text === "string" && p.text.trim().length > 0;
  }
  if (p.kind === "agentTurn") {
    return typeof p.message === "string" && p.message.trim().length > 0;
  }
  return false;
}

class CronController {
  /**
   * GET /cron/status
   * Get cron scheduler status
   */
  async getStatus(_req: Request, res: Response): Promise<void> {
    const status = await cronService.status();
    res.json(status);
  }

  /**
   * GET /cron
   * List all cron jobs
   * Query params:
   *   - all: boolean - Include disabled jobs
   */
  async list(req: Request, res: Response): Promise<void> {
    const includeDisabled = req.query.all === "true" || req.query.all === "1";
    const jobs = await cronService.list(includeDisabled);
    res.json({ jobs, total: jobs.length });
  }

  /**
   * GET /cron/:id
   * Get a single cron job by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    const id = getParamString(req.params.id);

    if (!id) {
      throw Errors.validation("Job ID is required");
    }

    const job = await cronService.getById(id);
    if (!job) {
      throw Errors.notFound("Cron job not found");
    }

    res.json(job);
  }

  /**
   * POST /cron
   * Create a new cron job
   *
   * Required fields:
   *   - name: string
   *   - schedule: { kind: "at"|"every"|"cron", ... }
   *   - sessionTarget: "main"|"isolated"
   *   - wakeMode: "now"|"next-heartbeat"
   *   - payload: { kind: "systemEvent"|"agentTurn", ... }
   *
   * Optional fields:
   *   - description: string
   *   - enabled: boolean (default: true)
   *   - deleteAfterRun: boolean (default: false)
   *   - agentId: string
   *   - isolation: { postToMainPrefix, postToMainMode, postToMainMaxChars }
   */
  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as Record<string, unknown>;

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      throw Errors.validation("name is required");
    }

    if (!validateSchedule(body.schedule)) {
      throw Errors.validation(
        "schedule is required and must be { kind: 'at'|'every'|'cron', ... }",
      );
    }

    if (!body.sessionTarget || !["main", "isolated"].includes(body.sessionTarget as string)) {
      throw Errors.validation("sessionTarget must be 'main' or 'isolated'");
    }

    if (!body.wakeMode || !["now", "next-heartbeat"].includes(body.wakeMode as string)) {
      throw Errors.validation("wakeMode must be 'now' or 'next-heartbeat'");
    }

    if (!validatePayload(body.payload)) {
      throw Errors.validation(
        "payload is required and must be { kind: 'systemEvent'|'agentTurn', ... }",
      );
    }

    // Validate session/payload consistency
    if (body.sessionTarget === "main") {
      const p = body.payload as Record<string, unknown>;
      if (p.kind !== "systemEvent") {
        throw Errors.validation("Main session jobs require systemEvent payload");
      }
    }
    if (body.sessionTarget === "isolated") {
      const p = body.payload as Record<string, unknown>;
      if (p.kind !== "agentTurn") {
        throw Errors.validation("Isolated session jobs require agentTurn payload");
      }
    }

    const data: CronJobCreate = {
      name: (body.name as string).trim(),
      description:
        typeof body.description === "string" ? body.description.trim() || undefined : undefined,
      enabled: body.enabled !== false,
      deleteAfterRun: body.deleteAfterRun === true,
      agentId:
        typeof body.agentId === "string" && body.agentId.trim() ? body.agentId.trim() : undefined,
      schedule: body.schedule as CronJobCreate["schedule"],
      sessionTarget: body.sessionTarget as CronJobCreate["sessionTarget"],
      wakeMode: body.wakeMode as CronJobCreate["wakeMode"],
      payload: body.payload as CronJobCreate["payload"],
      isolation:
        body.isolation && typeof body.isolation === "object"
          ? (body.isolation as CronJobCreate["isolation"])
          : undefined,
    };

    const job = await cronService.create(data);
    res.status(201).json(job);
  }

  /**
   * PATCH /cron/:id
   * Update an existing cron job
   *
   * All fields are optional:
   *   - name, description, enabled, deleteAfterRun
   *   - agentId, schedule, sessionTarget, wakeMode
   *   - payload, isolation
   */
  async update(req: Request, res: Response): Promise<void> {
    const id = getParamString(req.params.id);
    const body = req.body as Record<string, unknown>;

    if (!id) {
      throw Errors.validation("Job ID is required");
    }

    // Build patch object with only provided fields
    const patch: CronJobPatch = {};

    if (typeof body.name === "string" && body.name.trim()) {
      patch.name = body.name.trim();
    }
    if (typeof body.description === "string") {
      patch.description = body.description.trim() || undefined;
    }
    if (typeof body.enabled === "boolean") {
      patch.enabled = body.enabled;
    }
    if (typeof body.deleteAfterRun === "boolean") {
      patch.deleteAfterRun = body.deleteAfterRun;
    }
    if (body.agentId !== undefined) {
      patch.agentId =
        typeof body.agentId === "string" && body.agentId.trim() ? body.agentId.trim() : undefined;
    }
    if (body.schedule && validateSchedule(body.schedule)) {
      patch.schedule = body.schedule as CronJobPatch["schedule"];
    }
    if (body.sessionTarget && ["main", "isolated"].includes(body.sessionTarget as string)) {
      patch.sessionTarget = body.sessionTarget as CronJobPatch["sessionTarget"];
    }
    if (body.wakeMode && ["now", "next-heartbeat"].includes(body.wakeMode as string)) {
      patch.wakeMode = body.wakeMode as CronJobPatch["wakeMode"];
    }
    if (body.payload && typeof body.payload === "object") {
      patch.payload = body.payload as CronJobPatch["payload"];
    }
    if (body.isolation && typeof body.isolation === "object") {
      patch.isolation = body.isolation as CronJobPatch["isolation"];
    }

    if (Object.keys(patch).length === 0) {
      throw Errors.validation("No valid fields to update");
    }

    const job = await cronService.update(id, patch);
    res.json(job);
  }

  /**
   * DELETE /cron/:id
   * Delete a cron job
   */
  async remove(req: Request, res: Response): Promise<void> {
    const id = getParamString(req.params.id);

    if (!id) {
      throw Errors.validation("Job ID is required");
    }

    const result = await cronService.remove(id);
    res.json(result);
  }

  /**
   * POST /cron/:id/run
   * Manually run a cron job
   *
   * Body params:
   *   - mode: "due"|"force" (default: "force")
   */
  async run(req: Request, res: Response): Promise<void> {
    const id = getParamString(req.params.id);
    const body = req.body as Record<string, unknown>;

    if (!id) {
      throw Errors.validation("Job ID is required");
    }

    const mode = body.mode === "due" || body.mode === "force" ? body.mode : "force";

    const result = await cronService.run(id, mode);
    res.json(result);
  }

  /**
   * GET /cron/:id/runs
   * Get run history for a cron job
   *
   * Query params:
   *   - limit: number (default: 100, max: 5000)
   */
  async getRuns(req: Request, res: Response): Promise<void> {
    const id = getParamString(req.params.id);

    if (!id) {
      throw Errors.validation("Job ID is required");
    }

    const limitRaw = parseInt(String(req.query.limit ?? "100"), 10);
    const limit = Math.min(Math.max(1, limitRaw || 100), 5000);

    const entries = await cronService.getRuns(id, limit);
    res.json({ entries, total: entries.length });
  }

  /**
   * POST /cron/:id/enable
   * Enable a cron job
   */
  async enable(req: Request, res: Response): Promise<void> {
    const id = getParamString(req.params.id);

    if (!id) {
      throw Errors.validation("Job ID is required");
    }

    const job = await cronService.enable(id);
    res.json(job);
  }

  /**
   * POST /cron/:id/disable
   * Disable a cron job
   */
  async disable(req: Request, res: Response): Promise<void> {
    const id = getParamString(req.params.id);

    if (!id) {
      throw Errors.validation("Job ID is required");
    }

    const job = await cronService.disable(id);
    res.json(job);
  }
}

export const cronController = new CronController();

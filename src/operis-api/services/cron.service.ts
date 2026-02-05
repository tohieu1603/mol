/**
 * Cron Service
 * Proxy to Gateway WebSocket RPC for cron job management
 *
 * This service acts as a bridge between the REST API and the Gateway's
 * WebSocket-based cron functionality. All cron operations are forwarded
 * to the Gateway which manages the actual cron scheduler.
 */

import { callGateway } from "../../gateway/call.js";
import type { CronJob, CronJobCreate, CronJobPatch, CronJobState } from "../../cron/types.js";

// Re-export types for convenience
export type {
  CronJob,
  CronJobCreate,
  CronJobPatch,
  CronJobState,
  CronSchedule,
  CronPayload,
  CronPayloadPatch,
  CronIsolation,
  CronSessionTarget,
  CronWakeMode,
} from "../../cron/types.js";

/** Cron scheduler status response */
export type CronStatus = {
  enabled: boolean;
  running: boolean;
  jobCount: number;
  nextRunAtMs?: number;
};

/** Cron run log entry */
export type CronRunLogEntry = {
  ts: number;
  jobId: string;
  action: "finished";
  status?: "ok" | "error" | "skipped";
  error?: string;
  summary?: string;
  runAtMs?: number;
  durationMs?: number;
  nextRunAtMs?: number;
};

/** Gateway call timeout in milliseconds */
const GATEWAY_TIMEOUT_MS = 30_000;

/**
 * Call Gateway RPC method
 * Internal helper to standardize gateway calls
 */
async function callGatewayRpc<T>(method: string, params?: unknown): Promise<T> {
  return await callGateway<T>({
    method,
    params,
    timeoutMs: GATEWAY_TIMEOUT_MS,
  });
}

/**
 * Cron Service
 * Provides REST-compatible interface to Gateway cron functionality
 */
export const cronService = {
  /**
   * Get cron scheduler status
   * Returns overall status of the cron scheduler including job count
   */
  async status(): Promise<CronStatus> {
    const result = await callGatewayRpc<CronStatus>("cron.status", {});
    return result;
  },

  /**
   * List all cron jobs
   * @param includeDisabled - Include disabled jobs in the list (default: false)
   * @returns Array of cron jobs
   */
  async list(includeDisabled = false): Promise<CronJob[]> {
    const result = await callGatewayRpc<{ jobs: CronJob[] }>("cron.list", {
      includeDisabled,
    });
    return result.jobs ?? [];
  },

  /**
   * Get a single cron job by ID
   * @param id - Job ID
   * @returns Cron job or null if not found
   */
  async getById(id: string): Promise<CronJob | null> {
    const jobs = await this.list(true);
    return jobs.find((job) => job.id === id) ?? null;
  },

  /**
   * Create a new cron job
   * @param data - Job creation data
   * @returns Created cron job
   */
  async create(data: CronJobCreate): Promise<CronJob> {
    const result = await callGatewayRpc<CronJob>("cron.add", data);
    return result;
  },

  /**
   * Update an existing cron job
   * @param id - Job ID
   * @param patch - Partial job data to update
   * @returns Updated cron job
   */
  async update(id: string, patch: CronJobPatch): Promise<CronJob> {
    const result = await callGatewayRpc<CronJob>("cron.update", {
      id,
      patch,
    });
    return result;
  },

  /**
   * Delete a cron job
   * @param id - Job ID
   * @returns Success status
   */
  async remove(id: string): Promise<{ removed: boolean }> {
    const result = await callGatewayRpc<{ removed: boolean }>("cron.remove", {
      id,
    });
    return result;
  },

  /**
   * Manually run a cron job
   * @param id - Job ID
   * @param mode - Run mode: "due" (only if due) or "force" (run immediately)
   * @returns Run result
   */
  async run(
    id: string,
    mode: "due" | "force" = "force",
  ): Promise<{ triggered: boolean; reason?: string }> {
    const result = await callGatewayRpc<{ triggered: boolean; reason?: string }>("cron.run", {
      id,
      mode,
    });
    return result;
  },

  /**
   * Get run history for a cron job
   * @param id - Job ID
   * @param limit - Maximum number of entries to return (default: 100)
   * @returns Array of run log entries
   */
  async getRuns(id: string, limit = 100): Promise<CronRunLogEntry[]> {
    const result = await callGatewayRpc<{ entries: CronRunLogEntry[] }>("cron.runs", { id, limit });
    return result.entries ?? [];
  },

  /**
   * Enable a cron job
   * @param id - Job ID
   * @returns Updated cron job
   */
  async enable(id: string): Promise<CronJob> {
    return this.update(id, { enabled: true });
  },

  /**
   * Disable a cron job
   * @param id - Job ID
   * @returns Updated cron job
   */
  async disable(id: string): Promise<CronJob> {
    return this.update(id, { enabled: false });
  },
};

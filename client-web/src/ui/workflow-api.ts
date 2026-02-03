// Workflow API service - communicates with Gateway Cron RPC
import { API_CONFIG } from "../config";
import type { Workflow, WorkflowFormState } from "./workflow-types";
import { formToCronPayload, parseCronSchedule } from "./workflow-types";

type CronJob = {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  schedule?: { kind?: string; everyMs?: number; atMs?: number; expr?: string; tz?: string };
  payload?: { kind?: string; message?: string; event?: string; deliver?: boolean };
  sessionTarget?: "main" | "isolated";
  wakeMode?: "next-heartbeat" | "now";
  timeoutSec?: number;
  lastRunAtMs?: number;
  lastRunStatus?: string;
  nextRunAtMs?: number;
};

type RpcResponse<T> = T & { error?: string };

async function rpcRequest<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const url = `${API_CONFIG.baseUrl}/rpc`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_CONFIG.token}`,
    },
    body: JSON.stringify({ method, params }),
  });

  if (!response.ok) {
    throw new Error(`RPC error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as RpcResponse<T>;
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

function cronJobToWorkflow(job: CronJob): Workflow {
  const schedule = parseCronSchedule(job);
  const payloadKind = job.payload?.kind as Workflow["payloadKind"];
  return {
    id: job.id,
    name: job.name,
    description: job.description ?? "",
    schedule,
    prompt: job.payload?.message ?? job.payload?.event ?? "",
    notifyMe: job.payload?.deliver ?? false,
    enabled: job.enabled,
    sessionTarget: job.sessionTarget,
    wakeMode: job.wakeMode,
    payloadKind,
    timeout: job.timeoutSec,
    lastRunAt: job.lastRunAtMs,
    lastRunStatus: job.lastRunStatus as Workflow["lastRunStatus"],
    nextRunAt: job.nextRunAtMs,
  };
}

export async function listWorkflows(): Promise<Workflow[]> {
  try {
    const result = await rpcRequest<{ jobs?: CronJob[] }>("cron.list", { includeDisabled: true });
    const jobs = Array.isArray(result.jobs) ? result.jobs : [];
    return jobs.map(cronJobToWorkflow);
  } catch (error) {
    console.error("Failed to list workflows:", error);
    return [];
  }
}

export async function createWorkflow(form: WorkflowFormState): Promise<boolean> {
  try {
    const payload = formToCronPayload(form);
    await rpcRequest("cron.add", payload);
    return true;
  } catch (error) {
    console.error("Failed to create workflow:", error);
    throw error;
  }
}

export async function toggleWorkflow(id: string, enabled: boolean): Promise<boolean> {
  try {
    await rpcRequest("cron.update", { id, patch: { enabled } });
    return true;
  } catch (error) {
    console.error("Failed to toggle workflow:", error);
    throw error;
  }
}

export async function runWorkflow(id: string): Promise<boolean> {
  try {
    await rpcRequest("cron.run", { id, mode: "force" });
    return true;
  } catch (error) {
    console.error("Failed to run workflow:", error);
    throw error;
  }
}

export async function deleteWorkflow(id: string): Promise<boolean> {
  try {
    await rpcRequest("cron.remove", { id });
    return true;
  } catch (error) {
    console.error("Failed to delete workflow:", error);
    throw error;
  }
}

export type WorkflowRun = {
  ts: number;
  status: string;
  summary?: string;
  durationMs?: number;
  error?: string;
};

export async function getWorkflowRuns(id: string): Promise<WorkflowRun[]> {
  try {
    const result = await rpcRequest<{ entries?: WorkflowRun[] }>("cron.runs", { id, limit: 20 });
    return Array.isArray(result.entries) ? result.entries : [];
  } catch (error) {
    console.error("Failed to get workflow runs:", error);
    return [];
  }
}

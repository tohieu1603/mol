<<<<<<< HEAD
// Workflow API service - communicates with Gateway via WebSocket RPC
import { waitForConnection } from "./gateway-client";
=======
// Workflow API service - communicates with Gateway Cron RPC
import { API_CONFIG } from "../config";
>>>>>>> origin/main
import type { Workflow, WorkflowFormState } from "./workflow-types";
import { formToCronPayload, parseCronSchedule } from "./workflow-types";

type CronJob = {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  schedule?: { kind?: string; everyMs?: number; atMs?: number; expr?: string; tz?: string };
<<<<<<< HEAD
  payload?: { kind?: string; message?: string; text?: string; deliver?: boolean };
  sessionTarget?: "main" | "isolated";
  wakeMode?: "next-heartbeat" | "now";
  timeoutSec?: number;
  agentId?: string;
  createdAtMs?: number;
  updatedAtMs?: number;
  state?: {
    lastRunAtMs?: number;
    lastStatus?: string;
    nextRunAtMs?: number;
  };
};

=======
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

>>>>>>> origin/main
function cronJobToWorkflow(job: CronJob): Workflow {
  const schedule = parseCronSchedule(job);
  const payloadKind = job.payload?.kind as Workflow["payloadKind"];
  return {
    id: job.id,
    name: job.name,
    description: job.description ?? "",
    schedule,
<<<<<<< HEAD
    prompt: job.payload?.message ?? job.payload?.text ?? "",
=======
    prompt: job.payload?.message ?? job.payload?.event ?? "",
>>>>>>> origin/main
    notifyMe: job.payload?.deliver ?? false,
    enabled: job.enabled,
    sessionTarget: job.sessionTarget,
    wakeMode: job.wakeMode,
    payloadKind,
    timeout: job.timeoutSec,
<<<<<<< HEAD
    lastRunAt: job.state?.lastRunAtMs,
    lastRunStatus: job.state?.lastStatus as Workflow["lastRunStatus"],
    nextRunAt: job.state?.nextRunAtMs,
    createdAtMs: job.createdAtMs,
    updatedAtMs: job.updatedAtMs,
    agentId: job.agentId,
=======
    lastRunAt: job.lastRunAtMs,
    lastRunStatus: job.lastRunStatus as Workflow["lastRunStatus"],
    nextRunAt: job.nextRunAtMs,
>>>>>>> origin/main
  };
}

export async function listWorkflows(): Promise<Workflow[]> {
  try {
<<<<<<< HEAD
    const client = await waitForConnection();
    const result = await client.request<{ jobs?: CronJob[] }>("cron.list", { includeDisabled: true });
=======
    const result = await rpcRequest<{ jobs?: CronJob[] }>("cron.list", { includeDisabled: true });
>>>>>>> origin/main
    const jobs = Array.isArray(result.jobs) ? result.jobs : [];
    return jobs.map(cronJobToWorkflow);
  } catch (error) {
    console.error("Failed to list workflows:", error);
    return [];
  }
}

export async function createWorkflow(form: WorkflowFormState): Promise<boolean> {
  try {
<<<<<<< HEAD
    const client = await waitForConnection();
    const payload = formToCronPayload(form);
    await client.request("cron.add", payload);
=======
    const payload = formToCronPayload(form);
    await rpcRequest("cron.add", payload);
>>>>>>> origin/main
    return true;
  } catch (error) {
    console.error("Failed to create workflow:", error);
    throw error;
  }
}

export async function toggleWorkflow(id: string, enabled: boolean): Promise<boolean> {
  try {
<<<<<<< HEAD
    const client = await waitForConnection();
    await client.request("cron.update", { id, patch: { enabled } });
=======
    await rpcRequest("cron.update", { id, patch: { enabled } });
>>>>>>> origin/main
    return true;
  } catch (error) {
    console.error("Failed to toggle workflow:", error);
    throw error;
  }
}

export async function runWorkflow(id: string): Promise<boolean> {
  try {
<<<<<<< HEAD
    const client = await waitForConnection();
    await client.request("cron.run", { id, mode: "force" });
=======
    await rpcRequest("cron.run", { id, mode: "force" });
>>>>>>> origin/main
    return true;
  } catch (error) {
    console.error("Failed to run workflow:", error);
    throw error;
  }
}

export async function deleteWorkflow(id: string): Promise<boolean> {
  try {
<<<<<<< HEAD
    const client = await waitForConnection();
    await client.request("cron.remove", { id });
=======
    await rpcRequest("cron.remove", { id });
>>>>>>> origin/main
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

<<<<<<< HEAD
export type WorkflowStatus = {
  enabled: boolean;
  jobs: number;
  nextWakeAtMs?: number | null;
};

export async function getWorkflowStatus(): Promise<WorkflowStatus | null> {
  try {
    const client = await waitForConnection();
    const result = await client.request<WorkflowStatus>("cron.status", {});
    return result;
  } catch (error) {
    console.error("Failed to get workflow status:", error);
    return null;
  }
}

export async function getWorkflowRuns(id: string): Promise<WorkflowRun[]> {
  try {
    const client = await waitForConnection();
    const result = await client.request<{ entries?: WorkflowRun[] }>("cron.runs", { id, limit: 20 });
=======
export async function getWorkflowRuns(id: string): Promise<WorkflowRun[]> {
  try {
    const result = await rpcRequest<{ entries?: WorkflowRun[] }>("cron.runs", { id, limit: 20 });
>>>>>>> origin/main
    return Array.isArray(result.entries) ? result.entries : [];
  } catch (error) {
    console.error("Failed to get workflow runs:", error);
    return [];
  }
}

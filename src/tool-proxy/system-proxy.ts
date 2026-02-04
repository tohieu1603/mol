/**
 * System Tool Proxy
 * Proxies system information and process commands to remote boxes
 */

import { getToolProxyExecutor } from "./executor.js";
import type {
  SystemInfoResult,
  SystemProcessArgs,
  SystemProcessListResult,
  ProxyOptions,
  ProxyCommandResponse,
} from "./types.js";

// ============================================================================
// System Proxy Functions
// ============================================================================

/**
 * Get system information from a remote box
 */
export async function proxySystemInfo(
  options: ProxyOptions,
): Promise<ProxyCommandResponse & { result?: SystemInfoResult }> {
  const executor = getToolProxyExecutor();

  return executor.execute<Record<string, never>, SystemInfoResult>("system.info", {}, options);
}

/**
 * Manage processes on a remote box
 */
export async function proxySystemProcess(
  args: SystemProcessArgs,
  options: ProxyOptions,
): Promise<ProxyCommandResponse & { result?: SystemProcessListResult }> {
  const executor = getToolProxyExecutor();

  return executor.execute<SystemProcessArgs, SystemProcessListResult>(
    "system.process",
    {
      action: args.action,
      pid: args.pid,
      signal: args.signal,
    },
    options,
  );
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get system info from a box
 */
export async function getBoxSystemInfo(
  boxId: string,
  agentId?: string,
): Promise<SystemInfoResult | null> {
  const response = await proxySystemInfo({
    boxId,
    agentId,
    logCommand: false, // Don't log routine info requests
  });

  if (!response.success) {
    console.error(`[SystemProxy] Failed to get system info: ${response.error}`);
    return null;
  }

  return response.result ?? null;
}

/**
 * List processes on a box
 */
export async function listBoxProcesses(
  boxId: string,
  agentId?: string,
): Promise<SystemProcessListResult["processes"] | null> {
  const response = await proxySystemProcess(
    { action: "list" },
    {
      boxId,
      agentId,
      logCommand: false,
    },
  );

  if (!response.success) {
    console.error(`[SystemProxy] Failed to list processes: ${response.error}`);
    return null;
  }

  return response.result?.processes ?? null;
}

/**
 * Kill a process on a box
 */
export async function killBoxProcess(
  boxId: string,
  pid: number,
  signal: string = "SIGTERM",
  agentId?: string,
): Promise<boolean> {
  const response = await proxySystemProcess(
    { action: "kill", pid, signal },
    {
      boxId,
      agentId,
      logCommand: true,
    },
  );

  return response.success;
}

// ============================================================================
// Integration
// ============================================================================

/**
 * Execute system command on box via proxy
 */
export async function executeSystemOnBox(params: {
  boxId: string;
  action: "info" | "process-list" | "process-kill";
  args?: Record<string, unknown>;
  agentId?: string;
}): Promise<ProxyCommandResponse> {
  const options: ProxyOptions = {
    boxId: params.boxId,
    agentId: params.agentId,
    logCommand: params.action.startsWith("process-kill"),
  };

  switch (params.action) {
    case "info":
      return proxySystemInfo(options);
    case "process-list":
      return proxySystemProcess({ action: "list" }, options);
    case "process-kill":
      return proxySystemProcess(
        {
          action: "kill",
          pid: params.args?.pid as number,
          signal: (params.args?.signal as string) ?? "SIGTERM",
        },
        options,
      );
    default:
      return {
        commandId: "",
        success: false,
        error: `Unknown system action: ${params.action}`,
      };
  }
}

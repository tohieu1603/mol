/**
 * Bash Tool Proxy
 * Proxies bash commands to remote boxes
 */

import { getToolProxyExecutor } from "./executor.js";
import type {
  BashExecArgs,
  BashExecResult,
  BashWriteArgs,
  BashReadArgs,
  ProxyOptions,
  ProxyCommandResponse,
} from "./types.js";

// ============================================================================
// Bash Proxy Functions
// ============================================================================

/**
 * Execute a bash command on a remote box
 */
export async function proxyBashExec(
  args: BashExecArgs,
  options: ProxyOptions,
): Promise<ProxyCommandResponse & { result?: BashExecResult }> {
  const executor = getToolProxyExecutor();

  return executor.execute<BashExecArgs, BashExecResult>(
    "bash.exec",
    {
      command: args.command,
      workdir: args.workdir,
      env: args.env,
      timeoutMs: args.timeoutMs,
      maxOutputChars: args.maxOutputChars,
    },
    options,
  );
}

/**
 * Write a file via bash on a remote box
 */
export async function proxyBashWrite(
  args: BashWriteArgs,
  options: ProxyOptions,
): Promise<ProxyCommandResponse> {
  const executor = getToolProxyExecutor();

  return executor.execute(
    "bash.write",
    {
      filePath: args.filePath,
      content: args.content,
      mode: args.mode,
    },
    options,
  );
}

/**
 * Read a file via bash on a remote box
 */
export async function proxyBashRead(
  args: BashReadArgs,
  options: ProxyOptions,
): Promise<ProxyCommandResponse & { result?: string }> {
  const executor = getToolProxyExecutor();

  return executor.execute<BashReadArgs, string>(
    "bash.read",
    {
      filePath: args.filePath,
      maxBytes: args.maxBytes,
    },
    options,
  );
}

// ============================================================================
// Integration with Existing Exec Tool
// ============================================================================

/**
 * Check if a command should be proxied to a box
 * This is used by the existing bash-tools.exec.ts
 */
export function shouldProxyToBox(host: string | undefined): boolean {
  return host === "box";
}

/**
 * Execute command on box via proxy
 * Integration point for bash-tools.exec.ts
 */
export async function executeOnBox(params: {
  boxId: string;
  command: string;
  workdir?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  maxOutputChars?: number;
  agentId?: string;
}): Promise<{
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
  durationMs?: number;
}> {
  const response = await proxyBashExec(
    {
      command: params.command,
      workdir: params.workdir,
      env: params.env,
      timeoutMs: params.timeoutMs,
      maxOutputChars: params.maxOutputChars,
    },
    {
      boxId: params.boxId,
      agentId: params.agentId,
      timeoutMs: params.timeoutMs,
      logCommand: true,
    },
  );

  if (!response.success) {
    return {
      success: false,
      error: response.error,
      durationMs: response.durationMs,
    };
  }

  const result = response.result;
  return {
    success: true,
    stdout: result?.stdout ?? "",
    stderr: result?.stderr ?? "",
    exitCode: result?.exitCode ?? 0,
    durationMs: response.durationMs,
  };
}

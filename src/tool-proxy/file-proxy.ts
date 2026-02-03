/**
 * File Tool Proxy
 * Proxies file operations to remote boxes
 */

import { getToolProxyExecutor } from "./executor.js";
import type {
  FileReadArgs,
  FileWriteArgs,
  FileListArgs,
  FileListResult,
  ProxyOptions,
  ProxyCommandResponse,
} from "./types.js";

// ============================================================================
// File Proxy Functions
// ============================================================================

/**
 * Read a file on a remote box
 */
export async function proxyFileRead(
  args: FileReadArgs,
  options: ProxyOptions,
): Promise<ProxyCommandResponse & { result?: string }> {
  const executor = getToolProxyExecutor();

  return executor.execute<FileReadArgs, string>(
    "file.read",
    {
      path: args.path,
      encoding: args.encoding ?? "utf8",
      maxBytes: args.maxBytes,
    },
    options,
  );
}

/**
 * Write a file on a remote box
 */
export async function proxyFileWrite(
  args: FileWriteArgs,
  options: ProxyOptions,
): Promise<ProxyCommandResponse> {
  const executor = getToolProxyExecutor();

  return executor.execute(
    "file.write",
    {
      path: args.path,
      content: args.content,
      encoding: args.encoding ?? "utf8",
      mode: args.mode,
      append: args.append ?? false,
    },
    options,
  );
}

/**
 * List files on a remote box
 */
export async function proxyFileList(
  args: FileListArgs,
  options: ProxyOptions,
): Promise<ProxyCommandResponse & { result?: FileListResult }> {
  const executor = getToolProxyExecutor();

  return executor.execute<FileListArgs, FileListResult>(
    "file.list",
    {
      path: args.path,
      recursive: args.recursive ?? false,
      pattern: args.pattern,
    },
    options,
  );
}

// ============================================================================
// Integration with Existing File Tools
// ============================================================================

/**
 * Execute file operation on box via proxy
 * Generic integration point for file tools
 */
export async function executeFileOnBox(params: {
  boxId: string;
  action: "read" | "write" | "list";
  args: Record<string, unknown>;
  agentId?: string;
  timeoutMs?: number;
}): Promise<ProxyCommandResponse> {
  const options: ProxyOptions = {
    boxId: params.boxId,
    agentId: params.agentId,
    timeoutMs: params.timeoutMs,
    logCommand: true,
  };

  switch (params.action) {
    case "read":
      return proxyFileRead(params.args as unknown as FileReadArgs, options);
    case "write":
      return proxyFileWrite(params.args as unknown as FileWriteArgs, options);
    case "list":
      return proxyFileList(params.args as unknown as FileListArgs, options);
    default:
      return {
        commandId: "",
        success: false,
        error: `Unknown file action: ${params.action}`,
      };
  }
}

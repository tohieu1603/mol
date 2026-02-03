/**
 * Tool Proxy Types
 * Types for proxying tool execution to remote boxes
 */

// ============================================================================
// Command Types
// ============================================================================

/**
 * Supported command types that can be proxied to boxes
 */
export type ProxyCommandType =
  | "bash.exec"
  | "bash.write"
  | "bash.read"
  | "browser.navigate"
  | "browser.click"
  | "browser.type"
  | "browser.screenshot"
  | "file.read"
  | "file.write"
  | "file.list"
  | "system.info"
  | "system.process";

/**
 * Command request to be sent to a box
 */
export interface ProxyCommandRequest {
  /** Unique command ID */
  commandId: string;
  /** Box ID to execute on */
  boxId: string;
  /** Agent ID that initiated the command */
  agentId?: string;
  /** Command type */
  commandType: ProxyCommandType;
  /** Command arguments */
  args: Record<string, unknown>;
  /** Timeout in milliseconds */
  timeoutMs?: number;
  /** Metadata for logging */
  metadata?: Record<string, unknown>;
}

/**
 * Command response from a box
 */
export interface ProxyCommandResponse {
  /** Original command ID */
  commandId: string;
  /** Whether command succeeded */
  success: boolean;
  /** Command result (type depends on command) */
  result?: unknown;
  /** Error message if failed */
  error?: string;
  /** Execution duration in milliseconds */
  durationMs?: number;
}

// ============================================================================
// Bash Command Types
// ============================================================================

export interface BashExecArgs {
  command: string;
  workdir?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  maxOutputChars?: number;
  [key: string]: unknown;
}

export interface BashExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  signal?: number;
  timedOut?: boolean;
}

export interface BashWriteArgs {
  filePath: string;
  content: string;
  mode?: number;
}

export interface BashReadArgs {
  filePath: string;
  maxBytes?: number;
  [key: string]: unknown;
}

// ============================================================================
// Browser Command Types
// ============================================================================

export interface BrowserNavigateArgs {
  url: string;
  waitFor?: "load" | "domcontentloaded" | "networkidle";
  timeoutMs?: number;
}

export interface BrowserClickArgs {
  selector: string;
  button?: "left" | "right" | "middle";
  clickCount?: number;
}

export interface BrowserTypeArgs {
  selector: string;
  text: string;
  delay?: number;
}

export interface BrowserScreenshotArgs {
  selector?: string;
  fullPage?: boolean;
  format?: "png" | "jpeg";
  quality?: number;
  [key: string]: unknown;
}

export interface BrowserScreenshotResult {
  base64: string;
  width: number;
  height: number;
}

// ============================================================================
// File Command Types
// ============================================================================

export interface FileReadArgs {
  path: string;
  encoding?: "utf8" | "base64" | "binary";
  maxBytes?: number;
  [key: string]: unknown;
}

export interface FileWriteArgs {
  path: string;
  content: string;
  encoding?: "utf8" | "base64";
  mode?: number;
  append?: boolean;
}

export interface FileListArgs {
  path: string;
  recursive?: boolean;
  pattern?: string;
  [key: string]: unknown;
}

export interface FileListResult {
  files: Array<{
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    modifiedAt: number;
  }>;
}

// ============================================================================
// System Command Types
// ============================================================================

export interface SystemInfoResult {
  hostname: string;
  platform: string;
  arch: string;
  cpuCount: number;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
}

export interface SystemProcessArgs {
  action: "list" | "kill";
  pid?: number;
  signal?: string;
  [key: string]: unknown;
}

export interface SystemProcessListResult {
  processes: Array<{
    pid: number;
    name: string;
    cpu: number;
    memory: number;
  }>;
}

// ============================================================================
// Proxy Options
// ============================================================================

export interface ProxyOptions {
  /** Box ID to execute on */
  boxId: string;
  /** Agent ID for tracking */
  agentId?: string;
  /** Command timeout in milliseconds */
  timeoutMs?: number;
  /** Whether to log the command */
  logCommand?: boolean;
  /** Metadata to attach to command log */
  metadata?: Record<string, unknown>;
}

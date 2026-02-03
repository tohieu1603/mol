/**
 * Relay Gateway Types
 * Types for communication between cloud server and mini-PC boxes
 */

import type { WebSocket } from "ws";
import type { Box } from "../db/models/types.js";

// ============================================================================
// Box Connection State
// ============================================================================

export interface BoxConnection {
  /** Box ID from database */
  boxId: string;
  /** Customer ID who owns this box */
  customerId: string;
  /** WebSocket connection */
  ws: WebSocket;
  /** Connection timestamp */
  connectedAt: Date;
  /** Last heartbeat received */
  lastHeartbeat: Date;
  /** Hardware ID reported by box */
  hardwareId?: string;
  /** Box metadata from database */
  box?: Box;
  /** Pending RPC requests awaiting response */
  pendingRequests: Map<string, PendingRequest>;
}

export interface PendingRequest {
  /** Request ID */
  id: string;
  /** Command type */
  commandType: string;
  /** Timestamp when request was sent */
  sentAt: Date;
  /** Timeout handle */
  timeoutHandle: ReturnType<typeof setTimeout>;
  /** Promise resolve function */
  resolve: (response: RpcResponse) => void;
  /** Promise reject function */
  reject: (error: Error) => void;
}

// ============================================================================
// RPC Protocol Messages
// ============================================================================

export type RpcMessageType =
  | "auth"
  | "auth_response"
  | "heartbeat"
  | "heartbeat_ack"
  | "command"
  | "command_response"
  | "error";

export interface RpcMessage {
  /** Message type */
  type: RpcMessageType;
  /** Unique message ID */
  id: string;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Authentication Messages
// ============================================================================

export interface AuthRequest extends RpcMessage {
  type: "auth";
  payload: {
    /** API key for authentication */
    apiKey: string;
    /** Hardware ID of the box */
    hardwareId: string;
    /** Box hostname */
    hostname?: string;
    /** Operating system */
    os?: string;
    /** CPU architecture */
    arch?: string;
    /** Client version */
    version?: string;
  };
}

export interface AuthResponse extends RpcMessage {
  type: "auth_response";
  payload: {
    /** Whether authentication succeeded */
    success: boolean;
    /** Box ID if authenticated */
    boxId?: string;
    /** Error message if failed */
    error?: string;
    /** Server configuration */
    config?: {
      heartbeatIntervalMs: number;
      commandTimeoutMs: number;
    };
  };
}

// ============================================================================
// Heartbeat Messages
// ============================================================================

export interface HeartbeatRequest extends RpcMessage {
  type: "heartbeat";
  payload: {
    /** CPU usage percentage */
    cpuUsage?: number;
    /** Memory usage percentage */
    memoryUsage?: number;
    /** Disk usage percentage */
    diskUsage?: number;
    /** Number of active processes */
    activeProcesses?: number;
  };
}

export interface HeartbeatAck extends RpcMessage {
  type: "heartbeat_ack";
  payload: {
    /** Server timestamp */
    serverTime: number;
  };
}

// ============================================================================
// Command Messages
// ============================================================================

export interface CommandRequest extends RpcMessage {
  type: "command";
  payload: {
    /** Command ID for tracking */
    commandId: string;
    /** Command type (e.g., "bash.exec", "browser.navigate") */
    commandType: string;
    /** Command arguments */
    args: Record<string, unknown>;
    /** Optional timeout in milliseconds */
    timeoutMs?: number;
  };
}

export interface CommandResponse extends RpcMessage {
  type: "command_response";
  payload: {
    /** Original command ID */
    commandId: string;
    /** Whether command succeeded */
    success: boolean;
    /** Command result */
    result?: unknown;
    /** Error message if failed */
    error?: string;
    /** Execution duration in milliseconds */
    durationMs?: number;
  };
}

// ============================================================================
// Error Messages
// ============================================================================

export interface ErrorMessage extends RpcMessage {
  type: "error";
  payload: {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** Related request ID if applicable */
    requestId?: string;
  };
}

// ============================================================================
// Union Types
// ============================================================================

export type InboundMessage = AuthRequest | HeartbeatRequest | CommandResponse;

export type OutboundMessage = AuthResponse | HeartbeatAck | CommandRequest | ErrorMessage;

// ============================================================================
// RPC Response Type (for pending request resolution)
// ============================================================================

export interface RpcResponse {
  success: boolean;
  result?: unknown;
  error?: string;
  durationMs?: number;
}

// ============================================================================
// Registry Types
// ============================================================================

export interface BoxRegistryStats {
  /** Total connected boxes */
  connectedBoxes: number;
  /** Total active connections */
  totalConnections: number;
  /** Number of unique customers connected */
  customerCount: number;
  /** Number of unique boxes connected */
  boxCount: number;
  /** Boxes by customer */
  byCustomer: Record<string, number>;
  /** Average connection age in seconds */
  avgConnectionAge: number;
}

/** RPC Response from box */
export interface RpcResponse {
  success: boolean;
  result?: unknown;
  error?: string;
  durationMs?: number;
}

// ============================================================================
// Gateway Configuration
// ============================================================================

export interface RelayGatewayConfig {
  /** Port to listen on */
  port: number;
  /** Heartbeat interval in milliseconds */
  heartbeatIntervalMs: number;
  /** Command timeout in milliseconds */
  commandTimeoutMs: number;
  /** Connection timeout (no auth) in milliseconds */
  authTimeoutMs: number;
  /** Max connections per customer */
  maxConnectionsPerCustomer: number;
  /** Enable TLS */
  enableTls: boolean;
  /** TLS certificate path */
  tlsCertPath?: string;
  /** TLS key path */
  tlsKeyPath?: string;
}

export const DEFAULT_GATEWAY_CONFIG: RelayGatewayConfig = {
  port: 8443,
  heartbeatIntervalMs: 30_000, // 30 seconds
  commandTimeoutMs: 120_000, // 2 minutes
  authTimeoutMs: 10_000, // 10 seconds
  maxConnectionsPerCustomer: 100,
  enableTls: false,
};

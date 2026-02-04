/**
 * Box Registry
 * Manages connected mini-PC boxes via WebSocket
 */

import { EventEmitter } from "node:events";
import type { WebSocket } from "ws";
import { boxes } from "../db/models/index.js";
import type { Box } from "../db/models/types.js";
import type {
  BoxConnection,
  PendingRequest,
  BoxRegistryStats,
  CommandRequest,
  CommandResponse,
  RpcResponse,
} from "./types.js";

// ============================================================================
// Box Registry Events
// ============================================================================

export interface BoxRegistryEvents {
  "box:connected": (boxId: string, connection: BoxConnection) => void;
  "box:disconnected": (boxId: string, reason: string) => void;
  "box:heartbeat": (boxId: string, stats: Record<string, unknown>) => void;
  "box:error": (boxId: string, error: Error) => void;
}

// ============================================================================
// Box Registry Class
// ============================================================================

export class BoxRegistry extends EventEmitter {
  /** Map of boxId -> connection */
  private connections: Map<string, BoxConnection> = new Map();

  /** Map of customerId -> Set of boxIds */
  private customerBoxes: Map<string, Set<string>> = new Map();

  /** Heartbeat check interval */
  private heartbeatCheckInterval?: ReturnType<typeof setInterval>;

  /** Heartbeat timeout in milliseconds */
  private heartbeatTimeoutMs: number;

  /** Command timeout in milliseconds */
  private commandTimeoutMs: number;

  constructor(options?: { heartbeatTimeoutMs?: number; commandTimeoutMs?: number }) {
    super();
    this.heartbeatTimeoutMs = options?.heartbeatTimeoutMs ?? 90_000; // 90 seconds
    this.commandTimeoutMs = options?.commandTimeoutMs ?? 120_000; // 2 minutes
  }

  // ==========================================================================
  // Connection Management
  // ==========================================================================

  /**
   * Register a new box connection
   */
  registerConnection(
    boxId: string,
    customerId: string,
    ws: WebSocket,
    box?: Box,
    hardwareId?: string,
  ): BoxConnection {
    // Check if already connected
    const existing = this.connections.get(boxId);
    if (existing) {
      // Close old connection
      this.unregisterConnection(boxId, "replaced by new connection");
    }

    const now = new Date();
    const connection: BoxConnection = {
      boxId,
      customerId,
      ws,
      connectedAt: now,
      lastHeartbeat: now,
      hardwareId,
      box,
      pendingRequests: new Map(),
    };

    this.connections.set(boxId, connection);

    // Track by customer
    let customerSet = this.customerBoxes.get(customerId);
    if (!customerSet) {
      customerSet = new Set();
      this.customerBoxes.set(customerId, customerSet);
    }
    customerSet.add(boxId);

    // Update box status in database
    const remoteAddress = (ws as unknown as { _socket?: { remoteAddress?: string } })._socket
      ?.remoteAddress;
    boxes.updateBoxStatus(boxId, "online", remoteAddress).catch((err) => {
      console.error(`[BoxRegistry] Failed to update box status: ${err.message}`);
    });

    this.emit("box:connected", boxId, connection);

    return connection;
  }

  /**
   * Unregister a box connection
   */
  unregisterConnection(boxId: string, reason: string = "disconnected"): void {
    const connection = this.connections.get(boxId);
    if (!connection) return;

    // Cancel all pending requests
    for (const pending of connection.pendingRequests.values()) {
      clearTimeout(pending.timeoutHandle);
      pending.reject(new Error(`Connection closed: ${reason}`));
    }
    connection.pendingRequests.clear();

    // Close WebSocket if still open
    if (connection.ws.readyState === connection.ws.OPEN) {
      connection.ws.close(1000, reason);
    }

    // Remove from tracking
    this.connections.delete(boxId);

    const customerSet = this.customerBoxes.get(connection.customerId);
    if (customerSet) {
      customerSet.delete(boxId);
      if (customerSet.size === 0) {
        this.customerBoxes.delete(connection.customerId);
      }
    }

    // Update box status in database
    boxes.updateBoxStatus(boxId, "offline").catch((err) => {
      console.error(`[BoxRegistry] Failed to update box status: ${err.message}`);
    });

    this.emit("box:disconnected", boxId, reason);
  }

  /**
   * Get connection by box ID
   */
  getConnection(boxId: string): BoxConnection | undefined {
    return this.connections.get(boxId);
  }

  /**
   * Check if box is connected
   */
  isConnected(boxId: string): boolean {
    return this.connections.has(boxId);
  }

  /**
   * Get all connections for a customer
   */
  getCustomerConnections(customerId: string): BoxConnection[] {
    const boxIds = this.customerBoxes.get(customerId);
    if (!boxIds) return [];

    return Array.from(boxIds)
      .map((id) => this.connections.get(id))
      .filter((c): c is BoxConnection => c !== undefined);
  }

  // ==========================================================================
  // Heartbeat Management
  // ==========================================================================

  /**
   * Update heartbeat for a box
   */
  updateHeartbeat(boxId: string, stats?: Record<string, unknown>): void {
    const connection = this.connections.get(boxId);
    if (!connection) return;

    connection.lastHeartbeat = new Date();
    this.emit("box:heartbeat", boxId, stats ?? {});
  }

  /**
   * Start heartbeat checker
   */
  startHeartbeatChecker(intervalMs: number = 30_000): void {
    this.stopHeartbeatChecker();

    this.heartbeatCheckInterval = setInterval(() => {
      this.checkHeartbeats();
    }, intervalMs);
  }

  /**
   * Stop heartbeat checker
   */
  stopHeartbeatChecker(): void {
    if (this.heartbeatCheckInterval) {
      clearInterval(this.heartbeatCheckInterval);
      this.heartbeatCheckInterval = undefined;
    }
  }

  /**
   * Check all connections for stale heartbeats
   */
  private checkHeartbeats(): void {
    const now = Date.now();

    for (const [boxId, connection] of this.connections) {
      const age = now - connection.lastHeartbeat.getTime();

      if (age > this.heartbeatTimeoutMs) {
        this.unregisterConnection(boxId, "heartbeat timeout");
      }
    }
  }

  // ==========================================================================
  // Command Execution
  // ==========================================================================

  /**
   * Send a command to a box and wait for response
   */
  async sendCommand(
    boxId: string,
    commandType: string,
    args: Record<string, unknown>,
    timeoutMs?: number,
  ): Promise<RpcResponse> {
    const connection = this.connections.get(boxId);
    if (!connection) {
      return { success: false, error: "Box not connected" };
    }

    if (connection.ws.readyState !== connection.ws.OPEN) {
      return { success: false, error: "WebSocket not open" };
    }

    const commandId = crypto.randomUUID();
    const timeout = timeoutMs ?? this.commandTimeoutMs;

    return new Promise((resolve, reject) => {
      // Create timeout
      const timeoutHandle = setTimeout(() => {
        connection.pendingRequests.delete(commandId);
        resolve({ success: false, error: "Command timeout" });
      }, timeout);

      // Store pending request
      const pending: PendingRequest = {
        id: commandId,
        commandType,
        sentAt: new Date(),
        timeoutHandle,
        resolve,
        reject,
      };
      connection.pendingRequests.set(commandId, pending);

      // Build and send command
      const message: CommandRequest = {
        type: "command",
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        payload: {
          commandId,
          commandType,
          args,
          timeoutMs: timeout,
        },
      };

      try {
        connection.ws.send(JSON.stringify(message));
      } catch (err) {
        clearTimeout(timeoutHandle);
        connection.pendingRequests.delete(commandId);
        resolve({
          success: false,
          error: `Failed to send command: ${err instanceof Error ? err.message : "unknown error"}`,
        });
      }
    });
  }

  /**
   * Handle command response from box
   */
  handleCommandResponse(boxId: string, response: CommandResponse): void {
    const connection = this.connections.get(boxId);
    if (!connection) return;

    const pending = connection.pendingRequests.get(response.payload.commandId);
    if (!pending) {
      console.warn(
        `[BoxRegistry] Received response for unknown command: ${response.payload.commandId}`,
      );
      return;
    }

    clearTimeout(pending.timeoutHandle);
    connection.pendingRequests.delete(response.payload.commandId);

    pending.resolve({
      success: response.payload.success,
      result: response.payload.result,
      error: response.payload.error,
      durationMs: response.payload.durationMs,
    });
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Get registry statistics
   */
  getStats(): BoxRegistryStats {
    const now = Date.now();
    let totalAge = 0;
    const byCustomer: Record<string, number> = {};

    for (const connection of this.connections.values()) {
      totalAge += now - connection.connectedAt.getTime();

      byCustomer[connection.customerId] = (byCustomer[connection.customerId] ?? 0) + 1;
    }

    return {
      connectedBoxes: this.connections.size,
      totalConnections: this.connections.size,
      customerCount: this.customerBoxes.size,
      boxCount: this.connections.size,
      byCustomer,
      avgConnectionAge: this.connections.size > 0 ? totalAge / this.connections.size / 1000 : 0,
    };
  }

  /**
   * Get count of connected boxes for a customer
   */
  getCustomerConnectionCount(customerId: string): number {
    return this.customerBoxes.get(customerId)?.size ?? 0;
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  /**
   * Close all connections and cleanup
   */
  shutdown(): void {
    this.stopHeartbeatChecker();

    for (const boxId of this.connections.keys()) {
      this.unregisterConnection(boxId, "server shutdown");
    }
  }
}

// Import crypto for UUID generation
import crypto from "node:crypto";

// Singleton instance
let registryInstance: BoxRegistry | null = null;

/**
 * Get the singleton registry instance
 */
export function getBoxRegistry(): BoxRegistry {
  if (!registryInstance) {
    registryInstance = new BoxRegistry();
  }
  return registryInstance;
}

/**
 * Reset registry (for testing)
 */
export function resetBoxRegistry(): void {
  if (registryInstance) {
    registryInstance.shutdown();
    registryInstance = null;
  }
}

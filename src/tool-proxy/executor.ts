/**
 * Tool Proxy Executor
 * Executes commands on remote boxes via the relay gateway
 */

import crypto from "node:crypto";
import { getBoxRegistry } from "../relay-gateway/box-registry.js";
import { commands } from "../db/models/index.js";
import type { ProxyCommandResponse, ProxyCommandType, ProxyOptions } from "./types.js";

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_COMMAND_TIMEOUT_MS = 120_000; // 2 minutes

// ============================================================================
// Executor Class
// ============================================================================

export class ToolProxyExecutor {
  /**
   * Execute a command on a remote box
   */
  async execute<TArgs extends object, TResult = unknown>(
    commandType: ProxyCommandType,
    args: TArgs,
    options: ProxyOptions,
  ): Promise<ProxyCommandResponse & { result?: TResult }> {
    const commandId = crypto.randomUUID();
    const timeoutMs = options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;
    const startTime = Date.now();

    // Cast args to Record for compatibility
    const argsRecord = args as unknown as Record<string, unknown>;

    // Create command log entry if logging is enabled
    let logId: string | undefined;
    if (options.logCommand !== false) {
      try {
        const logEntry = await commands.createCommandLog({
          box_id: options.boxId,
          agent_id: options.agentId,
          command_id: commandId,
          command_type: commandType,
          command_payload: argsRecord,
          metadata: options.metadata ?? {},
        });
        logId = logEntry.id;
      } catch (err) {
        console.error(`[ToolProxy] Failed to create command log: ${err}`);
      }
    }

    // Get box connection
    const registry = getBoxRegistry();
    const connection = registry.getConnection(options.boxId);

    if (!connection) {
      const errorResponse: ProxyCommandResponse & { result?: TResult } = {
        commandId,
        success: false,
        error: "Box not connected",
        durationMs: Date.now() - startTime,
      };

      // Update log with error
      if (logId) {
        await this.updateCommandLog(logId, errorResponse);
      }

      return errorResponse as ProxyCommandResponse & { result?: TResult };
    }

    // Send command to box
    try {
      const response = await registry.sendCommand(
        options.boxId,
        commandType,
        argsRecord,
        timeoutMs,
      );

      const commandResponse: ProxyCommandResponse = {
        commandId,
        success: response.success,
        result: response.result,
        error: response.error,
        durationMs: response.durationMs ?? Date.now() - startTime,
      };

      // Update command log with response
      if (logId) {
        await this.updateCommandLog(logId, commandResponse);
      }

      return commandResponse as ProxyCommandResponse & { result?: TResult };
    } catch (err) {
      const errorResponse: ProxyCommandResponse & { result?: TResult } = {
        commandId,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        durationMs: Date.now() - startTime,
      };

      // Update log with error
      if (logId) {
        await this.updateCommandLog(logId, errorResponse);
      }

      return errorResponse as ProxyCommandResponse & { result?: TResult };
    }
  }

  /**
   * Update command log with response
   */
  private async updateCommandLog(logId: string, response: ProxyCommandResponse): Promise<void> {
    try {
      await commands.updateCommandLog(logId, {
        success: response.success,
        response_payload: response.result as Record<string, unknown> | undefined,
        error: response.error,
        received_at: new Date(),
        duration_ms: response.durationMs,
      });
    } catch (err) {
      console.error(`[ToolProxy] Failed to update command log: ${err}`);
    }
  }

  /**
   * Check if a box is available for command execution
   */
  isBoxAvailable(boxId: string): boolean {
    return getBoxRegistry().isConnected(boxId);
  }

  /**
   * Get list of connected boxes for a customer
   */
  getAvailableBoxes(customerId: string): string[] {
    const connections = getBoxRegistry().getCustomerConnections(customerId);
    return connections.map((c) => c.boxId);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let executorInstance: ToolProxyExecutor | null = null;

/**
 * Get the singleton executor instance
 */
export function getToolProxyExecutor(): ToolProxyExecutor {
  if (!executorInstance) {
    executorInstance = new ToolProxyExecutor();
  }
  return executorInstance;
}

/**
 * Reset executor (for testing)
 */
export function resetToolProxyExecutor(): void {
  executorInstance = null;
}

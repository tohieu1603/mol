/**
 * Relay Gateway WebSocket Server
 * Handles connections from mini-PC boxes
 */

import { createServer, type Server as HttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import fs from "node:fs";
import { WebSocketServer, WebSocket } from "ws";
import { authenticateBox } from "./box-auth.js";
import { getBoxRegistry } from "./box-registry.js";
import type {
  RelayGatewayConfig,
  AuthRequest,
  AuthResponse,
  HeartbeatRequest,
  HeartbeatAck,
  CommandResponse,
  ErrorMessage,
  InboundMessage,
} from "./types.js";

// ============================================================================
// Relay Gateway Server
// ============================================================================

export class RelayGatewayServer {
  private config: RelayGatewayConfig;
  private httpServer?: HttpServer;
  private wss?: WebSocketServer;
  private isRunning: boolean = false;

  /** Map of unauthenticated connections with auth timeout */
  private pendingAuth: Map<WebSocket, ReturnType<typeof setTimeout>> = new Map();

  constructor(config?: Partial<RelayGatewayConfig>) {
    this.config = {
      port: config?.port ?? 8443,
      heartbeatIntervalMs: config?.heartbeatIntervalMs ?? 30_000,
      commandTimeoutMs: config?.commandTimeoutMs ?? 120_000,
      authTimeoutMs: config?.authTimeoutMs ?? 10_000,
      maxConnectionsPerCustomer: config?.maxConnectionsPerCustomer ?? 100,
      enableTls: config?.enableTls ?? false,
      tlsCertPath: config?.tlsCertPath,
      tlsKeyPath: config?.tlsKeyPath,
    };
  }

  // ==========================================================================
  // Server Lifecycle
  // ==========================================================================

  /**
   * Start the relay gateway server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error("Relay gateway is already running");
    }

    // Create HTTP(S) server
    if (this.config.enableTls && this.config.tlsCertPath && this.config.tlsKeyPath) {
      const cert = fs.readFileSync(this.config.tlsCertPath);
      const key = fs.readFileSync(this.config.tlsKeyPath);
      this.httpServer = createHttpsServer({ cert, key });
    } else {
      this.httpServer = createServer();
    }

    // Create WebSocket server
    this.wss = new WebSocketServer({
      server: this.httpServer,
      path: "/relay",
    });

    // Set up connection handler
    this.wss.on("connection", (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Start HTTP server
    await new Promise<void>((resolve, reject) => {
      this.httpServer!.listen(this.config.port, () => {
        console.log(`[RelayGateway] Listening on port ${this.config.port}`);
        resolve();
      });

      this.httpServer!.on("error", reject);
    });

    // Start heartbeat checker
    getBoxRegistry().startHeartbeatChecker(this.config.heartbeatIntervalMs);

    this.isRunning = true;
  }

  /**
   * Stop the relay gateway server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    // Stop heartbeat checker
    getBoxRegistry().stopHeartbeatChecker();

    // Clear pending auth timeouts
    for (const timeout of this.pendingAuth.values()) {
      clearTimeout(timeout);
    }
    this.pendingAuth.clear();

    // Close all connections
    getBoxRegistry().shutdown();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
      this.wss = undefined;
    }

    // Close HTTP server
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => resolve());
      });
      this.httpServer = undefined;
    }

    this.isRunning = false;
    console.log("[RelayGateway] Server stopped");
  }

  // ==========================================================================
  // Connection Handling
  // ==========================================================================

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: import("http").IncomingMessage): void {
    const clientIp = req.socket.remoteAddress ?? "unknown";
    console.log(`[RelayGateway] New connection from ${clientIp}`);

    // Set auth timeout
    const authTimeout = setTimeout(() => {
      if (this.pendingAuth.has(ws)) {
        this.pendingAuth.delete(ws);
        this.sendError(ws, "AUTH_TIMEOUT", "Authentication timeout");
        ws.close(4001, "Authentication timeout");
      }
    }, this.config.authTimeoutMs);

    this.pendingAuth.set(ws, authTimeout);

    // Set up message handler
    ws.on("message", (data) => {
      this.handleMessage(ws, data);
    });

    // Set up close handler
    ws.on("close", (code, reason) => {
      this.handleClose(ws, code, reason.toString());
    });

    // Set up error handler
    ws.on("error", (error) => {
      console.error(`[RelayGateway] WebSocket error: ${error.message}`);
    });
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(ws: WebSocket, data: import("ws").RawData): Promise<void> {
    let message: InboundMessage;

    try {
      message = JSON.parse(data.toString()) as InboundMessage;
    } catch {
      this.sendError(ws, "INVALID_JSON", "Failed to parse message");
      return;
    }

    // Handle based on message type
    switch (message.type) {
      case "auth":
        await this.handleAuth(ws, message as AuthRequest);
        break;

      case "heartbeat":
        await this.handleHeartbeat(ws, message as HeartbeatRequest);
        break;

      case "command_response":
        await this.handleCommandResponse(ws, message as CommandResponse);
        break;

      default:
        this.sendError(
          ws,
          "UNKNOWN_MESSAGE_TYPE",
          `Unknown message type: ${(message as { type: string }).type}`,
        );
    }
  }

  /**
   * Handle authentication request
   */
  private async handleAuth(ws: WebSocket, message: AuthRequest): Promise<void> {
    // Check if already authenticated
    if (!this.pendingAuth.has(ws)) {
      this.sendError(ws, "ALREADY_AUTHENTICATED", "Connection is already authenticated");
      return;
    }

    const { apiKey, hardwareId, hostname, os, arch, version } = message.payload;

    // Authenticate
    const result = await authenticateBox(apiKey, hardwareId);

    if (!result.success || !result.box) {
      const response: AuthResponse = {
        type: "auth_response",
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        payload: {
          success: false,
          error: result.error ?? "Authentication failed",
        },
      };
      ws.send(JSON.stringify(response));
      ws.close(4003, "Authentication failed");
      return;
    }

    // Check connection limit for customer
    const registry = getBoxRegistry();
    const currentCount = registry.getCustomerConnectionCount(result.box.customer_id);

    if (currentCount >= this.config.maxConnectionsPerCustomer) {
      const response: AuthResponse = {
        type: "auth_response",
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        payload: {
          success: false,
          error: "Connection limit exceeded for customer",
        },
      };
      ws.send(JSON.stringify(response));
      ws.close(4004, "Connection limit exceeded");
      return;
    }

    // Clear auth timeout
    const timeout = this.pendingAuth.get(ws);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingAuth.delete(ws);
    }

    // Update box info if provided
    if (hostname || os || arch) {
      const { boxes } = await import("../db/models/index.js");
      const remoteAddress = (ws as unknown as { _socket?: { remoteAddress?: string } })._socket
        ?.remoteAddress;
      await boxes.updateBox(result.box.id, {
        hostname,
        os: os as import("../db/models/types.js").BoxOS | undefined,
        arch: arch as import("../db/models/types.js").BoxArch | undefined,
        metadata: {
          ...result.box.metadata,
          clientVersion: version,
          lastConnectIp: remoteAddress,
        },
      });
    }

    // Register connection
    registry.registerConnection(result.box.id, result.box.customer_id, ws, result.box, hardwareId);

    // Store box ID on WebSocket for later reference
    (ws as WebSocket & { boxId?: string }).boxId = result.box.id;

    // Send success response
    const response: AuthResponse = {
      type: "auth_response",
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      payload: {
        success: true,
        boxId: result.box.id,
        config: {
          heartbeatIntervalMs: this.config.heartbeatIntervalMs,
          commandTimeoutMs: this.config.commandTimeoutMs,
        },
      },
    };

    ws.send(JSON.stringify(response));
    console.log(`[RelayGateway] Box authenticated: ${result.box.id} (${result.box.name})`);
  }

  /**
   * Handle heartbeat request
   */
  private async handleHeartbeat(ws: WebSocket, message: HeartbeatRequest): Promise<void> {
    const boxId = (ws as WebSocket & { boxId?: string }).boxId;

    if (!boxId) {
      this.sendError(ws, "NOT_AUTHENTICATED", "Connection not authenticated");
      return;
    }

    // Update heartbeat
    getBoxRegistry().updateHeartbeat(boxId, message.payload);

    // Send acknowledgment
    const response: HeartbeatAck = {
      type: "heartbeat_ack",
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      payload: {
        serverTime: Date.now(),
      },
    };

    ws.send(JSON.stringify(response));
  }

  /**
   * Handle command response
   */
  private async handleCommandResponse(ws: WebSocket, message: CommandResponse): Promise<void> {
    const boxId = (ws as WebSocket & { boxId?: string }).boxId;

    if (!boxId) {
      this.sendError(ws, "NOT_AUTHENTICATED", "Connection not authenticated");
      return;
    }

    getBoxRegistry().handleCommandResponse(boxId, message);
  }

  /**
   * Handle connection close
   */
  private handleClose(ws: WebSocket, code: number, reason: string): void {
    // Clear auth timeout if pending
    const timeout = this.pendingAuth.get(ws);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingAuth.delete(ws);
    }

    // Unregister if authenticated
    const boxId = (ws as WebSocket & { boxId?: string }).boxId;
    if (boxId) {
      getBoxRegistry().unregisterConnection(boxId, `closed: ${code} - ${reason}`);
    }
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Send error message to client
   */
  private sendError(ws: WebSocket, code: string, message: string, requestId?: string): void {
    const error: ErrorMessage = {
      type: "error",
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      payload: {
        code,
        message,
        requestId,
      },
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(error));
    }
  }

  /**
   * Get server statistics
   */
  getStats(): {
    isRunning: boolean;
    port: number;
    pendingAuth: number;
    registry: import("./types.js").BoxRegistryStats;
  } {
    return {
      isRunning: this.isRunning,
      port: this.config.port,
      pendingAuth: this.pendingAuth.size,
      registry: getBoxRegistry().getStats(),
    };
  }
}

// Import crypto for UUID generation
import crypto from "node:crypto";

// Singleton instance
let serverInstance: RelayGatewayServer | null = null;

/**
 * Get or create the relay gateway server
 */
export function getRelayGateway(config?: Partial<RelayGatewayConfig>): RelayGatewayServer {
  if (!serverInstance) {
    serverInstance = new RelayGatewayServer(config);
  }
  return serverInstance;
}

/**
 * Reset server (for testing)
 */
export function resetRelayGateway(): void {
  if (serverInstance) {
    serverInstance.stop().catch(() => {});
    serverInstance = null;
  }
}

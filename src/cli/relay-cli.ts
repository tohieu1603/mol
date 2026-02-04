/**
 * Relay Gateway CLI
 * Commands for managing the WebSocket relay gateway for mini-PC connections
 */

import type { Command } from "commander";
import { loadDotEnv } from "../infra/dotenv.js";

// Load environment variables
loadDotEnv({ quiet: true });

type RelayRunOpts = {
  port?: string;
  host?: string;
  verbose?: boolean;
  force?: boolean;
};

type RelayStatusOpts = {
  json?: boolean;
};

async function runRelayCommand(opts: RelayRunOpts) {
  const { getRelayGateway } = await import("../relay-gateway/index.js");
  const { runMigrations } = await import("../db/index.js");

  const port = opts.port
    ? parseInt(opts.port, 10)
    : parseInt(process.env.RELAY_GATEWAY_PORT || "8443", 10);
  const host = opts.host || process.env.RELAY_GATEWAY_HOST || "0.0.0.0";

  console.log(`[relay] Starting Relay Gateway...`);
  console.log(`[relay] Port: ${port}, Host: ${host}`);

  // Run database migrations first
  try {
    console.log("[relay] Running database migrations...");
    await runMigrations();
    console.log("[relay] Database ready");
  } catch (err) {
    console.error("[relay] Database migration failed:", err);
    if (!process.env.DB_HOST) {
      console.error("[relay] Hint: Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in .env");
    }
    process.exit(1);
  }

  // Create and start relay gateway
  const config = {
    port,
    heartbeatIntervalMs: parseInt(process.env.RELAY_GATEWAY_HEARTBEAT_INTERVAL_MS || "30000", 10),
    commandTimeoutMs: parseInt(process.env.RELAY_GATEWAY_COMMAND_TIMEOUT_MS || "120000", 10),
    authTimeoutMs: parseInt(process.env.RELAY_GATEWAY_AUTH_TIMEOUT_MS || "10000", 10),
    maxConnectionsPerCustomer: parseInt(
      process.env.RELAY_GATEWAY_MAX_CONNECTIONS_PER_CUSTOMER || "100",
      10,
    ),
    enableTls: process.env.RELAY_GATEWAY_TLS_ENABLED === "true",
    tlsCertPath: process.env.RELAY_GATEWAY_TLS_CERT,
    tlsKeyPath: process.env.RELAY_GATEWAY_TLS_KEY,
  };

  const server = getRelayGateway(config);

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log("\n[relay] Shutting down...");
    await server.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    await server.start();
    console.log(`[relay] Relay Gateway is running on ${host}:${port}`);
    console.log("[relay] Waiting for box connections...");
    console.log("[relay] Press Ctrl+C to stop");

    // Keep the process running
    await new Promise(() => {});
  } catch (err) {
    console.error("[relay] Failed to start:", err);
    process.exit(1);
  }
}

async function showRelayStatus(opts: RelayStatusOpts) {
  const { getRelayGateway } = await import("../relay-gateway/index.js");
  const { checkHealth } = await import("../db/index.js");

  const server = getRelayGateway();
  const stats = server.getStats();

  // Check database health
  let dbHealth: { ok: boolean; error?: string } = { ok: false, error: "" };
  try {
    const health = await checkHealth();
    dbHealth = { ok: health.ok, error: health.error };
  } catch (err) {
    dbHealth = { ok: false, error: String(err) };
  }

  const status = {
    relay: {
      running: stats.isRunning,
      port: stats.port,
      pendingAuth: stats.pendingAuth,
      connections: stats.registry.totalConnections,
      customers: stats.registry.customerCount,
      boxes: stats.registry.boxCount,
    },
    database: dbHealth,
  };

  if (opts.json) {
    console.log(JSON.stringify(status, null, 2));
  } else {
    console.log("Relay Gateway Status:");
    console.log(`  Running: ${stats.isRunning ? "Yes" : "No"}`);
    console.log(`  Port: ${stats.port}`);
    console.log(`  Pending Auth: ${stats.pendingAuth}`);
    console.log(`  Active Connections: ${stats.registry.totalConnections}`);
    console.log(`  Connected Customers: ${stats.registry.customerCount}`);
    console.log(`  Connected Boxes: ${stats.registry.boxCount}`);
    console.log("");
    console.log("Database:");
    console.log(`  Connected: ${dbHealth.ok ? "Yes" : "No"}`);
    if (!dbHealth.ok && dbHealth.error) {
      console.log(`  Error: ${dbHealth.error}`);
    }
  }
}

export function registerRelayCli(program: Command) {
  const relay = program.command("relay").description("Relay Gateway for mini-PC box connections");

  // relay (default = run)
  relay
    .option("--port <port>", "Port for the relay WebSocket server")
    .option("--host <host>", "Host to bind to (default: 0.0.0.0)")
    .option("--verbose", "Verbose logging", false)
    .option("--force", "Force start even if port is in use", false)
    .action(async (opts: RelayRunOpts) => {
      await runRelayCommand(opts);
    });

  // relay run
  relay
    .command("run")
    .description("Run the Relay Gateway (foreground)")
    .option("--port <port>", "Port for the relay WebSocket server")
    .option("--host <host>", "Host to bind to (default: 0.0.0.0)")
    .option("--verbose", "Verbose logging", false)
    .action(async (opts: RelayRunOpts) => {
      await runRelayCommand(opts);
    });

  // relay status
  relay
    .command("status")
    .description("Show Relay Gateway status")
    .option("--json", "Output as JSON", false)
    .action(async (opts: RelayStatusOpts) => {
      await showRelayStatus(opts);
    });

  // relay stop - placeholder for service management
  relay
    .command("stop")
    .description("Stop the Relay Gateway service")
    .action(async () => {
      console.log("[relay] To stop the relay gateway:");
      console.log("  - If running in foreground: Press Ctrl+C");
      console.log("  - If running with PM2: pm2 stop relay-gateway");
      console.log("  - If running with systemd: sudo systemctl stop operis-relay");
    });
}

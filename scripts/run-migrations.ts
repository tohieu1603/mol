#!/usr/bin/env bun
/**
 * Run database migrations for Operis
 */

import { runMigrations, closePool, checkHealth } from "../src/db/connection.js";

async function main() {
  console.log("[migrations] Starting...");

  // Check connection
  const health = await checkHealth();
  if (!health.ok) {
    console.error("[migrations] Database connection failed:", health.error);
    process.exit(1);
  }
  console.log("[migrations] Database connected");

  // Run migrations
  try {
    await runMigrations();
    console.log("[migrations] Complete");
  } catch (error) {
    console.error("[migrations] Failed:", error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();

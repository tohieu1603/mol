/**
 * Database Initialization Script
 * Run: npx tsx scripts/init-db.ts
 */

import { runMigrations, checkHealth, closePool } from "../src/db/connection.js";

async function main() {
  console.log("🚀 Initializing Operis Database...\n");

  // Check connection
  console.log("1. Checking database connection...");
  const health = await checkHealth();

  if (!health.ok) {
    console.error("❌ Database connection failed:", health.error);
    console.log("\nPlease check your .env configuration:");
    console.log("  DB_HOST=", process.env.DB_HOST);
    console.log("  DB_PORT=", process.env.DB_PORT);
    console.log("  DB_NAME=", process.env.DB_NAME);
    console.log("  DB_USER=", process.env.DB_USER);
    process.exit(1);
  }

  console.log("✅ Database connection OK\n");

  // Run migrations
  console.log("2. Running migrations...");
  try {
    await runMigrations();
    console.log("✅ Migrations completed\n");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  // Close pool
  await closePool();

  console.log("🎉 Database initialization complete!");
  console.log("\nNext steps:");
  console.log("  1. Start the server: npm run dev");
  console.log("  2. Create a customer account");
  console.log("  3. Generate API key for boxes");
}

main().catch(console.error);

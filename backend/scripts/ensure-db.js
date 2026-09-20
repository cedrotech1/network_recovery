/**
 * Create PostgreSQL database from DEV_DATABASE_* in backend/.env if missing.
 * Connects to the default "postgres" maintenance DB first.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { Client } = require("pg");

async function main() {
  const host = process.env.DEV_DATABASE_HOST || "127.0.0.1";
  const port = Number(process.env.DEV_DATABASE_PORT || 5432);
  const user = process.env.DEV_DATABASE_USER || "postgres";
  const password = process.env.DEV_DATABASE_PASSWORD || "password";
  const dbName = process.env.DEV_DATABASE_NAME || "network_recovery";

  const admin = new Client({
    host,
    port,
    user,
    password,
    database: "postgres",
  });

  try {
    await admin.connect();
    const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (exists.rowCount === 0) {
      // Identifiers cannot be parameterized; dbName comes from local .env only.
      await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, "")}"`);
      console.log(`[ensure-db] Created database "${dbName}"`);
    } else {
      console.log(`[ensure-db] Database "${dbName}" already exists`);
    }
  } catch (e) {
    console.error("[ensure-db] FAILED:", e.message);
    console.error("  Check PostgreSQL is running and DEV_DATABASE_* in backend/.env");
    process.exitCode = 1;
  } finally {
    await admin.end().catch(() => {});
  }
}

main();

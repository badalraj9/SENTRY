/**
 * PostgreSQL Connection Pool
 */

import pg from "pg";
import { config } from "../config/index.js";

const { Pool } = pg;

// Determine SSL config based on environment
const isProduction = process.env.NODE_ENV === "production";
const sslConfig = config.database.url.includes("localhost")
  ? false
  : { rejectUnauthorized: isProduction };

export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: sslConfig,
});

// Test connection on startup
pool.on("connect", () => {
  console.log("📦 Database connection established");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected database error:", err);
});

/**
 * Execute a query with automatic connection handling
 */
export async function query<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  if (config.isDev && duration > 100) {
    console.log(`⚠️ Slow query (${duration}ms):`, text.slice(0, 100));
  }

  return result;
}

/**
 * Get a client for transaction support
 */
export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

/**
 * Execute within a transaction
 */
export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Shutdown pool gracefully
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log("📦 Database pool closed");
}

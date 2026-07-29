import pg from "pg";

const { Pool } = pg;

let pool;
let lastConnectionError = null;

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

export function getPool() {
  if (pool) return pool;

  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    const msg = "DATABASE_URL not set in environment - cannot connect to PostgreSQL";
    lastConnectionError = msg;
    throw new Error(msg);
  }

  pool = new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
    max: process.env.VERCEL ? 1 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on("error", (err) => {
    lastConnectionError = {
      message: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack,
    };
    console.error("PostgreSQL pool error:", err);
  });

  return pool;
}

export async function ensureDbConnection() {
  try {
    const result = await getPool().query("select 1 as ok");
    lastConnectionError = null;
    return result;
  } catch (err) {
    lastConnectionError = {
      message: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack,
    };
    throw err;
  }
}

export function getLastConnectionError() {
  return lastConnectionError;
}

export async function query(text, params = []) {
  return getPool().query(text, params);
}

export async function transaction(callback) {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export function mapBase(row) {
  if (!row) return row;
  return {
    _id: row.id,
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

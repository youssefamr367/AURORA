import { ensureDbConnection, getPool } from "../db/postgres.js";

export async function ensureConnection() {
  return ensureDbConnection();
}

export default getPool;

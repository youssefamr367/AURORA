import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const schemaPath = path.join(rootDir, "database", "postgresql_schema.sql");

dotenv.config({ path: path.join(rootDir, ".env") });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error(
    "DATABASE_URL or POSTGRES_URL is required. Example:\n" +
      '  $env:DATABASE_URL="postgresql://user:password@host/db?sslmode=require"; npm run db:schema'
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl:
    connectionString.includes("sslmode=require") ||
    process.env.PGSSLMODE === "require"
      ? { rejectUnauthorized: false }
      : undefined,
});

try {
  const sql = await fs.readFile(schemaPath, "utf8");
  await pool.query(sql);
  console.log("PostgreSQL schema applied successfully.");
} catch (err) {
  console.error("Failed to apply PostgreSQL schema:");
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}

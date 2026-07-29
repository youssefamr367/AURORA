import { ensureDbConnection } from "./db/postgres.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    hasDatabaseUrl: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL),
    tests: {},
  };

  try {
    await ensureDbConnection();
    debugInfo.tests.connection = "success";
    res.status(200).json(debugInfo);
  } catch (err) {
    debugInfo.tests.connection = "failed";
    debugInfo.tests.connectionError = err.message;
    debugInfo.tests.connectionErrorType = err.name;
    debugInfo.tests.connectionErrorCode = err.code;
    res.status(500).json(debugInfo);
  }
}

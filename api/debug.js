export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  try {
    const debugInfo = {
      environment: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      hasDatabaseUrl: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    try {
      const mod = await import("./app.js");
      debugInfo.appImport = "success";
      debugInfo.hasEnsureDbConnection = !!mod.ensureDbConnection;

      if (mod.ensureDbConnection) {
        try {
          await mod.ensureDbConnection();
          debugInfo.dbConnection = "success";
        } catch (dbErr) {
          debugInfo.dbConnection = "failed";
          debugInfo.dbError = dbErr.message;
        }
      }
    } catch (importErr) {
      debugInfo.appImport = "failed";
      debugInfo.importError = importErr.message;
    }

    res.status(200).json(debugInfo);
  } catch (err) {
    res.status(500).json({
      error: "Debug endpoint failed",
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
}

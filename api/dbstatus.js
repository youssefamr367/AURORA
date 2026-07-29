export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    if (!(process.env.DATABASE_URL || process.env.POSTGRES_URL)) {
      return res.status(400).json({
        ok: false,
        message: "DATABASE_URL or POSTGRES_URL not set",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    }

    const mod = await import("./app.js");
    if (!mod.ensureDbConnection) {
      return res.status(500).json({
        ok: false,
        message: "ensureDbConnection not available",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    }

    const connectPromise = mod.ensureDbConnection();
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB connect timed out")), 5000)
    );
    await Promise.race([connectPromise, timeout]);

    return res.status(200).json({
      ok: true,
      message: "PostgreSQL connect succeeded",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("dbstatus error:", err && err.stack ? err.stack : err);
    return res.status(500).json({
      ok: false,
      error: err.message,
      message: "Database connection failed",
      environment: process.env.NODE_ENV,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }
}

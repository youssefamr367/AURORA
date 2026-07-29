let appInstance = null;
let ensureDbConnection = null;
let getLastConnectionError = null;
let initRoutes = null;

export default async function handler(req, res) {
  try {
    if (!appInstance || !ensureDbConnection) {
      const mod = await import("./app.js");
      appInstance = mod.default;
      ensureDbConnection = mod.ensureDbConnection;
      getLastConnectionError = mod.getLastConnectionError;
      initRoutes = mod.initRoutes;
    }

    if (initRoutes) {
      await initRoutes();
    }

    try {
      await ensureDbConnection();
    } catch (dbErr) {
      console.error(
        "DB connection failed:",
        dbErr && dbErr.stack ? dbErr.stack : dbErr
      );
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        error: "Database connection failed",
        message: "Unable to connect to PostgreSQL. Please try again later.",
        debug: {
          databaseUrlPresent: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL),
          dbErrorMessage: dbErr && dbErr.message,
          dbErrorStack: dbErr && dbErr.stack,
          lastConnectionErrorDetails:
            getLastConnectionError && getLastConnectionError(),
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Import/DB init failed:", err && err.stack ? err.stack : err);
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({
      error: err.message || "Import/DB initialization failed",
      message: "Server initialization failed. Please check configuration.",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    if (!appInstance || typeof appInstance !== "function") {
      throw new Error("Express app is not properly initialized");
    }

    return appInstance(req, res);
  } catch (err) {
    console.error(
      "Unhandled error in app handler:",
      err && err.stack ? err.stack : err
    );
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({
      error: err.message || "Internal server error",
      message: "An unexpected error occurred while processing your request.",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
}

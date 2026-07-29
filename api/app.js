import path from "path";
import { fileURLToPath } from "url";
import {
  ensureDbConnection,
  getLastConnectionError,
} from "./db/postgres.js";
import { createExpressApp } from "../shared/server/createExpressApp.js";
import { loadEnvironment } from "../shared/server/loadEnvironment.js";
import { apiRouteDefinitions } from "../shared/server/routeDefinitions.js";
import { registerRoutes } from "../shared/server/registerRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnvironment(__dirname);

const app = createExpressApp({
  debugHandler: (req, res) => {
    res.status(200).json({
      message: "Debug endpoint working",
      databaseUrl: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL),
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
    });
  },
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

let routesLoaded = false;

async function setupRoutes() {
  if (routesLoaded) return;

  try {
    const routeModules = {
      product: (await import("./routes/ProductRoute.js")).default,
      order: (await import("./routes/OrderRoute.js")).default,
      supplier: (await import("./routes/SupplierRoute.js")).default,
      fabric: (await import("./routes/FabricRoute.js")).default,
      eshra: (await import("./routes/EshraRoute.js")).default,
      painting: (await import("./routes/PaintingRoute.js")).default,
      marble: (await import("./routes/MarbleRoute.js")).default,
      glass: (await import("./routes/GlassRoute.js")).default,
    };

    registerRoutes(
      app,
      apiRouteDefinitions.map((route) => ({
        ...route,
        router: routeModules[route.key],
      })),
      console
    );

    routesLoaded = true;
    console.log("All PostgreSQL-backed routes registered successfully");
  } catch (err) {
    console.error("Error registering routes:", err.message);
    console.error("Error stack:", err.stack);
    routesLoaded = false;
  }
}

export async function initRoutes() {
  await setupRoutes();
}

export { ensureDbConnection, getLastConnectionError };

export default app;

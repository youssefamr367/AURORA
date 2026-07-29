import express from "express";
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
  requestLogger: (req) => console.log(`[${req.method}] ${req.path}`),
});

import ProductRoutes from "./routes/ProductRoute.js";
import OrderRoutes from "./routes/OrderRoute.js";
import SupplierRoutes from "./routes/SupplierRoute.js";
import FabricRoutes from "./routes/FabricRoute.js";
import EshraRoutes from "./routes/EshraRoute.js";
import PaintingRoutes from "./routes/PaintingRoute.js";
import MarbleRoutes from "./routes/MarbleRoute.js";
import GlassRoutes from "./routes/GlassRoute.js";

registerRoutes(
  app,
  [
    { ...apiRouteDefinitions[0], router: ProductRoutes },
    { ...apiRouteDefinitions[1], router: OrderRoutes },
    { ...apiRouteDefinitions[2], router: SupplierRoutes },
    { ...apiRouteDefinitions[3], router: FabricRoutes },
    { ...apiRouteDefinitions[4], router: EshraRoutes },
    { ...apiRouteDefinitions[5], router: PaintingRoutes },
    { ...apiRouteDefinitions[6], router: MarbleRoutes },
    { ...apiRouteDefinitions[7], router: GlassRoutes },
  ],
  console
);

if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(distPath));
  app.get("/*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export { ensureDbConnection, getLastConnectionError };

export default app;

if (!process.env.VERCEL) {
  ensureDbConnection().catch((err) => {
    console.error("PostgreSQL connection failed:", err.message);
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

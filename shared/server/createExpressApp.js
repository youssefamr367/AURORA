import cors from "cors";
import express from "express";

export function createExpressApp({ requestLogger, debugHandler } = {}) {
  const app = express();

  app.use(express.json());

  const corsOptions = {
    origin:
      process.env.NODE_ENV === "production"
        ? [process.env.FRONTEND_URL, "https://*.vercel.app"]
        : "http://localhost:5173",
    credentials: true,
  };

  app.use(cors(corsOptions));

  if (requestLogger) {
    app.use((req, res, next) => {
      requestLogger(req);
      next();
    });
  }

  if (debugHandler) {
    app.get("/api/debug", debugHandler);
  }

  return app;
}

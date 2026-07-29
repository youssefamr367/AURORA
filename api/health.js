export default function handler(req, res) {
  console.log("health check invoked", { method: req.method, url: req.url });
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    hasDatabaseUrl: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL),
    timestamp: new Date().toISOString(),
  });
}

import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { createExpressApp } from "../../shared/server/createExpressApp.js";
import { registerRoutes } from "../../shared/server/registerRoutes.js";

async function withServer(app, run) {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });

  try {
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("createExpressApp mounts JSON and optional debug route", async () => {
  const app = createExpressApp({
    debugHandler: (req, res) => {
      res.json({ ok: true });
    },
  });

  app.post("/echo", (req, res) => {
    res.json(req.body);
  });

  await withServer(app, async (baseUrl) => {
    const debugResponse = await fetch(`${baseUrl}/api/debug`);
    assert.equal(debugResponse.status, 200);
    assert.deepEqual(await debugResponse.json(), { ok: true });

    const echoResponse = await fetch(`${baseUrl}/echo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: 42 }),
    });

    assert.equal(echoResponse.status, 200);
    assert.deepEqual(await echoResponse.json(), { value: 42 });
  });
});

test("registerRoutes mounts each router and logs mount progress", async () => {
  const app = express();
  const router = express.Router();
  const logs = [];
  const errors = [];

  router.get("/ping", (req, res) => {
    res.json({ pong: true });
  });

  registerRoutes(
    app,
    [{ label: "PingRoutes", path: "/api/ping", router }],
    {
      log: (...args) => logs.push(args.join(" ")),
      error: (...args) => errors.push(args.join(" ")),
    }
  );

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/ping/ping`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { pong: true });
  });

  assert.equal(errors.length, 0);
  assert.ok(logs.some((entry) => entry.includes("Registering route: PingRoutes")));
  assert.ok(logs.some((entry) => entry.includes("Mounted PingRoutes")));
});

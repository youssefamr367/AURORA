import express from "express";
import { createLookupController } from "./lookup.controller.js";

export function createLookupRouter(config) {
  const controller = createLookupController(config);
  const router = express.Router();

  router.post("/create", controller.create);
  router.get("/all", controller.list);
  router.delete("/:id", controller.remove);

  return router;
}

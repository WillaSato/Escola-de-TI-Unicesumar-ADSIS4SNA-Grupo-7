import { Router, type RequestHandler } from "express";
import { productController } from "./controller.js";
import type { ProductService } from "./service.js";

export function productRoutes(service: ProductService, authenticate: RequestHandler) {
  const router = Router();
  const controller = productController(service);

  router.use(authenticate);
  router.get("/", controller.list);
  router.get("/:id", controller.get);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.archive);
  router.post("/:id/restore", controller.restore);
  return router;
}

import express from "express";
import type { Pool } from "pg";
import { authRoutes } from "./auth/routes.js";
import { AuthService } from "./auth/service.js";
import { authenticate, rejectCrossSiteWrite } from "./auth/middleware.js";
import { handleError, HttpError } from "./http/errors.js";
import { ProductRepository } from "./products/repository.js";
import { productRoutes } from "./products/routes.js";
import { ProductService } from "./products/service.js";

export function createApp(database: Pool, secureCookie: boolean) {
  const app = express();
  const auth = new AuthService(database);
  const requireSession = authenticate(auth);
  const products = new ProductService(new ProductRepository(database));

  app.disable("x-powered-by");
  app.use("/api", (_request, response, next) => {
    response.set("Cache-Control", "no-store");
    next();
  }, rejectCrossSiteWrite, express.json({ limit: "12kb" }));
  app.get("/api/health", async (_request, response) => {
    await database.query("SELECT 1");
    response.json({ status: "ok" });
  });
  app.use("/api/auth", authRoutes(auth, requireSession, secureCookie));
  app.use("/api/products", productRoutes(products, requireSession));
  app.use((_request, _response, next) => next(new HttpError(404, "Rota não encontrada.")));
  app.use(handleError);
  return app;
}

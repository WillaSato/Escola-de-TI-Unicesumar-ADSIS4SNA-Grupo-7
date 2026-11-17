import type { Request, Response } from "express";
import { sessionUser } from "../auth/middleware.js";
import type { ProductService } from "./service.js";
import { readFilter, readId, readProduct } from "./validation.js";

export function productController(products: ProductService) {
  return {
    list: async (request: Request, response: Response) => {
      response.json(await products.list(sessionUser(response).id, readFilter(request.query)));
    },
    get: async (request: Request<{ id: string }>, response: Response) => {
      response.json(await products.get(sessionUser(response).id, readId(request.params.id)));
    },
    create: async (request: Request, response: Response) => {
      const product = await products.create(sessionUser(response).id, readProduct(request.body));
      response.location("/api/products/" + product.id).status(201).json(product);
    },
    update: async (request: Request<{ id: string }>, response: Response) => {
      const product = await products.update(sessionUser(response).id, readId(request.params.id), readProduct(request.body));
      response.json(product);
    },
    archive: async (request: Request<{ id: string }>, response: Response) => {
      await products.archive(sessionUser(response).id, readId(request.params.id));
      response.status(204).end();
    },
    restore: async (request: Request<{ id: string }>, response: Response) => {
      response.json(await products.restore(sessionUser(response).id, readId(request.params.id)));
    },
  };
}

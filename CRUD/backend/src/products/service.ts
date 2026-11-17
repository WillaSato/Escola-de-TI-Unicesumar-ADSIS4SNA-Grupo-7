import { HttpError } from "../http/errors.js";
import type { ProductFilter, ProductInput, ProductRow } from "./model.js";
import type { ProductRepository } from "./repository.js";
import { today } from "./validation.js";

function present(row: ProductRow, date: string) {
  const daysToExpiry = row.warrantyUntil
    ? (Date.parse(row.warrantyUntil) - Date.parse(date)) / 86_400_000
    : null;
  return {
    ...row,
    warrantyStatus: daysToExpiry === null ? "none" : daysToExpiry < 0 ? "expired" : "active",
    daysToExpiry,
  };
}

function found(row: ProductRow | undefined): ProductRow {
  if (!row) throw new HttpError(404, "Produto não encontrado.");
  return row;
}

function translateDuplicate(error: unknown): never {
  const databaseError = error as { code?: string; constraint?: string } | null;
  if (databaseError?.code === "23505" && databaseError.constraint === "products_active_duplicate") {
    throw new HttpError(409, "Já existe um produto ativo com este nome, categoria e data da compra.");
  }
  throw error;
}

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async list(ownerId: number, filter: ProductFilter) {
    const date = today();
    return (await this.repository.list(ownerId, filter)).map(row => present(row, date));
  }

  async get(ownerId: number, id: number) {
    return present(found(await this.repository.find(ownerId, id)), today());
  }

  async create(ownerId: number, input: ProductInput) {
    const row = await this.repository.create(ownerId, input).catch(translateDuplicate);
    return present(row, today());
  }

  async update(ownerId: number, id: number, input: ProductInput) {
    const row = await this.repository.update(ownerId, id, input).catch(translateDuplicate);
    if (row) return present(row, today());
    const existing = found(await this.repository.find(ownerId, id));
    if (existing.archivedAt) throw new HttpError(409, "Restaure o produto antes de editá-lo.");
    throw new HttpError(409, "O estado do produto mudou. Recarregue e tente novamente.");
  }

  async archive(ownerId: number, id: number) {
    found(await this.repository.setArchived(ownerId, id, true));
  }

  async restore(ownerId: number, id: number) {
    const row = await this.repository.setArchived(ownerId, id, false).catch(translateDuplicate);
    return present(found(row), today());
  }
}

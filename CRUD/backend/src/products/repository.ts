import type { Pool } from "pg";
import { productNameKey, type ProductFilter, type ProductInput, type ProductRow } from "./model.js";

const fields = 'id, name, category, purchase_date::text AS "purchaseDate", warranty_until::text AS "warrantyUntil", archived_at AS "archivedAt"';

export class ProductRepository {
  constructor(private readonly db: Pool) {}

  async list(ownerId: number, filter: ProductFilter) {
    const result = await this.db.query(
      `SELECT ${fields} FROM products WHERE owner_id = $1 AND (archived_at IS NOT NULL) = $2 AND ($3::text IS NULL OR category = $3) ORDER BY purchase_date DESC, id DESC`,
      [ownerId, filter.archived, filter.category],
    );
    return result.rows;
  }

  async find(ownerId: number, id: number) {
    const result = await this.db.query(
      `SELECT ${fields} FROM products WHERE owner_id = $1 AND id = $2`,
      [ownerId, id],
    );
    return result.rows[0];
  }

  async create(ownerId: number, input: ProductInput) {
    const result = await this.db.query(
      `INSERT INTO products (owner_id, name, category, purchase_date, warranty_until, name_key) VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${fields}`,
      [ownerId, input.name, input.category, input.purchaseDate, input.warrantyUntil, productNameKey(input.name)],
    );
    return result.rows[0];
  }

  async update(ownerId: number, id: number, input: ProductInput) {
    const result = await this.db.query(
      `UPDATE products SET name = $3, category = $4, purchase_date = $5, warranty_until = $6, name_key = $7 WHERE owner_id = $1 AND id = $2 AND archived_at IS NULL RETURNING ${fields}`,
      [ownerId, id, input.name, input.category, input.purchaseDate, input.warrantyUntil, productNameKey(input.name)],
    );
    return result.rows[0];
  }

  async setArchived(ownerId: number, id: number, archived: boolean) {
    const result = await this.db.query(
      `UPDATE products SET archived_at = CASE WHEN $3::boolean THEN COALESCE(archived_at, now()) ELSE NULL END WHERE owner_id = $1 AND id = $2 RETURNING ${fields}`,
      [ownerId, id, archived],
    );
    return result.rows[0];
  }
}

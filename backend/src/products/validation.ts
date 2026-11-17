import { HttpError } from "../http/errors.js";
import { categories, type Category, type ProductInput } from "./model.js";

const SaoPauloDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" });

export function today() {
  return SaoPauloDate.format(new Date());
}

function isoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function categoryName(value: unknown): value is Category {
  return categories.some(category => category === value);
}

export function readProduct(value: unknown): ProductInput {
  const payload = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const category = categoryName(payload.category) ? payload.category : null;
  const purchaseDate = isoDate(payload.purchaseDate) ? payload.purchaseDate : null;
  const warrantyUntil = isoDate(payload.warrantyUntil) ? payload.warrantyUntil : null;
  const fields: Record<string, string> = {};

  if (!name || Array.from(name).length > 90 || /[\x00-\x1F\x7F]/.test(name)) {
    fields.name = "Informe um nome válido de até 90 caracteres.";
  }
  if (!category) fields.category = "Selecione uma categoria.";
  if (!purchaseDate || purchaseDate > today()) fields.purchaseDate = "Informe uma data de compra válida, até hoje.";
  if (payload.warrantyUntil != null && payload.warrantyUntil !== "" && !warrantyUntil) {
    fields.warrantyUntil = "Informe uma data de vencimento válida.";
  } else if (warrantyUntil && purchaseDate && warrantyUntil < purchaseDate) {
    fields.warrantyUntil = "A garantia deve vencer na data da compra ou depois.";
  }

  if (Object.keys(fields).length || !category || !purchaseDate) {
    throw new HttpError(400, "Revise os campos indicados.", fields);
  }
  return { name, category, purchaseDate, warrantyUntil };
}

export function readId(value: string) {
  const id = Number(value);
  if (!/^\d+$/.test(value) || !Number.isInteger(id) || id < 1 || id > 2_147_483_647) {
    throw new HttpError(400, "Identificador de produto inválido.");
  }
  return id;
}

export function readFilter(query: Record<string, unknown>) {
  const archived = query.archived ?? "false";
  const category = query.category ?? null;
  if (archived !== "true" && archived !== "false") throw new HttpError(400, "Filtro de arquivamento inválido.");
  if (category !== null && !categoryName(category)) throw new HttpError(400, "Categoria inválida.");
  return { archived: archived === "true", category };
}

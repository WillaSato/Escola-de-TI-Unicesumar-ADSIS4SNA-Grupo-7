export const categories = ["Eletrônicos", "Eletrodomésticos", "Casa", "Outros"] as const;
export type Category = typeof categories[number];

export interface ProductInput {
  name: string;
  category: Category;
  purchaseDate: string;
  warrantyUntil: string | null;
}

export interface Product extends ProductInput {
  id: number;
  archivedAt: string | null;
  warrantyStatus: "active" | "expired" | "none";
  daysToExpiry: number | null;
}

export function dateLabel(value: string | null) {
  return value ? value.split("-").reverse().join("/") : "—";
}

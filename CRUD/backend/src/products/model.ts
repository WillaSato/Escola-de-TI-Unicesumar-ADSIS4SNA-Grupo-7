export const categories = ["Eletrônicos", "Eletrodomésticos", "Casa", "Outros"] as const;

export type Category = typeof categories[number];

export function productNameKey(name: string) {
  return name.trim().toLocaleLowerCase("pt-BR").normalize("NFC");
}

export interface ProductInput {
  name: string;
  category: Category;
  purchaseDate: string;
  warrantyUntil: string | null;
}

export interface ProductRow extends ProductInput {
  id: number;
  archivedAt: Date | null;
}

export interface ProductFilter {
  archived: boolean;
  category: Category | null;
}

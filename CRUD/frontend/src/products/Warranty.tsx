import type { Product } from "./model";

const labels = { active: "Ativa", expired: "Vencida", none: "Sem garantia" };

export function Warranty({ status }: { status: Product["warrantyStatus"] }) {
  return <span className={"warranty " + status}>{labels[status]}</span>;
}

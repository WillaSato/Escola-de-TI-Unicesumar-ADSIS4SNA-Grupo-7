import { ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { User } from "../auth/session";
import { useResource } from "../lib/useResource";
import { Feedback } from "../ui/Feedback";
import { dateLabel, type Product } from "./model";

const alertWindow = 30;

export function Dashboard({ user }: { user: User }) {
  const result = useResource<Product[]>("/products");

  return <>
    <header className="screen-header">
      <div><p className="breadcrumb">Meu espaço / Dashboard</p><h1>Olá, {user.name.split(" ")[0]}</h1></div>
    </header>
    <section className="feature">
      <div><h2>Produtos e garantias</h2><p>Confira as datas de vencimento das garantias de suas compras.</p></div>
      <Link className="button feature-action" to="/produtos">Ver produtos<ArrowRight size={17} /></Link>
    </section>
    {result.status === "loading" && <Feedback />}
    {result.status === "error" && <Feedback error={result.error} onRetry={result.retry} />}
    {result.status === "success" && <Overview products={result.data} />}
  </>;
}

function Overview({ products }: { products: Product[] }) {
  const active = products.filter(product => product.warrantyStatus === "active");
  const upcoming = active
    .filter(product => product.daysToExpiry !== null && product.daysToExpiry <= alertWindow)
    .sort((left, right) => (left.daysToExpiry ?? 0) - (right.daysToExpiry ?? 0));
  return <div className="dashboard-grid">
    <section className="panel">
      <h2>Vencem nos próximos {alertWindow} dias</h2>
      {upcoming.length === 0 && <p className="muted">Nenhuma garantia vence nesse período.</p>}
      {upcoming.slice(0, 5).map(product => <Link key={product.id} className="expiry-row" to={"/produtos/" + product.id}>
        <span><strong>{product.name}</strong><small>Garantia até {dateLabel(product.warrantyUntil)}</small></span>
        <ChevronRight size={17} aria-hidden="true" />
      </Link>)}
      {upcoming.length > 5 && <Link className="back-link" to="/produtos">Ver lista completa</Link>}
    </section>
    <section className="panel">
      <h2>Minhas compras</h2>
      <dl className="facts dashboard-facts">
        <div><dt>Produtos na lista principal</dt><dd>{products.length}</dd></div>
        <div><dt>Garantias ativas</dt><dd>{active.length}</dd></div>
      </dl>
    </section>
  </div>;
}

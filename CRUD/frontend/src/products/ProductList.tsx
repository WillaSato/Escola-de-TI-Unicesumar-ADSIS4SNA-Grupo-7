import { ChevronRight, Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useResource } from "../lib/useResource";
import { Feedback } from "../ui/Feedback";
import { categories, dateLabel, type Product } from "./model";
import { Warranty } from "./Warranty";

export function ProductList() {
  const [params, setParams] = useSearchParams();
  const archived = params.get("archived") === "true";
  const category = categories.find(value => value === params.get("category")) ?? "";
  const query = new URLSearchParams({ archived: String(archived) });
  if (category) query.set("category", category);
  const result = useResource<Product[]>("/products?" + query);

  function updateFilters(showArchived: boolean, selectedCategory: string) {
    const next = new URLSearchParams();
    if (showArchived) next.set("archived", "true");
    if (selectedCategory) next.set("category", selectedCategory);
    setParams(next);
  }

  return <>
    <header className="screen-header">
      <div><p className="breadcrumb">Meu espaço / Produtos</p><h1>Produtos e garantias</h1></div>
      <Link className="button primary" to="/produtos/novo"><Plus size={17} />Novo produto</Link>
    </header>
    <div className="filters">
      <div className="segments" role="group" aria-label="Listagem">
        <button type="button" aria-pressed={!archived} onClick={() => updateFilters(false, category)}>Ativos</button>
        <button type="button" aria-pressed={archived} onClick={() => updateFilters(true, category)}>Arquivados</button>
      </div>
      <select aria-label="Filtrar por categoria" value={category} onChange={event => updateFilters(archived, event.target.value)}>
        <option value="">Todas as categorias</option>
        {categories.map(option => <option key={option}>{option}</option>)}
      </select>
    </div>
    {result.status === "loading" && <Feedback />}
    {result.status === "error" && <Feedback error={result.error} onRetry={result.retry} />}
    {result.status === "success" && <div className="panel product-list">
      <div className="product-row list-heading" aria-hidden="true">
        <span>Produto</span><span className="purchase-column">Compra</span><span>Garantia</span><span />
      </div>
      {result.data.map(product => <Link to={"/produtos/" + product.id} key={product.id} className="product-row"
        state={{ listUrl: "/produtos?" + params.toString() }}>
        <span className="product-name"><strong>{product.name}</strong>
          <small>{product.category}<span className="mobile-date"> · {dateLabel(product.purchaseDate)}</span></small>
        </span>
        <time className="purchase-column" dateTime={product.purchaseDate}>{dateLabel(product.purchaseDate)}</time>
        <Warranty status={product.warrantyStatus} />
        <ChevronRight size={17} aria-hidden="true" />
      </Link>)}
      {result.data.length === 0 && <p className="empty">{category
        ? "Nenhum produto encontrado nesta categoria."
        : archived ? "Nenhum produto arquivado." : "Cadastre seu primeiro produto para acompanhar a garantia."}</p>}
    </div>}
  </>;
}

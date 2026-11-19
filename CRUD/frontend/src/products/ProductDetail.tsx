import { Archive, ArrowLeft, Pencil, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api, messageOf } from "../lib/api";
import { useResource } from "../lib/useResource";
import { Feedback } from "../ui/Feedback";
import { ArchiveDialog } from "./ArchiveDialog";
import { dateLabel, type Product } from "./model";
import { Warranty } from "./Warranty";

export function ProductDetail() {
  const { id } = useParams();
  const location = useLocation();
  const result = useResource<Product>("/products/" + encodeURIComponent(id ?? ""));
  return <>
    <Link className="back-link" to={location.state?.listUrl ?? "/produtos"}><ArrowLeft size={16} />Produtos e garantias</Link>
    {result.status === "loading" && <Feedback />}
    {result.status === "error" && <Feedback error={result.error} onRetry={result.retry} />}
    {result.status === "success" && <DetailContent key={result.data.id + ":" + result.data.archivedAt}
      product={result.data} onRestore={result.retry} />}
  </>;
}

function DetailContent({ product, onRestore }: { product: Product; onRestore: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function restore() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await api<Product>("/products/" + product.id + "/restore", { method: "POST" });
      navigate("/produtos/" + product.id, { replace: true, state: { message: "Produto restaurado." } });
      onRestore();
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setPending(false);
    }
  }

  return <>
    <header className="screen-header">
      <div><h1>{product.name}</h1><p className="muted">{product.archivedAt ? "Produto arquivado" : product.category}</p></div>
      {product.archivedAt
        ? <button className="button primary" type="button" onClick={restore} disabled={pending}><RotateCcw size={16} />{pending ? "Restaurando…" : "Restaurar"}</button>
        : <Link className="button primary" to={"/produtos/" + product.id + "/editar"}><Pencil size={16} />Editar</Link>}
    </header>
    {error && <p className="error-text" role="alert">{error}</p>}
    <div className="detail-grid">
      <section className="panel">
        <h2>Dados da compra</h2>
        <dl className="facts">
          <div><dt>Categoria</dt><dd>{product.category}</dd></div>
          <div><dt>Data da compra</dt><dd><time dateTime={product.purchaseDate}>{dateLabel(product.purchaseDate)}</time></dd></div>
        </dl>
      </section>
      <section className="panel">
        <h2>Garantia</h2>
        <Warranty status={product.warrantyStatus} />
        {product.warrantyUntil
          ? <div className="warranty-date"><p className="muted">Data de vencimento</p><time dateTime={product.warrantyUntil}>{dateLabel(product.warrantyUntil)}</time></div>
          : <p className="warranty-date muted">Nenhuma data de vencimento informada.</p>}
      </section>
    </div>
    {!product.archivedAt && <button className="button archive-action" type="button" onClick={() => setConfirming(true)}>
      <Archive size={16} />Arquivar produto
    </button>}
    {confirming && <ArchiveDialog product={product} onCancel={() => setConfirming(false)} />}
  </>;
}

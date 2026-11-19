import { ArrowLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError, messageOf } from "../lib/api";
import { useResource } from "../lib/useResource";
import { Feedback } from "../ui/Feedback";
import { categories, type Product, type ProductInput } from "./model";
import "./form.css";

export function ProductEdit() {
  const { id } = useParams();
  const result = useResource<Product>("/products/" + encodeURIComponent(id ?? ""));
  if (result.status === "loading") return <Feedback />;
  if (result.status === "error") return <Feedback error={result.error} onRetry={result.retry} />;
  if (result.data.archivedAt) return <section className="panel feedback">
    <p>Restaure o produto antes de editá-lo.</p>
    <Link to={"/produtos/" + result.data.id}>Voltar aos detalhes</Link>
  </section>;
  return <ProductForm key={result.data.id} product={result.data} />;
}

export function ProductForm({ product }: { product?: Product }) {
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const returnTo = product ? "/produtos/" + product.id : "/produtos";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const input: ProductInput = {
      name: String(data.get("name") ?? "").trim(),
      category: data.get("category") as ProductInput["category"],
      purchaseDate: String(data.get("purchaseDate") ?? ""),
      warrantyUntil: String(data.get("warrantyUntil") ?? "") || null,
    };
    setFields({});
    setError("");
    setPending(true);
    try {
      const saved = await api<Product>(product ? "/products/" + product.id : "/products", {
        method: product ? "PUT" : "POST",
        json: input,
      });
      navigate("/produtos/" + saved.id, { replace: true, state: { message: product ? "Alterações salvas." : "Produto cadastrado." } });
    } catch (failure) {
      setError(messageOf(failure));
      if (failure instanceof ApiError) setFields(failure.fields);
    } finally {
      setPending(false);
    }
  }

  function field(name: keyof ProductInput) {
    return { name, "aria-invalid": Boolean(fields[name]), "aria-describedby": fields[name] ? name + "-error" : undefined };
  }

  function fieldError(name: keyof ProductInput) {
    return fields[name] && <span id={name + "-error"} className="error-text field-error">{fields[name]}</span>;
  }

  return <>
    <Link className="back-link" to={returnTo}><ArrowLeft size={16} />{product ? "Detalhes do produto" : "Produtos e garantias"}</Link>
    <header className="screen-header"><h1>{product ? "Editar produto" : "Novo produto"}</h1></header>
    <form className="panel product-form" onSubmit={submit}>
      <label>Nome do produto
        <input {...field("name")} defaultValue={product?.name ?? ""} required maxLength={90} placeholder="Ex.: Notebook IdeaPad 5" />
        {fieldError("name")}
      </label>
      <label><span id="product-category-label">Categoria</span>
        <select {...field("category")} aria-labelledby="product-category-label" defaultValue={product?.category ?? ""} required>
          <option value="">Selecione uma categoria</option>
          {categories.map(category => <option key={category}>{category}</option>)}
        </select>
        {fieldError("category")}
      </label>
      <div className="form-columns">
        <label>Data da compra
          <input {...field("purchaseDate")} type="date" defaultValue={product?.purchaseDate ?? ""} required />
          {fieldError("purchaseDate")}
        </label>
        <label><span>Vencimento da garantia <span className="muted">(opcional)</span></span>
          <input {...field("warrantyUntil")} type="date" defaultValue={product?.warrantyUntil ?? ""} />
          {fieldError("warrantyUntil")}
        </label>
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
      <div className="form-actions">
        <Link className="button" to={returnTo}>Cancelar</Link>
        <button className="button primary" disabled={pending}>{pending ? "Salvando…" : product ? "Salvar alterações" : "Cadastrar produto"}</button>
      </div>
    </form>
  </>;
}

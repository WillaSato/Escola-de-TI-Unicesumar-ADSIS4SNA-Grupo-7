import { Archive } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, messageOf } from "../lib/api";
import type { Product } from "./model";
import "./form.css";

export function ArchiveDialog({ product, onCancel }: { product: Product; onCancel: () => void }) {
  const element = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const dialog = element.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  async function archive() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await api<void>("/products/" + product.id, { method: "DELETE" });
      navigate("/produtos", { replace: true, state: { message: "Produto arquivado." } });
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setPending(false);
    }
  }

  return <dialog ref={element} className="archive-dialog" aria-labelledby="archive-title" aria-describedby="archive-description"
    onCancel={event => { event.preventDefault(); if (!pending) onCancel(); }}>
    <Archive size={22} aria-hidden="true" />
    <h2 id="archive-title">Arquivar produto?</h2>
    <p id="archive-description"><strong>{product.name}</strong> sairá da lista principal. Você poderá restaurá-lo em Arquivados.</p>
    {error && <p className="error-text" role="alert">{error}</p>}
    <div className="form-actions">
      <button className="button" type="button" autoFocus onClick={onCancel} disabled={pending}>Cancelar</button>
      <button className="button primary" type="button" onClick={archive} disabled={pending}>{pending ? "Arquivando…" : "Arquivar produto"}</button>
    </div>
  </dialog>;
}

import { messageOf } from "../lib/api";

export function Feedback({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  if (!error) return <div className="panel feedback" role="status">Carregando…</div>;
  return <div className="panel feedback" role="alert">
    <p>{messageOf(error)}</p>
    {onRetry && <button type="button" className="button" onClick={onRetry}>Tentar novamente</button>}
  </div>;
}

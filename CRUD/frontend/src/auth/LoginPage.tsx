import { ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api, messageOf } from "../lib/api";
import { Brand } from "../ui/Brand";
import type { User } from "./session";
import "./login.css";

export function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      onLogin(await api<User>("/auth/login", { method: "POST", json: { email, password } }));
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login">
      <section className="login-identity">
        <Brand />
        <div className="login-orbit" aria-hidden="true" />
        <p>Suas compras e garantias em um só lugar</p>
      </section>
      <section className="login-access">
        <form className="login-form" onSubmit={submit}>
          <h1>Entrar no LifeHub</h1>
          <label>E-mail
            <input type="email" autoComplete="username" name="email" required maxLength={254}
              value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@exemplo.com" />
          </label>
          <label>Senha
            <input type="password" autoComplete="current-password" name="password" required maxLength={128}
              value={password} onChange={event => setPassword(event.target.value)} />
          </label>
          {error && <p className="error-text" role="alert">{error}</p>}
          <button className="button primary" disabled={pending}>{pending ? "Entrando…" : "Entrar"}<ArrowRight size={16} /></button>
        </form>
      </section>
    </main>
  );
}

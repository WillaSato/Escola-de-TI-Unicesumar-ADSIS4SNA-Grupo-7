import { useEffect, useState } from "react";
import { Boxes, LayoutDashboard, LogOut } from "lucide-react";
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { LoginPage } from "./auth/LoginPage";
import type { User } from "./auth/session";
import { api, ApiError, messageOf, sessionExpiredEvent } from "./lib/api";
import { useResource } from "./lib/useResource";
import { Dashboard } from "./products/Dashboard";
import { ProductDetail } from "./products/ProductDetail";
import { ProductEdit, ProductForm } from "./products/ProductForm";
import { ProductList } from "./products/ProductList";
import { Brand } from "./ui/Brand";
import { Feedback } from "./ui/Feedback";

export function App() {
  const session = useResource<User>("/auth/me");
  const [override, setOverride] = useState<User | null>();
  const signedOut = session.status === "error" && session.error instanceof ApiError && session.error.status === 401;
  useEffect(() => {
    const signOut = () => setOverride(null);
    window.addEventListener(sessionExpiredEvent, signOut);
    return () => window.removeEventListener(sessionExpiredEvent, signOut);
  }, []);

  if (override === undefined && session.status === "loading") {
    return <main className="boot"><Feedback /></main>;
  }
  if (override === undefined && session.status === "error" && !signedOut) {
    return <main className="boot"><Feedback error={session.error} onRetry={session.retry} /></main>;
  }
  const user = override !== undefined ? override : session.status === "success" ? session.data : null;
  if (!user) {
    return <Routes>
      <Route path="/login" element={<LoginPage onLogin={setOverride} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>;
  }

  return <Routes>
    <Route element={<Shell user={user} onLogout={() => setOverride(null)} />}>
      <Route index element={<Dashboard user={user} />} />
      <Route path="produtos" element={<ProductList />} />
      <Route path="produtos/novo" element={<ProductForm />} />
      <Route path="produtos/:id" element={<ProductDetail />} />
      <Route path="produtos/:id/editar" element={<ProductEdit />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

function Shell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const initial = user.name.split(/\s+/).slice(0, 2).map(word => word[0]).join("");
  const location = useLocation();

  async function logout() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await api<void>("/auth/logout", { method: "POST" });
      onLogout();
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setPending(false);
    }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <Brand />
      <nav aria-label="Menu principal">
        <NavLink to="/" end><LayoutDashboard size={17} />Dashboard</NavLink>
        <NavLink to="/produtos"><Boxes size={17} />Produtos e garantias</NavLink>
      </nav>
      <div className="account">
        <span className="avatar" aria-hidden="true">{initial}</span>
        <span className="account-name">{user.name}</span>
        <button type="button" aria-label="Sair da conta" className="icon-button" onClick={logout} disabled={pending}>
          <LogOut size={17} />
        </button>
      </div>
    </aside>
    <main className="workspace">
      {error && <p className="error-text" role="alert">{error}</p>}
      {location.state?.message && <p className="notice" role="status">{location.state.message}</p>}
      <Outlet />
    </main>
  </div>;
}

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "./styles.css";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("Elemento raiz não encontrado.");
createRoot(root).render(<BrowserRouter><App /></BrowserRouter>);

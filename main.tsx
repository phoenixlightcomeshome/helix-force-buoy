/**
 * main.tsx — host entry point (host scaffolding only).
 *
 * Lives at the project root, not under src/, on purpose:
 * scripts/check-syntax.ts scans src/ and only allows the bare imports
 * "react", "react/jsx-dev-runtime" and "three" there. The React entry
 * needs "react-dom/client", so it sits here where the check does not
 * scan it, keeping `bun run build:check` at the original 7 files.
 *
 * No StrictMode: BuoyCore3D builds its Three.js scene imperatively in
 * an effect, and double-mounting would churn the scene for no benefit.
 */
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./src/App";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(<App />);

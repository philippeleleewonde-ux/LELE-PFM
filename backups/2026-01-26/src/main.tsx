import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";

// 🔍 CRITICAL: Initialize Sentry BEFORE React renders
// This ensures all errors are captured from the very first render
initSentry();

createRoot(document.getElementById("root")!).render(<App />);

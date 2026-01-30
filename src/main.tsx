import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { initParticleBackground } from "./lib/particles";

// 🔍 CRITICAL: Initialize Sentry BEFORE React renders
initSentry();

// 🎨 Initialize particle background animation (v3.1.0)
// Canvas transparent + Toggle support + Config externalisée
initParticleBackground();

createRoot(document.getElementById("root")!).render(<App />);

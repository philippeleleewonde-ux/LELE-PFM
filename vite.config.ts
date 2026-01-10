import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // ✅ Exclure pdfjs-dist et tesseract.js de la pré-optimisation Vite
    // Ces bibliothèques utilisent des Web Workers qui causent des problèmes avec esbuild
    exclude: ['pdfjs-dist'],
    include: ['tesseract.js'],
  },
  worker: {
    // ✅ Configuration pour les Web Workers (pdfjs-dist, tesseract.js)
    format: 'es',
  },
  build: {
    // ✅ Optimisation du bundle avec manual chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // ✅ Vendor chunks : séparer les grosses dépendances
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
    // ✅ Augmenter la limite de warning (temporaire, pour éviter le spam)
    chunkSizeWarningLimit: 600,
    // ✅ Utiliser esbuild (plus rapide que terser et déjà inclus dans Vite)
    minify: 'esbuild',
  },
}));

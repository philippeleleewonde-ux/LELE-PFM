// vite.config.ts
import { defineConfig } from "file:///sessions/festive-quirky-mccarthy/mnt/HCM-PORTAL%20V2/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/festive-quirky-mccarthy/mnt/HCM-PORTAL%20V2/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///sessions/festive-quirky-mccarthy/mnt/HCM-PORTAL%20V2/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/sessions/festive-quirky-mccarthy/mnt/HCM-PORTAL V2";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  optimizeDeps: {
    // ✅ Exclure pdfjs-dist et tesseract.js de la pré-optimisation Vite
    // Ces bibliothèques utilisent des Web Workers qui causent des problèmes avec esbuild
    exclude: ["pdfjs-dist"],
    include: ["tesseract.js"]
  },
  worker: {
    // ✅ Configuration pour les Web Workers (pdfjs-dist, tesseract.js)
    format: "es"
  },
  build: {
    // ✅ Optimisation du bundle avec manual chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // ✅ Vendor chunks : séparer les grosses dépendances
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-slot"
          ],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          "vendor-charts": ["recharts"],
          "vendor-utils": ["date-fns", "clsx", "tailwind-merge", "class-variance-authority"]
        }
      }
    },
    // ✅ Augmenter la limite de warning (temporaire, pour éviter le spam)
    chunkSizeWarningLimit: 600,
    // ✅ Utiliser esbuild (plus rapide que terser et déjà inclus dans Vite)
    minify: "esbuild"
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvZmVzdGl2ZS1xdWlya3ktbWNjYXJ0aHkvbW50L0hDTS1QT1JUQUwgVjJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9zZXNzaW9ucy9mZXN0aXZlLXF1aXJreS1tY2NhcnRoeS9tbnQvSENNLVBPUlRBTCBWMi92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vc2Vzc2lvbnMvZmVzdGl2ZS1xdWlya3ktbWNjYXJ0aHkvbW50L0hDTS1QT1JUQUwlMjBWMi92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gXCJsb3ZhYmxlLXRhZ2dlclwiO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogXCI6OlwiLFxuICAgIHBvcnQ6IDgwODAsXG4gIH0sXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCldLmZpbHRlcihCb29sZWFuKSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICAvLyBcdTI3MDUgRXhjbHVyZSBwZGZqcy1kaXN0IGV0IHRlc3NlcmFjdC5qcyBkZSBsYSBwclx1MDBFOS1vcHRpbWlzYXRpb24gVml0ZVxuICAgIC8vIENlcyBiaWJsaW90aFx1MDBFOHF1ZXMgdXRpbGlzZW50IGRlcyBXZWIgV29ya2VycyBxdWkgY2F1c2VudCBkZXMgcHJvYmxcdTAwRThtZXMgYXZlYyBlc2J1aWxkXG4gICAgZXhjbHVkZTogWydwZGZqcy1kaXN0J10sXG4gICAgaW5jbHVkZTogWyd0ZXNzZXJhY3QuanMnXSxcbiAgfSxcbiAgd29ya2VyOiB7XG4gICAgLy8gXHUyNzA1IENvbmZpZ3VyYXRpb24gcG91ciBsZXMgV2ViIFdvcmtlcnMgKHBkZmpzLWRpc3QsIHRlc3NlcmFjdC5qcylcbiAgICBmb3JtYXQ6ICdlcycsXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgLy8gXHUyNzA1IE9wdGltaXNhdGlvbiBkdSBidW5kbGUgYXZlYyBtYW51YWwgY2h1bmtzXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIFx1MjcwNSBWZW5kb3IgY2h1bmtzIDogc1x1MDBFOXBhcmVyIGxlcyBncm9zc2VzIGRcdTAwRTlwZW5kYW5jZXNcbiAgICAgICAgICAndmVuZG9yLXJlYWN0JzogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgICd2ZW5kb3ItdWknOiBbXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWRpYWxvZycsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnUnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zZWxlY3QnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10YWJzJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9hc3QnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b29sdGlwJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtYXZhdGFyJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtY2hlY2tib3gnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1sYWJlbCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNsb3QnLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgJ3ZlbmRvci1xdWVyeSc6IFsnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5J10sXG4gICAgICAgICAgJ3ZlbmRvci1zdXBhYmFzZSc6IFsnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ10sXG4gICAgICAgICAgJ3ZlbmRvci1mb3Jtcyc6IFsncmVhY3QtaG9vay1mb3JtJywgJ0Bob29rZm9ybS9yZXNvbHZlcnMnLCAnem9kJ10sXG4gICAgICAgICAgJ3ZlbmRvci1jaGFydHMnOiBbJ3JlY2hhcnRzJ10sXG4gICAgICAgICAgJ3ZlbmRvci11dGlscyc6IFsnZGF0ZS1mbnMnLCAnY2xzeCcsICd0YWlsd2luZC1tZXJnZScsICdjbGFzcy12YXJpYW5jZS1hdXRob3JpdHknXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICAvLyBcdTI3MDUgQXVnbWVudGVyIGxhIGxpbWl0ZSBkZSB3YXJuaW5nICh0ZW1wb3JhaXJlLCBwb3VyIFx1MDBFOXZpdGVyIGxlIHNwYW0pXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA2MDAsXG4gICAgLy8gXHUyNzA1IFV0aWxpc2VyIGVzYnVpbGQgKHBsdXMgcmFwaWRlIHF1ZSB0ZXJzZXIgZXQgZFx1MDBFOWpcdTAwRTAgaW5jbHVzIGRhbnMgVml0ZSlcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNlUsU0FBUyxvQkFBb0I7QUFDMVcsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsaUJBQWlCLGdCQUFnQixDQUFDLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDOUUsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBO0FBQUE7QUFBQSxJQUdaLFNBQVMsQ0FBQyxZQUFZO0FBQUEsSUFDdEIsU0FBUyxDQUFDLGNBQWM7QUFBQSxFQUMxQjtBQUFBLEVBQ0EsUUFBUTtBQUFBO0FBQUEsSUFFTixRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsT0FBTztBQUFBO0FBQUEsSUFFTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUE7QUFBQSxVQUVaLGdCQUFnQixDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxVQUN6RCxhQUFhO0FBQUEsWUFDWDtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLGdCQUFnQixDQUFDLHVCQUF1QjtBQUFBLFVBQ3hDLG1CQUFtQixDQUFDLHVCQUF1QjtBQUFBLFVBQzNDLGdCQUFnQixDQUFDLG1CQUFtQix1QkFBdUIsS0FBSztBQUFBLFVBQ2hFLGlCQUFpQixDQUFDLFVBQVU7QUFBQSxVQUM1QixnQkFBZ0IsQ0FBQyxZQUFZLFFBQVEsa0JBQWtCLDBCQUEwQjtBQUFBLFFBQ25GO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsdUJBQXVCO0FBQUE7QUFBQSxJQUV2QixRQUFRO0FBQUEsRUFDVjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==

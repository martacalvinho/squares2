import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "/crypto-squares-auction/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  build: {
    rollupOptions: {
      external: ['react/jsx-runtime'],
      output: {
        globals: {
          'react/jsx-runtime': 'jsxRuntime'
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    esbuildOptions: {
      jsx: 'automatic'
    }
  }
});

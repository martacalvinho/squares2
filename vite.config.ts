import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "/crypto-squares-auction/",
  plugins: [react({
    jsxRuntime: 'classic',
    jsxImportSource: 'react',
    babel: {
      plugins: [
        ['@babel/plugin-transform-react-jsx']
      ]
    }
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react/jsx-runtime": "react/jsx-runtime.js"
    }
  },
  define: {
    'process.env': {}
  }
});

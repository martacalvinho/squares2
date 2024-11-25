import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/crypto-squares-auction/",
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  server: {
    port: 3000,
    host: true, 
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "stream": "stream-browserify",
      "buffer": "buffer"
    }
  },
  optimizeDeps: {
    include: [
      '@solana/web3.js',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-wallets',
      '@solana/wallet-adapter-react-ui',
      "buffer", 
      "stream-browserify"
    ],
    exclude: ['@solana/wallet-adapter-react-ui/styles.css']
  },
  define: {
    'process.env': {},
    'global': {}
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    commonjsOptions: {
      include: []
    }
  }
}));

import { Buffer } from 'buffer';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import './polyfills';


// Polyfills
window.global = window;
window.Buffer = Buffer;

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

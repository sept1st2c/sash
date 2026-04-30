import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SashProvider } from '@sash/sdk';
import App from './App.tsx';
import './index.css';

// Using Vite's env variables
const API_KEY = import.meta.env.VITE_SASH_API_KEY || "MISSING_KEY";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SashProvider apiKey={API_KEY} baseUrl="http://localhost:3000">
      <App />
    </SashProvider>
  </StrictMode>,
);

import { StrictMode } from 'react';
import '@verdocs/react-sdk/styles.css';
import { BrowserRouter } from 'react-router';
import { createRoot } from 'react-dom/client';
import { VerdocsProvider } from '@verdocs/react-sdk';
import { App } from './App';
import './app.css';

const apiBase = import.meta.env.VITE_VERDOCS_API_BASE || 'https://stage-api.verdocs.com';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VerdocsProvider baseUrl={apiBase}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </VerdocsProvider>
  </StrictMode>,
);

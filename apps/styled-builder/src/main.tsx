import { StrictMode } from 'react';
import '@verdocs/react-sdk/styles.css';
import { createRoot } from 'react-dom/client';
import App from './App';
import './app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

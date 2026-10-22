import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrutalToaster } from './components/BrutalToast';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
        <App />
        <BrutalToaster />
    </ErrorBoundary>
  </StrictMode>
);

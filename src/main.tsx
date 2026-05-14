import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/globals.css';
import { initSentry } from '@/lib/sentry';
import { initAnalytics } from '@/lib/analytics';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import App from './App';

initSentry('app');
initAnalytics();

document.documentElement.classList.add('dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary name="root">
      <App />
    </ErrorBoundary>
  </StrictMode>
);

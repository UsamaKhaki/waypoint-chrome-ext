import * as React from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { analytics } from '@/lib/analytics';

interface FallbackProps {
  error: Error;
  resetError: () => void;
  eventId: string | null;
}

function ErrorFallback({ error, resetError, eventId }: FallbackProps) {
  return (
    <div
      data-testid="error-boundary-fallback"
      className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4 p-8 text-center"
    >
      <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="h-5 w-5 text-destructive" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-primary mb-1">Something went wrong</h3>
        <p className="text-xs text-muted max-w-xs">{error.message}</p>
        {eventId && <p className="text-xs text-muted/60 mt-1 font-mono">Ref: {eventId}</p>}
      </div>
      <button
        data-testid="error-boundary-retry"
        onClick={resetError}
        className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Try again
      </button>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional label added as a Sentry tag — helps pinpoint which panel crashed */
  name?: string;
}

export function ErrorBoundary({ children, name }: ErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError, eventId }) => (
        <ErrorFallback error={error as Error} resetError={resetError} eventId={eventId} />
      )}
      onError={(error) => {
        analytics.errorBoundaryTriggered(name ?? 'unknown', (error as Error).message);
      }}
      beforeCapture={(scope) => {
        scope.setTag('caught_by', 'ErrorBoundary');
        if (name) scope.setTag('boundary', name);
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

import * as Sentry from '@sentry/react';

export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initSentry(context: 'app' | 'palette' = 'app') {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: 'waypoint@1.0.0',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    initialScope: {
      tags: { context },
    },
    beforeSend(event) {
      // Scrub auth tokens from outgoing Sentry events
      if (event.request?.headers) {
        const safe = { ...event.request.headers };
        delete safe['Authorization'];
        delete safe['authorization'];
        event.request.headers = safe;
      }
      return event;
    },
  });
}

/**
 * Capture an API/integration error with service-level context.
 * No-op when Sentry is not configured.
 */
export function captureApiError(error: unknown, service: string, extra?: Record<string, unknown>) {
  if (!SENTRY_DSN) return;
  Sentry.withScope((scope) => {
    scope.setTag('integration', service);
    if (extra) scope.setExtras(extra);
    Sentry.captureException(error);
  });
}

export { Sentry };

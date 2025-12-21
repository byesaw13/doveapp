import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/.*\.doveapp\.com/],
    }),
  ],
  beforeSend(event) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    // Filter out common non-actionable errors
    if (event.exception) {
      const errorMessage = event.exception.values?.[0]?.value || '';
      const ignoredErrors = [
        'Loading chunk',
        'Script error',
        'Network Error',
        'Failed to fetch',
        'Non-Error promise rejection',
      ];

      if (ignoredErrors.some((ignored) => errorMessage.includes(ignored))) {
        return null;
      }
    }

    return event;
  },
  beforeSendTransaction(event) {
    // Filter out health check transactions
    if (event.request?.url?.includes('/api/health')) {
      return null;
    }

    return event;
  },
});

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Console(),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    // Filter out common non-actionable errors
    if (event.exception) {
      const errorMessage = event.exception.values?.[0]?.value || '';
      const ignoredErrors = [
        'NEXT_REDIRECT',
        'NEXT_NOT_FOUND',
        'ABORT_ERR',
        'Network Error',
        'fetch failed',
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT',
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

    // Filter out static asset requests
    if (
      event.request?.url?.match(
        /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/
      )
    ) {
      return null;
    }

    return event;
  },
});

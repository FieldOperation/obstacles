import * as Sentry from '@sentry/node';
import { env } from './env';

export function initSentry() {
  if (!env.SENTRY_DSN) {
    return; // Sentry is optional
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% of transactions in production
    integrations: [
      // Enable HTTP tracing
      new Sentry.Integrations.Http({ tracing: true }),
    ],
  });
}

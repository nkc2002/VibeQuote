/**
 * Sentry Error Tracking Integration
 *
 * Setup and configuration for error monitoring.
 */

// Note: Install with: npm install @sentry/node

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate?: number;
}

/**
 * Initialize Sentry (call at app startup)
 */
export function initSentry(config?: Partial<SentryConfig>): void {
  const dsn = config?.dsn || process.env.SENTRY_DSN;

  if (!dsn) {
    console.log("[Sentry] DSN not configured, error tracking disabled");
    return;
  }

  // Dynamic import to avoid errors if @sentry/node not installed
  import("@sentry/node")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment:
          config?.environment || process.env.NODE_ENV || "development",
        release: config?.release || process.env.npm_package_version,

        // Sample rate for performance monitoring
        tracesSampleRate: config?.sampleRate ?? 0.1,

        // Capture unhandled rejections
        integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })],

        // Filter out expected errors
        beforeSend(event, hint) {
          // Don't report 4xx client errors
          if (hint?.originalException instanceof Error) {
            const msg = hint.originalException.message;
            if (
              msg.includes("Invalid unsplashId") ||
              msg.includes("Missing search query")
            ) {
              return null;
            }
          }
          return event;
        },
      });

      console.log("[Sentry] Error tracking initialized");
    })
    .catch(() => {
      console.log("[Sentry] @sentry/node not installed, skipping");
    });
}

/**
 * Capture an error with context
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>
): void {
  console.error("[Error]", error.message, context);

  import("@sentry/node")
    .then((Sentry) => {
      Sentry.withScope((scope) => {
        if (context) {
          scope.setExtras(context);
        }
        Sentry.captureException(error);
      });
    })
    .catch(() => {
      // Sentry not installed, just log
    });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(
  userId: string,
  extra?: Record<string, string>
): void {
  import("@sentry/node")
    .then((Sentry) => {
      Sentry.setUser({
        id: userId,
        ...extra,
      });
    })
    .catch(() => {});
}

/**
 * Create a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string
): { finish: () => void; setData: (key: string, value: unknown) => void } {
  let transaction: any = null;

  import("@sentry/node")
    .then((Sentry) => {
      transaction = Sentry.startSpan({ name, op });
    })
    .catch(() => {});

  return {
    finish: () => transaction?.end(),
    setData: (key: string, value: unknown) => {
      transaction?.setData(key, value);
    },
  };
}

export default { initSentry, captureError, setUserContext, startTransaction };

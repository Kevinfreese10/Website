/**
 * Error reporting and structured logging.
 *
 * Before this, the application had no error monitoring of any kind — no Sentry, no Bugsnag, no
 * Cloud Error Reporting integration — and ~30 table pages had catch blocks that neither notified
 * the user nor logged usefully. A failure in payments, email delivery or a statutory calculation
 * would surface only as a customer complaint.
 *
 * This deliberately has no third-party dependency. The app runs on Firebase App Hosting
 * (Cloud Run), where anything written to stdout/stderr as JSON is ingested by Cloud Logging, and
 * entries carrying a `severity` of ERROR or above together with a stack trace are automatically
 * picked up by Cloud Error Reporting — grouped, counted and alertable, at no extra cost and with
 * nothing to install.
 *
 * If you later add Sentry (or similar), set NEXT_PUBLIC_ERROR_REPORTING_DSN and extend
 * `forwardToProvider` below; every call site here stays unchanged.
 */

export type Severity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface ErrorContext {
  /** Where this happened, e.g. 'payfast.itn', 'payroll.finalize', 'checkout'. */
  operation: string;
  /** Anything useful for diagnosis. Must not contain credentials or full PII. */
  detail?: Record<string, unknown>;
  /** Acting user, when known. */
  userId?: string;
  /** Business identifiers that make an incident traceable. */
  orderId?: string;
  clientId?: string;
}

const SENSITIVE_KEY = /pass|secret|token|passphrase|apikey|api_key|authorization|credential|idnumber|id_number/i;

/**
 * Strips anything that looks like a credential or a direct identifier before it reaches a log
 * sink. Logs are retained and widely readable, so this is the last line of defence against the
 * kind of leak we already found (subscription tokens and SARS passwords in log output).
 */
function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[truncated]';
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.slice(0, 25).map(v => redact(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? '[redacted]' : redact(v, depth + 1);
    }
    return out;
  }
  if (typeof value === 'string' && value.length > 500) return value.slice(0, 500) + '…[truncated]';
  return value;
}

function forwardToProvider(_payload: Record<string, unknown>) {
  // Placeholder for a hosted provider. Cloud Error Reporting needs nothing here — it reads the
  // structured stdout/stderr entry written below.
}

/**
 * Reports a handled or unhandled error.
 *
 * Emits a single JSON line shaped for Cloud Error Reporting: `severity`, a `message` containing
 * the stack (Error Reporting groups on the stack), and a `context` block for filtering.
 */
export function reportError(error: unknown, context: ErrorContext, severity: Severity = 'ERROR') {
  const err = error instanceof Error ? error : new Error(String(error));

  const payload = {
    severity,
    // Error Reporting parses the stack out of `message`.
    message: err.stack || `${err.name}: ${err.message}`,
    errorName: err.name,
    errorMessage: err.message,
    operation: context.operation,
    userId: context.userId,
    orderId: context.orderId,
    clientId: context.clientId,
    detail: context.detail ? redact(context.detail) : undefined,
    timestamp: new Date().toISOString(),
    runtime: typeof window === 'undefined' ? 'server' : 'client',
  };

  // eslint-disable-next-line no-console
  console.error(JSON.stringify(payload));
  forwardToProvider(payload);
}

/** Structured non-error log. Use for events worth being able to search for later. */
export function logEvent(message: string, context: ErrorContext, severity: Severity = 'INFO') {
  const payload = {
    severity,
    message,
    operation: context.operation,
    userId: context.userId,
    orderId: context.orderId,
    clientId: context.clientId,
    detail: context.detail ? redact(context.detail) : undefined,
    timestamp: new Date().toISOString(),
    runtime: typeof window === 'undefined' ? 'server' : 'client',
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

/**
 * Wraps an operation so a failure is always reported rather than swallowed, while still letting
 * the caller decide what the user sees.
 *
 * Intended for the pattern this codebase repeats — `catch (e) { console.error(e); }` followed by
 * returning success anyway. Use as:
 *
 *   const result = await withReporting({ operation: 'wallet.debit', userId }, () => debit(...));
 *   if (!result.ok) toast({ ... });
 */
export async function withReporting<T>(
  context: ErrorContext,
  fn: () => Promise<T>
): Promise<{ ok: true; value: T } | { ok: false; error: Error }> {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    reportError(err, context);
    return { ok: false, error: err };
  }
}

/**
 * Reports a failure that must not interrupt the caller (best-effort side effects such as
 * notification emails), but must still be visible in monitoring rather than disappearing.
 */
export function reportNonFatal(error: unknown, context: ErrorContext) {
  reportError(error, context, 'WARNING');
}

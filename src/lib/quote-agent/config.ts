/**
 * Cloud quote agent: configuration and limits.
 *
 * Every value here comes from env (App Hosting secrets in production, .env.local in dev).
 * Nothing secret is hardcoded. The policy numbers below are the decisions Kevin signed off
 * (see quote_agent_audit.md): strict auto-send eligibility, no daily cap, max 5 automatic
 * quotes per sender per 24 hours, and a 3-strike circuit breaker.
 */

export const QUOTE_POLICY = {
  /** Auto-send only if the client asked for between 1 and this many catalog services. */
  maxServices: 3,
  /** Auto-send only if the quote total (including required add-ons) is at or below this, in ZAR. */
  maxTotalZar: 10_000,
  /** Auto-send only if Gemini is at least this confident in its classification (0-1). */
  minConfidence: 0.85,
  /** Max automatic quotes to the same sender address in a rolling 24 hours. Further requests go to review. */
  maxAutoQuotesPerSenderPer24h: 5,
  /** Consecutive failed ticks or sends before the agent pauses itself. */
  circuitBreakerThreshold: 3,
  /** Max emails handled per tick, so one run stays well inside the route's maxDuration. */
  maxEmailsPerTick: 15,
  /** Lease length for the single-runner lock. */
  lockLeaseMs: 5 * 60 * 1000,
  /** Days a quote stays valid when no service carries a priceValidUntil. */
  defaultValidityDays: 30,
} as const;

export const KEVIN_ADDRESS = 'kev@thinkestry.co.za';
export const KEVIN_DOMAIN = 'thinkestry.co.za';

/** The mailbox the agent owns. Sending and reading both use it. */
export const AGENT_MAILBOX = 'info@myacc.co.za';
export const AGENT_FROM = `"Kevin Freese | My Accountant" <${AGENT_MAILBOX}>`;

/** Our own addresses. Mail from these is never processed (loop guard) and they are never recipients. */
export const PRACTICE_ADDRESSES = ['info@myacc.co.za', 'ai@myacc.co.za', 'no_reply@myacc.co.za'];

export const PORTAL_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za';

export interface MailboxConfig {
  host: string;
  user: string;
  pass: string;
  fallbackIp?: string;
}

export function getMailboxConfig(): MailboxConfig {
  const pass = process.env.INFO_MAIL_PASS;
  if (!pass) {
    throw new Error('[quote-agent] INFO_MAIL_PASS is not set. Add it as an App Hosting secret (see apphosting.yaml).');
  }
  return {
    host: process.env.INFO_MAIL_HOST || 'mail.myacc.co.za',
    user: process.env.INFO_MAIL_USER || AGENT_MAILBOX,
    pass,
    fallbackIp: process.env.INFO_MAIL_FALLBACK_IP || undefined,
  };
}

export interface TelegramConfig {
  token: string;
  chatId: string;
}

/** Returns null when Telegram isn't configured, so the agent can still run (alerts then go by email only). */
export function getTelegramConfig(): TelegramConfig | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null;
  return { token, chatId };
}

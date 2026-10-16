import { timingSafeEqual } from 'crypto';

/**
 * Fail-closed check for scheduler-triggered routes. Production requires CRON_SECRET to be set AND
 * to match. (The older cron routes compare against `Bearer ${process.env.CRON_SECRET}`, which, when
 * the secret is missing, accepts the literal header "Bearer undefined".)
 */
export function isAuthorizedCron(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  const expected = Buffer.from(`Bearer ${secret}`);
  const got = Buffer.from(authHeader || '');
  return got.length === expected.length && timingSafeEqual(got, expected);
}

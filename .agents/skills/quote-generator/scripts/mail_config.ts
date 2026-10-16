import fs from 'fs';
import dns from 'dns';

// Mailbox credentials for the quote agent (ai@myacc.co.za) are read from env, never hardcoded.
// Required: QUOTE_MAIL_USER, QUOTE_MAIL_PASS. Optional: QUOTE_MAIL_HOST, QUOTE_MAIL_FALLBACK_IP, QUOTE_STATE_FILE.
const ENV_PATHS = ['c:/myacc/.env.local', 'c:/myacc/.env'];

function loadEnv(): void {
  if (process.env.QUOTE_MAIL_USER && process.env.QUOTE_MAIL_PASS) return;
  for (const p of ENV_PATHS) {
    if (fs.existsSync(p)) require('dotenv').config({ path: p });
  }
}

export interface MailConfig {
  host: string;
  user: string;
  pass: string;
  fallbackIp?: string;
}

export function getMailConfig(): MailConfig {
  loadEnv();
  const user = process.env.QUOTE_MAIL_USER;
  const pass = process.env.QUOTE_MAIL_PASS;
  if (!user || !pass) {
    throw new Error('[mail_config] QUOTE_MAIL_USER and QUOTE_MAIL_PASS must be set (e.g. in c:/myacc/.env.local).');
  }
  return {
    host: process.env.QUOTE_MAIL_HOST || 'mail.myacc.co.za',
    user,
    pass,
    fallbackIp: process.env.QUOTE_MAIL_FALLBACK_IP || undefined
  };
}

export function getStateFile(): string {
  loadEnv();
  return process.env.QUOTE_STATE_FILE || 'C:/Users/kev/.gemini/antigravity/scratch/quote_ai_state.json';
}

export async function resolveHostWithFallback(hostname: string, fallbackIp?: string): Promise<string> {
  try {
    const res = await dns.promises.lookup(hostname);
    if (res && res.address) return res.address;
  } catch (_) {}

  try {
    const resolver = new dns.promises.Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);
    const addresses = await resolver.resolve4(hostname);
    if (addresses && addresses.length > 0) return addresses[0];
  } catch (_) {}

  return fallbackIp || hostname;
}

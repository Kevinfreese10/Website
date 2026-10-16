/**
 * Twice-daily digest to Kevin (07:00 and 16:00 SAST, decision 5): everything the agent handled
 * since the previous digest, what is waiting for him, and the agent's health.
 */
import { getAdminDb } from '@/lib/firebase-admin';
import { KEVIN_ADDRESS, PORTAL_URL } from './config';
import { escapeHtml as e } from './filters';
import { sendEmail } from './mailer';
import * as store from './store';
import { formatZar } from './template';

const DIGEST_DOC = 'agentConfig/quoteAgentDigest';

export async function sendDigest(): Promise<{ sent: boolean; since: string; counts: Record<string, number> }> {
  const db = getAdminDb();
  const last = (await db.doc(DIGEST_DOC).get()).data()?.lastSentAt as string | undefined;
  const since = last || new Date(Date.now() - 12 * 3_600_000).toISOString();
  const until = new Date().toISOString();

  const [messages, pending, config, quotesSnap] = await Promise.all([
    store.messagesSince(since),
    store.listDrafts('pending', 50),
    store.getConfig(),
    db.collection('quotes').where('sentAt', '>=', since).get(),
  ]);
  const quotes = quotesSnap.docs.map(d => d.data() as store.QuoteRecord);
  const counts: Record<string, number> = {};
  for (const m of messages) counts[m.action || m.status] = (counts[m.action || m.status] || 0) + 1;

  const row = (cells: string[]) => `<tr>${cells.map(c => `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:13px;">${c}</td>`).join('')}</tr>`;
  const section = (title: string, body: string) => `<h3 style="font-size:15px;margin:22px 0 8px 0;color:#0f172a;">${e(title)}</h3>${body}`;
  const table = (rows: string[]) => rows.length ? `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">${rows.join('')}</table>` : '<p style="font-size:13px;color:#64748b;">None.</p>';

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1e293b;max-width:720px;">
<h2 style="font-size:18px;margin:0 0 4px 0;">info@ agent digest</h2>
<p style="font-size:12px;color:#64748b;margin:0;">${e(new Date(since).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' }))} &rarr; ${e(new Date(until).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' }))} SAST &bull; Mode: <b>${e(config.mode)}</b>${config.lastError ? ` &bull; Last error: ${e(config.lastError)}` : ''}</p>
<p style="font-size:13px;">Emails handled: <b>${messages.length}</b> &bull; ${Object.entries(counts).map(([k, v]) => `${e(k)}: ${v}`).join(' &bull; ') || 'none'}</p>
${section(`Quotes sent (${quotes.length})`, table(quotes.map(q => row([e(q.quoteRef), e(q.to), q.auto ? 'auto' : 'approved', `R ${formatZar(q.total)}`]))))}
${section(`Waiting for you (${pending.length})`, table(pending.map(d => row([e(d.category), e(d.sourceFrom), e(d.summary), `<a href="${PORTAL_URL}/admin/quote-drafts?id=${encodeURIComponent(d.id)}">Open</a>`]))))}
${section('Alerts', table(messages.filter(m => ['regulator', 'order_update'].includes(m.category)).map(m => row([e(m.category), e(m.from || ''), e(m.subject || ''), e(m.summary || '')]))))}
${section('Errors', table(messages.filter(m => m.status === 'error').map(m => row([e(m.from || ''), e(m.subject || ''), e(m.error || '')]))))}
</div>`;

  if (!messages.length && !pending.length && !quotes.length) {
    await db.doc(DIGEST_DOC).set({ lastSentAt: until }, { merge: true });
    return { sent: false, since, counts };
  }
  await sendEmail({ to: KEVIN_ADDRESS, subject: `info@ agent digest: ${quotes.length} quote(s) sent, ${pending.length} waiting`, html });
  await db.doc(DIGEST_DOC).set({ lastSentAt: until }, { merge: true });
  return { sent: true, since, counts };
}

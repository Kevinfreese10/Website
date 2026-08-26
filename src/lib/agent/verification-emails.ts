/**
 * Emails to Kevin from the verification cycle. Plain HTML tables — no React Email needed.
 * Recipient: AGENT_NOTIFY_EMAIL (default kev@thinkestry.co.za).
 */
import { sendEmail } from '@/lib/email';
import type { Order } from '@/lib/types';
import type { ItemVerdict } from './verification-cycle';

const TO = process.env.AGENT_NOTIFY_EMAIL || 'kev@thinkestry.co.za';
const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za';

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function header(order: Order & { id: string }, title: string) {
  const n = order.originalOrderId || order.id;
  const services = (order.serviceSnapshots || []).map(s => s.title).join(', ') || (order.items || []).map(i => i.title).join(', ');
  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#222;max-width:760px">
    <h2 style="margin:0 0 4px;color:#0F2137">${esc(title)}</h2>
    <p style="margin:0 0 12px;color:#555">Order <a href="${APP}/admin/orders/${order.id}"><b>#${esc(n)}</b></a> · ${esc(order.endCustomerName || order.customerName || '')} · ${esc(services)}</p>`;
}

function table(items: ItemVerdict[]) {
  const badge = (o: ItemVerdict['outcome']) => ({ approved: '#16a34a', rejected: '#dc2626', pending: '#d97706', missing: '#6b7280', not_applicable: '#9ca3af' }[o]);
  const rows = items.map(i => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(i.label)}<div style="color:#888;font-size:11px">${esc(i.serviceTitle)}</div></td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;white-space:nowrap"><span style="background:${badge(i.outcome)};color:#fff;padding:2px 6px;border-radius:3px;font-size:11px">${esc(i.outcome.replace('_', ' '))}</span></td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px">${esc(i.reason || '')}${i.facts ? `<div style="color:#555;margin-top:2px">${esc([i.facts.kind, ...(i.facts.names || []).slice(0, 3), ...(i.facts.identifiers || []).slice(0, 3), ...(i.facts.dates || []).slice(0, 3), i.facts.certified ? 'certified' : ''].filter(Boolean).join(' · '))}</div>` : ''}</td>
    </tr>`).join('');
  return `<table style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr style="background:#f5f5f5"><th align="left" style="padding:6px 8px">Requirement</th><th align="left" style="padding:6px 8px">Verdict</th><th align="left" style="padding:6px 8px">Reason / facts read</th></tr></thead><tbody>${rows}</tbody></table>`;
}

export async function sendCompleteEmail(order: Order & { id: string }, items: ItemVerdict[]) {
  const n = order.originalOrderId || order.id;
  const html = `${header(order, 'All documents approved')}
    <p>Every item in <i>Documents &amp; Data Required</i> has been received and approved. The client has been told, and the order is now <b>Under Review</b>.</p>
    ${table(items.filter(i => i.outcome !== 'not_applicable'))}
    <p style="margin-top:14px"><a href="${APP}/admin/orders/${order.id}" style="background:#0F2137;color:#fff;padding:8px 14px;border-radius:4px;text-decoration:none">Open order #${esc(n)}</a></p>
  </div>`;
  await sendEmail({ to: TO, subject: `✅ Order #${n} — all documents approved (${order.endCustomerName || order.customerName || ''})`, html });
}

export async function sendUndecidedEmail(order: Order & { id: string }, items: ItemVerdict[]) {
  const n = order.originalOrderId || order.id;
  const pending = items.filter(i => i.outcome === 'pending');
  const html = `${header(order, `${pending.length} item${pending.length > 1 ? 's' : ''} need your decision`)}
    <p>The checks could not decide on the items below. Everything else the client has sent is approved, and nothing is outstanding from them. Approve or reject on the order page and the cycle carries on.</p>
    ${table(pending)}
    <p style="color:#666;font-size:12px;margin-top:10px">Full picture:</p>
    ${table(items.filter(i => i.outcome !== 'pending' && i.outcome !== 'not_applicable'))}
    <p style="margin-top:14px"><a href="${APP}/admin/orders/${order.id}" style="background:#0F2137;color:#fff;padding:8px 14px;border-radius:4px;text-decoration:none">Open order #${esc(n)}</a></p>
  </div>`;
  await sendEmail({ to: TO, subject: `⚠️ Order #${n} — ${pending.length} document${pending.length > 1 ? 's' : ''} need your decision`, html });
}

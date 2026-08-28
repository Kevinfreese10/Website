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

/**
 * Sends a full, consolidated AI Audit Findings report email to kev@thinkestry.co.za
 * triggered immediately when a client submits their documents or clicks "Notify Consultant".
 */
export async function sendAuditFindingsEmail(
  order: Order & { id: string }, 
  items: ItemVerdict[], 
  state: 'awaiting_client' | 'awaiting_consultant' | 'complete' | 'skipped',
  trigger: string
) {
  const n = order.originalOrderId || order.id || (order as any).orderNumber;
  const customerName = order.endCustomerName || order.customerName || 'Client';
  const customerEmail = order.endCustomerEmail || order.customerEmail || '';
  const customerPhone = order.endCustomerPhone || order.customerPhone || '';
  const entityName = (order as any).companyName || (order as any).entityName || (order as any).shippingAddress?.company || '';
  const services = (order.serviceSnapshots || []).map(s => s.title).join(', ') || (order.items || []).map(i => i.title || (i as any).name).join(', ');

  const approved = items.filter(i => i.outcome === 'approved');
  const rejected = items.filter(i => i.outcome === 'rejected');
  const pending = items.filter(i => i.outcome === 'pending');
  const missing = items.filter(i => i.outcome === 'missing');

  const isComplete = state === 'complete';
  const headerTitle = isComplete 
    ? '✅ AI Order Audit Completed — All Documents Approved' 
    : rejected.length > 0 
      ? '⚠️ AI Order Audit Completed — Issues Identified / Attention Required'
      : '📋 AI Order Audit Findings — Submissions Received';

  const subject = isComplete
    ? `✅ [AI Audit Passed] Order #${n} — All Documents & Data Verified (${customerName})`
    : rejected.length > 0
      ? `⚠️ [AI Audit Issues] Order #${n} — Revisions Required (${customerName})`
      : `📋 [AI Audit Report] Order #${n} — Submissions Received (${customerName})`;

  const statusBg = isComplete ? '#dcfce7' : rejected.length > 0 ? '#fee2e2' : '#fef3c7';
  const statusColor = isComplete ? '#166534' : rejected.length > 0 ? '#991b1b' : '#92400e';
  const statusBorder = isComplete ? '#86efac' : rejected.length > 0 ? '#fca5a5' : '#fde68a';

  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #1e293b; max-width: 780px; margin: 0 auto; line-height: 1.5;">
    
    <!-- Top Brand Header -->
    <div style="background: #0f172a; padding: 18px 24px; border-radius: 8px 8px 0 0; color: #ffffff;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td>
            <div style="font-size: 18px; font-weight: 700; color: #ffffff;">My Accountant — AI Order Audit</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Automated Document Verification & Compliance Engine</div>
          </td>
          <td align="right">
            <span style="background: rgba(255,255,255,0.15); font-size: 13px; padding: 4px 10px; border-radius: 4px; color: #f8fafc; font-weight: 600;">
              Order #${esc(n)}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body Container -->
    <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px; background: #ffffff;">
      
      <!-- Status Alert Box -->
      <div style="background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 6px; padding: 14px 18px; margin-bottom: 20px;">
        <div style="font-size: 15px; font-weight: 700; color: ${statusColor};">${esc(headerTitle)}</div>
        <div style="font-size: 12px; color: ${statusColor}; margin-top: 4px;">
          Triggered by client: <b>${esc(customerName)}</b> via Order Dashboard (${esc(trigger)}) · Timestamp: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
        </div>
      </div>

      <!-- Quick Metrics Counters -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; text-align: center;">
        <tr>
          <td style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px 0 0 6px;">
            <div style="font-size: 20px; font-weight: 700; color: #16a34a;">${approved.length}</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Approved</div>
          </td>
          <td style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-left: none;">
            <div style="font-size: 20px; font-weight: 700; color: #dc2626;">${rejected.length}</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Needs Attention</div>
          </td>
          <td style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-left: none;">
            <div style="font-size: 20px; font-weight: 700; color: #d97706;">${pending.length}</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Pending Review</div>
          </td>
          <td style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-left: none; border-radius: 0 6px 6px 0;">
            <div style="font-size: 20px; font-weight: 700; color: #64748b;">${missing.length}</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Outstanding</div>
          </td>
        </tr>
      </table>

      <!-- Order & Client Details Table -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px;">
        <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Client & Order Details</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding: 3px 0; width: 140px;">Client Name:</td>
            <td style="font-weight: 600; color: #0f172a;">${esc(customerName)}</td>
          </tr>
          ${customerEmail ? `<tr><td style="color: #64748b; padding: 3px 0;">Email Address:</td><td><a href="mailto:${esc(customerEmail)}" style="color: #2563eb; text-decoration: none;">${esc(customerEmail)}</a></td></tr>` : ''}
          ${customerPhone ? `<tr><td style="color: #64748b; padding: 3px 0;">Phone:</td><td style="color: #0f172a;">${esc(customerPhone)}</td></tr>` : ''}
          ${entityName ? `<tr><td style="color: #64748b; padding: 3px 0;">Entity / Company:</td><td style="font-weight: 600; color: #0f172a;">${esc(entityName)}</td></tr>` : ''}
          <tr>
            <td style="color: #64748b; padding: 3px 0;">Services:</td>
            <td style="color: #0f172a;">${esc(services)}</td>
          </tr>
          ${order.total ? `<tr><td style="color: #64748b; padding: 3px 0;">Order Value:</td><td style="font-weight: 600; color: #16a34a;">R${Number(order.total).toFixed(2)}</td></tr>` : ''}
        </table>
      </div>

      <!-- Itemized Audit Findings Table -->
      <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Itemized Verification Breakdown</div>
      ${table(items.filter(i => i.outcome !== 'not_applicable'))}

      <!-- Admin Action Button -->
      <div style="margin-top: 28px; text-align: center; padding-top: 18px; border-top: 1px solid #e2e8f0;">
        <a href="${APP}/admin/orders/${order.id}" style="background: #0F2137; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          Open Order #${esc(n)} in Admin Portal →
        </a>
      </div>

    </div>
  </div>`;

  await sendEmail({
    to: TO,
    subject,
    html,
  });
}

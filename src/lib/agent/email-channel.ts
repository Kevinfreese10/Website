/**
 * EMAIL adapter (AI-ORDER-AGENT-PLAN.md §6.5).
 *
 * Outbound: builds a submission proposal (to / subject / body / attachments) for an
 * `email_submission` step, and sends it once approved from the submissions mailbox with a
 * `[MYACC-<order>]` tag so replies can be matched. Inbound: polls that mailbox over IMAP,
 * attaches replies to the order and surfaces them for Kevin.
 *
 * Env: SUBMISSIONS_EMAIL (from address), SUBMISSIONS_SMTP_HOST/PORT/USER/PASS (optional
 * override; defaults to the site SMTP), SUBMISSIONS_IMAP_HOST/PORT/USER/PASS (poller).
 */

import { getAdminDb, cleanFirestoreData, uploadBufferToStorage } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import type { DocumentUpload, Order, OrderChecklistItem, OrderServiceSnapshot } from '@/lib/types';
import type { EntityContext } from '@/lib/verification/rules';
import type { EmailSubmissionPayload, RegulatorMail, RegulatorSubmission } from './types';

export const SUBMISSIONS_FROM = process.env.SUBMISSIONS_EMAIL || 'submissions@myacc.co.za';

export function submissionTag(orderNumber: string) { return `[MYACC-${orderNumber}]`; }

export function fillSubjectTemplate(template: string | undefined, vars: Record<string, string | undefined>, fallback: string): string {
  const t = (template || fallback).replace(/\{(\w+)\}/g, (_, k) => vars[k] || `{${k}}`);
  return t;
}

// ---------------------------------------------------------------------------------------------
// Outbound
// ---------------------------------------------------------------------------------------------

export function buildSubmissionPayload(args: {
  order: Order & { id: string };
  service: OrderServiceSnapshot;
  step: OrderChecklistItem;
  entity: EntityContext;
  uploads: DocumentUpload[];
}): EmailSubmissionPayload {
  const { order, service, step, entity, uploads } = args;
  const orderNumber = String(order.originalOrderId || order.id);
  const tag = submissionTag(orderNumber);
  const cfg = step.stepConfig || {};
  const vars = { entityName: entity.entityName || order.endCustomerName || order.customerName || '', registrationNumber: entity.registrationNumber || '', orderNumber };
  const subjectCore = fillSubjectTemplate(cfg.emailSubjectTemplate, vars, `${service.title} — ${vars.entityName}`);
  const to = (cfg.emailTo || '').trim();
  const addressUnverified = !to || /⚠|invalid|confirm/i.test(to) || /⚠ CONFIRM ADDRESS/i.test(step.aiInstructions || '');

  // Attachments: approved (signed) drafts named on the step, plus approved client uploads for this service.
  const drafts = ((order.generatedDrafts as any[]) || []) as { templateId: string; status: string; fileName: string; fileUrl: string; signedFileUrl?: string }[];
  const wanted = new Set(step.templateIds || []);
  const attachments: EmailSubmissionPayload['attachments'] = [];
  for (const d of drafts) {
    if (d.status !== 'approved') continue;
    if (wanted.size && !wanted.has(d.templateId)) continue;
    attachments.push({ name: d.fileName, url: d.signedFileUrl || d.fileUrl, source: 'draft' });
  }
  for (const u of uploads) {
    if (u.status !== 'approved' || u.type !== 'file') continue;
    const files = u.files && u.files.length ? u.files : u.fileUrl ? [{ fileName: u.fileName || u.requirementLabel, fileUrl: u.fileUrl }] : [];
    for (const f of files) attachments.push({ name: `${safeName(u.requirementLabel)}_${f.fileName || 'file'}`.slice(0, 120), url: f.fileUrl, source: 'upload' });
  }

  const body = [
    'Good day',
    '',
    `Please find attached the ${service.title.toLowerCase()} application for ${vars.entityName}${vars.registrationNumber ? ` (registration number ${vars.registrationNumber})` : ''}.`,
    '',
    attachments.length ? 'Attached:' : 'No attachments.',
    ...attachments.map(a => `- ${a.name}`),
    '',
    'We act on behalf of the applicant. Kindly direct any queries or requests for further information to this address, quoting the reference in the subject line.',
    '',
    'Kind regards',
    'Kevin Freese, CBA (SA) #3561',
    'My Accountant (Pty) Ltd',
    'Tel 010 109 1625',
  ].join('\n');

  return { stepId: step.id, stepTitle: step.title, purpose: 'submission', to, subject: `${subjectCore} ${tag}`, body, attachments, tag, addressUnverified };
}

export function buildFollowUpPayload(args: { order: Order & { id: string }; service: OrderServiceSnapshot; step: OrderChecklistItem; submission: RegulatorSubmission; daysSince: number }): EmailSubmissionPayload {
  const { order, service, step, submission, daysSince } = args;
  const body = [
    'Good day',
    '',
    `We refer to our ${service.title.toLowerCase()} application submitted on ${submission.sentAt.slice(0, 10)}${submission.reference ? ` (your reference ${submission.reference})` : ''}, now ${daysSince} days ago.`,
    '',
    'Could you kindly confirm the current status of the application and whether anything further is required from our side?',
    '',
    'Kind regards',
    'Kevin Freese, CBA (SA) #3561',
    'My Accountant (Pty) Ltd',
    'Tel 010 109 1625',
  ].join('\n');
  return { stepId: step.id, stepTitle: step.title, purpose: 'follow_up', to: submission.to, subject: `RE: ${submission.subject}`, body, attachments: [], tag: submission.tag, submissionId: submission.id };
}

function textToHtml(text: string): string {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#222;white-space:pre-wrap">${esc}</div>`;
}

async function fetchAttachment(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`attachment fetch ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Sends an approved submission / follow-up and records it on the order. */
export async function sendSubmission(orderId: string, serviceId: string, payload: EmailSubmissionPayload, sentBy: string): Promise<{ submissionId: string; message: string }> {
  if (!payload.to || /invalid|⚠/i.test(payload.to)) throw new Error(`Regulator address "${payload.to}" is not usable — confirm it in the playbook first.`);
  const attachments = [] as { filename: string; content: Buffer; contentType: string }[];
  for (const a of payload.attachments) {
    attachments.push({ filename: a.name, content: await fetchAttachment(a.url), contentType: a.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream' });
  }
  const smtpOverride = process.env.SUBMISSIONS_SMTP_HOST && process.env.SUBMISSIONS_SMTP_USER && process.env.SUBMISSIONS_SMTP_PASS
    ? { host: process.env.SUBMISSIONS_SMTP_HOST, port: process.env.SUBMISSIONS_SMTP_PORT || '465', user: process.env.SUBMISSIONS_SMTP_USER, pass: process.env.SUBMISSIONS_SMTP_PASS }
    : undefined;

  await sendEmail({
    to: payload.to,
    cc: payload.cc || undefined,
    subject: payload.subject,
    html: textToHtml(payload.body),
    from: `"My Accountant (Pty) Ltd" <${SUBMISSIONS_FROM}>`,
    replyTo: SUBMISSIONS_FROM,
    attachments,
    smtpOverride,
  });

  const db = getAdminDb();
  const ref = db.collection('orders').doc(orderId);
  const snap = await ref.get();
  const order = snap.data() as Order;
  const subs: RegulatorSubmission[] = order.regulatorSubmissions || [];
  const nowIso = new Date().toISOString();
  let submissionId = payload.submissionId || '';
  let updated: RegulatorSubmission[];
  if (payload.purpose === 'follow_up' && submissionId) {
    updated = subs.map(s => (s.id === submissionId ? { ...s, followUpsSent: [...(s.followUpsSent || []), nowIso] } : s));
  } else {
    submissionId = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    updated = [...subs, { id: submissionId, stepId: payload.stepId, serviceId, to: payload.to, subject: payload.subject, tag: payload.tag, sentAt: nowIso, sentBy, attachmentNames: payload.attachments.map(a => a.name), status: 'sent', followUpsSent: [], replies: [] }];
  }
  await ref.update(cleanFirestoreData({ regulatorSubmissions: updated, updatedAt: nowIso }));
  return { submissionId, message: `${payload.purpose === 'follow_up' ? 'Follow-up' : 'Submission'} sent to ${payload.to} with ${attachments.length} attachment(s)` };
}

function safeName(s: string) { return String(s || '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40); }

// ---------------------------------------------------------------------------------------------
// Inbound
// ---------------------------------------------------------------------------------------------

export function isPollerConfigured(): boolean {
  return !!(process.env.SUBMISSIONS_IMAP_HOST && process.env.SUBMISSIONS_IMAP_USER && process.env.SUBMISSIONS_IMAP_PASS);
}

/**
 * Reads unseen mail from the submissions mailbox, matches it to orders by the [MYACC-n] tag (or a
 * known regulator reference), records it, and marks it seen. Returns a summary. Never throws for a
 * single bad message.
 */
export async function pollSubmissionsInbox(limit = 50): Promise<{ processed: number; matched: number; unmatched: number; errors: string[] }> {
  const summary = { processed: 0, matched: 0, unmatched: 0, errors: [] as string[] };
  if (!isPollerConfigured()) { summary.errors.push('IMAP not configured (SUBMISSIONS_IMAP_*)'); return summary; }

  const imapsMod: any = await import('imap-simple');
  const imaps = imapsMod.default || imapsMod;
  const { simpleParser } = await import('mailparser');
  const db = getAdminDb();

  const connection = await imaps.connect({
    imap: {
      user: process.env.SUBMISSIONS_IMAP_USER,
      password: process.env.SUBMISSIONS_IMAP_PASS,
      host: process.env.SUBMISSIONS_IMAP_HOST,
      port: Number(process.env.SUBMISSIONS_IMAP_PORT || 993),
      tls: (process.env.SUBMISSIONS_IMAP_TLS || 'true') !== 'false',
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 15000,
    },
  });
  try {
    await connection.openBox('INBOX');
    const messages: any[] = await connection.search(['UNSEEN'], { bodies: [''], markSeen: false });
    // Preload known tags/references so we can match without a query per mail.
    const active = await db.collection('orders').where('status', 'in', ['Processing', 'Waiting on Customer', 'Waiting for Information', 'Under Review']).get();
    const byTag = new Map<string, { orderId: string; orderNumber: string; subs: RegulatorSubmission[] }>();
    active.docs.forEach(d => { const o = d.data() as Order; const n = String(o.originalOrderId || d.id); byTag.set(submissionTag(n), { orderId: d.id, orderNumber: n, subs: o.regulatorSubmissions || [] }); });

    for (const m of messages.slice(0, limit)) {
      try {
        const raw = m.parts.find((p: any) => p.which === '')?.body;
        const parsed = await simpleParser(raw);
        const subject = parsed.subject || '';
        const text = (parsed.text || parsed.html || '').toString();
        const addrText = (a: any): string => Array.isArray(a) ? a.map((x: any) => x?.text || '').filter(Boolean).join(', ') : (a?.text || '');
        const from = addrText(parsed.from);
        const receivedAt = (parsed.date || new Date()).toISOString();
        const mailId = `mail_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

        // 1. tag in subject/body
        let hit: { orderId: string; orderNumber: string; subs: RegulatorSubmission[] } | undefined;
        let matchedBy: RegulatorMail['matchedBy'] = 'none';
        const tagMatch = (subject + ' ' + text).match(/\[MYACC-([A-Za-z0-9]+)\]/);
        if (tagMatch) { hit = byTag.get(`[MYACC-${tagMatch[1]}]`); if (hit) matchedBy = 'tag'; }
        // 2. known regulator reference
        if (!hit) {
          for (const v of byTag.values()) {
            if (v.subs.some(s => s.reference && (subject + ' ' + text).includes(s.reference))) { hit = v; matchedBy = 'reference'; break; }
          }
        }

        // Save attachments
        const saved: { name: string; url: string }[] = [];
        for (const att of parsed.attachments || []) {
          try {
            const url = await uploadBufferToStorage(att.content, `regulatorMail/${mailId}/${safeName(att.filename || 'attachment')}${extOf(att.filename)}`, att.contentType || 'application/octet-stream');
            saved.push({ name: att.filename || 'attachment', url });
          } catch (e: any) { summary.errors.push(`attachment save failed: ${e.message}`); }
        }

        const submission = hit?.subs.find(s => s.tag === (tagMatch ? `[MYACC-${tagMatch[1]}]` : '')) || hit?.subs[hit.subs.length - 1];
        const record: RegulatorMail = { id: mailId, messageId: parsed.messageId, from, to: addrText(parsed.to), subject, receivedAt, text: text.slice(0, 20000), attachments: saved, orderId: hit?.orderId || null, orderNumber: hit?.orderNumber || null, submissionId: submission?.id || null, matchedBy, processedAt: new Date().toISOString() };
        await db.collection('regulatorMail').doc(mailId).set(cleanFirestoreData(record));

        if (hit) {
          const ref = db.collection('orders').doc(hit.orderId);
          const snap = await ref.get();
          const order = snap.data() as Order;
          const subs = (order.regulatorSubmissions || []).map(s => s.id === submission?.id ? { ...s, status: s.status === 'sent' ? 'acknowledged' as const : s.status, replies: [...(s.replies || []), { mailId, from, subject, receivedAt, snippet: text.slice(0, 300) }] } : s);
          const { FieldValue } = await import('firebase-admin/firestore');
          await ref.update(cleanFirestoreData({
            regulatorSubmissions: subs,
            notes: FieldValue.arrayUnion(cleanFirestoreData({ text: `Regulator reply received from ${from}: "${subject}"\n\n${text.slice(0, 1500)}`, authorId: 'system', date: new Date(), type: 'email', isInternal: true, subject, attachments: saved.length ? saved : null })),
            updatedAt: new Date().toISOString(),
          }));
          summary.matched++;
        } else summary.unmatched++;

        await connection.addFlags(m.attributes.uid, '\\Seen');
        summary.processed++;
      } catch (e: any) {
        summary.errors.push(e.message);
      }
    }
  } finally {
    try { connection.end(); } catch { /* ignore */ }
  }
  return summary;
}

function extOf(name?: string) { const m = (name || '').match(/\.[A-Za-z0-9]{1,5}$/); return m ? m[0] : ''; }

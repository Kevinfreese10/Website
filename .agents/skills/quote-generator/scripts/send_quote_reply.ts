import fs from 'fs';
import nodemailer from 'nodemailer';
import MailComposer from 'nodemailer/lib/mail-composer';
import imapSimple from 'imap-simple';
import { convert } from 'html-to-text';
import { loadState, markProcessed, KEVIN_ADDRESSES } from './check_inbox';
import { getMailConfig, resolveHostWithFallback } from './mail_config';

// Addresses that must never receive agent mail: CCing them loops back into the inbox agent.
const BLOCKED_RECIPIENTS = ['info@myacc.co.za', 'ai@myacc.co.za'];

// Content that must never reach a client (see SKILL.md invariants).
const FORBIDDEN_CONTENT: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /whatsapp/i, reason: 'mentions WhatsApp (practice has no WhatsApp channel)' },
  { pattern: /\{\{[^}]*\}\}/, reason: 'contains unfilled template placeholders ({{...}})' },
  { pattern: /\[(client name|entity name|amount|service)\]/i, reason: 'contains unfilled [placeholder] text' }
];

// How a send to a non-Kevin recipient was authorised. Required for every client-facing send.
export type Approval = 'kevin' | 'catalog-auto';

export interface SendQuoteOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  inReplyTo?: string;
  references?: string | string[];
  cc?: string;
  approval?: Approval;
  dryRun?: boolean;
  originalUid?: number;
  originalMessageId?: string;
  originalFrom?: string;
}

function splitAddresses(value?: string): string[] {
  return (value || '').split(/[,;]/).map(a => a.trim().toLowerCase()).filter(Boolean);
}

function bareAddress(addr: string): string {
  const m = addr.match(/<([^>]+)>/);
  return (m ? m[1] : addr).trim().toLowerCase();
}

export function validateSend(options: SendQuoteOptions): void {
  const recipients = [...splitAddresses(options.to), ...splitAddresses(options.cc)].map(bareAddress);
  if (recipients.length === 0) throw new Error('No recipients.');

  const blocked = recipients.filter(r => BLOCKED_RECIPIENTS.includes(r));
  if (blocked.length) {
    throw new Error(`Blocked recipient(s): ${blocked.join(', ')}. Never send or CC the practice inboxes.`);
  }

  const external = recipients.filter(r => !KEVIN_ADDRESSES.includes(r));
  if (external.length && !options.approval) {
    throw new Error(
      `Client-facing send to ${external.join(', ')} requires --approval kevin (Kevin approved in chat) ` +
      `or --approval catalog-auto (pure fixed-catalog quote, not forwarded by Kevin). Send to Kevin for review instead.`
    );
  }

  for (const rule of FORBIDDEN_CONTENT) {
    if (rule.pattern.test(options.html)) throw new Error(`Email blocked: HTML ${rule.reason}.`);
  }
}

async function saveToSent(raw: Buffer, host: string, resolvedHost: string, user: string, pass: string): Promise<void> {
  const connection = await imapSimple.connect({
    imap: { user, password: pass, host: resolvedHost, port: 993, tls: true, tlsOptions: { servername: host }, authTimeout: 15000 }
  });
  try {
    for (const mailbox of ['INBOX.Sent', 'Sent']) {
      try {
        await connection.append(raw, { mailbox, flags: ['\\Seen'] });
        console.log(`[send_quote_reply] Copy saved to ${mailbox}.`);
        return;
      } catch (_) {}
    }
    console.warn('[send_quote_reply] Could not save a copy to the Sent folder.');
  } finally {
    connection.end();
  }
}

export async function sendQuoteReply(options: SendQuoteOptions): Promise<{ success: boolean; messageId: string; dryRun?: boolean }> {
  validateSend(options);

  const mailOptions: nodemailer.SendMailOptions = {
    from: '"Kevin Freese | My Accountant" <info@myacc.co.za>',
    replyTo: 'info@myacc.co.za',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || convert(options.html, { wordwrap: 100, selectors: [{ selector: 'img', format: 'skip' }] }),
    inReplyTo: options.inReplyTo,
    references: options.references || options.inReplyTo,
    cc: options.cc || undefined
  };

  if (options.dryRun) {
    console.log('[send_quote_reply] DRY RUN - validation passed, nothing sent.');
    console.log(JSON.stringify({ to: options.to, cc: options.cc, subject: options.subject, approval: options.approval, inReplyTo: options.inReplyTo }, null, 2));
    console.log('--- Plain-text preview ---\n' + mailOptions.text);
    return { success: true, messageId: '', dryRun: true };
  }

  const mail = getMailConfig();
  const resolvedHost = await resolveHostWithFallback(mail.host, mail.fallbackIp);

  const transporter = nodemailer.createTransport({
    host: resolvedHost,
    port: 465,
    secure: true,
    auth: { user: mail.user, pass: mail.pass },
    tls: { servername: mail.host }
  });

  const info = await transporter.sendMail(mailOptions);
  console.log(`[send_quote_reply] Successfully sent email to ${options.to}.`);
  console.log(`[send_quote_reply] Accepted: ${JSON.stringify(info.accepted)}, Rejected: ${JSON.stringify(info.rejected)}`);
  console.log(`[send_quote_reply] Server Response: ${info.response}`);
  console.log(`[send_quote_reply] Message-ID: ${info.messageId}`);

  try {
    const raw = await new MailComposer({ ...mailOptions, messageId: info.messageId }).compile().build();
    await saveToSent(raw, mail.host, resolvedHost, mail.user, mail.pass);
  } catch (e: any) {
    console.warn('[send_quote_reply] Sent-folder copy failed:', e.message);
  }

  if (options.originalUid) {
    const state = loadState();
    markProcessed(state, options.originalUid, options.originalMessageId || options.inReplyTo || '', {
      from: options.originalFrom || options.to,
      subject: options.subject,
      date: new Date().toISOString(),
      originType: `REPLIED_TO:${options.to}`
    });
  }

  return { success: true, messageId: info.messageId };
}

// CLI usage support
if (require.main === module || (process.argv[1] && process.argv[1].endsWith('send_quote_reply.ts'))) {
  const args = process.argv.slice(2);
  const getArg = (name: string): string | undefined => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  const to = getArg('to');
  const subject = getArg('subject');
  const htmlFile = getArg('htmlFile');
  const html = htmlFile ? fs.readFileSync(htmlFile, 'utf8') : getArg('html');
  const approval = getArg('approval') as Approval | undefined;
  const originalUid = getArg('uid') ? parseInt(getArg('uid')!, 10) : undefined;

  if (!to || !subject || !html) {
    console.error(
      'Usage: npx tsx send_quote_reply.ts --to <email> --subject <subj> --htmlFile <path> ' +
      '[--cc <email>] [--inReplyTo <msgid>] [--references <msgids>] [--uid <num>] [--originalFrom <email>] ' +
      '[--approval kevin|catalog-auto] [--dry-run]'
    );
    process.exit(1);
  }
  if (approval && approval !== 'kevin' && approval !== 'catalog-auto') {
    console.error('--approval must be "kevin" or "catalog-auto".');
    process.exit(1);
  }

  sendQuoteReply({
    to,
    cc: getArg('cc'),
    subject,
    html,
    inReplyTo: getArg('inReplyTo'),
    references: getArg('references')?.split(/\s+/),
    approval,
    dryRun: args.includes('--dry-run'),
    originalUid,
    originalFrom: getArg('originalFrom')
  })
    .then(res => {
      console.log(JSON.stringify(res, null, 2));
    })
    .catch(err => {
      console.error('Error sending quote:', err.message || err);
      process.exit(1);
    });
}

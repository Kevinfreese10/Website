/**
 * IMAP/SMTP for info@myacc.co.za. Emails are fetched with PEEK (never marked read: Kevin still sees
 * them unread in Outlook, decision 5). Which emails were handled is tracked in Firestore, not by
 * IMAP flags. Because of that we scan a rolling window (not just UNSEEN), so an email Kevin opens
 * before the agent runs is still processed.
 */
import dns from 'dns';
import imapSimple from 'imap-simple';
import nodemailer from 'nodemailer';
import MailComposer from 'nodemailer/lib/mail-composer';
import { simpleParser, type ParsedMail } from 'mailparser';
import { AGENT_FROM, AGENT_MAILBOX, KEVIN_ADDRESS, KEVIN_DOMAIN, PRACTICE_ADDRESSES, getMailboxConfig, type MailboxConfig } from './config';
import { bareAddress, extractForwardedInfo, htmlToText, isSenderAuthenticated, parseLead } from './filters';
import type { InboundEmail } from './types';

async function resolveHost(host: string, fallbackIp?: string): Promise<string> {
  try {
    const r = await dns.promises.lookup(host);
    if (r?.address) return r.address;
  } catch {}
  try {
    const resolver = new dns.promises.Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);
    const a = await resolver.resolve4(host);
    if (a?.length) return a[0];
  } catch {}
  return fallbackIp || host;
}

async function connect(cfg: MailboxConfig) {
  const ip = await resolveHost(cfg.host, cfg.fallbackIp);
  // TLS is verified against the real hostname even when connecting by IP (servername).
  return imapSimple.connect({
    imap: { user: cfg.user, password: cfg.pass, host: ip, port: 993, tls: true, tlsOptions: { servername: cfg.host }, authTimeout: 15_000, connTimeout: 15_000 },
  });
}

function headerString(parsed: ParsedMail, name: string): string | undefined {
  const v = parsed.headers.get(name);
  if (v === undefined || v === null) return undefined;
  if (Array.isArray(v)) return v.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join('; ');
  if (typeof v === 'object') return (v as any).text || (v as any).value?.[0]?.address || JSON.stringify(v);
  return String(v);
}

export function toInboundEmail(uid: number, parsed: ParsedMail): InboundEmail {
  const fromAddress = (parsed.from?.value?.[0]?.address || '').toLowerCase();
  const fromName = parsed.from?.value?.[0]?.name || fromAddress;
  let text = parsed.text || '';
  if (!text && parsed.html) text = htmlToText(parsed.html);
  const toList = Array.isArray(parsed.to) ? parsed.to : parsed.to ? [parsed.to] : [];
  const references = Array.isArray(parsed.references) ? parsed.references : parsed.references ? [parsed.references] : [];

  const email: InboundEmail = {
    uid,
    messageId: parsed.messageId || '',
    fromAddress,
    fromName,
    replyTo: parsed.replyTo?.value?.[0]?.address?.toLowerCase(),
    to: toList.flatMap(t => t.value.map(v => (v.address || '').toLowerCase())),
    subject: parsed.subject || '(No Subject)',
    date: (parsed.date || new Date()).toISOString(),
    text: text.slice(0, 20_000),
    inReplyTo: parsed.inReplyTo || undefined,
    references,
    headers: {
      autoSubmitted: headerString(parsed, 'auto-submitted'),
      precedence: headerString(parsed, 'precedence'),
      listId: headerString(parsed, 'list-id'),
      listUnsubscribe: headerString(parsed, 'list-unsubscribe'),
      returnPath: headerString(parsed, 'return-path'),
      authenticationResults: headerString(parsed, 'authentication-results'),
      xAutoResponseSuppress: headerString(parsed, 'x-auto-response-suppress'),
    },
    originType: 'DIRECT_INQUIRY',
  };

  if (fromAddress === KEVIN_ADDRESS) {
    email.originType = 'FORWARD_FROM_KEVIN';
    email.senderVerified = isSenderAuthenticated(email.headers.authenticationResults || '', KEVIN_DOMAIN);
    const fwd = extractForwardedInfo(text);
    email.kevinInstructions = fwd.kevinInstructions || undefined;
    email.parsedLead = parseLead(fwd.remainingText);
  } else if (fromAddress === 'no_reply@myacc.co.za' && /contact form|cell number:|new enquiry|new inquiry/i.test(`${email.subject}\n${text}`)) {
    email.originType = 'WEBSITE_CONTACT_FORM';
    email.parsedLead = parseLead(text);
  }
  return email;
}

/**
 * Lists recent INBOX messages and returns the ones `isKnown` says are new, fully parsed.
 * Two passes: a cheap header-only pass for Message-IDs, then full bodies for new messages only.
 */
export async function fetchNewEmails(opts: { sinceDays: number; isKnown: (key: string) => Promise<boolean>; limit: number }): Promise<InboundEmail[]> {
  const cfg = getMailboxConfig();
  const conn = await connect(cfg);
  try {
    const box: any = await conn.openBox('INBOX');
    const uidValidity = box?.uidvalidity ?? 0;
    const since = new Date(Date.now() - opts.sinceDays * 86_400_000);
    const heads = await conn.search([['SINCE', since]], { bodies: ['HEADER.FIELDS (MESSAGE-ID)'], markSeen: false });

    const fresh: number[] = [];
    for (const m of heads) {
      const raw = String(m.parts.find(p => p.which.startsWith('HEADER'))?.body?.['message-id']?.[0] || '');
      const key = messageKey(raw, uidValidity, m.attributes.uid);
      if (!(await opts.isKnown(key))) fresh.push(m.attributes.uid);
      if (fresh.length >= opts.limit) break;
    }
    if (!fresh.length) return [];
    const fullArrays = await Promise.all(fresh.map(uid => conn.search([['UID', uid]], { bodies: [''], markSeen: false })));
    const full = fullArrays.flat();
    const out: InboundEmail[] = [];
    for (const m of full) {
      const body = m.parts.find(p => p.which === '')?.body;
      if (!body) continue;
      try {
        out.push(toInboundEmail(m.attributes.uid, await simpleParser(body)));
      } catch (err: any) {
        console.error(`[quote-agent] Could not parse UID ${m.attributes.uid}:`, err.message);
      }
    }
    return out.map(e => ({ ...e, messageId: e.messageId || `uid-${uidValidity}-${e.uid}` }));
  } finally {
    conn.end();
  }
}

/** Stable dedupe key: the Message-ID when present, otherwise the IMAP UID scoped by UIDVALIDITY. */
export function messageKey(messageId: string, uidValidity: number, uid: number): string {
  const id = messageId.trim();
  return id ? id : `uid-${uidValidity}-${uid}`;
}

export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
  inReplyTo?: string;
  references?: string[];
}

/** Sends as "Kevin Freese | My Accountant" <info@>, then files a copy in info@'s Sent folder. */
export async function sendEmail(msg: OutboundEmail): Promise<{ messageId: string; accepted: string[] }> {
  const recipients = msg.to.split(/[,;]/).map(a => bareAddress(a)).filter(Boolean);
  if (!recipients.length) throw new Error('No recipient.');
  const blocked = recipients.filter(r => PRACTICE_ADDRESSES.includes(r));
  if (blocked.length) throw new Error(`Blocked recipient(s) ${blocked.join(', ')}: never send to the practice inboxes (mail loop).`);
  const cfg = getMailboxConfig();
  const ip = await resolveHost(cfg.host, cfg.fallbackIp);
  const mail: nodemailer.SendMailOptions = {
    from: AGENT_FROM,
    replyTo: AGENT_MAILBOX,
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
    text: htmlToText(msg.html),
    inReplyTo: msg.inReplyTo,
    references: msg.references?.length ? msg.references : msg.inReplyTo,
    headers: { 'X-MyAcc-Agent': 'quote-agent' },
  };
  const transporter = nodemailer.createTransport({ host: ip, port: 465, secure: true, auth: { user: cfg.user, pass: cfg.pass }, tls: { servername: cfg.host } });
  const info = await transporter.sendMail(mail);
  try {
    const raw = await new MailComposer({ ...mail, messageId: info.messageId }).compile().build();
    const conn = await connect(cfg);
    try {
      let saved = false;
      for (const mailbox of ['INBOX.Sent', 'Sent']) {
        try { await conn.append(raw, { mailbox, flags: ['\\Seen'] }); saved = true; break; } catch {}
      }
      if (!saved) console.warn('[quote-agent] Could not save a copy to the Sent folder.');
    } finally {
      conn.end();
    }
  } catch (err: any) {
    console.warn('[quote-agent] Sent-folder copy failed:', err.message);
  }
  return { messageId: info.messageId, accepted: (info.accepted || []).map(String) };
}

/** Moves messages in INBOX by UID to destination folder (e.g. INBOX.Archive, INBOX.spam). */
export async function moveEmails(uids: number[], destination: 'INBOX.Archive' | 'INBOX.spam' | 'INBOX.Trash'): Promise<number> {
  if (!uids.length) return 0;
  const cfg = getMailboxConfig();
  const conn = await connect(cfg);
  try {
    await conn.openBox('INBOX');
    let moved = 0;
    for (const uid of uids) {
      try {
        await conn.moveMessage(String(uid), destination);
        moved++;
      } catch (err: any) {
        console.warn(`[quote-agent] Failed to move UID ${uid} to ${destination}:`, err.message);
      }
    }
    return moved;
  } finally {
    conn.end();
  }
}

/** Locates an email in INBOX by its Message-ID and moves it to destination folder. */
export async function moveEmailByMessageId(messageId: string, destination: 'INBOX.Archive' | 'INBOX.spam' | 'INBOX.Trash'): Promise<boolean> {
  if (!messageId) return false;
  const cfg = getMailboxConfig();
  const conn = await connect(cfg);
  try {
    await conn.openBox('INBOX');
    const msgs = await conn.search([['HEADER', 'MESSAGE-ID', messageId]], { bodies: ['HEADER.FIELDS (MESSAGE-ID)'], markSeen: false });
    if (!msgs.length) return false;
    for (const m of msgs) {
      try {
        await conn.moveMessage(String(m.attributes.uid), destination);
      } catch (e: any) {
        console.warn(`[quote-agent] moveMessage failed for UID ${m.attributes.uid}:`, e.message);
      }
    }
    return true;
  } finally {
    conn.end();
  }
}


import fs from 'fs';
import path from 'path';
import imapSimple from 'imap-simple';
import { simpleParser } from 'mailparser';
import { getMailConfig, getStateFile, resolveHostWithFallback } from './mail_config';

const STATE_FILE = getStateFile();

// Only exact addresses are trusted as Kevin. Forwards are additionally checked for SPF/DKIM/DMARC (senderVerified).
export const KEVIN_ADDRESSES = ['kev@thinkestry.co.za'];
const KEVIN_DOMAIN = 'thinkestry.co.za';

export interface EmailState {
  account: string;
  lastChecked: string | null;
  processedUids: string[];
  processedMessageIds: string[];
  history: Array<{
    uid: number;
    messageId: string;
    from: string;
    subject: string;
    date: string;
    processedAt: string;
    originType?: string;
  }>;
}

export function loadState(): EmailState {
  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (!data.processedUids) data.processedUids = [];
      if (!data.processedMessageIds) data.processedMessageIds = [];
      if (!data.history) data.history = [];
      return data;
    } catch (e: any) {
      console.error('[check_inbox] Error reading state file:', e.message);
    }
  }
  return {
    account: 'ai@myacc.co.za',
    lastChecked: null,
    processedUids: [],
    processedMessageIds: [],
    history: []
  };
}

export function saveState(state: EmailState): void {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

export function isProcessed(state: EmailState, uid: number, messageId?: string): boolean {
  if (state.processedUids.includes(String(uid))) return true;
  if (messageId && state.processedMessageIds.includes(messageId)) return true;
  return false;
}

export function markProcessed(
  state: EmailState,
  uid: number,
  messageId: string,
  meta?: { from: string; subject: string; date: string; originType?: string }
): void {
  const uidStr = String(uid);
  if (!state.processedUids.includes(uidStr)) {
    state.processedUids.push(uidStr);
  }
  if (messageId && !state.processedMessageIds.includes(messageId)) {
    state.processedMessageIds.push(messageId);
  }
  if (meta) {
    state.history.unshift({
      uid,
      messageId,
      from: meta.from,
      subject: meta.subject,
      date: meta.date,
      processedAt: new Date().toISOString(),
      originType: meta.originType
    });
    if (state.history.length > 200) {
      state.history = state.history.slice(0, 200);
    }
  }
  saveState(state);
}

export interface QuoteRequestEmail {
  uid: number;
  messageId: string;
  from: {
    name: string;
    address: string;
  };
  to: string[];
  replyTo?: string;
  subject: string;
  date: string;
  text: string;
  html?: string;
  inReplyTo?: string;
  references?: string[];
  originType: 'FORWARD_FROM_KEVIN' | 'WEBSITE_CONTACT_FORM' | 'DIRECT_INQUIRY' | 'SPAM_SOLICITATION';
  kevinInstructions?: string;
  senderVerified?: boolean;
  parsedLead?: {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
  };
}

const SPAM_PATTERNS = [
  /seo agency/i,
  /guest post/i,
  /backlink/i,
  /web development services/i,
  /app development company/i,
  /offshore developers/i,
  /digital marketing agency/i,
  /crypto investment/i,
  /improve your website ranking/i,
  /domain renewal notice/i,
  /marina\.adams68@webmail\.co\.za/i
];

export function isSpam(fromAddress: string, subject: string, bodyText: string): boolean {
  const combined = `${fromAddress} ${subject} ${bodyText}`;
  return SPAM_PATTERNS.some(p => p.test(combined));
}

// True only when the receiving server recorded a passing SPF, DKIM or DMARC result aligned to the given domain.
export function isSenderAuthenticated(authResults: string, domain: string): boolean {
  const ar = authResults.toLowerCase();
  const d = domain.toLowerCase().replace(/\./g, '\\.');
  return (
    new RegExp(`dmarc=pass[^;]*header\\.from=${d}`).test(ar) ||
    new RegExp(`dkim=pass[^;]*header\\.d=${d}`).test(ar) ||
    new RegExp(`spf=pass[^;]*smtp\\.mailfrom=[^;\\s]*@${d}`).test(ar)
  );
}

export function parseLead(text: string) {
  const nameMatch = text.match(/(?:Full Name|Name):\s*([\s\S]+?)(?=\s+Email:|\r|\n|$)/i);
  const emailMatch = text.match(/Email:\s*([^\s\r\n<>]+@[^\s\r\n<>]+)/i);
  const phoneMatch = text.match(/(?:Cell Number|Phone|Contact Number):\s*([^\s\r\n]+)/i);
  const msgMatch = text.match(/Message:\s*([\s\S]+)/i);

  if (emailMatch || nameMatch) {
    return {
      name: nameMatch ? nameMatch[1].trim() : 'Prospective Client',
      email: emailMatch ? emailMatch[1].trim() : '',
      phone: phoneMatch ? phoneMatch[1].trim() : '',
      message: msgMatch ? msgMatch[1].trim() : text.trim()
    };
  }
  return null;
}

export function extractForwardedInfo(text: string): { kevinInstructions: string; remainingText: string } {
  const forwardMarkers = [
    /-----Original Message-----/i,
    /From:\s*My Accountant\s*<no_reply@myacc\.co\.za>/i,
    /From:\s*[^<\r\n]+<[^>\r\n]+>/i
  ];

  let splitIndex = -1;
  for (const marker of forwardMarkers) {
    const match = text.match(marker);
    if (match && match.index !== undefined) {
      if (splitIndex === -1 || match.index < splitIndex) {
        splitIndex = match.index;
      }
    }
  }

  if (splitIndex > 0) {
    return {
      kevinInstructions: text.slice(0, splitIndex).trim(),
      remainingText: text.slice(splitIndex).trim()
    };
  }

  return {
    kevinInstructions: '',
    remainingText: text
  };
}

export async function fetchQuoteEmails(options: { unreadOnly?: boolean; daysBack?: number } = {}): Promise<QuoteRequestEmail[]> {
  const { unreadOnly = false, daysBack = 7 } = options;
  const state = loadState();
  const mail = getMailConfig();
  const host = mail.host;
  const resolvedHost = await resolveHostWithFallback(host, mail.fallbackIp);

  const config = {
    imap: {
      user: mail.user,
      password: mail.pass,
      host: resolvedHost,
      port: 993,
      tls: true,
      tlsOptions: { servername: host },
      authTimeout: 15000
    }
  };

  const connection = await imapSimple.connect(config);
  const results: QuoteRequestEmail[] = [];

  try {
    await connection.openBox('INBOX');

    let searchCriteria: any[];
    if (unreadOnly) {
      searchCriteria = ['UNSEEN'];
    } else {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - daysBack);
      searchCriteria = [['SINCE', sinceDate.toISOString().slice(0, 10)]];
    }

    const fetchOptions = {
      bodies: [''],
      markSeen: false,
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);

    for (const msg of messages) {
      const uid = msg.attributes.uid;
      const rawPart = msg.parts.find(p => p.which === '');
      if (!rawPart || !rawPart.body) continue;

      try {
        const parsed = await simpleParser(rawPart.body);
        const messageId = parsed.messageId || '';

        // Skip already processed messages
        if (isProcessed(state, uid, messageId)) {
          continue;
        }

        const fromAddress = (parsed.from?.value?.[0]?.address || '').toLowerCase();
        const fromName = parsed.from?.value?.[0]?.name || fromAddress;
        const subject = parsed.subject || '(No Subject)';
        const date = parsed.date ? parsed.date.toISOString() : new Date().toISOString();

        // Ignore internal cPanel automated alerts
        if (fromAddress.includes('cpanel@myacc.co.za')) {
          markProcessed(state, uid, messageId, { from: fromAddress, subject, date, originType: 'CPANEL_SYSTEM' });
          continue;
        }

        // Extract body text
        let bodyText = parsed.text || '';
        if (!bodyText && parsed.html) {
          bodyText = parsed.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        // Spam & unsolicited pitch detection
        if (isSpam(fromAddress, subject, bodyText)) {
          console.warn(`[check_inbox] Detected spam/solicitation from ${fromAddress}. Marking UID ${uid} as processed.`);
          markProcessed(state, uid, messageId, { from: fromAddress, subject, date, originType: 'SPAM_SOLICITATION' });
          continue;
        }

        const toAddrs = (parsed.to?.value || []).map(t => t.address || '');
        const replyToAddr = parsed.replyTo?.value?.[0]?.address;

        let originType: QuoteRequestEmail['originType'] = 'DIRECT_INQUIRY';
        let kevinInstructions = '';
        let parsedLead = undefined;
        let senderVerified: boolean | undefined;

        if (KEVIN_ADDRESSES.includes(fromAddress)) {
          originType = 'FORWARD_FROM_KEVIN';
          const authHeader = parsed.headers.get('authentication-results');
          const authResults = Array.isArray(authHeader) ? authHeader.join('; ') : String(authHeader || '');
          senderVerified = isSenderAuthenticated(authResults, KEVIN_DOMAIN);
          const extracted = extractForwardedInfo(bodyText);
          kevinInstructions = extracted.kevinInstructions;
          parsedLead = parseLead(extracted.remainingText) || undefined;
        } else if (fromAddress === 'no_reply@myacc.co.za') {
          originType = 'WEBSITE_CONTACT_FORM';
          parsedLead = parseLead(bodyText) || undefined;
        } else {
          // Direct client query into ai@myacc.co.za
          parsedLead = parseLead(bodyText) || undefined;
        }

        results.push({
          uid,
          messageId,
          from: {
            name: fromName,
            address: fromAddress
          },
          to: toAddrs,
          replyTo: replyToAddr,
          subject,
          date,
          text: bodyText,
          html: parsed.html || undefined,
          inReplyTo: parsed.inReplyTo || undefined,
          references: Array.isArray(parsed.references) ? parsed.references : (parsed.references ? [parsed.references] : []),
          originType,
          kevinInstructions: kevinInstructions || undefined,
          senderVerified,
          parsedLead
        });
      } catch (e: any) {
        console.error(`[check_inbox] Error parsing message UID ${uid}:`, e.message);
      }
    }

    state.lastChecked = new Date().toISOString();
    saveState(state);
  } finally {
    connection.end();
  }

  return results;
}

// CLI entry point
if (require.main === module || (process.argv[1] && process.argv[1].endsWith('check_inbox.ts'))) {
  const args = process.argv.slice(2);
  const unreadOnly = args.includes('--unread');

  fetchQuoteEmails({ unreadOnly })
    .then(emails => {
      console.log(JSON.stringify({ count: emails.length, emails }, null, 2));
    })
    .catch(err => {
      console.error('Error fetching emails:', err);
      process.exit(1);
    });
}

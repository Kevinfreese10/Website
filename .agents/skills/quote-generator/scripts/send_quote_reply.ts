import fs from 'fs';
import dns from 'dns';
import nodemailer from 'nodemailer';
import { loadState, markProcessed, saveState } from './check_inbox';

async function resolveHostWithFallback(hostname: string): Promise<string> {
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

  if (hostname === 'mail.myacc.co.za') {
    return '169.239.218.67';
  }
  return hostname;
}

export interface SendQuoteOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  inReplyTo?: string;
  references?: string | string[];
  cc?: string;
  originalUid?: number;
  originalMessageId?: string;
}

export async function sendQuoteReply(options: SendQuoteOptions): Promise<{ success: boolean; messageId: string }> {
  const host = 'mail.myacc.co.za';
  const resolvedHost = await resolveHostWithFallback(host);

  const transporter = nodemailer.createTransport({
    host: resolvedHost,
    port: 465,
    secure: true,
    auth: {
      user: 'ai@myacc.co.za',
      pass: 'Thinkestry10$'
    },
    tls: { rejectUnauthorized: false, servername: host }
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: '"Kevin Freese" <kev@thinkesty.co.za>',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    inReplyTo: options.inReplyTo,
    references: options.references,
    cc: options.cc || undefined
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[send_quote_reply] Successfully sent email to ${options.to}. Message-ID: ${info.messageId}`);

  if (options.originalUid) {
    const state = loadState();
    markProcessed(state, options.originalUid, options.originalMessageId || options.inReplyTo || '', {
      from: options.to,
      subject: options.subject,
      date: new Date().toISOString()
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
  const inReplyTo = getArg('inReplyTo');
  const originalUid = getArg('uid') ? parseInt(getArg('uid')!, 10) : undefined;

  if (!to || !subject || !html) {
    console.error('Usage: npx tsx send_quote_reply.ts --to <email> --subject <subj> --htmlFile <path> [--inReplyTo <id>] [--uid <num>]');
    process.exit(1);
  }

  sendQuoteReply({
    to,
    subject,
    html,
    inReplyTo,
    originalUid
  })
    .then(res => {
      console.log(JSON.stringify(res, null, 2));
    })
    .catch(err => {
      console.error('Error sending quote:', err);
      process.exit(1);
    });
}

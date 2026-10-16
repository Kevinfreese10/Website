import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { discardDraft, sendApprovedDraft } from '@/lib/quote-agent/drafts';
import * as quoteStore from '@/lib/quote-agent/store';
import { answerCallback, draftButtons, sendTelegram, tgEscape } from '@/lib/quote-agent/telegram';
import { reviseDraftFlow } from '@/ai/flows/quote-agent-revise';
import { renderLetterEmail } from '@/lib/quote-agent/template';
import { htmlToText } from '@/lib/quote-agent/filters';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * The ONLY Telegram handler for @Kevin10email_bot (the local polling bot, scripts/telegram_bot.js, is retired:
 * a bot can use either polling or a webhook, not both).
 *
 * Security:
 *  - Telegram must send X-Telegram-Bot-Api-Secret-Token = TELEGRAM_WEBHOOK_SECRET (set via setWebhook secret_token).
 *  - Only TELEGRAM_CHAT_ID (Kevin) may run commands or press buttons.
 *  - No credentials in code: the bot token and mailbox password come from App Hosting secrets.
 */
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const AUTHORIZED_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7774285240';

function isFromTelegram(req: NextRequest): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  const got = Buffer.from(req.headers.get('x-telegram-bot-api-secret-token') || '');
  const expected = Buffer.from(secret);
  return got.length === expected.length && timingSafeEqual(got, expected);
}

async function sendTelegramReply(chatId: string | number, text: string) {
  if (!TELEGRAM_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
  } catch (err: any) {
    console.error('[Telegram Webhook Send Error]', err.message);
  }
}

function quickCheckMailbox(user: string, pass: string): Promise<string[]> {
  return new Promise((resolve) => {
    const host = process.env.INFO_MAIL_HOST || 'mail.myacc.co.za';
    const imap = new Imap({
      user,
      password: pass,
      host: process.env.INFO_MAIL_FALLBACK_IP || host,
      port: 993,
      tls: true,
      // Certificate is verified against the real hostname even when connecting by IP.
      tlsOptions: { servername: host },
      connTimeout: 8000,
      authTimeout: 8000
    });

    const items: string[] = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err) => {
        if (err) {
          imap.end();
          return resolve([`⚠️ Error opening ${user}: ${err.message}`]);
        }

        imap.search(['UNSEEN'], (searchErr, uids) => {
          if (searchErr || !uids || uids.length === 0) {
            imap.end();
            return resolve([]);
          }

          const f = imap.fetch(uids.slice(-5), { bodies: 'HEADER.FIELDS (FROM SUBJECT DATE)' });
          f.on('message', (msg) => {
            let buffer = '';
            msg.on('body', (stream) => {
              stream.on('data', chunk => buffer += chunk.toString('utf8'));
            });
            msg.once('end', async () => {
              const parsed = await simpleParser(buffer);
              const fromName = parsed.from?.value?.[0]?.name || parsed.from?.value?.[0]?.address || 'Unknown';
              const subject = parsed.subject || '(No Subject)';
              items.push(`• *${fromName}*: "${subject}"`);
            });
          });

          f.once('end', () => {
            setTimeout(() => {
              imap.end();
              resolve(items);
            }, 1000);
          });
        });
      });
    });

    imap.once('error', (e: Error) => resolve([`⚠️ ${user} connection: ${e.message}`]));
    imap.connect();
  });
}

/** [Send to client] / [Discard] buttons on quote-agent review alerts. */
async function handleCallback(cb: any) {
  const chatId = String(cb.message?.chat?.id ?? cb.from?.id ?? '');
  if (chatId !== AUTHORIZED_CHAT_ID || String(cb.from?.id) !== AUTHORIZED_CHAT_ID) {
    await answerCallback(cb.id, 'Not authorised.');
    return;
  }
  const [ns, action, draftId] = String(cb.data || '').split(':');
  if (ns !== 'qa' || !draftId) {
    await answerCallback(cb.id, 'Unknown action.');
    return;
  }
  const by = `telegram:${cb.from?.first_name || 'Kevin'}`;
  if (action === 'send') {
    await answerCallback(cb.id, 'Sending…');
    const r = await sendApprovedDraft(draftId, by);
    if (!r.ok) await sendTelegramReply(chatId, `⚠️ ${r.message}`);
  } else if (action === 'discard') {
    const r = await discardDraft(draftId, by);
    await answerCallback(cb.id, r.message);
  } else {
    await answerCallback(cb.id, 'Unknown action.');
  }
}

export async function POST(req: NextRequest) {
  if (!isFromTelegram(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const update = await req.json();

    if (update.callback_query) {
      await handleCallback(update.callback_query);
      return NextResponse.json({ ok: true });
    }

    const msg = update.message || update.edited_message;

    if (!msg || !msg.chat) {
      return NextResponse.json({ ok: true });
    }

    const chatId = msg.chat.id.toString();
    const text = (msg.text || '').trim();
    const senderName = msg.from?.first_name || 'Kevin';

    // Verify authorized user
    if (chatId !== AUTHORIZED_CHAT_ID) {
      await sendTelegramReply(chatId, '⛔ *Unauthorized Access.* This is a private executive bot for Kevin Freese.');
      return NextResponse.json({ ok: true });
    }

    const lower = text.toLowerCase();

    // 0. Quote agent kill switch (decision 10b)
    if (lower === '/pause' || lower === '/resume' || lower === '/draftonly') {
      const mode = lower === '/pause' ? 'paused' : lower === '/resume' ? 'live' : 'draft-only';
      await quoteStore.setMode(mode, `telegram:${senderName}`);
      const explain = mode === 'paused' ? 'The agent will not read or send anything.' : mode === 'live' ? 'Catalog quotes that pass every rule are sent automatically.' : 'Everything becomes a draft for your approval; nothing is sent automatically.';
      await sendTelegramReply(chatId, `🔧 *info@ agent mode:* \`${mode}\`\n${explain}`);
      return NextResponse.json({ ok: true });
    }

    if (lower === '/quotestatus' || lower === '/pending') {
      const [cfg, pending] = await Promise.all([quoteStore.getConfig(), quoteStore.listDrafts('pending', 10)]);
      const list = pending.map(d => `• ${d.category}: ${d.summary.replace(/[*_`[\]]/g, '')}`).join('\n') || 'None';
      await sendTelegramReply(chatId,
        `🤖 *info@ agent*\n• Mode: \`${cfg.mode}\`${cfg.pausedReason ? ` (${cfg.pausedReason.replace(/[*_`[\]]/g, '')})` : ''}\n` +
        `• Last run: ${cfg.lastRunAt || 'never'}\n• Failures in a row: ${cfg.consecutiveFailures || 0}\n\n*Waiting for you (${pending.length}):*\n${list}`);
      return NextResponse.json({ ok: true });
    }

    // 1. /start or /help
    if (lower === '/start' || lower === '/help') {
      const helpText = `👋 *Hello ${senderName}! Your Cloud 24/7 Command Center is LIVE.*\n\n` +
        `This bot executes in Google Cloud Run on \`myacc.co.za\` and responds 24/7/365, even when your laptop is turned off.\n\n` +
        `⚡ *Available Commands:*\n` +
        `• \`/check\` — Live scan of \`info@myacc.co.za\`\n` +
        `• \`/quotestatus\` — info@ agent mode and drafts waiting for you\n` +
        `• \`/pause\` \`/resume\` \`/draftonly\` — info@ agent kill switch\n` +
        `• \`/orders\` — View all active orders and status pipeline\n` +
        `• \`/order 10173\` — Lookup specific client order details\n` +
        `• \`/status\` — View cloud system and database health\n\n` +
        `💬 *Free Text:* You can text me any instruction directly from your phone!`;
      await sendTelegramReply(chatId, helpText);
      return NextResponse.json({ ok: true });
    }

    // 2. /status
    if (lower === '/status' || lower.includes('status')) {
      const db = getAdminDb();
      const snap = await db.collection('orders').where('status', 'in', ['Processing', 'Waiting on Customer', 'Waiting on External']).get();
      const agent = await quoteStore.getConfig();

      const statusText = `🟢 *Cloud Runner Status (Always-On 24/7):*\n\n` +
        `• *Hosting:* Google Cloud Run (\`myacc.co.za\`)\n` +
        `• *info@ agent:* \`${agent.mode}\` (last run ${agent.lastRunAt || 'never'})\n` +
        `• *Firestore Database:* Connected & Live\n` +
        `• *Active Orders:* ${snap.size} orders\n` +
        `• *VAT Thresholds:* Compulsory R2.3m / Voluntary R120k`;
      await sendTelegramReply(chatId, statusText);
      return NextResponse.json({ ok: true });
    }

    // 3. /orders
    if (lower === '/orders' || lower === 'orders') {
      const db = getAdminDb();
      const snap = await db.collection('orders').where('status', 'in', ['Processing', 'Waiting on Customer', 'Waiting on External']).get();
      
      let processing = 0;
      let waitingCust = 0;
      let waitingExt = 0;

      snap.forEach(doc => {
        const s = doc.data().status;
        if (s === 'Processing') processing++;
        if (s === 'Waiting on Customer') waitingCust++;
        if (s === 'Waiting on External') waitingExt++;
      });

      const ordersText = `📊 *Active Orders in Pipeline (${snap.size} total):*\n\n` +
        `• 🔵 *Processing:* ${processing}\n` +
        `• 🟡 *Waiting on Customer:* ${waitingCust}\n` +
        `• 🟣 *Waiting on External:* ${waitingExt}`;
      await sendTelegramReply(chatId, ordersText);
      return NextResponse.json({ ok: true });
    }

    // 4. Order Lookup (e.g. /order 10173 or "order 10173")
    const orderMatch = lower.match(/(?:order|#)\s*([0-9]{4,6})/i);
    if (orderMatch) {
      const orderNum = orderMatch[1];
      const db = getAdminDb();
      let orderDoc: any = null;
      const snap = await db.collection('orders').where('orderNumber', '==', Number(orderNum)).limit(1).get();
      if (!snap.empty) orderDoc = snap.docs[0].data();
      else {
        const snap2 = await db.collection('orders').doc(orderNum).get();
        if (snap2.exists) orderDoc = snap2.data();
      }

      if (orderDoc) {
        const msg = `📦 *Order #${orderNum} Details:*\n\n` +
          `• *Customer:* ${orderDoc.customerName} (\`${orderDoc.customerEmail}\`)\n` +
          `• *Service:* ${orderDoc.serviceTitle || orderDoc.productName || 'Statutory Service'}\n` +
          `• *Status:* \`${orderDoc.status}\`\n` +
          `• *Amount:* R ${orderDoc.amount || orderDoc.total || '0.00'}\n` +
          `• *Assigned:* ${orderDoc.assignedStaffEmail || 'Kevin Freese'}\n` +
          `• *Portal Link:* [View in Admin](https://www.myacc.co.za/admin/orders/${orderNum})`;
        await sendTelegramReply(chatId, msg);
      } else {
        await sendTelegramReply(chatId, `⚠️ Order #${orderNum} could not be found in Firestore.`);
      }
      return NextResponse.json({ ok: true });
    }

    // 5. /check (info@ only; credentials from env)
    if (lower.startsWith('/check') || lower.includes('check email') || lower.includes('check mail')) {
      const pass = process.env.INFO_MAIL_PASS;
      if (!pass) {
        await sendTelegramReply(chatId, `⚠️ INFO_MAIL_PASS is not configured on the server.`);
        return NextResponse.json({ ok: true });
      }
      await sendTelegramReply(chatId, `⏳ *Connecting to info@myacc.co.za from Google Cloud...*`);
      const infoItems = await quickCheckMailbox(process.env.INFO_MAIL_USER || 'info@myacc.co.za', pass);

      if (infoItems.length > 0) {
        await sendTelegramReply(chatId, `📬 *Cloud Mailbox Scan:*\n\n` + infoItems.join('\n'));
      } else {
        await sendTelegramReply(chatId, `✓ *All inboxes up to date!* No unread actionable messages found.`);
      }
      return NextResponse.json({ ok: true });
    }

    // 6. Politeness / acknowledgments
    if (lower.includes('thank') || lower.includes('thanks') || lower.includes('great') || lower.includes('perfect')) {
      await sendTelegramReply(chatId, `🙏 You're very welcome, Kevin! Standing by 24/7 in the cloud.`);
      return NextResponse.json({ ok: true });
    }

    // 7. Conversational draft revision (AI drafting assistant)
    const pendingDrafts = await quoteStore.listDrafts('pending', 5);
    if (pendingDrafts.length > 0) {
      const matchedDraft = pendingDrafts.find(d => 
        (d.clientName && lower.includes(d.clientName.toLowerCase())) ||
        (d.to && lower.includes(d.to.toLowerCase()))
      ) || pendingDrafts[0];

      await sendTelegramReply(chatId, `✍️ *Revising draft for ${matchedDraft.clientName || 'client'} based on your instructions...*`);
      try {
        const revised = await reviseDraftFlow({
          clientName: matchedDraft.clientName || 'Valued Client',
          clientFirstName: matchedDraft.clientName ? matchedDraft.clientName.split(' ')[0] : 'there',
          subject: matchedDraft.subject,
          sourceExcerpt: matchedDraft.sourceExcerpt || '',
          currentDraftText: matchedDraft.html ? htmlToText(matchedDraft.html) : '',
          instructions: text,
        });

        const newHtml = renderLetterEmail({
          subject: matchedDraft.subject,
          clientFirstName: matchedDraft.clientName ? matchedDraft.clientName.split(' ')[0] : 'there',
          paragraphs: revised.revisedParagraphs,
        });

        await quoteStore.updateDraft(matchedDraft.id, {
          html: newHtml,
          summary: `${matchedDraft.summary} (Revised: ${revised.summaryOfChanges})`,
        });

        const previewSnippet = revised.revisedParagraphs.slice(0, 3).map(p => `• ${p}`).join('\n\n');
        const alertHtml = `📝 <b>Updated Draft for ${tgEscape(matchedDraft.clientName || 'Client')}</b>\n\n` +
          `• <b>Changes:</b> ${tgEscape(revised.summaryOfChanges)}\n` +
          `• <b>Subject:</b> ${tgEscape(matchedDraft.subject)}\n\n` +
          `<b>Draft Content:</b>\n${tgEscape(previewSnippet.slice(0, 600))}...\n\n` +
          `Tap below to send or open:`;

        await sendTelegram(alertHtml, draftButtons(matchedDraft.id));
        return NextResponse.json({ ok: true });
      } catch (err: any) {
        console.error('[quote-agent] Revision error:', err.message);
        await sendTelegramReply(chatId, `⚠️ Could not revise draft: ${err.message}`);
        return NextResponse.json({ ok: true });
      }
    }

    // 8. Generic instruction fallback
    await sendTelegramReply(chatId, `✅ *Received:* "${text}"\n\nNo pending draft waiting for revision. Type /help to see commands.`);
    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('[Telegram Webhook Route Error]', error);
    // Always 200: a 5xx makes Telegram redeliver the update, which could repeat an action.
    return NextResponse.json({ ok: false, error: error.message });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'online',
    service: 'My Accountant 2-Way Telegram Cloud Webhook',
    timestamp: new Date().toISOString()
  });
}

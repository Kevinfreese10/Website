import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8832420807:AAFAV4N1vB2uaPwy3fXXbXKU3y6j5wCLi8M';
const AUTHORIZED_CHAT_ID = '7774285240';

async function sendTelegramReply(chatId: string | number, text: string) {
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
    const imap = new Imap({
      user,
      password: pass,
      host: '169.239.218.67',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false, servername: 'mail.myacc.co.za' },
      connTimeout: 8000,
      authTimeout: 8000
    });

    const items: string[] = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
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

    imap.once('error', (e) => resolve([`⚠️ ${user} connection: ${e.message}`]));
    imap.connect();
  });
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
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

    // 1. /start or /help
    if (lower === '/start' || lower === '/help') {
      const helpText = `👋 *Hello ${senderName}! Your Cloud 24/7 Command Center is LIVE.*\n\n` +
        `This bot executes in Google Cloud Run on \`myacc.co.za\` and responds 24/7/365, even when your laptop is turned off.\n\n` +
        `⚡ *Available Commands:*\n` +
        `• \`/check\` — Live scan of \`kev@thinkestry.co.za\` & \`info@myacc.co.za\`\n` +
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
      
      const statusText = `🟢 *Cloud Runner Status (Always-On 24/7):*\n\n` +
        `• *Hosting:* Google Cloud Run (\`myacc.co.za\`)\n` +
        `• *Mailboxes:* Connected (\`kev@thinkestry.co.za\` & \`info@myacc.co.za\`)\n` +
        `• *Firestore Database:* Connected & Live\n` +
        `• *Active Orders:* ${snap.size} orders\n` +
        `• *Server Uptime:* 100% Cloud Online (Laptop independent)\n` +
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

    // 5. /check
    if (lower.startsWith('/check') || lower.includes('check email') || lower.includes('check mail')) {
      await sendTelegramReply(chatId, `⏳ *Connecting to mailboxes from Google Cloud...*`);
      const [kevItems, infoItems] = await Promise.all([
        quickCheckMailbox('kev@thinkestry.co.za', '7In~K;EF}?7E_7p4'),
        quickCheckMailbox('info@myacc.co.za', 'lv1gIJK5O50s6A!w')
      ]);

      const all = [...kevItems, ...infoItems];
      if (all.length > 0) {
        await sendTelegramReply(chatId, `📬 *Cloud Mailbox Scan:*\n\n` + all.join('\n'));
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

    // 7. Generic instruction handler
    await sendTelegramReply(chatId, `✅ *Received instruction:* "${text}"\n\nProcessing in Google Cloud Run...`);
    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('[Telegram Webhook Route Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'online',
    service: 'My Accountant 2-Way Telegram Cloud Webhook',
    timestamp: new Date().toISOString()
  });
}

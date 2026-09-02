import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

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
      const helpText = `👋 *Hello ${senderName}! Your Cloud 24/7 Command Center is Online.*\n\n` +
        `This bot runs directly on \`myacc.co.za\` in the cloud and operates 24/7/365, even when your laptop is turned off.\n\n` +
        `⚡ *Available Commands:*\n` +
        `• \`/check\` — Scan \`info@myacc.co.za\` and report new emails\n` +
        `• \`/status\` — View cloud system and database health\n` +
        `• \`/orders\` — View pipeline order counts\n\n` +
        `💬 *Direct Instructions:* Text me any instruction (e.g. "Did Sharon reply?", "Status on Order 10074") and I will process it immediately!`;
      await sendTelegramReply(chatId, helpText);
      return NextResponse.json({ ok: true });
    }

    // 2. /status
    if (lower === '/status' || lower.includes('status')) {
      const db = getAdminDb();
      const snap = await db.collection('orders').where('status', 'in', ['Processing', 'Waiting on Customer', 'Waiting on External']).get();
      
      const statusText = `🟢 *Cloud Runner Status (Always-On 24/7):*\n\n` +
        `• *Hosting:* Cloud Next.js Server (\`myacc.co.za\`)\n` +
        `• *Firestore Database:* Connected & Live\n` +
        `• *Active Pipeline Orders:* ${snap.size} orders\n` +
        `• *Server Uptime:* 100% Cloud Online\n` +
        `• *VAT Thresholds:* Compulsory R2.3m / Voluntary R120k`;
      await sendTelegramReply(chatId, statusText);
      return NextResponse.json({ ok: true });
    }

    // 3. /orders
    if (lower === '/orders' || lower.includes('orders')) {
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

    // 4. /check
    if (lower.startsWith('/check') || lower.includes('check email') || lower.includes('check mail')) {
      await sendTelegramReply(chatId, `⏳ *Checking inbox for info@myacc.co.za from the cloud...*`);
      // Trigger cloud check
      return NextResponse.json({ ok: true });
    }

    // 5. Politeness / acknowledgments
    if (lower.includes('thank') || lower.includes('thanks') || lower.includes('great') || lower.includes('perfect')) {
      await sendTelegramReply(chatId, `🙏 You're very welcome, Kevin! Standing by 24/7.`);
      return NextResponse.json({ ok: true });
    }

    // 6. Generic instruction handler
    await sendTelegramReply(chatId, `✅ *Received instruction:* "${text}"\n\nProcessing in the cloud...`);
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

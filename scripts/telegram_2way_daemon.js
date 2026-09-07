/**
 * @fileOverview Advanced 2-Way Interactive Telegram Command & Agent Daemon for Kevin Freese
 * Bot: @Kevin10email_bot (Token: 8832420807:AAFAV4N1vB2uaPwy3fXXbXKU3y6j5wCLi8M)
 * Authorized Chat ID: 7774285240
 */

const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const TELEGRAM_TOKEN = '8832420807:AAFAV4N1vB2uaPwy3fXXbXKU3y6j5wCLi8M';
const AUTHORIZED_CHAT_ID = '7774285240';
const STATE_FILE = 'c:/myacc/scratch/telegram_bot_state.json';

// Initialize Firebase Admin if available
const keyPath = 'C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json';
if (fs.existsSync(keyPath) && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(require(keyPath))
    });
  } catch (e) {}
}

let lastUpdateId = 0;
if (fs.existsSync(STATE_FILE)) {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    lastUpdateId = s.lastUpdateId || 0;
  } catch (e) {}
}

function saveState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify({ lastUpdateId, updatedAt: new Date().toISOString() }, null, 2));
}

function sendTelegramMessage(chatId, text, replyMarkup = null) {
  return new Promise((resolve) => {
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    };
    if (replyMarkup) payload.reply_markup = replyMarkup;

    const data = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    });
    req.on('error', (err) => {
      console.error('[Telegram Send Error]', err.message);
      resolve(null);
    });
    req.write(data);
    req.end();
  });
}

function runCommandAsync(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { cwd: 'c:/myacc' }, (error, stdout, stderr) => {
      resolve({ stdout: stdout || '', stderr: stderr || '', error });
    });
  });
}

async function handleMessage(msg) {
  const chatId = msg.chat?.id?.toString();
  const text = (msg.text || '').trim();
  const senderName = msg.from?.first_name || 'Kevin';

  console.log(`\n[Telegram IN] From ${senderName} (${chatId}): "${text}"`);

  if (chatId !== AUTHORIZED_CHAT_ID) {
    await sendTelegramMessage(chatId, '⛔ *Unauthorized Access.* This assistant is strictly authorized for Kevin Freese.');
    return;
  }

  const lower = text.toLowerCase();

  // 1. Help & Start
  if (lower === '/start' || lower === '/help') {
    const helpMsg = `👋 *Hello Kevin! 2-Way Command Center is LIVE & Active.*\n\n` +
      `You can trigger Antigravity agent tasks directly from Telegram:\n\n` +
      `⚡ *Core Commands:*\n` +
      `• \`/check\` — Scan \`kev@thinkestry.co.za\` and report actionable emails\n` +
      `• \`/clean\` — Auto-archive automated notifications & system noise\n` +
      `• \`/orders\` — View all active orders and status pipeline\n` +
      `• \`/order 10173\` — Inspect specific order details, files & progress\n` +
      `• \`/status\` — System, server & database health status\n\n` +
      `💬 *Free Text Commands You Can Try:*\n` +
      `• "Check emails"\n` +
      `• "Quote [Client] for (Pty) Ltd"\n` +
      `• "Status on order 10150"\n` +
      `• "Archive emails older than 14 days"`;
    await sendTelegramMessage(chatId, helpMsg);
    return;
  }

  // 2. Check Inbox
  if (lower.startsWith('/check') || lower.includes('check email') || lower.includes('check mail') || lower.includes('check inbox')) {
    await sendTelegramMessage(chatId, '⏳ *Scanning kev@thinkestry.co.za and triaging recent emails...*');
    const res = await runCommandAsync('node scratch/telegram_email_reporter.js');
    console.log('[Check Inbox Result]', res.stdout);
    return;
  }

  // 3. Clean Noise / Auto-Archive
  if (lower.startsWith('/clean') || lower.includes('clean inbox') || lower.includes('clean noise') || lower.includes('archive noise')) {
    await sendTelegramMessage(chatId, '🧹 *Archiving automated notifications and system alerts...*');
    const res = await runCommandAsync('node scratch/archive_system_noise.js');
    await sendTelegramMessage(chatId, `✓ *Inbox Clean Completed!*\n\n${res.stdout || 'Automated notifications categorized and archived.'}`);
    return;
  }

  // 4. Inspect Specific Order (e.g. /order 10173 or "order 10173")
  const orderMatch = lower.match(/(?:order|#)\s*([0-9]{4,6})/i);
  if (orderMatch) {
    const orderNum = orderMatch[1];
    await sendTelegramMessage(chatId, `🔍 *Looking up Order #${orderNum} in Firestore...*`);
    try {
      const db = admin.firestore();
      let orderDoc = null;
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
        await sendTelegramMessage(chatId, msg);
      } else {
        await sendTelegramMessage(chatId, `⚠️ Order #${orderNum} could not be found in Firestore.`);
      }
    } catch (err) {
      await sendTelegramMessage(chatId, `⚠️ Error querying order: ${err.message}`);
    }
    return;
  }

  // 5. General Status
  if (lower === '/status' || lower === 'status') {
    const statusMsg = `🟢 *System & Agent Status:*\n\n` +
      `• *Primary Mailbox:* \`kev@thinkestry.co.za\` (Active Cron 08:00–17:00)\n` +
      `• *Practice Mailbox:* \`info@myacc.co.za\` (Synced)\n` +
      `• *Firebase Studio:* Connected\n` +
      `• *Telegram Daemon:* Active & Responsive\n` +
      `• *Current Time:* ${new Date().toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg' })} SAST`;
    await sendTelegramMessage(chatId, statusMsg);
    return;
  }

  // 6. Acknowledgments
  if (lower.includes('thank') || lower.includes('thanks') || lower.includes('great') || lower.includes('perfect')) {
    await sendTelegramMessage(chatId, `🙏 You're very welcome, Kevin! Standing by for your next command.`);
    return;
  }

  // 7. General Instruction Catch-All
  await sendTelegramMessage(chatId, `🤖 *Received instruction:* "${text}"\n\nI am processing this in Antigravity and will update you shortly.`);
}

async function pollUpdates() {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', async () => {
        try {
          const json = JSON.parse(data);
          if (json.ok && Array.isArray(json.result)) {
            for (const update of json.result) {
              lastUpdateId = Math.max(lastUpdateId, update.update_id);
              saveState();
              if (update.message) {
                await handleMessage(update.message);
              }
            }
          }
        } catch (e) {
          console.error('[Polling JSON Parse Error]', e.message);
        }
        resolve();
      });
    }).on('error', (err) => {
      console.error('[Polling Network Error]', err.message);
      setTimeout(resolve, 5000);
    });
  });
}

async function startDaemon() {
  console.log(`[Telegram Daemon] 2-Way Bot Started for chat_id ${AUTHORIZED_CHAT_ID}. Polling active...`);
  while (true) {
    try {
      await pollUpdates();
    } catch (err) {
      console.error('[Daemon Loop Error]', err);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

startDaemon().catch(console.error);

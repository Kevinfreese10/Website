import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8832420807:AAFAV4N1vB2uaPwy3fXXbXKU3y6j5wCLi8M';
const TELEGRAM_CHAT_ID = '7774285240';

async function sendTelegram(text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown'
      })
    });
  } catch (e: any) {
    console.error('[Cloud Telegram Alert Error]:', e.message);
  }
}

function scanMailbox(user: string, pass: string): Promise<{ user: string; unreadCount: number; newItems: string[] }> {
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

    const newItems: string[] = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err) => {
        if (err) {
          imap.end();
          return resolve({ user, unreadCount: 0, newItems: [`⚠️ Could not open mailbox: ${err.message}`] });
        }

        imap.search(['UNSEEN'], (searchErr, uids) => {
          if (searchErr || !uids || uids.length === 0) {
            imap.end();
            return resolve({ user, unreadCount: 0, newItems: [] });
          }

          const f = imap.fetch(uids, { bodies: '' });
          const batch: { seqno: number; raw: string }[] = [];

          f.on('message', (msg, seqno) => {
            let buffer = '';
            msg.on('body', (stream) => {
              stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
            });
            msg.once('end', () => batch.push({ seqno, raw: buffer }));
          });

          f.once('end', async () => {
            for (const m of batch) {
              try {
                const parsed = await simpleParser(m.raw);
                const fromAddr = (parsed.from?.value?.[0]?.address || '').toLowerCase();
                const fromName = parsed.from?.value?.[0]?.name || fromAddr;
                const subject = parsed.subject || '(No Subject)';

                // Filter automated noise
                if (fromAddr.includes('payfast') || /payfast/i.test(subject)) {
                  newItems.push(`• 💳 PayFast Payment Received: "${subject}"`);
                } else if (fromAddr.includes('ncr.org.za')) {
                  newItems.push(`• 🏛️ *NCR Regulator Update:* "${subject}" from \`${fromAddr}\``);
                } else if (!fromAddr.includes('dribbble') && !fromAddr.includes('canva') && !fromAddr.includes('domains.co.za')) {
                  newItems.push(`• ✉️ *${fromName}*: "${subject}" (\`${fromAddr}\`)`);
                }
              } catch (e) {}
            }

            imap.end();
            resolve({ user, unreadCount: batch.length, newItems });
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error(`[IMAP Error for ${user}]`, err.message);
      resolve({ user, unreadCount: 0, newItems: [`⚠️ IMAP Error: ${err.message}`] });
    });

    imap.connect();
  });
}

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const runTime = new Date().toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' });

  try {
    console.log(`[Cloud Cron 24/7] Checking mailboxes at ${runTime} SAST...`);

    // Check both Kevin's personal mailbox and the practice info mailbox in parallel
    const [kevScan, infoScan] = await Promise.all([
      scanMailbox('kev@thinkestry.co.za', '7In~K;EF}?7E_7p4'),
      scanMailbox('info@myacc.co.za', 'lv1gIJK5O50s6A!w')
    ]);

    const totalNew = kevScan.unreadCount + infoScan.unreadCount;
    const allItems = [...kevScan.newItems, ...infoScan.newItems];

    if (totalNew > 0 && allItems.length > 0) {
      const alertMsg = `📬 *CLOUD 24/7 EMAIL ALERT* (${runTime} SAST)\n\n` +
        `Found *${totalNew} unread messages* in cloud scan:\n\n` +
        allItems.join('\n') + `\n\n` +
        `_This alert was generated in Google Cloud Run (24/7/365 active)._`;
      
      await sendTelegram(alertMsg);
    }

    // Also verify active orders in Firestore
    let activeOrdersCount = 0;
    try {
      const db = getAdminDb();
      const snap = await db.collection('orders').where('status', 'in', ['Processing', 'Waiting on Customer', 'Waiting on External']).get();
      activeOrdersCount = snap.size;
    } catch (e) {}

    return NextResponse.json({
      success: true,
      cloudRuntime: 'Google Cloud App Hosting (24/7)',
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      kevUnread: kevScan.unreadCount,
      infoUnread: infoScan.unreadCount,
      activeOrdersChecked: activeOrdersCount,
      notificationsSent: totalNew > 0
    });
  } catch (error: any) {
    console.error('[Cloud Cron Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

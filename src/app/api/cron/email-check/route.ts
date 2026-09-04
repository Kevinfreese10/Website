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

function scanKevMailbox(): Promise<{ unreadCount: number; newItems: string[] }> {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: 'kev@thinkestry.co.za',
      password: '7In~K;EF}?7E_7p4',
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
          return resolve({ unreadCount: 0, newItems: [`⚠️ Could not open kev@thinkestry.co.za: ${err.message}`] });
        }

        imap.search(['UNSEEN'], (searchErr, uids) => {
          if (searchErr || !uids || uids.length === 0) {
            imap.end();
            return resolve({ unreadCount: 0, newItems: [] });
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
                const bodyText = parsed.text || '';

                // 1. Handle Website Contact Form Submissions
                if (subject.toLowerCase().includes('contact form submission') || bodyText.includes('Cell Number:')) {
                  const nameMatch = bodyText.match(/Name:\s*([^\n\r]+)/i);
                  const emailMatch = bodyText.match(/Email:\s*([^\n\r]+)/i);
                  const cellMatch = bodyText.match(/Cell Number:\s*([^\n\r]+)/i);
                  const msgMatch = bodyText.match(/Message:\s*([\s\S]+)/i);

                  const clientName = nameMatch ? nameMatch[1].trim() : fromName;
                  const clientEmail = emailMatch ? emailMatch[1].trim() : 'Unknown';
                  const clientCell = cellMatch ? cellMatch[1].trim() : '';
                  const clientMsg = msgMatch ? msgMatch[1].trim() : '';

                  newItems.push(
                    `🌟 *NEW WEBSITE LEAD: ${clientName}*\n` +
                    `• *Email:* \`${clientEmail}\`\n` +
                    `• *Phone:* \`${clientCell}\`\n` +
                    `• *Inquiry:* "${clientMsg}"`
                  );
                }
                // 2. Handle Regulator & Client Updates
                else if (fromAddr.includes('ncr.org.za')) {
                  newItems.push(`🏛️ *NCR Regulator Update:* "${subject}" from \`${fromAddr}\``);
                } else if (fromAddr.includes('sars.gov.za') || subject.toLowerCase().includes('sars')) {
                  newItems.push(`🏛️ *SARS Notice:* "${subject}" from \`${fromAddr}\``);
                } else if (!fromAddr.includes('payfast') && !fromAddr.includes('dribbble') && !fromAddr.includes('canva') && !fromAddr.includes('domains.co.za')) {
                  newItems.push(`✉️ *${fromName}*: "${subject}" (\`${fromAddr}\`)`);
                }
              } catch (e) {}
            }

            imap.end();
            resolve({ unreadCount: batch.length, newItems });
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('[IMAP Error for kev@thinkestry.co.za]', err.message);
      resolve({ unreadCount: 0, newItems: [`⚠️ IMAP Error: ${err.message}`] });
    });

    imap.connect();
  });
}

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const runTime = new Date().toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' });

  try {
    console.log(`[Cloud Cron 24/7] Checking kev@thinkestry.co.za at ${runTime} SAST...`);

    // Strictly scan kev@thinkestry.co.za ONLY
    const kevScan = await scanKevMailbox();

    if (kevScan.newItems.length > 0) {
      const alertMsg = `📬 *CLOUD 24/7 EMAIL ALERT* (${runTime} SAST)\n*Mailbox:* \`kev@thinkestry.co.za\`\n\n` +
        kevScan.newItems.join('\n\n') + `\n\n` +
        `_Google Cloud Run (24/7/365 active)._`;
      
      await sendTelegram(alertMsg);
    }

    let activeOrdersCount = 0;
    try {
      const db = getAdminDb();
      const snap = await db.collection('orders').where('status', 'in', ['Processing', 'Waiting on Customer', 'Waiting on External']).get();
      activeOrdersCount = snap.size;
    } catch (e) {}

    return NextResponse.json({
      success: true,
      mailbox: 'kev@thinkestry.co.za',
      cloudRuntime: 'Google Cloud App Hosting (24/7)',
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      unreadFound: kevScan.unreadCount,
      actionableCount: kevScan.newItems.length,
      activeOrdersChecked: activeOrdersCount,
      notificationsSent: kevScan.newItems.length > 0
    });
  } catch (error: any) {
    console.error('[Cloud Cron Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

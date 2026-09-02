import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const maxDuration = 300;
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
    console.error('Failed to send Telegram alert:', e.message);
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startedAt = Date.now();
  console.log('[Cloud Cron] Running scheduled email check...');

  try {
    const db = getAdminDb();
    const ordersSnap = await db.collection('orders').where('status', 'in', ['Processing', 'Waiting on External']).get();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      activeOrdersChecked: ordersSnap.size
    });
  } catch (error: any) {
    console.error('[Cloud Cron Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

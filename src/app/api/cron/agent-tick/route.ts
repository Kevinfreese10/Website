import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { runVerificationCycle } from '@/lib/agent/verification-cycle';

export const maxDuration = 300;

/**
 * Hourly verification tick. Re-runs the document verification cycle on active orders that still
 * have pending uploads (e.g. files whose extraction was deferred by the per-run limit, or orders
 * where the client uploaded without pressing Notify Consultant). Only posts to the client when
 * something changed. Schedule with the same CRON_SECRET bearer token as /api/cron/daily.
 *
 * Query params: ?limit=25  ?orderId=<one order>
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100);
  const only = url.searchParams.get('orderId');
  const startedAt = Date.now();
  const results: { orderId: string; state: string; modelCalls: number; notePosted: boolean; emailedKevin: string | null; notes: string[] }[] = [];
  try {
    const db = getAdminDb();
    let ids: string[] = [];
    if (only) ids = [only];
    else {
      const snap = await db.collection('orders').where('status', 'in', ['Processing', 'Waiting on Customer', 'Waiting for Information', 'Under Review']).get();
      ids = snap.docs
        .filter(d => ((d.data().documentUploads || []) as any[]).some(u => u.status === 'pending' && !u.notAvailableReason))
        .map(d => ({ id: d.id, last: (d.data().lastAgentRunAt as string) || '' }))
        .sort((a, b) => a.last.localeCompare(b.last))
        .slice(0, limit)
        .map(x => x.id);
    }
    for (const id of ids) {
      if (Date.now() - startedAt > 240_000) break;
      const r = await runVerificationCycle(id, 'cron');
      results.push({ orderId: id, state: r.state, modelCalls: r.modelCalls, notePosted: r.notePosted, emailedKevin: r.emailedKevin, notes: r.notes });
    }
    return NextResponse.json({ processed: results.length, results, durationMs: Date.now() - startedAt });
  } catch (error: any) {
    console.error('Agent tick error:', error);
    return NextResponse.json({ error: error.message, results }, { status: 500 });
  }
}

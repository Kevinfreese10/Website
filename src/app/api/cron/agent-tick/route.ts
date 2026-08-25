import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { runOrderAgent } from '@/lib/agent/orchestrator';

export const maxDuration = 300;

/**
 * Hourly AI order agent tick (AI-ORDER-AGENT-PLAN.md §6.1). Runs the orchestrator over active
 * orders, oldest-touched first, within a bounded budget. Schedule from Cloud Scheduler with the
 * same CRON_SECRET bearer token as /api/cron/daily.
 *
 * Query params: ?limit=25 (orders per tick) ?orderId=... (single order)
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
  const results: { orderId: string; ok: boolean; proposals: number; modelCalls: number; error?: string }[] = [];

  let inbox: any = null;
  try {
    // 1. Read the submissions mailbox first so replies are on the orders before the agent looks at them.
    try {
      const { isPollerConfigured, pollSubmissionsInbox } = await import('@/lib/agent/email-channel');
      if (isPollerConfigured()) inbox = await pollSubmissionsInbox();
    } catch (e: any) { inbox = { error: e.message }; }

    const db = getAdminDb();
    let ids: string[] = [];
    if (only) ids = [only];
    else {
      const snap = await db.collection('orders')
        .where('status', 'in', ['Processing', 'Waiting on Customer', 'Waiting for Information', 'Under Review'])
        .get();
      // Oldest agent visit first; never-visited orders first of all.
      ids = snap.docs
        .map(d => ({ id: d.id, last: (d.data().lastAgentRunAt as string) || '' }))
        .sort((a, b) => a.last.localeCompare(b.last))
        .slice(0, limit)
        .map(x => x.id);
    }
    for (const id of ids) {
      if (Date.now() - startedAt > 240_000) break; // leave headroom under maxDuration
      const run = await runOrderAgent(id, 'cron', { maxModelCalls: 3 });
      results.push({ orderId: id, ok: run.ok, proposals: run.proposalsCreated.length, modelCalls: run.modelCalls, error: run.error });
    }
    return NextResponse.json({ inbox, processed: results.length, results, durationMs: Date.now() - startedAt });
  } catch (error: any) {
    console.error('Agent tick error:', error);
    return NextResponse.json({ error: error.message, results }, { status: 500 });
  }
}

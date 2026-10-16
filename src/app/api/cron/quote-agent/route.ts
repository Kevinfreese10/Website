import type { NextRequest } from 'next/server';
import { runTick } from '@/lib/quote-agent/agent';
import { isAuthorizedCron } from '@/lib/quote-agent/cron-auth';

export const maxDuration = 300;

/**
 * Cloud quote agent tick: the 24/7 owner of info@myacc.co.za.
 * Triggered by Google Cloud Scheduler every 10 minutes with `Authorization: Bearer $CRON_SECRET`.
 * Safe to call twice at once (Firestore lease lock) and to re-run (per-email atomic claim).
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req.headers.get('authorization'))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await runTick();
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

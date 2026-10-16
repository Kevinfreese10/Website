import type { NextRequest } from 'next/server';
import { sendDigest } from '@/lib/quote-agent/digest';
import { isAuthorizedCron } from '@/lib/quote-agent/cron-auth';

export const maxDuration = 120;

/** Twice-daily info@ agent digest to Kevin. Cloud Scheduler: 0 7,16 * * * (Africa/Johannesburg). */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req.headers.get('authorization'))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return Response.json(await sendDigest());
  } catch (err: any) {
    return Response.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

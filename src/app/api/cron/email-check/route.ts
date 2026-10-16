import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * RETIRED. info@myacc.co.za is now owned by the cloud quote agent (/api/cron/quote-agent), which
 * triages every email and sends Telegram alerts for urgent items. Running both would double-alert.
 *
 * The previous version also contained a hardcoded mailbox password and Telegram token; both must be
 * rotated because they remain in git history.
 *
 * Kept as a harmless no-op so any scheduler still pointing here gets a clear answer instead of a 404.
 */
export async function GET() {
  return NextResponse.json({ retired: true, replacedBy: '/api/cron/quote-agent' }, { status: 410 });
}

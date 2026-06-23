import { NextRequest, NextResponse } from 'next/server';
import { syncEmailsInternal } from '@/lib/email-sync';

export async function POST(req: NextRequest) {
  // Auth guard
  const adminSecret = req.headers.get('x-admin-secret');
  if (adminSecret !== process.env.ADMIN_SECRET && process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await syncEmailsInternal();
  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Email sync failed' }, { status: 500 });
  }

  return NextResponse.json(result);
}

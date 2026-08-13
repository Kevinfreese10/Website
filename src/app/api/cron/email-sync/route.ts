import { NextResponse } from 'next/server';
import { syncEmailsInternal } from '@/lib/email-sync';
import { triageExistingInboxAction } from '@/app/actions/email-actions';

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecretHeader = request.headers.get('x-cron-secret');
  
  const expectedSecret = process.env.CRON_SECRET;
  const isAuthorized = 
    !expectedSecret || 
    cronSecretHeader === expectedSecret || 
    authHeader === `Bearer ${expectedSecret}`;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron: Email Sync] Starting scheduled email sync & triage...');

    // 1. Fetch new IMAP emails & triage them
    const syncResult = await syncEmailsInternal();

    // 2. Batch triage any remaining un-analyzed existing emails in Firestore
    const triageResult = await triageExistingInboxAction(50);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      sync: syncResult,
      triage: triageResult,
    });
  } catch (error: any) {
    console.error('[Cron: Email Sync] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Cron execution failed' },
      { status: 500 }
    );
  }
}

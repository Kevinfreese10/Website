import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// Local development fallbacks only. These are never used in production, and the filenames are
// kept generic — the previous values embedded real client and individual names plus an order
// number, which were readable by anyone with repo or bundle access.
const LOCAL_TEMPLATE_PATHS: Record<string, string> = process.env.NODE_ENV === 'production' ? {} : {
  ncr_form_2: 'C:/Users/kev/Downloads/NCR_Form_2_Fillable.pdf',
  ncr_director_resolution: 'C:/Users/kev/OneDrive/Documents/NCR Director Resolution Template.pdf',
  director_resolution: 'C:/Users/kev/OneDrive/Documents/NCR Director Resolution Template.pdf',
  ncr_annexure_fees: 'C:/Users/kev/OneDrive/Documents/Annexure Confirmation of Fees.pdf',
  accounting_officer_letter: 'C:/Users/kev/OneDrive/Documents/Accountant Appointment Letter.pdf',
  accountants_letter: 'C:/Users/kev/OneDrive/Documents/My Accountants Letterhead.pdf',
  engagement_letter: 'C:/Users/kev/OneDrive/Documents/My Accountant Engagement Letter.pdf',
  power_of_attorney: 'C:/Users/kev/OneDrive/Documents/Power of Attorney Template.pdf',
  share_certificate: 'C:/Users/kev/OneDrive/Documents/SHARE CERTIFICATE.pdf',
  sars_public_officer_resolution: 'C:/Users/kev/Downloads/TPPOA-Special-Power-of-Attorney-to-Tax-Practitioner-External-Form.pdf',
  coida_cf1b_application: 'C:/Users/kev/OneDrive/Documents/COIDA CF-1B Power of Attorney Template.pdf',
};

export async function GET(request: NextRequest) {
  try {
    // Streams statutory templates — letterheads, powers of attorney, appointment letters. These
    // are raw material for forging documents on the practice's identity, so the endpoint must not
    // be anonymously enumerable by `?id=`.
    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      const decoded = await getAdminAuth().verifyIdToken(idToken);
      const callerSnap = await getAdminDb().collection('users').doc(decoded.uid).get();
      const role = callerSnap.exists ? (callerSnap.data()?.role || '') : '';
      if (!['admin', 'staff', 'cap_staff', 'cap_supervisor'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden: staff access required.' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id') || searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'Missing template ID query parameter (id)' }, { status: 400 });
    }

    // 1. Try fetching from Firestore 'templates' collection
    try {
      const db = getAdminDb();
      const templateDoc = await db.collection('templates').doc(templateId).get();

      if (templateDoc.exists) {
        const data = templateDoc.data();
        if (data?.fileUrl) {
          // Fetch the authentic PDF buffer from Firebase Storage URL
          const res = await fetch(data.fileUrl);
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            return new NextResponse(Buffer.from(arrayBuf), {
              status: 200,
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${data.fileName || `${templateId}.pdf`}"`,
                'Cache-Control': 'public, max-age=3600',
              },
            });
          }
        }
      }
    } catch (dbErr) {
      console.warn('Firestore template lookup error, trying local fallback:', dbErr);
    }

    // 2. Fallback to direct authentic local file on disk
    const localPath = LOCAL_TEMPLATE_PATHS[templateId];
    if (localPath && fs.existsSync(localPath)) {
      const fileBuf = fs.readFileSync(localPath);
      return new NextResponse(fileBuf, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${path.basename(localPath)}"`,
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    return NextResponse.json({ error: `Template document not found for ID: ${templateId}` }, { status: 404 });
  } catch (error: any) {
    console.error('Error serving template preview PDF:', error);
    return NextResponse.json({ error: error.message || 'Failed to serve template preview' }, { status: 500 });
  }
}

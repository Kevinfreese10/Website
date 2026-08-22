import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    try {
        // The decoded token was previously discarded, so ANY authenticated user — and signup is
        // self-service — could send arbitrary HTML to arbitrary recipients from the practice's
        // own SPF/DKIM-aligned domain. Verify the caller is actually staff.
        const decoded = await getAdminAuth().verifyIdToken(idToken);
        const callerSnap = await getAdminDb().collection('users').doc(decoded.uid).get();
        const callerRole = callerSnap.exists ? (callerSnap.data()?.role || '') : '';
        if (!['admin', 'staff', 'cap_staff', 'cap_supervisor'].includes(callerRole)) {
            return NextResponse.json({ error: 'Forbidden: staff access required.' }, { status: 403 });
        }

        const body = await req.json();
        const { to, subject, html } = body;

        if (!to || !subject || !html) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }


        await sendEmail({
            to,
            subject,
            html,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error sending custom email:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

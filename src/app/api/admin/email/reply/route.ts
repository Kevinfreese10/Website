import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import type { Email } from '@/lib/types';

export async function POST(req: NextRequest) {
  // Auth guard
  const adminSecret = req.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { emailId, replyBody, replySubject } = await req.json();

    if (!emailId || !replyBody) {
      return NextResponse.json(
        { error: 'emailId and replyBody are required' },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();

    // 1. Fetch original email
    const emailDoc = await adminDb.collection('emails').doc(emailId).get();
    if (!emailDoc.exists) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    const email = emailDoc.data() as Email;

    // 2. Build reply HTML
    const replyHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        ${replyBody}
      </div>
      <br/>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
      <div style="font-size: 12px; color: #888;">
        <p><strong>On ${email.date?.toDate?.()?.toLocaleString?.() || 'original date'}, ${email.from.name || email.from.email} wrote:</strong></p>
        <blockquote style="border-left: 2px solid #ddd; padding-left: 12px; margin-left: 0; color: #666;">
          ${email.bodyHtml || email.bodyText?.replace(/\n/g, '<br/>') || ''}
        </blockquote>
      </div>
    `;

    // 3. Send the reply
    const subject = replySubject || `Re: ${email.subject}`;

    const connDoc = await adminDb.collection('emailSettings').doc('connection').get();
    const connData = connDoc.exists ? connDoc.data() : null;

    const smtpUser = connData?.smtpUser || process.env.SMTP_USER;
    const smtpPass = connData?.smtpPass || process.env.SMTP_PASS;
    const smtpHost = connData?.smtpHost || process.env.SMTP_HOST;
    const smtpPort = connData?.smtpPort || process.env.SMTP_PORT || '465';

    let smtpOverride = undefined;
    if (smtpUser && smtpPass && smtpHost) {
      smtpOverride = {
        host: smtpHost,
        port: String(smtpPort),
        user: smtpUser,
        pass: smtpPass,
      };
    }

    await sendEmail({
      to: email.from.email,
      subject,
      html: replyHtml,
      replyTo: smtpUser || process.env.SMTP_USER,
      smtpOverride,
    });

    // 4. Update email status to replied
    await adminDb.collection('emails').doc(emailId).update({
      status: 'replied',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Email Reply] API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send reply' },
      { status: 500 }
    );
  }
}

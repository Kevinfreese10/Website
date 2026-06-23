import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET() {
    try {
        console.log("[debug-email] Sending test email...");
        const info = await sendEmail({
            to: 'winifred@myacc.co.za',
            subject: 'Debug test email from Cloud Run',
            html: '<p>If you see this, email sending works from Cloud Run!</p>'
        });
        return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (err: any) {
        console.error("[debug-email] Failed:", err);
        return NextResponse.json({ 
            success: false, 
            error: err.message, 
            code: err.code,
            stack: err.stack 
        });
    }
}

import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const db = getAdminDb();
        const envData = {
            SMTP_HOST: process.env.SMTP_HOST || 'not set',
            SMTP_PORT: process.env.SMTP_PORT || 'not set',
            SMTP_USER: process.env.SMTP_USER || 'not set',
            SMTP_PASS_exists: !!process.env.SMTP_PASS,
            SMTP_PASS_length: process.env.SMTP_PASS?.length || 0,
            SMTP_PASS_start: process.env.SMTP_PASS ? process.env.SMTP_PASS.substring(0, 2) : 'not set',
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'not set',
            timestamp: new Date().toISOString(),
        };

        await db.collection('debug').doc('env').set(envData);
        return NextResponse.json({ success: true, message: "Debug data written to Firestore." });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}

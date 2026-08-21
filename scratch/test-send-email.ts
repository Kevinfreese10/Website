import { sendEmail } from '../src/lib/email';
import * as dotenv from 'dotenv';
import path from 'path';
import { getAdminDb } from '../src/lib/firebase-admin';

// Initialize env and firebase admin to test locally
dotenv.config({ path: path.resolve('c:/myacc/.env') });

async function testEmails() {
    console.log('Testing sendEmail function...');
    console.log(`Using SMTP_USER: ${process.env.SMTP_USER}`);

    try {
        const info = await sendEmail({
            to: 'test@example.com', // Using a dummy address, it will send but might bounce or just succeed at the SMTP level. Actually better to use the user's email if possible, or just a safe placeholder.
            subject: 'Test Email - Order Confirmation',
            html: '<h1>Order Confirmation 10119</h1><p>This is a test to verify email sending is fixed.</p>',
            fromNameOverride: 'My Accountant Automated Test'
        });
        console.log('✅ sendEmail succeeded!');
        console.log('Message ID:', info.messageId);
    } catch (e: any) {
        console.error('❌ sendEmail failed:');
        console.error(e.message);
    }
}

testEmails();

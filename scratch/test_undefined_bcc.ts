import nodemailer from 'dotenv';
import path from 'path';

// Load .env
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import nodemailerLib from 'nodemailer';

async function testUndefinedBcc() {
    const transportConfig = {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false
        },
    };

    const transporter = nodemailerLib.createTransport(transportConfig);

    try {
        console.log("Sending email with undefined in BCC...");
        const info = await transporter.sendMail({
            from: `"Test Sender" <${process.env.SMTP_USER}>`,
            to: 'winifred@myacc.co.za',
            bcc: 'kev@thinkestry.co.za, winifred@myacc.co.za, undefined',
            subject: 'Test Undefined BCC Email',
            html: '<p>This should fail if undefined in BCC causes error.</p>',
        });
        console.log("Email sent successfully! MessageId:", info.messageId);
    } catch (err: any) {
        console.error("Nodemailer Failed as expected:", err);
    }
}

testUndefinedBcc();

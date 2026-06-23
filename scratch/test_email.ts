import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testEmail() {
    console.log("SMTP_HOST:", process.env.SMTP_HOST);
    console.log("SMTP_PORT:", process.env.SMTP_PORT);
    console.log("SMTP_USER:", process.env.SMTP_USER);
    console.log("SMTP_PASS length:", process.env.SMTP_PASS?.length);

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

    const transporter = nodemailer.createTransport(transportConfig);

    try {
        console.log("Verifying SMTP connection...");
        await transporter.verify();
        console.log("SMTP Connection verified successfully!");

        console.log("Sending test email...");
        const info = await transporter.sendMail({
            from: `"Test Sender" <${process.env.SMTP_USER}>`,
            to: 'winifred@myacc.co.za',
            subject: 'Test SMTP Email',
            html: '<p>This is a test email to verify SMTP configuration.</p>',
        });
        console.log("Email sent successfully! MessageId:", info.messageId);
    } catch (err: any) {
        console.error("SMTP Test Failed:", err);
    }
}

testEmail();

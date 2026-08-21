import { sendEmail } from '../src/lib/email';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/myacc/.env') });

async function verify() {
  console.log('Sending live verification email to confirm credentials...');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('User:', process.env.SMTP_USER);

  try {
    const res = await sendEmail({
      to: 'kev@thinkestry.co.za',
      subject: '✅ Confirmed: SMTP Credentials Active & Verified',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #1D70E8;">SMTP Credentials Confirmed</h2>
          <p>This is a live confirmation that the new password for <strong>no_reply@myacc.co.za</strong> has been verified and all email delivery pathways are active.</p>
          <ul>
            <li><strong>Host:</strong> mail.myacc.co.za</li>
            <li><strong>Port:</strong> 465 (SSL) / 587 (STARTTLS)</li>
            <li><strong>Status:</strong> Active & Connected</li>
          </ul>
        </div>
      `,
    });
    console.log('✅ Email successfully delivered! Message ID:', res?.messageId);
  } catch (err: any) {
    console.error('❌ Failed to send email:', err.message);
  }
}

verify();

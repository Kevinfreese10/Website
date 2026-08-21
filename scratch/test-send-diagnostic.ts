import { sendEmail } from '../src/lib/email';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/myacc/.env') });

async function run() {
  console.log('Sending test email via src/lib/email.ts...');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  try {
    const res = await sendEmail({
      to: 'kev@thinkestry.co.za',
      subject: 'Antigravity Diagnostic Test Email',
      html: '<p>Testing SMTP connection from local Node environment.</p>',
    });
    console.log('✅ sendEmail succeeded!', res?.messageId);
  } catch (err) {
    console.error('❌ sendEmail failed:', err);
  }
}

run();

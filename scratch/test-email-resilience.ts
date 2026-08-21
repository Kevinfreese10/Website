import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/myacc/.env') });

async function run() {
  console.log('Testing sendEmail with BROKEN smtpOverride (should automatically fall back to system SMTP)...');
  const { sendEmail } = await import('../src/lib/email');
  try {
    const res = await sendEmail({
      to: 'kev@thinkestry.co.za',
      subject: 'Fallback Test (Broken Override)',
      html: '<p>This email was sent with a broken override that gracefully recovered.</p>',
      smtpOverride: {
        host: 'mail.thinkestry.co.za',
        port: '465',
        user: 'kev@thinkestry.co.za',
        pass: 'WrongPassword123!',
      }
    });
    console.log('✅ sendEmail succeeded via graceful fallback!', res?.messageId);
  } catch (err: any) {
    console.error('❌ sendEmail failed:', err.message);
  }
}

run();

import { sendEmail } from '../src/lib/email';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/myacc/.env') });

async function run() {
  console.log('Testing sendEmail with new password W0=LP2i_yVzQ8EQL...');
  try {
    const res = await sendEmail({
      to: 'kev@thinkestry.co.za',
      subject: 'My Accountant Password Update Verification',
      html: '<p>This email confirms that the new password W0=LP2i_yVzQ8EQL is active and working perfectly!</p>',
    });
    console.log('✅ sendEmail SUCCESS with new password! Message ID:', res?.messageId);
  } catch (err: any) {
    console.error('❌ sendEmail failed:', err.message);
  }
}

run();

const { sendEmail } = require('./src/lib/email.ts');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve('c:/myacc/.env') });

async function run() {
  console.log('Sending test email via src/lib/email.ts...');
  try {
    const res = await sendEmail({
      to: 'kev@thinkestry.co.za',
      subject: 'Antigravity Diagnostic Test Email',
      html: '<p>Testing SMTP connection from local Node environment.</p>',
    });
    console.log('✅ sendEmail succeeded!', res.messageId);
  } catch (err) {
    console.error('❌ sendEmail failed:', err);
  }
}

run();

const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve('c:/myacc/.env') });

const host = process.env.SMTP_HOST || 'mail.myacc.co.za';
const user = process.env.SMTP_USER || 'no_reply@myacc.co.za';
const pass = (process.env.SMTP_PASS || '').trim();

console.log('Testing Nodemailer with:');
console.log('Host:', host);
console.log('User:', user);
console.log('Pass length:', pass.length);

async function testPort(port, secure) {
  console.log(`\n--- Testing Nodemailer on Port ${port} (secure: ${secure}) ---`);
  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: secure,
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  try {
    const verified = await transporter.verify();
    console.log(`✅ Port ${port} VERIFIED SUCCESS:`, verified);
    return true;
  } catch (err) {
    console.error(`❌ Port ${port} FAILED:`, err.code, err.message);
    return false;
  }
}

async function run() {
  await testPort(465, true);
  await testPort(587, false);
  await testPort(25, false);
}

run();

const nodemailer = require('nodemailer');

async function test() {
  const host = 'mail.myacc.co.za';
  const user = 'no_reply@myacc.co.za';
  const pass = 'W0=LP2i_yVzQ8EQL';

  console.log(`Testing nodemailer on ${host}:465 with user ${user}...`);
  const transporter = nodemailer.createTransport({
    host,
    port: 465,
    secure: true,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  try {
    const res = await transporter.verify();
    console.log('✅ Connection and Auth SUCCESS on port 465:', res);
  } catch (e) {
    console.error('❌ Failed on 465:', e.code, e.message);
  }

  console.log(`Testing nodemailer on ${host}:587 with user ${user}...`);
  const transporter587 = nodemailer.createTransport({
    host,
    port: 587,
    secure: false,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  try {
    const res587 = await transporter587.verify();
    console.log('✅ Connection and Auth SUCCESS on port 587:', res587);
  } catch (e) {
    console.error('❌ Failed on 587:', e.code, e.message);
  }
}

test();

const nodemailer = require('nodemailer');
const imaps = require('imap-simple');

async function checkAll() {
  const host = 'mail.myacc.co.za';
  const user = 'no_reply@myacc.co.za';
  const pass = 'W0=LP2i_yVzQ8EQL';

  console.log('=== Full Diagnostic Verification ===');

  // 1. SMTP Port 465 (SSL)
  try {
    const t465 = nodemailer.createTransport({
      host, port: 465, secure: true, auth: { user, pass }, tls: { rejectUnauthorized: false }
    });
    await t465.verify();
    console.log('✅ SMTP Port 465 (SSL): VERIFIED & ACTIVE');
  } catch (e) {
    console.error('❌ SMTP Port 465 Error:', e.message);
  }

  // 2. SMTP Port 587 (STARTTLS)
  try {
    const t587 = nodemailer.createTransport({
      host, port: 587, secure: false, auth: { user, pass }, tls: { rejectUnauthorized: false }
    });
    await t587.verify();
    console.log('✅ SMTP Port 587 (STARTTLS): VERIFIED & ACTIVE');
  } catch (e) {
    console.error('❌ SMTP Port 587 Error:', e.message);
  }

  // 3. IMAP Port 993 (SSL)
  try {
    const imapConn = await imaps.connect({
      imap: { user, password: pass, host, port: 993, tls: true, tlsOptions: { rejectUnauthorized: false }, authTimeout: 8000 }
    });
    await imapConn.end();
    console.log('✅ IMAP Port 993 (Incoming Mail): VERIFIED & ACTIVE');
  } catch (e) {
    console.error('❌ IMAP Port 993 Error:', e.message);
  }
}

checkAll();

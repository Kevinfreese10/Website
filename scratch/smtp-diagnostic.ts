/**
 * SMTP Diagnostic — checks actual delivery response details
 * Run: npx tsx scratch/smtp-diagnostic.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import nodemailer from 'nodemailer';

const TEST_TO = 'freesekevin@gmail.com';

async function diagnose() {
  console.log('\n🔍 SMTP Diagnostic\n');
  console.log('Config:');
  console.log(`  Host:  ${process.env.SMTP_HOST}`);
  console.log(`  Port:  ${process.env.SMTP_PORT}`);
  console.log(`  User:  ${process.env.SMTP_USER}`);
  console.log(`  Pass:  ${process.env.SMTP_PASS ? '***set***' : '❌ NOT SET'}`);
  console.log('');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    logger: true,    // ← full SMTP conversation logged
    debug: true,     // ← include DATA transfer logs
  });

  // 1. Verify connection
  console.log('1️⃣  Verifying SMTP connection...');
  try {
    await transporter.verify();
    console.log('   ✅ Connection OK — SMTP server is reachable and auth succeeded\n');
  } catch (err: any) {
    console.log(`   ❌ Connection FAILED: ${err.message}\n`);
    process.exit(1);
  }

  // 2. Send a single diagnostic email and capture full response
  console.log(`2️⃣  Sending test email to ${TEST_TO}...`);
  try {
    const info = await transporter.sendMail({
      from: `"My Accountant Test" <${process.env.SMTP_USER}>`,
      to: TEST_TO,
      subject: `SMTP Diagnostic Test — ${new Date().toISOString()}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>📧 SMTP Diagnostic Email</h2>
          <p>This is a diagnostic test sent at <strong>${new Date().toLocaleString('en-ZA')}</strong>.</p>
          <p>If you received this, SMTP delivery to Gmail is working correctly.</p>
          <hr/>
          <p style="color: #666; font-size: 12px;">
            Sent via: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}<br/>
            From: ${process.env.SMTP_USER}
          </p>
        </div>
      `,
    });

    console.log('\n   📨 Send result:');
    console.log(`      messageId:  ${info.messageId}`);
    console.log(`      response:   ${info.response}`);
    console.log(`      accepted:   ${JSON.stringify(info.accepted)}`);
    console.log(`      rejected:   ${JSON.stringify(info.rejected)}`);
    console.log(`      pending:    ${JSON.stringify(info.pending)}`);
    console.log(`      envelope:   ${JSON.stringify(info.envelope)}`);

    if (info.rejected && info.rejected.length > 0) {
      console.log(`\n   ❌ Server REJECTED delivery to: ${info.rejected.join(', ')}`);
    } else if (info.accepted && info.accepted.length > 0) {
      console.log(`\n   ✅ Server ACCEPTED the message for delivery to: ${info.accepted.join(', ')}`);
      console.log('   ⚠️  "Accepted" means the mail server took it — check spam/junk folder in Gmail.');
    }

  } catch (err: any) {
    console.log(`\n   ❌ Send FAILED: ${err.message}`);
    console.log(`      Code: ${err.code}`);
    console.log(`      Response: ${err.response}`);
  }

  console.log('\n');
}

diagnose();

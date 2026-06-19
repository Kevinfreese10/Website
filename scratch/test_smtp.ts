import * as dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS ? '******' : 'undefined');

async function testSMTP() {
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
    }
  };

  console.log("Creating transporter...");
  const transporter = nodemailer.createTransport(transportConfig);

  console.log("Verifying connection...");
  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully!");
  } catch (error) {
    console.error("❌ SMTP verification failed:", error);
  }
}

testSMTP();

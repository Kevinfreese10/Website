import * as dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import path from 'path';

// Load from project root .env
dotenv.config({ path: path.resolve('c:/myacc/.env') });

async function verifySecrets() {
  console.log("Starting Secrets Verification...");

  // 1. Verify SMTP
  console.log("\n1. Testing SMTP Credentials...");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const success = await transporter.verify();
    console.log("✅ SMTP Verification Successful:", success);
  } catch (error: any) {
    console.error("❌ SMTP Verification Failed:");
    console.error(error.message);
  }

  // 2. Verify Gemini
  console.log("\n2. Testing Gemini API Key...");
  try {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: 'Respond with exactly one word: "Success".',
    });
    console.log("✅ Gemini API Response:", text);
  } catch (error: any) {
    console.error("❌ Gemini API Verification Failed:");
    console.error(error.message);
  }

  // 3. Verify Payfast
  console.log("\n3. Testing PayFast Passphrase Presence...");
  if (process.env.PAYFAST_PASSPHRASE) {
      console.log(`✅ PAYFAST_PASSPHRASE is loaded (${process.env.PAYFAST_PASSPHRASE.length} characters)`);
  } else {
      console.error("❌ PAYFAST_PASSPHRASE is missing.");
  }
}

verifySecrets().catch(console.error);

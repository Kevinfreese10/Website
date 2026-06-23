'use server';

import nodemailer from 'nodemailer';
import { getAdminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { User } from './types';

type EmailPayload = {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html: string;
    from?: string;
    resellerId?: string;
    attachments?: { filename: string; path: string }[];
    replyTo?: string;
    smtpOverride?: { host: string; port: string; user: string; pass: string };
    fromNameOverride?: string;
}

/**
 * Logs a failed email delivery to Firestore so admins can review it.
 * Never throws — logging failures should not disrupt the caller.
 */
async function logEmailFailure(payload: { to: string | string[]; subject: string; error: string }) {
    try {
        const adminDb = getAdminDb();
        await adminDb.collection('failedEmails').add({
            to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
            subject: payload.subject,
            error: payload.error,
            failedAt: FieldValue.serverTimestamp(),
        });
    } catch {
        // Silently ignore — logging failures must never crash the caller
    }
}

/**
 * Sends an email with retry logic on transient failures.
 * Ensures white-labeling by adjusting 'From' name and 'Reply-To' based on resellerId.
 */
export async function sendEmail({ 
    to, 
    cc, 
    bcc, 
    subject, 
    html, 
    from, 
    resellerId, 
    attachments, 
    replyTo,
    smtpOverride,
    fromNameOverride
}: EmailPayload) {
  
  // 1. Default SMTP Configuration (My Accountant Master)
  let transportConfig: any = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 15000, // 15 seconds — increased from 5s to handle slow SMTP servers
    greetingTimeout: 15000,   // 15 seconds
    socketTimeout: 30000,     // 30 seconds
  };

  let fromName = fromNameOverride || 'My Accountant';
  let fromEmail = process.env.SMTP_USER || 'no_reply@myacc.co.za';
  let finalBcc = Array.isArray(bcc) ? [...bcc] : (bcc ? [bcc] : []);
  let finalReplyTo = replyTo;

  // 2. Apply explicit SMTP overrides (primarily for admin internal tests)
  if (smtpOverride && smtpOverride.host && smtpOverride.user && smtpOverride.pass) {
      transportConfig = {
          host: smtpOverride.host,
          port: Number(smtpOverride.port || 465),
          secure: String(smtpOverride.port) === '465',
          auth: {
              user: smtpOverride.user,
              pass: smtpOverride.pass,
          },
          tls: {
              rejectUnauthorized: false
          },
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 30000,
      };
      fromEmail = smtpOverride.user;
  }

  // 3. Handle Reseller White-Labeling
  if (resellerId && !smtpOverride) {
    try {
      let partnerData: User | null = null;
      const adminDb = getAdminDb();
      const userSnap = await adminDb.collection('users').doc(resellerId).get();
      
      if (userSnap.exists) {
          partnerData = userSnap.data() as User;
      } else {
          const aiClientSnap = await adminDb.collection('aiAccountantClients').doc(resellerId).get();
          if (aiClientSnap.exists) {
              partnerData = aiClientSnap.data() as User;
          }
      }
      
      if (partnerData) {
        // Set white-label Display Name (e.g. "Acme Consulting")
        if (!fromNameOverride) {
            fromName = partnerData.companyName || partnerData.name;
        }

        // Set Reply-To to partner email so client responses go to the partner, not the master store
        if (!finalReplyTo) {
            finalReplyTo = partnerData.email;
        }
        
        // Use system SMTP for delivery (no_reply@myacc.co.za)
        // But BCC the partner so they have a copy of the notification sent to their client
        if (!finalBcc.includes(partnerData.email)) {
            finalBcc.push(partnerData.email);
        }
      }
    } catch (error) {
      console.error('Error fetching reseller details for email branding:', error);
    }
  }
  
  if (!transportConfig.host || !transportConfig.auth.user || !transportConfig.auth.pass) {
      const errMsg = 'Master SMTP configuration is missing.';
      console.error(errMsg);
      await logEmailFailure({ to, subject, error: errMsg });
      throw new Error('Email server is not configured.');
  }

  const fromAddress = from || `"${fromName}" <${fromEmail}>`;
  const transporter = nodemailer.createTransport(transportConfig);

  const mailOptions = {
      from: fromAddress,
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: Array.isArray(cc) ? cc.join(', ') : cc,
      bcc: finalBcc.length > 0 ? finalBcc.join(', ') : undefined,
      subject: subject,
      html: html,
      attachments: attachments,
      replyTo: finalReplyTo,
  };

  // 4. Send with 1 retry on transient connection failures
  const MAX_ATTEMPTS = 2;
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
          const info = await transporter.sendMail(mailOptions);
          return info;
      } catch (error: any) {
          lastError = error;
          const isTransient = ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ESOCKET'].includes(error.code);
          console.error(`[Email] Attempt ${attempt}/${MAX_ATTEMPTS} failed (${error.code || 'unknown'}): ${error.message}`);
          
          if (!isTransient || attempt === MAX_ATTEMPTS) {
              // Permanent failure or out of retries — log and throw
              const errorMsg = `SMTP Error: ${error.code || 'Unknown'} - ${error.message}`;
              await logEmailFailure({ to, subject, error: errorMsg });
              throw new Error(errorMsg);
          }

          // Wait 2 seconds before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
      }
  }
}
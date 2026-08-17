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
    attachments?: { filename: string; path?: string; content?: Buffer; contentType?: string }[];
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
  
  // Password must come from the environment — never hardcode a live credential in source.
  if (!smtpOverride && !process.env.SMTP_PASS) {
    console.error('sendEmail: SMTP_PASS environment variable is not set and no smtpOverride was provided.');
    throw new Error('Email is not configured on the server (missing SMTP_PASS).');
  }

  const cleanPass = (smtpOverride?.pass || process.env.SMTP_PASS || "")
    .toString()
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[\r\n\t]/g, '');

  const cleanUser = (smtpOverride?.user || process.env.SMTP_USER || "no_reply@myacc.co.za")
    .toString()
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[\r\n\t]/g, '');

  const cleanHost = (smtpOverride?.host || process.env.SMTP_HOST || "mail.myacc.co.za")
    .toString()
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[\r\n\t]/g, '');

  // Catches the case where SMTP_PASS is "set" (so the earlier check passes) but is actually
  // empty/whitespace-only — e.g. a Secret Manager secret with no version, or a blank value.
  if (!cleanPass) {
    console.error('sendEmail: SMTP_PASS resolved to an empty value after cleaning.');
    throw new Error('Email is not configured on the server (SMTP_PASS is empty).');
  }

  const defaultPort = Number(smtpOverride?.port || process.env.SMTP_PORT || 465);
  let transportConfig: any = {
    host: cleanHost,
    port: defaultPort,
    secure: defaultPort === 465,
    auth: {
      user: cleanUser,
      pass: cleanPass,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 15000, // 15 seconds
    greetingTimeout: 15000,   // 15 seconds
    socketTimeout: 30000,     // 30 seconds
  };

  let fromName = fromNameOverride || 'My Accountant';
  let fromEmail = cleanUser;
  let finalBcc = Array.isArray(bcc) ? [...bcc] : (bcc ? [bcc] : []);
  let finalReplyTo = replyTo;

  // Master admin BCC for monitoring all portal communications
  const MASTER_BCC = 'kev@thinkestry.co.za';
  if (!finalBcc.includes(MASTER_BCC)) {
      finalBcc.push(MASTER_BCC);
  }

  // 2. Apply explicit SMTP overrides (primarily for admin internal tests)
  if (smtpOverride && smtpOverride.host && smtpOverride.user && smtpOverride.pass) {
      transportConfig = {
          host: cleanHost,
          port: defaultPort,
          secure: defaultPort === 465,
          auth: {
              user: cleanUser,
              pass: cleanPass,
          },
          tls: {
              rejectUnauthorized: false
          },
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 30000,
      };
      fromEmail = cleanUser;
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

  // 4. Send with retry logic on transient connection failures & auth issues
  const MAX_ATTEMPTS = 3;
  let lastError: any;
  let currentConfig = { ...transportConfig };
  let currentFromAddress = fromAddress;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
          const transporter = nodemailer.createTransport(currentConfig);
          const info = await transporter.sendMail({
              ...mailOptions,
              from: currentFromAddress,
          });
          return info;
      } catch (error: any) {
          lastError = error;
          console.error(`[Email] Attempt ${attempt}/${MAX_ATTEMPTS} failed (${error.code || 'unknown'}): ${error.message}`);
          
          // If a custom smtpOverride failed (e.g. bad user password or unreachable host),
          // immediately fallback to system default credentials for subsequent attempts.
          if (smtpOverride && (error.code === 'EAUTH' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
              console.warn(`[Email] SMTP Override failed (${error.code}). Falling back to system default SMTP...`);
              const sysHost = (process.env.SMTP_HOST || "mail.myacc.co.za").trim().replace(/^["']|["']$/g, '');
              const sysUser = (process.env.SMTP_USER || "no_reply@myacc.co.za").trim().replace(/^["']|["']$/g, '');
              const sysPass = (process.env.SMTP_PASS || "").trim().replace(/^["']|["']$/g, '');
              const sysPort = Number(process.env.SMTP_PORT || 465);

              if (sysPass) {
                  currentConfig = {
                      host: sysHost,
                      port: sysPort,
                      secure: sysPort === 465,
                      auth: { user: sysUser, pass: sysPass },
                      tls: { rejectUnauthorized: false },
                      connectionTimeout: 12000,
                      greetingTimeout: 12000,
                      socketTimeout: 25000,
                  };
                  currentFromAddress = `"${fromName}" <${sysUser}>`;
                  smtpOverride = undefined; // Cleared so next iteration uses system
                  await new Promise(resolve => setTimeout(resolve, 500));
                  continue;
              }
          }

          const isTransient = ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ESOCKET', 'EDNS'].includes(error.code) || error.message?.includes('Greeting never received') || error.message?.includes('timeout');
          
          if ((!isTransient && !smtpOverride) || attempt === MAX_ATTEMPTS) {
              // Permanent failure or out of retries — log and throw
              const errorMsg = `SMTP Error: ${error.code || 'Unknown'} - ${error.message}`;
              await logEmailFailure({ to, subject, error: errorMsg });
              throw new Error(errorMsg);
          }

          // Switch port on transient failure (465 <-> 587)
          if (currentConfig.port === 587) {
              currentConfig.port = 465;
              currentConfig.secure = true;
          } else if (currentConfig.port === 465) {
              currentConfig.port = 587;
              currentConfig.secure = false;
          }

          // Wait 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
      }
  }
}


'use server';

import nodemailer from 'nodemailer';
import { getAdminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { User } from './types';
import { reportError } from '@/lib/observability';

type EmailPayload = {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html: string;
    text?: string;
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
    text,
    from, 
    resellerId, 
    attachments, 
    replyTo,
    smtpOverride,
    fromNameOverride
}: EmailPayload) {
  
  let liveSmtpPass = (process.env.SMTP_PASS || "").trim().replace(/^["']|["']$/g, '');
  let liveSmtpUser = (process.env.SMTP_USER || "no_reply@myacc.co.za").trim().replace(/^["']|["']$/g, '');
  let liveSmtpHost = (process.env.SMTP_HOST || "mail.myacc.co.za").trim().replace(/^["']|["']$/g, '');
  let liveSmtpPort = Number(process.env.SMTP_PORT || 465);

  // Proactively check Firestore emailSettings/connection to ensure Cloud Run uses latest credentials without delay
  if (!smtpOverride) {
    try {
      const adminDb = getAdminDb();
      const connSnap = await adminDb.collection('emailSettings').doc('connection').get();
      if (connSnap.exists) {
        const connData = connSnap.data();
        if (connData?.smtpPass && connData.smtpPass.trim()) {
          liveSmtpPass = connData.smtpPass.trim().replace(/^["']|["']$/g, '');
        }
        if (connData?.smtpUser && connData.smtpUser.trim()) {
          liveSmtpUser = connData.smtpUser.trim().replace(/^["']|["']$/g, '');
        }
        if (connData?.smtpHost && connData.smtpHost.trim()) {
          liveSmtpHost = connData.smtpHost.trim().replace(/^["']|["']$/g, '');
        }
        if (connData?.smtpPort) {
          liveSmtpPort = Number(connData.smtpPort);
        }
      }
    } catch {
      // Fallback silently to process.env
    }
  }

  const cleanPass = (smtpOverride?.pass || liveSmtpPass || "")
    .toString()
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[\r\n\t]/g, '');

  const cleanUser = (smtpOverride?.user || liveSmtpUser || "no_reply@myacc.co.za")
    .toString()
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[\r\n\t]/g, '');

  const cleanHost = (smtpOverride?.host || liveSmtpHost || "mail.myacc.co.za")
    .toString()
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[\r\n\t]/g, '');

  // Catches the case where SMTP_PASS is not resolved
  if (!cleanPass) {
    console.error('sendEmail: SMTP_PASS resolved to an empty value.');
    throw new Error('Email is not configured on the server (SMTP_PASS is empty).');
  }

  const defaultPort = Number(smtpOverride?.port || liveSmtpPort || 465);
  let transportConfig: any = {
    pool: false,
    host: cleanHost,
    port: defaultPort,
    secure: defaultPort === 465,
    auth: {
      user: cleanUser,
      pass: cleanPass,
    },
    tls: {
      rejectUnauthorized: false,
      servername: cleanHost,
    },
    connectionTimeout: 25000, // 25 seconds
    greetingTimeout: 35000,   // 35 seconds (prevents premature timeout on cPanel Exim ident query)
    socketTimeout: 45000,     // 45 seconds
  };

  let fromName = fromNameOverride || 'My Accountant';
  let fromEmail = cleanUser;
  let finalBcc = Array.isArray(bcc) ? [...bcc] : (bcc ? [bcc] : []);
  let finalReplyTo = replyTo;

  // 2. Apply explicit SMTP overrides (primarily for admin internal tests)
  if (smtpOverride && smtpOverride.host && smtpOverride.user && smtpOverride.pass) {
      transportConfig = {
          pool: false,
          host: cleanHost,
          port: defaultPort,
          secure: defaultPort === 465,
          auth: {
              user: cleanUser,
              pass: cleanPass,
          },
          tls: {
              rejectUnauthorized: false,
              servername: cleanHost,
          },
          connectionTimeout: 25000,
          greetingTimeout: 35000,
          socketTimeout: 45000,
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
      text: text || undefined,
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
          
          // If credentials failed or timed out, attempt to load live credentials from Firestore emailSettings/connection
          if (error.code === 'EAUTH' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
              try {
                  const adminDb = getAdminDb();
                  const connSnap = await adminDb.collection('emailSettings').doc('connection').get();
                  if (connSnap.exists) {
                      const data = connSnap.data();
                      if (data?.smtpPass && data?.smtpUser) {
                          console.log(`[Email] Retrying with live credentials from Firestore emailSettings/connection...`);
                          const fPort = Number(data.smtpPort || 465);
                          currentConfig = {
                              host: data.smtpHost || "mail.myacc.co.za",
                              port: fPort,
                              secure: fPort === 465,
                              auth: { user: data.smtpUser, pass: data.smtpPass },
                              tls: { rejectUnauthorized: false },
                              connectionTimeout: 12000,
                              greetingTimeout: 12000,
                              socketTimeout: 25000,
                          };
                          currentFromAddress = `"${fromName}" <${data.smtpUser}>`;
                          smtpOverride = undefined;
                          await new Promise(resolve => setTimeout(resolve, 500));
                          continue;
                      }
                  }
              } catch (fsErr) {
                  console.error('[Email] Firestore settings fallback lookup failed:', fsErr);
              }
          }

          const isTransient = ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ESOCKET', 'EDNS'].includes(error.code) || error.message?.includes('Greeting never received') || error.message?.includes('timeout');
          
          if ((!isTransient && !smtpOverride) || attempt === MAX_ATTEMPTS) {
              // Permanent failure or out of retries — log and throw
              const errorMsg = `SMTP Error: ${error.code || 'Unknown'} - ${error.message}`;
              reportError(error, {
                  operation: 'email.send',
                  detail: { subject, recipientCount: Array.isArray(to) ? to.length : 1, code: error.code },
              });
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


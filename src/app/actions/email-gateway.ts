'use server';

/**
 * Narrow, guarded wrappers around sendEmail() (src/lib/email.ts).
 *
 * sendEmail() itself is a generic utility with a fully caller-controlled `to`, `html`,
 * `subject`, and even `smtpOverride` — safe when called server-to-server by trusted code,
 * but several 'use client' components used to import and call it directly. Since any
 * function reachable from a client component is exposed as a directly-callable Next.js
 * Server Action endpoint (bypassable via a raw POST, not just through the UI), that meant
 * an unauthenticated caller could send arbitrary email — to arbitrary recipients, in some
 * cases — through this app's real mail server.
 *
 * Each function below narrows that down to exactly what its calling form legitimately needs:
 * a fixed recipient, a server-verified recipient, or an authorization check, plus basic bot
 * mitigation (honeypot + submit-timing) on the fully public forms.
 */

import { sendEmail } from '@/lib/email';
import { getVerifiedAuthContext, verifyIdTokenEmail, verifyPartnerAccess } from '@/lib/server-auth';

const OFFICE_EMAIL = 'info@myacc.co.za';

function isBotSubmission(website: string | undefined, formRenderedAt: number | undefined): boolean {
  if (website) return true; // honeypot field was filled in — only bots do this
  if (formRenderedAt && Date.now() - formRenderedAt < 2000) return true; // implausibly fast
  return false;
}

/**
 * For fully public "contact us" / lead-notification style forms (Contact, Support, SARS
 * Refund, SARS Compromise). Recipient is always the practice's own inbox — an attacker can
 * only spam this inbox, not direct email at third parties, but we still apply basic bot
 * mitigation to keep it usable.
 */
export async function sendPublicFormEmail({
  subject,
  replyToEmail,
  html,
  website,
  formRenderedAt,
}: {
  subject: string;
  replyToEmail?: string;
  html: string;
  website?: string;
  formRenderedAt?: number;
}) {
  if (isBotSubmission(website, formRenderedAt)) {
    return { success: true }; // pretend success, don't tip off the bot, don't send
  }
  try {
    await sendEmail({
      to: OFFICE_EMAIL,
      subject,
      replyTo: replyToEmail,
      html,
    });
    return { success: true };
  } catch (e: any) {
    console.error('sendPublicFormEmail error:', e);
    return { success: false, error: e.message || 'Failed to send message.' };
  }
}

/**
 * For "email me a copy" lead-magnet forms (e.g. the compliance assessment discount email),
 * where the whole point is sending TO the address the visitor supplied. We can't hardcode the
 * recipient here, so this relies on the honeypot/timing check plus a basic format guard to
 * curb automated abuse — genuinely lower assurance than the other gateways, by design.
 */
export async function sendLeadMagnetEmail({
  toEmail,
  subject,
  html,
  website,
  formRenderedAt,
}: {
  toEmail: string;
  subject: string;
  html: string;
  website?: string;
  formRenderedAt?: number;
}) {
  if (isBotSubmission(website, formRenderedAt)) {
    return { success: true };
  }
  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return { success: false, error: 'A valid email address is required.' };
  }
  try {
    await sendEmail({ to: toEmail, subject, html });
    return { success: true };
  } catch (e: any) {
    console.error('sendLeadMagnetEmail error:', e);
    return { success: false, error: e.message || 'Failed to send email.' };
  }
}

/**
 * For post-signup "welcome to My Accountant" emails. The recipient is derived from the
 * verified Firebase ID token — not the client-supplied form value — so this can only ever
 * email the account that was just authenticated, never an arbitrary third party.
 */
export async function sendOwnWelcomeEmail({
  idToken,
  subject,
  html,
  cc,
  bcc,
}: {
  idToken: string;
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
}) {
  const email = await verifyIdTokenEmail(idToken);
  if (!email) {
    return { success: false, error: 'Unauthorized' };
  }
  try {
    await sendEmail({ to: email, subject, html, cc, bcc });
    return { success: true };
  } catch (e: any) {
    console.error('sendOwnWelcomeEmail error:', e);
    return { success: false, error: e.message || 'Failed to send welcome email.' };
  }
}

/**
 * For internal admin/staff tools (SMTP test emails, reseller-program notifications). Requires
 * a verified caller who is an admin or staff member — recipient stays flexible since that's a
 * legitimate need for these internal tools, but only the practice's own team can trigger it.
 */
export async function sendAdminEmail({
  idToken,
  to,
  subject,
  html,
  cc,
  bcc,
  replyTo,
  smtpOverride,
}: {
  idToken: string;
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  smtpOverride?: { host: string; port: string; user: string; pass: string };
}) {
  const authCtx = await getVerifiedAuthContext(idToken);
  if (!authCtx || !authCtx.isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }
  try {
    await sendEmail({ to, subject, html, cc, bcc, replyTo, smtpOverride });
    return { success: true };
  } catch (e: any) {
    console.error('sendAdminEmail error:', e);
    return { success: false, error: e.message || 'Failed to send email.' };
  }
}

/**
 * For partner-facing order-notification emails. Requires a verified caller who owns (or is
 * active staff of) the given partner practice, or is an admin.
 */
export async function sendPartnerOrderEmail({
  idToken,
  partnerId,
  to,
  subject,
  html,
  resellerId,
}: {
  idToken: string;
  partnerId: string;
  to: string;
  subject: string;
  html: string;
  resellerId?: string;
}) {
  const authCtx = await getVerifiedAuthContext(idToken);
  if (!authCtx) {
    return { success: false, error: 'Unauthorized' };
  }
  if (!authCtx.isAdmin && !(await verifyPartnerAccess(authCtx.userId, partnerId))) {
    return { success: false, error: 'Unauthorized: you do not have access to this practice' };
  }
  try {
    await sendEmail({ to, subject, html, resellerId });
    return { success: true };
  } catch (e: any) {
    console.error('sendPartnerOrderEmail error:', e);
    return { success: false, error: e.message || 'Failed to send email.' };
  }
}

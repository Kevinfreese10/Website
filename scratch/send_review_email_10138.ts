import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { sendEmail } from '../src/lib/email';
import * as fs from 'fs';

async function sendReviewEmail() {
  const pdfPath = path.resolve('c:/myacc/scratch/order_10138_audit/Accounting_Officer_Appointment_Letter_FLEXIWILL_v2.pdf');
  const pdfBuffer = fs.readFileSync(pdfPath);

  const subject = "Review Required: Redrafted Accountant Appointment Letter — Order #10138 (FLEXIWILL (PTY) LTD)";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
      <div style="background-color: #0F2137; padding: 18px 24px; border-radius: 6px 6px 0 0; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px; color: #ffffff;">My Accountant — Order Audit Deliverable Review</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1;">Order #10138 • Accountant Appointment Letter</p>
      </div>

      <div style="padding: 24px; background-color: #ffffff;">
        <p style="font-size: 14px; margin-top: 0;">Hi Kevin,</p>
        <p style="font-size: 14px; line-height: 1.5;">
          The redrafted <strong>Accountant Appointment Letter</strong> for <strong>Order #10138 (FLEXIWILL (PTY) LTD)</strong> has been prepared using the official NCR statutory template format.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 18px 0;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #0F2137; text-transform: uppercase;">Entity & Document Summary</h4>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr><td style="padding: 4px 0; color: #64748b; width: 140px;"><strong>Applicant Entity:</strong></td><td style="padding: 4px 0; color: #0f172a;"><strong>FLEXIWILL (PTY) LTD</strong></td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Registration Number:</strong></td><td style="padding: 4px 0; color: #0f172a;">2003/002867/07</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Director / Applicant:</strong></td><td style="padding: 4px 0; color: #0f172a;">Lethabo Selaelo Ramaphakela (ID: 9908220104082)</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Registered Address:</strong></td><td style="padding: 4px 0; color: #0f172a;">16 Impala Road, Clayville, 1666</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Addressed To:</strong></td><td style="padding: 4px 0; color: #0f172a;">The National Credit Regulator (NCR) - Registration Dept</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Designated AO:</strong></td><td style="padding: 4px 0; color: #0f172a;">Kevin Freese CBA (SA) #3561 (CIBA CBAP SA #3561 • PR-0098553)</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Statutory Mandate:</strong></td><td style="padding: 4px 0; color: #0f172a;">National Credit Act Regulations 67 & 68 (NCR Form 2, 39 & 40)</td></tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #334155;">
          The complete PDF is attached to this email for your direct inspection.
        </p>

        <div style="margin: 24px 0; text-align: center;">
          <a href="https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10138%2Fgenerated_drafts%2FAccounting_Officer_Appointment_Letter_FLEXIWILL.pdf?alt=media" 
             style="background-color: #4f46e5; color: #ffffff; padding: 10px 20px; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 5px; display: inline-block;">
            View PDF in Browser
          </a>
        </div>

        <p style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-bottom: 0;">
          <em>Note: In accordance with protocol, the order's Communication History in the portal has not been updated yet and is pending your final approval.</em>
        </p>
      </div>
    </div>
  `;

  const recipients = ['kev@thinkestry.co.za', 'freesekevin@gmail.com'];

  console.log('Sending email to:', recipients);

  const res = await sendEmail({
    to: recipients,
    subject,
    html,
    fromNameOverride: "My Accountant Operations",
    attachments: [
      {
        filename: "Accounting_Officer_Appointment_Letter_FLEXIWILL.pdf",
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  });

  console.log('Email send result:', res);
}

sendReviewEmail().catch(console.error);

import fs from 'fs';
import { resolve } from 'path';

// Load .env and .env.local
['.env', '.env.local'].forEach(file => {
  const envPath = resolve(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const [key, ...vals] = line.split('=');
      if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
  }
});

import { sendEmail } from '../src/lib/email';

async function main() {
  const recipient = 'kev@thinkestry.co.za';
  console.log(`Sending updated test partner program email to ${recipient}...`);

  const subject = "Important Update: BEI Partner Program & Online Storefront Access";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f9; color: #333333;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #214392; padding: 32px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">My Accountant</h1>
                  <p style="color: #cbd5e1; margin: 6px 0 0 0; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Bookkeeper Empowerment Initiative (BEI)</p>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Dear Partner,</h2>
                  
                  <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
                    Thank you for being a valued member of the Bookkeeper Empowerment Initiative (BEI). We are reaching out to inform you of an exciting update to our platform model designed to give your practice greater flexibility, higher margins, and dedicated support.
                  </p>

                  <!-- Highlight Box: New 20% Wholesale Discount -->
                  <div style="background-color: #f0fdf4; border-top: 3px solid #16a34a; border-bottom: 1px solid #dcfce7; border-left: 4px solid #16a34a; border-right: 1px solid #dcfce7; padding: 16px 20px; border-radius: 8px; margin-bottom: 28px;">
                    <p style="margin: 0; font-size: 15px; font-weight: 700; color: #15803d;">🎉 Increased Wholesale Discount: 20% Off</p>
                    <p style="margin: 4px 0 0 0; font-size: 13.5px; color: #166534; line-height: 1.5;">
                      All partners now receive an increased <strong>20% wholesale discount</strong> on all services when outsourcing to My Accountant.
                    </p>
                  </div>

                  <h3 style="color: #0f172a; font-size: 16px; font-weight: 700; margin-bottom: 12px;">Two Flexible Ways to Partner With Us</h3>
                  
                  <!-- Tier 1 Card -->
                  <div style="border: 2px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 20px; background-color: #f8fafc;">
                    <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #1e293b;">1. Free Referral & Outsource Partner (R0)</p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569; line-height: 1.6;">
                      <li><strong>100% Free</strong> lifetime access to your Partner Portal dashboard.</li>
                      <li>Manage internal client orders & track fulfillment progress.</li>
                      <li>Outsource complex work to our back-office team at <strong>20% off retail rates</strong>.</li>
                      <li><em>Note: Does not include a client-facing online storefront.</em></li>
                    </ul>
                  </div>

                  <!-- Tier 2 Card (Full 4-sided border) -->
                  <div style="border: 2px solid #214392; border-radius: 10px; padding: 22px; margin-bottom: 28px; background-color: #ffffff; box-shadow: 0 2px 8px rgba(33,67,146,0.06);">
                    <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 700; color: #214392;">2. Full White-Label Storefront (R1,950 Once-Off)</p>
                    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 14px;">
                      Activate your own branded client-facing online store where clients can browse <strong>70+ services</strong>, place orders, and submit documents under your practice brand.
                    </p>
                    <p style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">What's Included in the R1,950 Fee:</p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; color: #475569; line-height: 1.7;">
                      <li style="margin-bottom: 6px;"><strong>Personalized Setup Assistance:</strong> Our team helps configure your practice branding, domain linking, and pricing markups.</li>
                      <li style="margin-bottom: 6px;"><strong>1-on-1 Platform Training:</strong> Full onboarding walkthrough session for you and your team.</li>
                      <li style="margin-bottom: 6px;"><strong>Custom Domain Linking:</strong> Host your store on your own custom domain.</li>
                      <li style="margin-bottom: 6px;"><strong>Service Markup Control:</strong> Set your own retail prices on all services.</li>
                      <li style="margin-bottom: 6px;"><strong>Automated Document Collection:</strong> Secure digital client document submissions.</li>
                      <li style="margin-bottom: 6px;"><strong>Flexible Fulfillment:</strong> Complete orders internally (10% platform royalty fee, R100-R500 cap — used towards hosting, maintenance & platform infrastructure) or outsource to us.</li>
                    </ul>
                  </div>

                  <!-- CTA Section -->
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="https://www.myacc.co.za/partner/onboarding" target="_blank" style="background-color: #214392; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(33, 67, 146, 0.3);">
                      Activate Your Online Storefront — R1,950 Once-Off
                    </a>
                    <p style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
                      Secure once-off payment via PayFast. Includes full setup assistance and 1-on-1 platform training.
                    </p>
                  </div>

                  <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-top: 30px;">
                    If you have any questions or need assistance with your practice configuration, please reply directly to this email or reach out to our team at <a href="mailto:info@myacc.co.za" style="color: #214392; text-decoration: underline;">info@myacc.co.za</a>.
                  </p>

                  <p style="font-size: 14px; color: #334155; margin-top: 24px; font-weight: 600;">
                    Kind regards,<br>
                    <span style="color: #214392;">The My Accountant Support Team</span>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f1f5f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 12px; color: #64748b;">
                    © ${new Date().getFullYear()} My Accountant (Pty) Ltd. All rights reserved.
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">
                    Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Johannesburg
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const result = await sendEmail({
    to: recipient,
    subject: `[TEST DRAFT v2] ${subject}`,
    html: html,
  });

  console.log('Updated test email result:', result);
}

main().catch(console.error);

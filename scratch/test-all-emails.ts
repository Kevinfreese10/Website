/**
 * Email Test Script — tests all 20 unique email templates
 * Run: npx tsx scratch/test-all-emails.ts
 *
 * Sends every template to freesekevin@gmail.com with realistic mock data.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import React from 'react';
import { render } from '@react-email/components';

// ── Email sender ──────────────────────────────────────────────────────────────
import nodemailer from 'nodemailer';

const TEST_TO = 'hr@myacc.co.za';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za';

async function send(subject: string, html: string, label: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });
  await transporter.sendMail({
    from: `"My Accountant Test" <${process.env.SMTP_USER}>`,
    to: TEST_TO,
    subject: `[TEST] ${subject}`,
    html,
  });
  console.log(`  ✅  ${label}`);
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockOrder: any = {
  id: 'TEST-001',
  originalOrderId: 'ORD-2024-001',
  customerName: 'Kevin Freese',
  customerEmail: TEST_TO,
  customerPhone: '071 000 0000',
  date: new Date(),
  items: [
    {
      id: 'monthly-accounting',
      title: 'Monthly Accounting',
      price: 1500,
      quantity: 1,
      service: {
        id: 'monthly-accounting',
        title: 'Monthly Accounting',
        price: 1500,
        clientRequirements: ['Bank Statements', 'Invoices'],
        informationToProvide: [
          { label: 'Company Registration Number', type: 'text' },
          { label: 'Bank Statements (Last 3 months)', type: 'pdf' },
        ],
        turnaroundTime: '5-7 business days',
        attachmentUrl: null,
      },
    },
  ],
  total: 1500,
  discountCode: null,
  discountAmount: null,
  status: 'Processing',
  assignedTo: [],
  notes: [],
  documentUploads: [],
};

const mockDocumentUploads: any[] = [
  {
    serviceId: 'monthly-accounting',
    requirementLabel: 'Bank Statements',
    type: 'file',
    fileUrl: 'https://www.myacc.co.za',
    fileName: 'bank_statements.pdf',
    uploadedAt: new Date(),
    status: 'approved',
  },
  {
    serviceId: 'monthly-accounting',
    requirementLabel: 'Invoices',
    type: 'file',
    fileUrl: 'https://www.myacc.co.za',
    fileName: 'invoices.pdf',
    uploadedAt: new Date(),
    status: 'rejected',
    rejectionReason: 'Document is too blurry to read. Please re-upload a clearer scan.',
  },
];

// ── Import all email components ───────────────────────────────────────────────

async function runTests() {
  console.log(`\n🚀 Sending all email tests to ${TEST_TO}...\n`);

  const { ClientDocumentUploadEmail }   = await import('../src/components/emails/ClientDocumentUploadEmail');
  const { DocumentReviewEmail }         = await import('../src/components/emails/DocumentReviewEmail');
  const { NewNoteNotificationEmail }    = await import('../src/components/emails/NewNoteNotificationEmail');
  const { OutstandingDocumentsEmail }   = await import('../src/components/emails/OutstandingDocumentsEmail');
  const { OrderConfirmationEmail }      = await import('../src/components/emails/OrderConfirmationEmail');
  const { DocumentRequestEmail }        = await import('../src/components/emails/DocumentRequestEmail');
  const { ReviewRequestEmail }          = await import('../src/components/emails/ReviewRequestEmail');
  const { PartnerWelcomeEmail }         = await import('../src/components/emails/PartnerWelcomeEmail');
  const { PartnerOnboardingEmail }      = await import('../src/components/emails/PartnerOnboardingEmail');
  const { PartnerStaffInviteEmail }     = await import('../src/components/emails/PartnerStaffInviteEmail');
  const { WelcomeDiscountEmail }        = await import('../src/components/emails/WelcomeDiscountEmail');
  const ChatNotificationEmail           = (await import('../src/components/emails/ChatNotificationEmail')).default;
  const ChatInviteEmail                 = (await import('../src/components/emails/ChatInviteEmail')).default;

  const results: { label: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

  async function test(label: string, subject: string, htmlPromise: Promise<string> | string) {
    try {
      const html = await htmlPromise;
      await send(subject, html, label);
      results.push({ label, status: 'PASS' });
    } catch (err: any) {
      console.log(`  ❌  ${label} — ${err.message}`);
      results.push({ label, status: 'FAIL', error: err.message });
    }
  }

  // ── 1. Order Confirmation ─────────────────────────────────────────────────
  await test(
    '#1 — Order Confirmation',
    `Order Confirmation #TEST-001`,
    render(React.createElement(OrderConfirmationEmail, {
      order: mockOrder,
      isNewUser: true,
      generatedPassword: null,
      showPaymentButton: false,
    }))
  );

  // ── 2. Document Request (Action Required) ─────────────────────────────────
  await test(
    '#2 — Document Request (Action Required for Your Order)',
    `Action Required for Your Order #TEST-001`,
    render(React.createElement(DocumentRequestEmail, {
      order: mockOrder,
      items: mockOrder.items,
      replyTo: 'info@myacc.co.za',
    }))
  );

  // ── 3. Document Review Feedback ───────────────────────────────────────────
  await test(
    '#3 — Document Review Feedback',
    `Feedback on Your Submitted Documents for Order #TEST-001`,
    render(React.createElement(DocumentReviewEmail, {
      clientName: 'Kevin Freese',
      orderId: 'TEST-001',
      documentUploads: mockDocumentUploads,
      orderUrl: `${APP_URL}/dashboard/orders/TEST-001`,
      resellerName: 'The My Accountant Team',
    }))
  );

  // ── 4. Outstanding Documents Reminder ────────────────────────────────────
  await test(
    '#4 — Outstanding Documents Reminder',
    `Action Required: Outstanding Documents for Order #TEST-001`,
    render(React.createElement(OutstandingDocumentsEmail, {
      clientName: 'Kevin Freese',
      orderId: 'TEST-001',
      orderUrl: `${APP_URL}/dashboard/orders/TEST-001`,
      resellerName: 'The My Accountant Team',
    }))
  );

  // ── 5. Review Request (Order Completed) ───────────────────────────────────
  await test(
    '#5 — Review Request (Order Completed)',
    `We'd love your feedback on order #TEST-001`,
    render(React.createElement(ReviewRequestEmail, {
      order: { ...mockOrder, status: 'Completed' },
    }))
  );

  // ── 6. New Note → Client ──────────────────────────────────────────────────
  await test(
    '#6 — New Note Notification (Admin → Client)',
    `New Note on Order #TEST-001`,
    render(React.createElement(NewNoteNotificationEmail, {
      recipientName: 'Kevin Freese',
      senderName: 'Winifred Smith',
      orderId: 'TEST-001',
      notePreview: 'Hi Kevin, we have received your documents and are busy processing your monthly accounts. We will update you within 5 business days.',
      actionUrl: `${APP_URL}/dashboard/orders/TEST-001`,
      isToClient: true,
      resellerName: 'The My Accountant Team',
    }))
  );

  // ── 7. New Note → Staff ───────────────────────────────────────────────────
  await test(
    '#7 — New Note Notification (Client → Staff)',
    `New Note on Order #TEST-001`,
    render(React.createElement(NewNoteNotificationEmail, {
      recipientName: 'Winifred Smith',
      senderName: 'Kevin Freese',
      orderId: 'TEST-001',
      notePreview: 'Hi, just checking in on the progress of my order. Has everything been received? Thank you.',
      actionUrl: `${APP_URL}/admin/orders/TEST-001`,
      isToClient: false,
    }))
  );

  // ── 8. Documents Uploaded → Staff ─────────────────────────────────────────
  await test(
    '#8 — Client Document Upload Notification (to Staff)',
    `Documents Uploaded for Order #TEST-001`,
    render(React.createElement(ClientDocumentUploadEmail, {
      assigneeName: 'Winifred Smith',
      clientName: 'Kevin Freese',
      orderId: 'TEST-001',
      orderUrl: `${APP_URL}/admin/orders/TEST-001`,
    }))
  );

  // ── 9. Partner Welcome ────────────────────────────────────────────────────
  await test(
    '#9 — Partner Welcome (Signup)',
    `Welcome to the My Accountant Partner Program!`,
    render(React.createElement(PartnerWelcomeEmail, {
      partnerName: 'Kevin Freese',
      email: TEST_TO,
      loginUrl: `${APP_URL}/login`,
    }))
  );

  // ── 10. Partner Practice Activated (BEI) ─────────────────────────────────
  await test(
    '#10 — Practice Activated (BEI Payment)',
    `Your My Accountant Practice is Activated! 🚀`,
    render(React.createElement(PartnerOnboardingEmail, {
      partnerName: 'Kevin Freese',
      email: TEST_TO,
      creditAmount: 4950,
      loginUrl: `${APP_URL}/login`,
    }))
  );

  // ── 11. Staff Invite ──────────────────────────────────────────────────────
  await test(
    '#11 — Staff Invite',
    `Invitation to join Freese & Associates on My Accountant`,
    render(React.createElement(PartnerStaffInviteEmail, {
      inviteeName: 'Kevin Freese',
      partnerCompanyName: 'Freese & Associates',
      partnerContactName: 'Kevin Freese',
      inviteRole: 'Staff Member',
      acceptUrl: `${APP_URL}/partner-invite/TEST-TOKEN-123`,
      expiryHours: 72,
    }))
  );

  // ── 12. Compliance Lead / Discount ────────────────────────────────────────
  await test(
    '#12 — Compliance Assessment Lead (Discount Email)',
    `Your Free Compliance Assessment & 5% Discount!`,
    render(React.createElement(WelcomeDiscountEmail, {
      name: 'Kevin Freese',
      discountCode: 'COMPLY5',
    }))
  );

  // ── 13. Chat Reply Notification ───────────────────────────────────────────
  await test(
    '#13 — Live Chat Reply Notification',
    `Live Chat Reply from My Accountant Support`,
    render(React.createElement(ChatNotificationEmail, {
      recipientName: 'Kevin Freese',
      lastMessagePreview: 'Hi Kevin! Thanks for reaching out. We can definitely help you with your VAT registration. Here are the next steps...',
      actionUrl: `${APP_URL}?resumeChat=TEST-CONV-123`,
    }))
  );

  // ── 14. Chat Invite ───────────────────────────────────────────────────────
  await test(
    '#14 — Live Chat Invite (Admin-initiated)',
    `Kevin Freese is ready to chat with you`,
    render(React.createElement(ChatInviteEmail, {
      recipientName: 'Kevin Freese',
      senderName: 'Kevin Freese',
      actionUrl: `${APP_URL}?resumeChat=TEST-CONV-123`,
    }))
  );

  // ── 15. Inbox Reply (plain HTML, no template) ─────────────────────────────
  await test(
    '#15 — Inbox Email Reply (no template, plain HTML)',
    `Re: Question about my tax return`,
    Promise.resolve(`
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        <p>Hi Kevin,</p>
        <p>Thank you for your email. We have reviewed your query and our tax team will be in touch within 24 hours.</p>
        <p>Kind regards,<br/><strong>My Accountant Support Team</strong></p>
      </div>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
      <div style="font-size: 12px; color: #888;">
        <p><strong>Original message:</strong></p>
        <blockquote style="border-left: 2px solid #ddd; padding-left: 12px;">
          Hi, I have a question about my tax return submission.
        </blockquote>
      </div>
    `)
  );

  // ── 16. Contact Form Notification ─────────────────────────────────────────
  await test(
    '#16 — Contact Form Submission (to info@myacc.co.za)',
    `New Contact Form Submission from Kevin Freese`,
    Promise.resolve(`
      <p><strong>Name:</strong> Kevin Freese</p>
      <p><strong>Email:</strong> ${TEST_TO}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>Hi, I'd like to enquire about your monthly accounting packages. What are the requirements and turnaround times?</p>
    `)
  );

  // ── 17. Support Form ──────────────────────────────────────────────────────
  await test(
    '#17 — Support Form Submission (to info@myacc.co.za)',
    `Support Request: Cannot access my dashboard`,
    Promise.resolve(`
      <p><strong>Name:</strong> Kevin Freese</p>
      <p><strong>Email:</strong> ${TEST_TO}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>I'm trying to log into my dashboard but keep getting a "permission denied" error. My order ID is ORD-2024-001. Please help!</p>
    `)
  );

  // ── 18. Partner Assistance Email (admin manual) ───────────────────────────
  await test(
    '#18 — Partner Assistance Offer (Admin Manual)',
    `Do you need assistance with your Freese & Associates setup?`,
    Promise.resolve(`
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <p>Hi Kevin,</p>
        <p>I hope you're having a great week.</p>
        <p>I noticed that your practice setup on the My Accountant BEI platform isn't quite complete yet. I'm reaching out to see if you need any assistance with the configuration, such as setting up your practice banking details or customizing your landing page content.</p>
        <p>Our goal is to make sure you have everything you need to start scaling your firm efficiently. If you have any questions, please feel free to reply to this email.</p>
        <br/>
        <p>Regards,</p>
        <p><strong>Kevin Freese</strong><br/>My Accountant Support Team</p>
      </div>
    `)
  );

  // ── 19. Wallet Refund Confirmation ────────────────────────────────────────
  await test(
    '#19 — Wallet Refund Confirmation',
    `Refund Confirmation: My Accountant Practice Wallet`,
    Promise.resolve(`
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <p>Hi Kevin,</p>
        <p>We have processed your wallet refund of <strong>R4,950.00</strong>.</p>
        <p>Please allow 5–7 business days for the funds to reflect in your account.</p>
        <p>Your practice wallet credit balance has been reset to zero. If you did not request this or have any questions, please contact support.</p>
        <br/>
        <p>Regards,</p>
        <p>The My Accountant Team</p>
      </div>
    `)
  );

  // ── 20. Email Forward ─────────────────────────────────────────────────────
  await test(
    '#20 — Email Forwarded from Inbox',
    `Fwd: Urgent: SARS Assessment Notice`,
    Promise.resolve(`
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        <p>FYI — please handle this urgently.</p>
      </div>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
      <div style="font-size: 12px; color: #888;">
        <p><strong>Forwarded from:</strong> sars@sars.gov.za</p>
        <blockquote style="border-left: 2px solid #ddd; padding-left: 12px;">
          Dear Taxpayer, you have received an assessment notice for the 2024 tax year. Please log into eFiling to view and respond within 30 days.
        </blockquote>
      </div>
    `)
  );

  // ── Summary ───────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log('\n' + '─'.repeat(60));
  console.log(`\n📊 Results: ${passed}/${results.length} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log('❌ Failed emails:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   • ${r.label}: ${r.error}`);
    });
  } else {
    console.log(`🎉 All ${passed} emails sent successfully to ${TEST_TO}!`);
  }
  console.log('');
}

runTests().catch(err => {
  console.error('Fatal error running email tests:', err);
  process.exit(1);
});

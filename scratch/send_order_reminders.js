const path = require('path');
const admin = require(path.resolve('c:/myacc/node_modules/firebase-admin'));
const nodemailer = require(path.resolve('c:/myacc/node_modules/nodemailer'));
const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Configure transporter
const transporter = nodemailer.createTransport({
  host: 'mail.myacc.co.za',
  port: 465,
  secure: true,
  auth: {
    user: 'no_reply@myacc.co.za',
    pass: 'W0=LP2i_yVzQ8EQL',
  },
});

const KEVIN_UID = 'LRM285EOq3gwNMKayY6vtzooaC03';

const reminders = [
  // --- Group 3: Awaiting Client Info / Documents ---
  {
    orderId: '10098',
    customerName: 'Sithabisiwe Mpofu',
    noteText: 'Hi Sithabisiwe, A kind reminder to please upload the remaining outstanding documents for your NCR Registration so that we can finalize and submit your application to the NCR. You can upload them directly in your client dashboard.'
  },
  {
    orderId: '10094',
    customerName: 'Bonolo Moremane',
    noteText: 'Hi Bonolo, This is a friendly reminder to please upload your ID copy and shareholding confirmation for your BEE Certificate order so that we can issue your certificate. Please log into your dashboard to complete the upload.'
  },
  {
    orderId: '10100',
    customerName: 'Hannelie van schalkwyk',
    noteText: 'Hi Hannelie, We are following up regarding your SARS Auto Assessment Review order. Please log into your dashboard to upload your tax details/documents or let us know if you need assistance so that we can review your assessment.'
  },
  {
    orderId: '10072',
    customerName: 'Zarika Lubbe',
    noteText: 'Hi Zarika, Following up on this COIDA Nature of Business Change — please provide the signed AFS and the signed instruction letter on company letterhead so that we can submit the pack to the Compensation Fund.'
  },
  {
    orderId: '10034',
    customerName: 'Bridget lindiwe Magagula',
    noteText: 'Hi Bridget, A friendly reminder to please send through your bank statements / updated transaction allocations so that we can complete the preparation of your Annual Financial Statements.'
  },
  {
    orderId: '9808',
    customerName: 'Liphetolo Lepota',
    noteText: 'Hi Liphetolo, We are following up regarding your tax return. Please upload your IRP5 tax certificates or provide your tax information so that we can complete and submit your tax return to SARS.'
  },
  {
    orderId: '9809',
    customerName: 'Liphetolo Lepota',
    noteText: 'Hi Liphetolo, We are following up regarding your tax return. Please upload your IRP5 tax certificates or provide your tax information so that we can complete and submit your tax return to SARS.'
  },
  {
    orderId: '9811',
    customerName: 'Liphetolo Lepota',
    noteText: 'Hi Liphetolo, We are following up regarding your tax return. Please upload your IRP5 tax certificates or provide your tax information so that we can complete and submit your tax return to SARS.'
  },
  {
    orderId: '9813',
    customerName: 'Liphetolo Lepota',
    noteText: 'Hi Liphetolo, We are following up regarding your tax return. Please upload your IRP5 tax certificates or provide your tax information so that we can complete and submit your tax return to SARS.'
  },
  {
    orderId: '9875',
    customerName: 'Martin Maledu',
    noteText: 'Hi Martin, This is a reminder to please send through the signed documents we drafted for your COIDA & Tax Clearance so that we can proceed with the submission.'
  },
  {
    orderId: '9870',
    customerName: 'Takalani Mutsharini',
    noteText: 'Hi Takalani, All your required compliance documents are approved and ready. Kindly let us know once you are ready to make payment for the CIDB registration fee so that we can finalize your CIDB submission.'
  },

  // --- Group 4: Stale / Inactive Orders (Final Follow-Up) ---
  {
    orderId: '9511',
    customerName: 'Nandu Cross Malumbete',
    noteText: 'Hi Nandu, We are conducting a final follow-up on your order #9511 for CSD Registration. Please upload the required documents in your dashboard if you still wish to proceed. If we do not hear from you, this order will be closed.'
  },
  {
    orderId: '9648',
    customerName: 'Johnson Mabuto',
    noteText: 'Hi Johnson, We are following up regarding your Tax Representative Appointment. Please let us know when you are ready to provide the outstanding documents so that we can finalize this with SARS, otherwise this order will be archived.'
  },
  {
    orderId: '9662',
    customerName: 'Marijke Barnard',
    noteText: 'Hi Marijke, A final follow-up regarding your order #9662 for Beneficial Ownership & Director Removal. Please upload the required company documents in your dashboard if you would like us to proceed, or let us know if this is no longer required.'
  },
  {
    orderId: '9673',
    customerName: 'Jia Bae',
    noteText: 'Hi Jia, This is a final reminder to please upload the required documents for your VAT Registration order #9673 so that we can proceed with SARS. Please let us know if you still wish to continue.'
  },
  {
    orderId: '9743',
    customerName: 'Phodzo  Zimeme',
    noteText: 'Hi Phodzo, We are following up on your CIDB Upgrade application #9743. Please upload the remaining required project completion documents so that we can submit your upgrade to the CIDB, or let us know if you would like to close this request.'
  },
  {
    orderId: '9871',
    customerName: 'Thinus Barnard',
    noteText: 'Hi Thinus, A final reminder regarding your CIDB Upgrade order #9871. Please upload the required financials and project certificates in your dashboard so that we can proceed with your application.'
  },
  {
    orderId: '9982',
    customerName: 'Kedisaletse Nchaupa',
    noteText: 'Hi Kedisaletse, This is a final reminder to please upload the required documents for your NCR Registration order #9982 so that we can prepare and lodge your application with the NCR.'
  }
];

async function sendReminders() {
  console.log(`Starting to post reminder notes on ${reminders.length} orders...\n`);

  for (const item of reminders) {
    try {
      const orderRef = db.collection('orders').doc(item.orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        console.error(`Order #${item.orderId} not found in Firestore. Skipping.`);
        continue;
      }

      const orderData = orderDoc.data();
      const customerEmail = orderData.customerEmail;
      const customerName = orderData.customerName || item.customerName;

      const newNote = {
        text: item.noteText,
        date: new Date().toISOString(),
        authorId: KEVIN_UID,
        type: 'note',
        isInternal: false,
        subject: null,
        attachments: null
      };

      // 1. Update Firestore Order Notes
      await orderRef.update({
        notes: admin.firestore.FieldValue.arrayUnion(newNote)
      });
      console.log(`✅ [Order #${item.orderId}] Note added to Firestore.`);

      // 2. Send Notification Email to Customer
      if (customerEmail) {
        const orderUrl = `https://www.myacc.co.za/dashboard/orders/${item.orderId}`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0;">My Accountant</h2>
              <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Update on Your Order #${item.orderId}</p>
            </div>
            <p>Dear ${customerName},</p>
            <p>A new note has been added to your order <strong>#${item.orderId}</strong> by <strong>Kevin Freese</strong>:</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 15px;">
              "${item.noteText}"
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${orderUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Order & Upload Documents</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">
              My Accountant (Pty) Ltd | 010 109 1625 | <a href="https://www.myacc.co.za" style="color: #0284c7;">www.myacc.co.za</a>
            </p>
          </div>
        `;

        await transporter.sendMail({
          from: '"My Accountant" <no_reply@myacc.co.za>',
          to: customerEmail,
          bcc: 'kev@thinkestry.co.za',
          subject: `New Note on Order #${item.orderId}`,
          html: emailHtml,
        });

        console.log(`   ✉️ Email sent to ${customerEmail} (BCC: kev@thinkestry.co.za)`);
      } else {
        console.log(`   ⚠️ No email found for Order #${item.orderId}`);
      }

      // Small delay between emails to be gentle with SMTP
      await new Promise(r => setTimeout(r, 600));

    } catch (err) {
      console.error(`❌ Error updating Order #${item.orderId}:`, err.message);
    }
  }

  console.log('\nAll reminder notes and notification emails sent successfully!');
}

sendReminders().catch(console.error);

const admin = require('c:/myacc/node_modules/firebase-admin');
const nodemailer = require('c:/myacc/node_modules/nodemailer');
const fs = require('fs');

const serviceAccountPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Transporter for note notification emails
const transporter = nodemailer.createTransport({
  host: 'mail.myacc.co.za',
  port: 465,
  secure: true,
  auth: {
    user: 'winifred@myacc.co.za',
    pass: 'vcG%4&Qr,_W{W6M)'
  }
});

function getNoteHtml({ recipientName, orderNumber, orderId, noteText, actionUrl }) {
  const firstName = (recipientName || 'Client').trim().split(' ')[0];
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Note on Order #${orderNumber || orderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
          
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #0f2137; padding: 24px 30px; text-align: center; border-bottom: 3px solid #c5a059;">
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: 1px; text-transform: uppercase;">
                My Accountant
              </h1>
              <p style="color: #c5a059; font-size: 11px; margin: 4px 0 0 0; letter-spacing: 2px; text-transform: uppercase;">
                Order Update
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 35px 35px 25px 35px;">
              <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">
                New Note on Order #${orderNumber || orderId}
              </h2>
              
              <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
                Dear ${firstName},
              </p>

              <div style="background-color: #f9fafb; border-left: 4px solid #0f2137; padding: 18px 20px; margin: 20px 0; border-radius: 0 6px 6px 0;">
                <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">
                  ${noteText}
                </p>
              </div>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 30px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${actionUrl}" style="display: inline-block; background-color: #0f2137; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 13px 32px; border-radius: 6px; letter-spacing: 0.5px;">
                      View Order &amp; Pay via PayFast
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin-bottom: 0; text-align: center;">
                You can also access your order directly by visiting <a href="${actionUrl}" style="color: #0f2137;">${actionUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 35px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #9ca3af; font-size: 11.5px; margin: 0 0 6px 0;">
                The My Accountant Team | <a href="mailto:info@myacc.co.za" style="color: #0f2137; text-decoration: none;">info@myacc.co.za</a> | <a href="https://www.myacc.co.za" style="color: #0f2137; text-decoration: none;">www.myacc.co.za</a>
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
}

async function processPendingOrders() {
  console.log('=== RUNNING AUTOMATED PENDING PAYMENT FOLLOW-UP CHECK ===');
  const now = new Date();
  
  const snap = await db.collection('orders').where('status', '==', 'Pending Payment').get();
  console.log(`Found ${snap.size} orders with 'Pending Payment' status.\n`);

  const results = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const orderId = doc.id;
    const orderNumber = data.orderNumber || data.originalOrderId || orderId;
    const customerName = (data.customerName || (data.customer ? (data.customer.firstName + ' ' + (data.customer.lastName || '')) : 'Valued Client')).trim();
    const firstName = customerName.split(' ')[0];
    const customerEmail = (data.customerEmail || data.customer?.email || '').toLowerCase().trim();
    const serviceTitle = data.serviceTitle || data.service || 'your service';
    const totalAmount = data.totalAmount || data.total || data.price || '';
    const amountStr = totalAmount ? ` (Total: R${Number(totalAmount).toFixed(2)})` : '';
    const actionUrl = `https://www.myacc.co.za/dashboard/orders/${orderId}`;

    const createdAt = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date();
    const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);

    const notes = data.notes || [];
    const sentStages = data.followUpStages || []; // e.g. [2, 3, 5, 7]

    console.log(`Checking Order #${orderNumber} (${customerName}) | Age: ${ageDays.toFixed(2)} days | Sent Stages: [${sentStages.join(', ')}]`);

    let targetStage = null;
    let noteText = null;
    let newStatus = null;

    if (ageDays >= 10) {
      targetStage = 10;
      newStatus = 'Cancelled';
      noteText = `Hi ${firstName},\n\nAs payment was not received within 10 days, your order #${orderNumber} for ${serviceTitle} has been closed automatically.\n\nIf you would like to proceed in the future, you are welcome to place a new order on our website at https://www.myacc.co.za at your convenience.\n\nKind regards,\nThe My Accountant Team`;
    } else if (ageDays >= 7 && !sentStages.includes(7)) {
      targetStage = 7;
      noteText = `Hi ${firstName},\n\nThis is a final courtesy notice regarding your pending order #${orderNumber} for ${serviceTitle}${amountStr}.\n\nUnpaid orders are automatically closed after 10 days. If you still wish to proceed, please complete your secure online payment via PayFast within the next 3 days:\n${actionUrl}\n\nKind regards,\nThe My Accountant Team`;
    } else if (ageDays >= 5 && !sentStages.includes(5)) {
      targetStage = 5;
      noteText = `Hi ${firstName},\n\nWe noticed that payment for order #${orderNumber} for ${serviceTitle}${amountStr} has not yet been completed.\n\nIf you experienced any issues during PayFast checkout or have questions regarding your service, please reply to this note so our team can assist you.\n\nComplete payment online via PayFast: ${actionUrl}\n\nKind regards,\nThe My Accountant Team`;
    } else if (ageDays >= 3 && !sentStages.includes(3)) {
      targetStage = 3;
      noteText = `Hi ${firstName},\n\nJust a quick follow-up on order #${orderNumber} for ${serviceTitle}${amountStr}.\n\nOur team is on standby and ready to begin processing your documents as soon as payment is confirmed online via PayFast: ${actionUrl}\n\nKind regards,\nThe My Accountant Team`;
    } else if (ageDays >= 2 && !sentStages.includes(2)) {
      targetStage = 2;
      noteText = `Hi ${firstName},\n\nThis is a friendly reminder that your order #${orderNumber} for ${serviceTitle}${amountStr} is awaiting payment.\n\nTo proceed with your order, please complete your secure payment online via PayFast here: ${actionUrl}\n\nIf you have any questions or need assistance, please feel free to reply directly to this note.\n\nKind regards,\nThe My Accountant Team`;
    }

    if (targetStage !== null) {
      console.log(`  -> Triggering Stage ${targetStage} for Order #${orderNumber}...`);
      
      const newNote = {
        authorId: 'system',
        authorName: 'The My Accountant Team',
        date: new Date(),
        text: noteText,
        type: 'note',
        isInternal: false,
        stage: targetStage
      };

      const updateData = {
        notes: [...notes, newNote],
        followUpStages: [...sentStages, targetStage],
        lastFollowUpAt: new Date()
      };

      if (newStatus) {
        updateData.status = newStatus;
      }

      await db.collection('orders').doc(orderId).update(updateData);
      console.log(`     ✓ Firestore updated (Note appended + Stage ${targetStage} recorded)`);

      // Dispatch notification email
      if (customerEmail && customerEmail.includes('@')) {
        try {
          const emailHtml = getNoteHtml({
            recipientName: customerName,
            orderNumber,
            orderId,
            noteText,
            actionUrl
          });

          const mailRes = await transporter.sendMail({
            from: '"My Accountant" <no_reply@myacc.co.za>',
            to: customerEmail,
            subject: targetStage === 10 ? `Update on your Order #${orderNumber} - Cancelled` : `New Note on Order #${orderNumber}`,
            html: emailHtml
          });

          console.log(`     ✓ Email dispatched to ${customerEmail} (ID: ${mailRes.messageId})`);
        } catch (mailErr) {
          console.error(`     ✗ Failed to send email to ${customerEmail}:`, mailErr.message);
        }
      }

      results.push({ orderNumber, customerName, stage: targetStage, newStatus: newStatus || 'Pending Payment' });
    } else {
      console.log(`  -> No action needed today (Age: ${ageDays.toFixed(2)}d)`);
    }
  }

  console.log('\n=== COMPLETED CHECK ===');
  console.log(`Processed: ${snap.size} orders | Actions taken: ${results.length}`);
}

processPendingOrders().catch(console.error);

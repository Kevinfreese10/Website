import { getAdminDb } from '../src/lib/firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';
import { sendEmail } from '../src/lib/email';
import React from 'react';
import { render } from '@react-email/render';
import { OrderConfirmationEmail } from '../src/components/emails/OrderConfirmationEmail';

// Load env
dotenv.config({ path: path.resolve('c:/myacc/.env') });

async function resendOrderEmail() {
    const db = getAdminDb();
    console.log("Fetching order 10119...");
    
    // Check main 'orders' collection (some systems use string IDs, others use integers)
    let orderSnap = await db.collection('orders').doc('10119').get();
    
    if (!orderSnap.exists) {
      // Try querying by number if doc ID is not the order ID
      const querySnap = await db.collection('orders').where('id', '==', 10119).get();
      if (!querySnap.empty) {
        orderSnap = querySnap.docs[0];
      } else {
        const stringQuerySnap = await db.collection('orders').where('id', '==', '10119').get();
        if (!stringQuerySnap.empty) {
          orderSnap = stringQuerySnap.docs[0];
        }
      }
    }

    if (!orderSnap || !orderSnap.exists) {
        console.error("Order 10119 not found.");
        return;
    }

    const orderData = orderSnap.data() as any;
    orderData.id = orderData.id || orderSnap.id;
    console.log("Found order:", orderData.id, "for customer:", orderData.customerEmail);

    let resellerData: any = undefined;
    if (orderData.resellerId) {
        const userSnap = await db.collection('users').doc(orderData.resellerId).get();
        if (userSnap.exists) {
            resellerData = userSnap.data();
        } else {
             const aiClientSnap = await db.collection('aiAccountantClients').doc(orderData.resellerId).get();
             if (aiClientSnap.exists) {
                 resellerData = aiClientSnap.data();
             }
        }
    }

    const emailHtml = render(
        React.createElement(OrderConfirmationEmail as any, {
          order: orderData,
          reseller: resellerData,
          isNewUser: false,
          generatedPassword: null,
          showPaymentButton: true,
        })
    );
    
    const defaultBcc = ['kev@thinkestry.co.za', 'winifred@myacc.co.za'];
    
    const targetEmail = orderData.endCustomerEmail || orderData.customerEmail;
    
    const ccList: string[] = [];
    if (orderData.endCustomerEmail && orderData.customerEmail && orderData.endCustomerEmail !== orderData.customerEmail) {
        ccList.push(orderData.customerEmail);
    }
    
    try {
        await sendEmail({
            to: targetEmail,
            cc: ccList.length > 0 ? ccList : undefined,
            bcc: defaultBcc,
            subject: `Order Confirmation #${orderData.id}`,
            html: emailHtml,
            resellerId: orderData.resellerId || undefined,
        });
        console.log("✅ Order confirmation email sent successfully to:", targetEmail);
    } catch (e: any) {
        console.error("❌ Failed to send order confirmation email:", e.message);
    }
}

resendOrderEmail();

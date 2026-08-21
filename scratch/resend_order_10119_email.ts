import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });
import { getAdminDb } from '../src/lib/firebase-admin.ts';
import { sendOrderConfirmationEmailAction } from '../src/app/actions/notifications.ts';

async function main() {
  const adminDb = getAdminDb();
  console.log('--- Resending Order Confirmation Email for Order #10119 ---');
  
  const orderSnap = await adminDb.collection('orders').doc('10119').get();
  if (!orderSnap.exists) {
    console.error('Order #10119 not found');
    return;
  }

  const orderData = { ...orderSnap.data(), id: orderSnap.id } as any;
  console.log('Order Data:', {
    id: orderData.id,
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail,
    endCustomerName: orderData.endCustomerName,
    endCustomerEmail: orderData.endCustomerEmail,
    resellerId: orderData.resellerId
  });

  let resellerData: any;
  if (orderData.resellerId) {
    const resellerSnap = await adminDb.collection('users').doc(orderData.resellerId).get();
    if (resellerSnap.exists) {
      resellerData = resellerSnap.data();
    }
  }

  console.log('Triggering sendOrderConfirmationEmailAction...');
  await sendOrderConfirmationEmailAction({
    orderData,
    resellerData,
    showPaymentButton: true,
  });

  console.log('✅ Successfully sent Order Confirmation email to end customer:', orderData.endCustomerEmail || orderData.customerEmail);
}

main().catch(console.error);

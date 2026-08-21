import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { notifyOfNewNote, sendOrderConfirmationEmailAction } from '@/app/actions/notifications';
import { getAdminDb } from '@/lib/firebase-admin';

async function resendFailed() {
  console.log('--- 1. Resending Note on Order 10034 to tradingbuvhezi@gmail.com ---');
  await notifyOfNewNote({
    orderId: '10034',
    recipientEmail: 'tradingbuvhezi@gmail.com',
    recipientName: 'Bridget lindiwe Magagula',
    senderName: 'Rizma',
    notePreview: 'Good morning,\n\nI trust you are well.\n\nA kind reminder to please send us the updated allocations to proceed with the order.\n\nKind regards,\nRizma',
    actionUrl: 'https://myaccountant.co.za/dashboard/orders/10034',
    isToClient: true,
  });
  console.log('Delivered note to tradingbuvhezi@gmail.com!');

  console.log('\n--- 2. Resending Order Confirmation on Order #10128 ---');
  const db = getAdminDb();
  const orderDoc = await db.collection('orders').doc('10128').get();
  if (orderDoc.exists) {
    const orderData = orderDoc.data() as any;
    await sendOrderConfirmationEmailAction({
      orderId: '10128',
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      items: orderData.items || [],
      total: orderData.total || 0,
      resellerId: orderData.resellerId,
    });
    console.log('Delivered Order Confirmation for #10128 to freesekevin@gmail.com!');
  }
}

resendFailed().catch(console.error);

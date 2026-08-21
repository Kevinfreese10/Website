import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { sendOrderConfirmationEmailAction } from '@/app/actions/notifications';
import { getAdminDb } from '@/lib/firebase-admin';

async function resend10128Confirmation() {
  const db = getAdminDb();
  const orderDoc = await db.collection('orders').doc('10128').get();
  if (orderDoc.exists) {
    const orderData = orderDoc.data() as any;
    await sendOrderConfirmationEmailAction({
      orderData: {
        ...orderData,
        id: '10128',
      },
    });
    console.log('Delivered Order Confirmation for #10128 to freesekevin@gmail.com!');
  }
}

resend10128Confirmation().catch(console.error);

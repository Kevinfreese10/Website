import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { notifyOfNewNote } from '@/app/actions/notifications';

async function resend10127Note() {
  console.log('Resending note email for Order 10127 to Ntombifuthi Mjiyako (ntombi@khulafs.co.za)...');
  
  await notifyOfNewNote({
    orderId: '10127',
    recipientEmail: 'ntombi@khulafs.co.za',
    recipientName: 'Ntombifuthi Mjiyako',
    senderName: 'Kevin Freese',
    notePreview: 'Hi,\n\nPlease let us know when we can request a OTP?',
    actionUrl: 'https://myaccountant.co.za/dashboard/orders/10127',
    isToClient: true,
  });

  console.log('Resent note email successfully for Order #10127.');
}

resend10127Note().catch(console.error);

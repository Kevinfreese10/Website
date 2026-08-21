import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { notifyOfNewNote, notifyStaffOfClientNote } from '@/app/actions/notifications';

async function resendRecentNotes() {
  console.log('--- 1. Resending Note from Staff to Client (Order #9801) ---');
  await notifyOfNewNote({
    orderId: '9801',
    recipientEmail: 'freesekevin@gmail.com',
    recipientName: 'Kevin Freese',
    senderName: 'Kevin Freese (Admin)',
    notePreview: 'Dont forget about this!',
    actionUrl: 'https://myaccountant.co.za/dashboard/orders/9801',
    isToClient: true,
  });
  console.log('Delivered note to client!');

  console.log('\n--- 2. Resending Note from Client to Staff (Order #9801) ---');
  await notifyStaffOfClientNote({
    orderId: '9801',
    senderName: 'Kevin Freese (Client)',
    noteText: 'Dont forget about this!',
  });
  console.log('Delivered note to staff (kev@thinkestry.co.za)!');
}

resendRecentNotes().catch(console.error);

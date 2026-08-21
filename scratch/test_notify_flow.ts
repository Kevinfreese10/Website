import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { notifyStaffOfClientNote } from '@/app/actions/notifications';

async function main() {
  console.log('Testing notifyStaffOfClientNote for order 9801...');
  await notifyStaffOfClientNote({
    orderId: '9801',
    senderName: 'Kevin Freese (Test)',
    noteText: 'Hello! This is a test note notification to verify email delivery.',
  });
  console.log('Finished notifyStaffOfClientNote execution.');
}

main().catch(console.error);

import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { notifyOfNewNote, notifyStaffOfClientNote } from '../src/app/actions';

async function testNoteEmails() {
    console.log("Testing client note notification...");
    try {
        // Send email to client (Kevin Freese)
        await notifyOfNewNote({
            recipientEmail: "freesekevin@gmail.com",
            recipientName: "Kevin Freese",
            senderName: "Kevin Freese (Admin)",
            orderId: "10009",
            notePreview: "Hi Kevin, This is a reminder to please upload the required documents for your order #10009...",
            actionUrl: "https://www.myacc.co.za/dashboard/orders/10009",
            isToClient: true
        });
        console.log("notifyOfNewNote call completed successfully!");

        // Send email to staff/admin (kev@thinkestry.co.za / info@myacc.co.za)
        console.log("Testing staff notification...");
        await notifyStaffOfClientNote({
            orderId: "10009",
            senderName: "Kevin Freese (Client)",
            noteText: "Hello! I need help!"
        });
        console.log("notifyStaffOfClientNote call completed successfully!");
    } catch (err: any) {
        console.error("Note email test failed:", err);
    }
}

testNoteEmails();

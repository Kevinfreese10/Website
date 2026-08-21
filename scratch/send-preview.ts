import { sendEmail } from '../src/lib/email';
import * as dotenv from 'dotenv';
import path from 'path';
import { render } from '@react-email/components';
import React from 'react';
import NewTaskEmail from '../src/components/emails/NewTaskEmail';
import StaffAssignmentEmail from '../src/components/emails/StaffAssignmentEmail';

// Initialize env and firebase admin to test locally
dotenv.config({ path: path.resolve('c:/myacc/.env') });

async function testEmails() {
    console.log('Rendering and sending preview emails...');

    try {
        const taskEmailHtml = render(
            React.createElement(NewTaskEmail, {
                assigneeName: 'Kevin',
                taskTitle: 'Prepare Quarterly VAT Return for TechCorp',
                taskDescription: 'Please gather the latest bank statements from Xero and reconcile the VAT control accounts before submitting the VAT201 on eFiling.',
                dueDate: '15/09/2026',
                assignedBy: 'System Administrator',
                taskUrl: 'https://www.myacc.co.za/admin/dashboard'
            })
        );
        
        await sendEmail({
            to: 'kev@thinkestry.co.za',
            subject: 'Preview: New Task Assigned: Prepare Quarterly VAT Return for TechCorp',
            html: taskEmailHtml,
            fromNameOverride: 'My Accountant (Preview)'
        });
        
        console.log('✅ Task email sent!');
        
        const mockOrder = {
            id: 'ord_preview_123',
            originalOrderId: 'ORD-12345',
            customerName: 'Acme Logistics Pty Ltd',
            serviceName: 'Annual Financial Statements',
            dueDate: { toDate: () => new Date('2026-10-31') },
            status: 'To-Do'
        };

        const orderEmailHtml = render(
            React.createElement(StaffAssignmentEmail, {
                order: mockOrder as any,
                staffName: 'Kevin'
            })
        );
        
        await sendEmail({
            to: 'kev@thinkestry.co.za',
            subject: `Preview: New Order Assigned: #ORD-12345`,
            html: orderEmailHtml,
            fromNameOverride: 'My Accountant (Preview)'
        });
        
        console.log('✅ Order email sent!');

    } catch (e: any) {
        console.error('❌ sendEmail failed:');
        console.error(e.message);
    }
}

testEmails();

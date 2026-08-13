import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { render } from '@react-email/components';
import React from 'react';
import SLABreachEmail from '@/components/emails/SLABreachEmail';
import TaxDeadlineEmail from '@/components/emails/TaxDeadlineEmail';
import AbandonedCartEmail from '@/components/emails/AbandonedCartEmail';
import DailyDigestEmail from '@/components/emails/DailyDigestEmail';
import QuarterlyCheckInEmail from '@/components/emails/QuarterlyCheckInEmail';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    
    // In production, require a secure bearer token (e.g. set in Google Cloud Scheduler)
    if (process.env.NODE_ENV === 'production') {
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const db = getAdminDb();
        const now = new Date();
        const results = {
            processed: true,
            slaBreaches: 0,
            deadlines: 0,
            abandonedCarts: 0,
            digestsSent: 0,
            quarterlyCheckIns: 0
        };

        // 1. SLA Breach Check
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const ordersRef = db.collection('orders');
        const slaSnapshot = await ordersRef
            .where('status', 'in', ['In Progress', 'Waiting for Client'])
            .get();
        
        for (const doc of slaSnapshot.docs) {
            const order = doc.data();
            const orderDate = order.date ? new Date(order.date.seconds * 1000) : null;
            if (orderDate && orderDate < sevenDaysAgo && order.assignedTo && order.assignedTo.length > 0) {
                // Email assigned staff
                const assigneeSnap = await db.collection('users').doc(order.assignedTo[0]).get();
                const assignee = assigneeSnap.data();
                if (assignee?.email) {
                    const html = render(React.createElement(SLABreachEmail, {
                        staffName: assignee.name,
                        orderId: order.originalOrderId || doc.id,
                        daysInactive: Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24))
                    }));
                    await sendEmail({ to: assignee.email, subject: `SLA Breach: Order ${order.originalOrderId || doc.id}`, html });
                    results.slaBreaches++;
                }
            }
        }

        // 2. Tax Deadline Check (Placeholder logic for upcoming deadlines)
        // Assume provisional tax end of Feb (month 1)
        if (now.getMonth() === 1 && now.getDate() === 1) {
            const clientsSnap = await db.collection('clients').where('submitsProvisionalTax', '==', true).get();
            for (const doc of clientsSnap.docs) {
                const client = doc.data();
                if (client.email) {
                    const html = render(React.createElement(TaxDeadlineEmail, {
                        clientName: client.name,
                        deadlineName: 'Provisional Tax',
                        dueDate: '28 February'
                    }));
                    await sendEmail({ to: client.email, subject: 'Upcoming Tax Deadline', html });
                    results.deadlines++;
                }
            }
        }

        // 3. Daily Digest (Staff)
        const staffSnap = await db.collection('users').where('role', '==', 'admin').get(); // simplistic role check
        for (const doc of staffSnap.docs) {
            const staff = doc.data();
            if (staff.email) {
                const pendingTasks = await db.collection('tasks').where('assignedTo', 'array-contains', doc.id).where('status', '==', 'To-Do').get();
                const html = render(React.createElement(DailyDigestEmail, {
                    staffName: staff.name,
                    pendingCount: pendingTasks.size,
                    overdueCount: 0 // Simplification for now
                }));
                await sendEmail({ to: staff.email, subject: 'Your Daily Task Digest', html });
                results.digestsSent++;
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Daily cron error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

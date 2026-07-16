'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { render } from '@react-email/components';
import React from 'react';
import StaffAssignmentEmail from '@/components/emails/StaffAssignmentEmail';
import DocumentRequestEmail from '@/components/emails/DocumentRequestEmail';
import ReviewRequestEmail from '@/components/emails/ReviewRequestEmail';
import OrderStatusUpdateEmail from '@/components/emails/OrderStatusUpdateEmail';
import { services as allServices } from '@/lib/data';

async function fetchOrderData(adminDb: any, orderId: string) {
    const orderSnap = await adminDb.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) throw new Error('Order not found');
    const orderData = orderSnap.data();
    return { id: orderId, ...orderData } as any;
}

async function fetchStaffData(adminDb: any, staffId: string) {
    const staffSnap = await adminDb.collection('users').doc(staffId).get();
    if (!staffSnap.exists) return undefined;
    const staffData = staffSnap.data();
    return { id: staffId, ...staffData } as any;
}

export async function notifyStaffOfAssignment(orderId: string, staffId: string) {
    try {
        const adminDb = getAdminDb();
        const orderToAssign = await fetchOrderData(adminDb, orderId);
        const staffData = await fetchStaffData(adminDb, staffId);
        
        if (!staffData?.email) {
            console.log(`Staff ${staffId} has no email, skipping assignment notification.`);
            return { success: true };
        }

        const staffName = staffData.name ? staffData.name.split(' ')[0] : 'Staff';
        
        const emailHtml = render(React.createElement(StaffAssignmentEmail, { order: orderToAssign, staffName }));
        
        await sendEmail({
            to: staffData.email,
            subject: `New Order Assigned: #${orderToAssign.originalOrderId || orderToAssign.id}`,
            html: emailHtml,
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to send assignment notification:', error);
        return { success: false, error: 'Failed to send notification' };
    }
}

export async function sendDocumentRequestEmailAction(orderId: string, replyToEmail: string, orderStatus: string) {
    try {
        const adminDb = getAdminDb();
        const orderData = await fetchOrderData(adminDb, orderId);
        
        const reseller = orderData.resellerId ? await fetchStaffData(adminDb, orderData.resellerId) : undefined;
        const isOutsourced = !!orderData.resellerId;
        const emailTo = isOutsourced && orderData.documentContact === 'client' ? orderData.endCustomerEmail : orderData.customerEmail;
        const customerName = (isOutsourced && orderData.documentContact === 'client' ? orderData.endCustomerName : orderData.customerName) || '';
        
        if (!emailTo) return { success: false, error: 'No client email found' };
        
        const emailOrder = { ...orderData, status: orderStatus, customerName, id: orderData.originalOrderId || orderData.id };
        const subject = `Action Required for Your Order #${emailOrder.id}`;
        
        const itemsWithServices = (orderData.items || []).map((item: any) => {
            const service = allServices.find(s => s.id === item.id);
            return { ...item, service };
        }).filter((item: any) => item.service);

        const emailHtml = render(React.createElement(DocumentRequestEmail, { order: emailOrder, items: itemsWithServices, reseller, replyTo: replyToEmail }));
        
        await sendEmail({
            to: emailTo,
            cc: ['winifred@myacc.co.za', 'kev@thinkestry.co.za'],
            subject: subject,
            html: emailHtml,
            resellerId: orderData.resellerId,
        });
        
        return { success: true, subject, emailTo };
    } catch (error) {
        console.error('Failed to send document request email:', error);
        return { success: false, error: 'Failed to send document request' };
    }
}

export async function sendReviewRequestEmailAction(orderId: string) {
    try {
        const adminDb = getAdminDb();
        const orderData = await fetchOrderData(adminDb, orderId);
        const reseller = orderData.resellerId ? await fetchStaffData(adminDb, orderData.resellerId) : undefined;
        const isOutsourced = !!orderData.resellerId;
        const emailTo = isOutsourced && orderData.documentContact === 'client' ? orderData.endCustomerEmail : orderData.customerEmail;
        const customerName = (isOutsourced && orderData.documentContact === 'client' ? orderData.endCustomerName : orderData.customerName) || '';
        
        if (!emailTo) return { success: false, error: 'No client email found' };
        
        const emailOrder = { ...orderData, status: 'Completed', customerName, id: orderData.originalOrderId || orderData.id };
        const emailHtml = render(React.createElement(ReviewRequestEmail, { order: emailOrder, reseller }));
        
        await sendEmail({
            to: emailTo,
            subject: `We'd love your feedback on order #${emailOrder.id}`,
            html: emailHtml,
            resellerId: orderData.resellerId
        });
        
        return { success: true };
    } catch (error) {
        console.error('Failed to send review request email:', error);
        return { success: false, error: 'Failed to send review request' };
    }
}

export async function sendOrderStatusUpdateEmailAction(orderId: string, newStatus: string) {
    try {
        const adminDb = getAdminDb();
        const orderData = await fetchOrderData(adminDb, orderId);
        const reseller = orderData.resellerId ? await fetchStaffData(adminDb, orderData.resellerId) : undefined;
        const isOutsourced = !!orderData.resellerId;
        const emailTo = isOutsourced && orderData.documentContact === 'client' ? orderData.endCustomerEmail : orderData.customerEmail;
        const customerName = (isOutsourced && orderData.documentContact === 'client' ? orderData.endCustomerName : orderData.customerName) || '';
        
        if (!emailTo) return { success: false, error: 'No client email found' };
        
        const emailOrder = { ...orderData, status: newStatus, customerName, id: orderData.originalOrderId || orderData.id };
        const emailHtml = render(React.createElement(OrderStatusUpdateEmail, { order: emailOrder, reseller }));
        
        await sendEmail({
            to: emailTo,
            subject: `Update on your Order #${emailOrder.id}`,
            html: emailHtml,
            resellerId: orderData.resellerId
        });
        
        return { success: true };
    } catch (error) {
        console.error('Failed to send status update email:', error);
        return { success: false, error: 'Failed to send status update' };
    }
}

'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Order, User, DocumentUpload, Invoice, ClientCustomer } from '@/lib/types';
import { sendEmail } from '@/lib/email';
import { render } from '@react-email/components';
import React from 'react';
import { ClientDocumentUploadEmail } from '@/components/emails/ClientDocumentUploadEmail';
import { DocumentReviewEmail } from '@/components/emails/DocumentReviewEmail';
import { NewNoteNotificationEmail } from '@/components/emails/NewNoteNotificationEmail';
import { OutstandingDocumentsEmail } from '@/components/emails/OutstandingDocumentsEmail';
import { OrderConfirmationEmail } from '@/components/emails/OrderConfirmationEmail';
import NewTaskEmail from '@/components/emails/NewTaskEmail';
import { DocumentRequestEmail } from '@/components/emails/DocumentRequestEmail';
import { services as allServices } from '@/lib/data';
import { InvoicePdfDocument } from '@/server/pdf/InvoicePdfDocument';
import { renderToBuffer } from '@react-pdf/renderer';

export async function notifyStaffOfDocumentUpload({ orderId, clientName, assignedStaffName, assignedStaffEmail }: { orderId: string, clientName: string, assignedStaffName: string, assignedStaffEmail: string }) {
    const emailHtml = render(
        React.createElement(ClientDocumentUploadEmail, {
            assigneeName: assignedStaffName,
            clientName: clientName,
            orderId: orderId,
            orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${orderId}`,
        })
    );

    await sendEmail({
        to: assignedStaffEmail,
        subject: `Documents Uploaded for Order #${orderId}`,
        html: emailHtml,
    });
}

export async function sendDocumentReviewFeedback({ orderId, clientName, clientEmail, documentUploads, resellerId }: { orderId: string, clientName: string, clientEmail: string, documentUploads: DocumentUpload[], resellerId?: string }) {
    let resellerName = 'My Accountant';
    let primaryColor = '#1e3a8a';
    const adminDb = getAdminDb();
    if (resellerId) {
        const resellerSnap = await adminDb.collection('users').doc(resellerId).get();
        if (resellerSnap.exists) {
            const resellerData = resellerSnap.data() as User;
            resellerName = resellerData.companyName || resellerData.name || 'My Accountant';
            primaryColor = resellerData.landingPage?.primaryColor || '#1e3a8a';
        }
    }

    const emailHtml = render(
        React.createElement(DocumentReviewEmail, {
            clientName,
            orderId,
            documentUploads,
            orderUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za'}/dashboard/orders/${orderId}`,
            resellerName,
            primaryColor,
        })
    );

    await sendEmail({
        to: clientEmail,
        subject: `Feedback on Your Submitted Documents for Order #${orderId}`,
        html: emailHtml,
        resellerId: resellerId,
    });
}

export async function notifyOfNewNote({ 
    recipientEmail, 
    recipientName, 
    senderName, 
    orderId, 
    notePreview, 
    actionUrl, 
    isToClient,
    resellerId 
    }: { 
    recipientEmail: string, 
    recipientName: string, 
    senderName: string, 
    orderId: string, 
    notePreview: string, 
    actionUrl: string, 
    isToClient: boolean,
    resellerId?: string 
    }) {
    try {
        const safeRecipientName = recipientName || 'Client';
        const safeSenderName = senderName || 'Admin';
        let resellerName = 'My Accountant';
        const adminDb = getAdminDb();
        if (resellerId && isToClient) {
            const resellerSnap = await adminDb.collection('users').doc(resellerId).get();
            if (resellerSnap.exists) {
                const resellerData = resellerSnap.data() as User;
                resellerName = resellerData.companyName || resellerData.name;
            }
        }

        const emailHtml = await render(
            React.createElement(NewNoteNotificationEmail, {
                recipientName: safeRecipientName,
                senderName: safeSenderName,
                orderId,
                notePreview,
                actionUrl,
                isToClient,
                resellerName: isToClient ? `The ${resellerName} Team` : undefined
            })
        );

        await sendEmail({
            to: recipientEmail,
            subject: `New Note on Order #${orderId}`,
            html: emailHtml,
            resellerId: resellerId,
        });
    } catch (err) {
        console.error('[notifyOfNewNote] Failed to send note notification email:', err);
    }
}

export async function notifyStaffOfClientNote({
    orderId,
    senderName,
    noteText,
}: {
    orderId: string,
    senderName: string,
    noteText: string,
}) {
    try {
        const adminDb = getAdminDb();
        const orderDoc = await adminDb.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            console.error(`[notifyStaffOfClientNote] Order not found: ${orderId}`);
            return;
        }
        const order = orderDoc.data() as Order;

        let recipientEmail = 'info@myacc.co.za';
        let recipientName = 'Support Team';

        if (order.assignedTo && order.assignedTo.length > 0) {
            const assigneeId = order.assignedTo[0];
            const staffSnap = await adminDb.collection('users').doc(assigneeId).get();
            if (staffSnap.exists) {
                const assignedStaffMember = staffSnap.data() as User;
                if (assignedStaffMember && assignedStaffMember.email) {
                    recipientEmail = assignedStaffMember.email;
                    recipientName = assignedStaffMember.name || 'Staff Member';
                }
            }
        }

        const emailHtml = await render(
            React.createElement(NewNoteNotificationEmail, {
                recipientName,
                senderName: senderName || 'Client',
                orderId: order.originalOrderId || orderId,
                notePreview: noteText.substring(0, 150) + (noteText.length > 150 ? '...' : ''),
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${orderId}`,
                isToClient: false
            })
        );

        await sendEmail({
            to: recipientEmail,
            subject: `New Note on Order #${order.originalOrderId || orderId}`,
            html: emailHtml,
        });
    } catch (err) {
        console.error('[notifyStaffOfClientNote] Failed to send email notification:', err);
    }
}

export async function notifyAllocatedUserOfInternalNote({
    orderId,
    senderName,
    senderEmail,
    noteText,
}: {
    orderId: string;
    senderName: string;
    senderEmail?: string;
    noteText: string;
}) {
    // Internal notes are visible live in the dashboard/Communication History without email spam
    return;
}

export async function sendOutstandingDocumentsReminder({ orderId, clientName, clientEmail, resellerId }: { orderId: string, clientName: string, clientEmail: string, resellerId?: string }) {
    let resellerName = 'My Accountant';
    let primaryColor = '#1e3a8a';
    const adminDb = getAdminDb();
    if (resellerId) {
        const resellerSnap = await adminDb.collection('users').doc(resellerId).get();
        if (resellerSnap.exists) {
            const resellerData = resellerSnap.data() as User;
            resellerName = resellerData.companyName || resellerData.name || 'My Accountant';
            primaryColor = resellerData.landingPage?.primaryColor || '#1e3a8a';
        }
    }

    const emailHtml = render(
        React.createElement(OutstandingDocumentsEmail, {
            clientName,
            orderId,
            orderUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za'}/dashboard/orders/${orderId}`,
            resellerName,
            primaryColor,
        })
    );

    await sendEmail({
        to: clientEmail,
        subject: `Action Required: Outstanding Documents for Order #${orderId}`,
        html: emailHtml,
        resellerId: resellerId,
    });
}

export async function sendOrderConfirmationEmailAction({
  orderData,
  resellerData,
  isNewUser,
  generatedPassword,
  showPaymentButton,
  bcc,
}: {
  orderData: Order;
  resellerData?: User;
  isNewUser?: boolean;
  generatedPassword?: string | null;
  showPaymentButton?: boolean;
  bcc?: string | string[];
}) {
  const emailHtml = render(
    React.createElement(OrderConfirmationEmail, {
      order: orderData,
      reseller: resellerData,
      isNewUser,
      generatedPassword,
      showPaymentButton,
    })
  );

  const finalBcc = bcc
    ? (Array.isArray(bcc) ? [...bcc] : [bcc])
    : undefined;

  // Primary recipient: endCustomerEmail (actual client) if present, fallback to customerEmail
  const targetEmail = (orderData as any).endCustomerEmail || orderData.customerEmail;

  // If order was created on behalf of a client and reseller email differs from client email, CC the reseller
  const ccList: string[] = [];
  if ((orderData as any).endCustomerEmail && orderData.customerEmail && (orderData as any).endCustomerEmail !== orderData.customerEmail) {
    ccList.push(orderData.customerEmail);
  }

  await sendEmail({
    to: targetEmail,
    cc: ccList.length > 0 ? ccList : undefined,
    bcc: finalBcc,
    subject: `Order Confirmation #${orderData.id}`,
    html: emailHtml,
    resellerId: orderData.resellerId || undefined,
  });
}

export async function sendDocumentRequestEmailAction({
  orderId,
  recipientEmail,
}: {
  orderId: string;
  recipientEmail?: string;
}) {
  const adminDb = getAdminDb();
  const orderRef = adminDb.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  
  if (!orderSnap.exists) {
    throw new Error('Order not found');
  }
  
  const orderData = { ...orderSnap.data(), id: orderSnap.id } as Order;
  
  // Resolve target recipient dynamically
  let targetEmail = recipientEmail;
  const ccEmails: string[] = [];

  if (!targetEmail) {
    if (orderData.documentContact === 'client' && (orderData as any).endCustomerEmail) {
      targetEmail = (orderData as any).endCustomerEmail;
      if (orderData.customerEmail && orderData.customerEmail !== targetEmail) {
        ccEmails.push(orderData.customerEmail);
      }
    } else if (orderData.documentContact === 'partner') {
      targetEmail = orderData.customerEmail;
      if ((orderData as any).endCustomerEmail && (orderData as any).endCustomerEmail !== targetEmail) {
        ccEmails.push((orderData as any).endCustomerEmail);
      }
    } else {
      targetEmail = (orderData as any).endCustomerEmail || orderData.customerEmail;
    }
  }

  let resellerData: User | undefined;
  if (orderData.resellerId) {
    const resellerSnap = await adminDb.collection('users').doc(orderData.resellerId).get();
    if (resellerSnap.exists) {
      resellerData = { ...resellerSnap.data(), id: resellerSnap.id } as User;
    }
  }

  const itemsWithServices = orderData.items.map(item => {
    const service = allServices.find(s => s.id === item.id);
    return { ...item, service };
  }).filter(item => item.service) as any[];

  const emailHtml = render(
    React.createElement(DocumentRequestEmail, {
      order: orderData,
      items: itemsWithServices,
      reseller: resellerData,
      replyTo: resellerData?.email || "info@myacc.co.za",
    })
  );

  const attachments = itemsWithServices
    .filter(item => item.service.attachmentUrl)
    .map(item => ({
      filename: `${item.service.title.replace(/\s/g, '_')}.pdf`,
      path: item.service.attachmentUrl!,
    }));

  await sendEmail({
    to: targetEmail!,
    cc: ccEmails.length > 0 ? ccEmails : undefined,
    subject: `Action Required for Your Order #${orderData.originalOrderId || orderId}`,
    html: emailHtml,
    attachments: attachments,
    resellerId: orderData.resellerId || undefined,
  });

  const emailNote = {
    text: `Sent "Request Documents" email to ${recipientEmail} (Payment Successful).`,
    date: new Date(),
    authorId: 'system',
    type: 'email',
    subject: `Action Required for Your Order #${orderId}`,
    attachments: null,
  };

  await orderRef.update({
    notes: FieldValue.arrayUnion(emailNote)
  });
}

export async function sendInvoiceEmailAction({
    invoice,
    client,
    customer,
    recipientEmail
}: {
    invoice: Invoice;
    client: User;
    customer: ClientCustomer;
    recipientEmail: string;
}) {
    try {
        const element = React.createElement(InvoicePdfDocument, { invoice, client, customer });
        const buffer = await renderToBuffer(element as any);
        
        const formatPrice = (price: number) => new Intl.NumberFormat('en-GB', { style: 'decimal', minimumFractionDigits: 2 }).format(price);
        const emailHtml = `
            <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                <p>Dear ${customer.name},</p>
                <p>Please find attached your invoice <strong>${invoice.id}</strong> from ${client.companyName || client.name}.</p>
                <p>The total amount due is <strong>R${formatPrice(invoice.total)}</strong>, due on <strong>${new Date(invoice.dueDate).toLocaleDateString('en-GB')}</strong>.</p>
                <p>Thank you for your business!</p>
                <br/>
                <p>Best regards,<br/>${client.companyName || client.name}</p>
            </div>
        `;

        await sendEmail({
            to: recipientEmail,
            subject: `Invoice ${invoice.id} from ${client.companyName || client.name}`,
            html: emailHtml,
            attachments: [
                {
                    filename: `Invoice-${invoice.id}.pdf`,
                    content: buffer,
                }
            ],
        });
        
        return { success: true };
    } catch (error: any) {
        console.error('[sendInvoiceEmailAction] Error:', error);
        return { success: false, error: String(error) };
    }
}

export async function notifyStaffOfTaskAssignment({ 
    taskId, 
    taskTitle, 
    taskDescription, 
    dueDate, 
    assigneeId, 
    assignedBy, 
    taskUrl 
}: { 
    taskId: string, 
    taskTitle: string, 
    taskDescription?: string, 
    dueDate?: string, 
    assigneeId: string, 
    assignedBy: string, 
    taskUrl: string 
}) {
    try {
        const adminDb = getAdminDb();
        const staffSnap = await adminDb.collection('users').doc(assigneeId).get();
        if (!staffSnap.exists) return { success: false, error: 'Assignee not found' };
        
        const staffData = staffSnap.data();
        if (!staffData?.email) return { success: false, error: 'Assignee has no email' };
        
        const emailHtml = render(
            React.createElement(NewTaskEmail, {
                assigneeName: staffData.name || 'Staff Member',
                taskTitle,
                taskDescription: taskDescription || 'No description provided.',
                dueDate: dueDate || 'No due date',
                assignedBy,
                taskUrl
            })
        );
        
        await sendEmail({
            to: staffData.email,
            subject: `New Task Assigned: ${taskTitle}`,
            html: emailHtml,
        });
        
        return { success: true };
    } catch (error) {
        console.error('[notifyStaffOfTaskAssignment] Error:', error);
        return { success: false, error: String(error) };
    }
}

'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { MasterTask, MasterTaskStatus, MasterTaskCategory, MasterTaskPriority, Order } from '@/lib/types';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { sendEmail } from '@/lib/email';
import { FieldValue } from 'firebase-admin/firestore';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY,
});

/**
 * Automated Spam / Newsletter / Marketing Detection
 */
export async function isAutomatedSpamOrMarketing(senderEmail?: string, senderName?: string, subject?: string, bodyText?: string): Promise<boolean> {
  const email = (senderEmail || '').toLowerCase();
  const name = (senderName || '').toLowerCase();
  const subj = (subject || '').toLowerCase();
  const body = (bodyText || '').toLowerCase();

  // Whitelisted legitimate South African statutory & banking bodies
  if (
    email.includes('sars.gov.za') ||
    email.includes('cipc.co.za') ||
    email.includes('ncr.org.za') ||
    email.includes('labour.gov.za') ||
    email.includes('fnb.co.za') ||
    email.includes('absa.co.za') ||
    email.includes('nedbank.co.za') ||
    email.includes('standardbank.co.za') ||
    email.includes('payfast.co.za') ||
    email.includes('myacc.co.za')
  ) {
    return false;
  }

  // 1. Known marketing / promotional senders
  if (
    email.includes('email.openai.com') ||
    email.includes('openai.com') ||
    email.includes('linkedin.com') ||
    email.includes('facebookmail.com') ||
    email.includes('twitter.com') ||
    email.includes('x.com') ||
    email.includes('canva.com') ||
    email.includes('grammarly.com') ||
    email.includes('takealot.com') ||
    email.includes('uber.com') ||
    email.includes('bolt.eu') ||
    email.includes('mailchimp.com') ||
    email.includes('sendgrid.net') ||
    email.includes('klaviyo.com') ||
    email.includes('newsletters@') ||
    email.includes('marketing@') ||
    email.includes('promo@') ||
    email.includes('offers@')
  ) {
    return true;
  }

  // 2. Keyword triggers for marketing / spam
  if (
    subj.includes('check your route before you go') ||
    subj.includes('unclaimed prize') ||
    subj.includes('lottery winner') ||
    subj.includes('crypto profit') ||
    subj.includes('viagra') ||
    subj.includes('seo services') ||
    subj.includes('guest post proposal') ||
    subj.includes('backlink building') ||
    body.includes('unsubscribe from our marketing') ||
    body.includes('you are receiving this email because you subscribed')
  ) {
    return true;
  }

  return false;
}

/**
 * Fetch all master tasks from Firestore
 */
export async function fetchMasterTasksAction(): Promise<{ success: boolean; tasks: MasterTask[]; error?: string }> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('masterTasks').orderBy('date', 'desc').limit(200).get();
    const tasks: MasterTask[] = [];

    snapshot.forEach(doc => {
      tasks.push({
        id: doc.id,
        ...doc.data(),
      } as MasterTask);
    });

    return { success: true, tasks };
  } catch (error: any) {
    console.error('Error fetching master tasks:', error);
    return { success: false, tasks: [], error: error.message };
  }
}

/**
 * Update custom instructions on a Master Task
 */
export async function updateMasterTaskInstructionsAction(
  taskId: string,
  instructions: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    await db.collection('masterTasks').doc(taskId).update({
      customInstructions: instructions,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating task instructions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update task status
 */
export async function updateMasterTaskStatusAction(
  taskId: string,
  status: MasterTaskStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    await db.collection('masterTasks').doc(taskId).update({
      status,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating task status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark a task as Spam (or unmark spam)
 */
export async function markMasterTaskAsSpamAction(
  taskId: string,
  isSpam: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    await db.collection('masterTasks').doc(taskId).update({
      status: isSpam ? 'Spam' : 'Pending',
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error marking task as spam:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate an AI Draft Reply using Gemini 2.5 Flash with live pricing and order context
 */
export async function generateMasterTaskAiReplyAction(
  taskId: string,
  options?: {
    customPrompt?: string;
    tone?: 'executive' | 'formal' | 'supportive' | 'concise';
    includeSignature?: boolean;
  }
): Promise<{ success: boolean; draftReply?: string; error?: string }> {
  try {
    const db = getAdminDb();
    const taskSnap = await db.collection('masterTasks').doc(taskId).get();
    if (!taskSnap.exists) throw new Error('Task not found');

    const task = taskSnap.data() as MasterTask;

    // 1. Fetch live Services & Official Pricing Catalog from Firestore
    const servicesSnap = await db.collection('services').get();
    const servicesCatalog: string[] = [];
    servicesSnap.forEach(doc => {
      const s = doc.data();
      if (s.title && s.price !== undefined) {
        servicesCatalog.push(`• ${s.title}: R ${s.price.toLocaleString('en-ZA')} (${s.turnaroundTime || '1-3 working days'}) — ${s.description ? s.description.substring(0, 100) : ''}`);
      }
    });

    // 2. Fetch Linked Order Details from Firestore if present
    let linkedOrderContext = '';
    if (task.matchedOrderId) {
      const orderSnap = await db.collection('orders').doc(task.matchedOrderId).get();
      if (orderSnap.exists) {
        const ord = orderSnap.data() as any;
        linkedOrderContext = `
--- LINKED ACTIVE ORDER PARTICULARS (FROM DATABASE) ---
• Order ID: #${ord.orderNumber || ord.id || task.matchedOrderId}
• Status: ${ord.status} (Fulfillment Status: ${ord.fulfillmentStatus || 'In Progress'})
• Company / Trading Entity: ${ord.companyName || 'N/A'} (Reg: ${ord.regNumber || 'N/A'}, Tax Ref: ${ord.taxNumber || 'N/A'})
• Customer / Director: ${ord.customerName || ord.directorName || 'N/A'} (${ord.customerEmail || 'N/A'}, Tel: ${ord.customerPhone || 'N/A'})
• Ordered Services: ${Array.isArray(ord.items) ? ord.items.map((it: any) => `${it.title} (R ${it.price})`).join(', ') : (ord.serviceTitle || 'N/A')}
• Total Amount: R ${ord.totalAmount || ord.total || 'N/A'} (Paid: ${ord.paymentStatus || 'Paid'})
• Uploaded Documents: ${Array.isArray(ord.documentUploads) ? ord.documentUploads.map((u: any) => `${u.requirementLabel || u.title}: ${u.status}`).join('; ') : 'None'}
• Recent Communication History / Notes:
${Array.isArray(ord.notes) ? ord.notes.slice(-3).map((n: any) => `  - [${n.date ? (n.date._seconds ? new Date(n.date._seconds * 1000).toLocaleDateString() : n.date) : ''}] ${n.subject || 'Note'}: ${n.text ? n.text.substring(0, 120) : ''}`).join('\n') : '  - No prior notes'}
-------------------------------------------------------
`;
      }
    }

    const systemPrompt = `You are the executive AI Accountant and Practice Assistant for Kevin Freese, Chartered Business Accountant in Practice (SA) (CIBA #3561) at My Accountant (Pty) Ltd (https://myacc.co.za).
Your role is to draft high-calibre, legally sound, and polite business correspondence in response to client inquiries, supplier communications, statutory authorities (SARS, NCR, COIDA, CIPC), or quotation requests.

Key Practice Context:
• Practice: My Accountant (Pty) Ltd | Reg: 2020 / 548105 / 07
• Accounting Officer: Kevin Freese, CBAP (SA) CIBA #3561 • PR-0098553
• Website: https://myacc.co.za | Tel: 010 109 1625
• Official Practice Bank: First National Bank (FNB) / Standard Bank / PayFast Online Checkout.

LIVE OFFICIAL PRICING & SERVICES CATALOG (FROM DATABASE):
${servicesCatalog.slice(0, 50).join('\n')}

INSTRUCTIONS FOR PRICING & QUOTES:
1. Whenever a client asks for quotes, pricing, or fees, ALWAYS quote the exact official prices in South African Rand (ZAR / R) and turnaround times from the live catalog above.
2. For Foreign Company Subsidiaries / Registrations:
   - CIPC Company Registration (including MOI & Shares): R 990.00
   - Beneficial Ownership Declaration: R 550.00
   - SARS Income Tax Registration & Tax Clearance (PIN): Included / Free with registration
   - SARS VAT Registration (Compulsory/Voluntary): R 1,800.00 – R 2,400.00
   - Corporate Banking Assistance / Letter: R 1,500.00
   - Registered Office & Local Representative / Secretary: R 450.00/month or R 3,500.00/annum
3. For Monthly Accounting & Payroll Retainers:
   - Sole Proprietor / Micro: R 950.00/month
   - Non-VAT Trading Company (EMP201, Management Accounts, Annual Returns): R 1,850.00/month
   - VAT Trading Company (Bi-monthly VAT201, Monthly EMP201, Management Accounts, Annual Financial Statements): R 3,450.00 – R 4,850.00/month
4. If an active order is linked, reference their exact order number, company name, and current processing step.
5. Tone: ${options?.tone || 'executive'}.
6. Sign off as Kevin Freese / The My Accountant Team.`;

    const userContent = `
Task Category: ${task.category}
Subject: ${task.title}
From: ${task.senderName} <${task.senderEmail}>
Date: ${task.date}

${linkedOrderContext}

Incoming Message / Context:
"""
${task.bodyText}
"""

${task.customInstructions ? `Kevin's Specific Custom Instructions:\n"${task.customInstructions}"\n` : ''}
${options?.customPrompt ? `Additional Prompt Notes:\n"${options.customPrompt}"\n` : ''}

Draft a polished, comprehensive, and ready-to-send response with exact prices, turnaround times, and next steps.
`;

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: userContent,
    });

    const draftReply = result.text.trim();

    // Save draft reply to task
    await db.collection('masterTasks').doc(taskId).update({
      aiDraftReply: draftReply,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, draftReply };
  } catch (error: any) {
    console.error('Error generating AI reply:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send an approved reply via SMTP and/or post to Order Communication History
 */
export async function sendMasterTaskReplyAction(
  taskId: string,
  replyBody: string,
  options: {
    sendSmtp?: boolean;
    postToOrderNotes?: boolean;
    toEmail?: string;
    subject?: string;
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const db = getAdminDb();
    const taskSnap = await db.collection('masterTasks').doc(taskId).get();
    if (!taskSnap.exists) throw new Error('Task not found');

    const task = taskSnap.data() as MasterTask;
    const recipientEmail = options.toEmail || task.senderEmail;
    const replySubject = options.subject || (task.title.toLowerCase().startsWith('re:') ? task.title : `Re: ${task.title}`);

    // 1. Send via SMTP if requested
    if (options.sendSmtp && recipientEmail) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; font-size: 14px;">
          ${replyBody.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')}
          <br/><br/>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <div style="font-size: 12px; color: #64748b;">
            <strong>Kevin Freese</strong><br/>
            Chartered Business Accountant in Practice (SA) | CIBA #3561<br/>
            <strong>My Accountant (Pty) Ltd</strong> • <a href="https://myacc.co.za" style="color: #0F2137;">myacc.co.za</a><br/>
            Landline: 010 109 1625
          </div>
        </div>
      `;

      await sendEmail({
        to: recipientEmail,
        subject: replySubject,
        html: emailHtml,
      });
    }

    // 2. Post to linked Order Communication History if requested
    if (options.postToOrderNotes && task.matchedOrderId) {
      const orderRef = db.collection('orders').doc(task.matchedOrderId);
      const newNote = {
        text: replyBody,
        subject: replySubject,
        authorId: 'system',
        date: new Date(),
        type: 'email_reply',
        isInternal: false,
        attachments: [],
      };

      await orderRef.update({
        notes: FieldValue.arrayUnion(newNote),
        updatedAt: new Date().toISOString(),
      });
    }

    // 3. Update task status to Replied
    await db.collection('masterTasks').doc(taskId).update({
      status: 'Replied',
      isReplied: true,
      repliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true, message: 'Reply sent and recorded successfully.' };
  } catch (error: any) {
    console.error('Error sending task reply:', error);
    return { success: false, error: error.message };
  }
}

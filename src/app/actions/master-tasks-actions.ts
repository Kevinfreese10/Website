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
 * Generate an AI Draft Reply using Gemini 2.5 Flash
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

    const systemPrompt = `You are the executive AI Accountant and Practice Assistant for Kevin Freese, Chartered Business Accountant in Practice (SA) (CIBA #3561) at My Accountant (Pty) Ltd (https://myacc.co.za).
Your role is to draft high-calibre, legally sound, and polite business correspondence in response to client inquiries, supplier communications, statutory authorities (SARS, NCR, COIDA, CIPC), or quotation requests.

Key Practice Context:
• Practice: My Accountant (Pty) Ltd | Reg: 2020 / 548105 / 07
• Accounting Officer: Kevin Freese, CBAP (SA) CIBA #3561 • PR-0098553
• Website: https://myacc.co.za | Tel: 010 109 1625
• Core Services: Annual Financial Statements, Monthly Accounting & Payroll, Tax Returns & Debt Compromise, CIPC Company Registration & Beneficial Ownership, NCR Form 2 Credit Provider Registrations, COIDA Nature of Business Changes & Letters of Good Standing, B-BBEE Sworn Affidavits.

Instructions:
1. Address the sender professionally.
2. Directly resolve or advance their request.
3. If instructions are provided by Kevin, integrate them precisely.
4. Tone: ${options?.tone || 'executive'}.
5. Sign off as Kevin Freese / My Accountant Team.`;

    const userContent = `
Task Category: ${task.category}
Subject: ${task.title}
From: ${task.senderName} <${task.senderEmail}>
Date: ${task.date}

Incoming Message / Context:
"""
${task.bodyText}
"""

${task.customInstructions ? `Kevin's Specific Custom Instructions:\n"${task.customInstructions}"\n` : ''}
${options?.customPrompt ? `Additional Prompt Notes:\n"${options.customPrompt}"\n` : ''}

Draft a polished, ready-to-send response.
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

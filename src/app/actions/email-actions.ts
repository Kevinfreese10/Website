'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { FieldValue } from 'firebase-admin/firestore';
import { draftEmailReply } from '@/ai/flows/draft-email-reply';
import { extractEmailActions } from '@/ai/flows/extract-email-actions';
import type { Email } from '@/lib/types';
import { syncEmailsInternal } from '@/lib/email-sync';

// ─── 1. Sync Emails ──────────────────────────────────────────────────────────

export async function syncEmails(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    return await syncEmailsInternal();
  } catch (error: any) {
    console.error('[syncEmails] Error:', error);
    return { success: false, error: error.message || 'Failed to sync emails' };
  }
}

// ─── 2. Mark Email Read ───────────────────────────────────────────────────────

export async function markEmailRead(emailId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = getAdminDb();
    await adminDb.collection('emails').doc(emailId).update({ status: 'read' });
    return { success: true };
  } catch (error: any) {
    console.error('[markEmailRead] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 3. Mark Email Unread ─────────────────────────────────────────────────────

export async function markEmailUnread(emailId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = getAdminDb();
    await adminDb.collection('emails').doc(emailId).update({ status: 'unread' });
    return { success: true };
  } catch (error: any) {
    console.error('[markEmailUnread] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 4. Archive Email ─────────────────────────────────────────────────────────

export async function archiveEmail(emailId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = getAdminDb();
    await adminDb.collection('emails').doc(emailId).update({ status: 'archived' });
    return { success: true };
  } catch (error: any) {
    console.error('[archiveEmail] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 5. Star Email ────────────────────────────────────────────────────────────

export async function starEmail(
  emailId: string,
  isStarred: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = getAdminDb();
    await adminDb.collection('emails').doc(emailId).update({ isStarred });
    return { success: true };
  } catch (error: any) {
    console.error('[starEmail] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 6. Assign Email ──────────────────────────────────────────────────────────

export async function assignEmail(
  emailId: string,
  staffId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = getAdminDb();
    await adminDb.collection('emails').doc(emailId).update({ assignedTo: staffId });
    return { success: true };
  } catch (error: any) {
    console.error('[assignEmail] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 7. Add Email Note ────────────────────────────────────────────────────────

export async function addEmailNote(
  emailId: string,
  note: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = getAdminDb();
    await adminDb.collection('emails').doc(emailId).update({ notes: note });
    return { success: true };
  } catch (error: any) {
    console.error('[addEmailNote] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 8. Get AI Draft Reply ────────────────────────────────────────────────────

export async function getAiDraftReply(
  emailId: string,
  instructions?: string
): Promise<{ success: boolean; draft?: string; subject?: string; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const emailDoc = await adminDb.collection('emails').doc(emailId).get();

    if (!emailDoc.exists) {
      return { success: false, error: 'Email not found' };
    }

    const email = emailDoc.data() as Email;

    const result = await draftEmailReply({
      subject: email.subject,
      body: email.bodyText,
      senderName: email.from.name || email.from.email,
      category: email.aiCategory || 'other',
      instructions: instructions || undefined,
    });

    if (result.success && result.data) {
      return {
        success: true,
        draft: result.data.replyBody,
        subject: result.data.replySubject,
      };
    }

    return { success: false, error: result.error || 'AI draft generation failed' };
  } catch (error: any) {
    console.error('[getAiDraftReply] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 9. Get AI Action Items ──────────────────────────────────────────────────

export async function getAiActionItems(
  emailId: string
): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const emailDoc = await adminDb.collection('emails').doc(emailId).get();

    if (!emailDoc.exists) {
      return { success: false, error: 'Email not found' };
    }

    const email = emailDoc.data() as Email;

    const result = await extractEmailActions({
      subject: email.subject,
      body: email.bodyText,
      senderEmail: email.from.email,
      senderName: email.from.name || email.from.email,
    });

    if (result.success && result.data) {
      const formattedActions = result.data.actionItems.map(
        (item) => `[${item.type.replace('_', ' ').toUpperCase()}] (${item.priority.toUpperCase()}) ${item.description}${item.suggestedDueDate ? ` (Due: ${item.suggestedDueDate})` : ''}`
      );

      // Save to Firestore
      await adminDb.collection('emails').doc(emailId).update({
        aiActionItems: formattedActions,
      });

      return {
        success: true,
        data: formattedActions,
      };
    }

    return { success: false, error: result.error || 'AI action extraction failed' };
  } catch (error: any) {
    console.error('[getAiActionItems] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 10. Create Task From Email ──────────────────────────────────────────────

export async function createTaskFromEmail(
  emailId: string,
  title: string,
  description: string,
  priority: 'High' | 'Medium' | 'Low',
  assignedTo: string[]
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  try {
    const adminDb = getAdminDb();

    // Create the task
    const taskData = {
      title,
      description,
      assignedTo,
      createdBy: 'system',
      createdAt: FieldValue.serverTimestamp(),
      dueDate: null,
      priority,
      status: 'To-Do',
      type: 'Email Follow-up',
      clientSource: 'system',
    };

    const taskRef = await adminDb.collection('tasks').add(taskData);

    // Link the task to the email
    await adminDb.collection('emails').doc(emailId).update({
      linkedTaskId: taskRef.id,
    });

    return { success: true, taskId: taskRef.id };
  } catch (error: any) {
    console.error('[createTaskFromEmail] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 11. Send Email Reply ────────────────────────────────────────────────────

export async function sendEmailReply(
  emailId: string,
  replyBody: string,
  replySubject?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = getAdminDb();

    // Fetch original email
    const emailDoc = await adminDb.collection('emails').doc(emailId).get();
    if (!emailDoc.exists) {
      return { success: false, error: 'Email not found' };
    }

    const email = emailDoc.data() as Email;

    // Fetch custom SMTP settings if configured
    const connDoc = await adminDb.collection('emailSettings').doc('connection').get();
    const connData = connDoc.exists ? connDoc.data() : null;

    const smtpUser = connData?.smtpUser || process.env.SMTP_USER;
    const smtpPass = connData?.smtpPass || process.env.SMTP_PASS;
    const smtpHost = connData?.smtpHost || process.env.SMTP_HOST;
    const smtpPort = connData?.smtpPort || process.env.SMTP_PORT || '465';

    let smtpOverride = undefined;
    if (smtpUser && smtpPass && smtpHost) {
      smtpOverride = {
        host: smtpHost,
        port: String(smtpPort),
        user: smtpUser,
        pass: smtpPass,
      };
    }

    // Build reply HTML
    const replyHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        ${replyBody}
      </div>
      <br/>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
      <div style="font-size: 12px; color: #888;">
        <p><strong>On ${email.date?.toDate?.()?.toLocaleString?.() || 'original date'}, ${email.from.name || email.from.email} wrote:</strong></p>
        <blockquote style="border-left: 2px solid #ddd; padding-left: 12px; margin-left: 0; color: #666;">
          ${email.bodyHtml || email.bodyText?.replace(/\n/g, '<br/>') || ''}
        </blockquote>
      </div>
    `;

    const subject = replySubject || `Re: ${email.subject}`;

    // Send the email
    await sendEmail({
      to: email.from.email,
      subject,
      html: replyHtml,
      replyTo: smtpUser || process.env.SMTP_USER,
      smtpOverride,
    });

    // Update status
    await adminDb.collection('emails').doc(emailId).update({
      status: 'replied',
    });

    return { success: true };
  } catch (error: any) {
    console.error('[sendEmailReply] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 12. Bulk Update Emails ──────────────────────────────────────────────────

export async function bulkUpdateEmails(
  emailIds: string[],
  update: { status?: string; isStarred?: boolean; assignedTo?: string }
): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const batch = adminDb.batch();

    // Build the clean update object (only include defined fields)
    const cleanUpdate: Record<string, any> = {};
    if (update.status !== undefined) cleanUpdate.status = update.status;
    if (update.isStarred !== undefined) cleanUpdate.isStarred = update.isStarred;
    if (update.assignedTo !== undefined) cleanUpdate.assignedTo = update.assignedTo;

    if (Object.keys(cleanUpdate).length === 0) {
      return { success: false, error: 'No update fields provided' };
    }

    for (const emailId of emailIds) {
      const docRef = adminDb.collection('emails').doc(emailId);
      batch.update(docRef, cleanUpdate);
    }

    await batch.commit();

    return { success: true, updatedCount: emailIds.length };
  } catch (error: any) {
    console.error('[bulkUpdateEmails] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 13. Get Email Settings ──────────────────────────────────────────────────

export async function getEmailSettings(): Promise<{
  success: boolean;
  settings?: {
    imapHost: string;
    imapPort: string;
    imapUser: string;
    imapPass: string;
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPass: string;
  };
  error?: string;
}> {
  try {
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('emailSettings').doc('connection');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return {
        success: true,
        settings: {
          imapHost: '',
          imapPort: '993',
          imapUser: '',
          imapPass: '',
          smtpHost: '',
          smtpPort: '465',
          smtpUser: '',
          smtpPass: '',
        },
      };
    }

    const data = docSnap.data() || {};
    return {
      success: true,
      settings: {
        imapHost: data.imapHost || '',
        imapPort: data.imapPort ? String(data.imapPort) : '993',
        imapUser: data.imapUser || '',
        imapPass: data.imapPass ? '••••••••' : '',
        smtpHost: data.smtpHost || '',
        smtpPort: data.smtpPort ? String(data.smtpPort) : '465',
        smtpUser: data.smtpUser || '',
        smtpPass: data.smtpPass ? '••••••••' : '',
      },
    };
  } catch (error: any) {
    console.error('[getEmailSettings] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 14. Save Email Settings ─────────────────────────────────────────────────

export async function saveEmailSettings(settings: {
  imapHost: string;
  imapPort: string;
  imapUser: string;
  imapPass: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('emailSettings').doc('connection');
    const docSnap = await docRef.get();
    const existingData = docSnap.exists ? docSnap.data() || {} : {};

    const dataToSave: Record<string, any> = {
      imapHost: settings.imapHost,
      imapPort: Number(settings.imapPort) || 993,
      imapUser: settings.imapUser,
      smtpHost: settings.smtpHost,
      smtpPort: Number(settings.smtpPort) || 465,
      smtpUser: settings.smtpUser,
    };

    // Only update password if it changed from mask
    if (settings.imapPass && settings.imapPass !== '••••••••') {
      dataToSave.imapPass = settings.imapPass;
    } else if (existingData.imapPass) {
      dataToSave.imapPass = existingData.imapPass;
    }

    if (settings.smtpPass && settings.smtpPass !== '••••••••') {
      dataToSave.smtpPass = settings.smtpPass;
    } else if (existingData.smtpPass) {
      dataToSave.smtpPass = existingData.smtpPass;
    }

    await docRef.set(dataToSave, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('[saveEmailSettings] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 15. Get Emails List ──────────────────────────────────────────────────────

export async function getEmailsList(): Promise<{ success: boolean; emails?: Email[]; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('emails').orderBy('date', 'desc').get();
    const emails: Email[] = snap.docs.map(doc => {
      const data = doc.data();
      const dateVal = data.date?.toDate?.() || (data.date ? new Date(data.date) : new Date());
      const receivedAtVal = data.receivedAt?.toDate?.() || (data.receivedAt ? new Date(data.receivedAt) : new Date());
      
      return {
        id: doc.id,
        ...data,
        date: dateVal.toISOString(),
        receivedAt: receivedAtVal.toISOString(),
      };
    }) as any[];

    return { success: true, emails };
  } catch (error: any) {
    console.error('[getEmailsList] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 16. Forward Email ────────────────────────────────────────────────────────

export async function forwardEmail(
  emailId: string,
  toEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = getAdminDb();

    // Fetch original email
    const emailDoc = await adminDb.collection('emails').doc(emailId).get();
    if (!emailDoc.exists) {
      return { success: false, error: 'Email not found' };
    }

    const email = emailDoc.data() as Email;

    // Fetch custom SMTP settings if configured
    const connDoc = await adminDb.collection('emailSettings').doc('connection').get();
    const connData = connDoc.exists ? connDoc.data() : null;

    const smtpUser = connData?.smtpUser || process.env.SMTP_USER;
    const smtpPass = connData?.smtpPass || process.env.SMTP_PASS;
    const smtpHost = connData?.smtpHost || process.env.SMTP_HOST;
    const smtpPort = connData?.smtpPort || process.env.SMTP_PORT || '465';

    let smtpOverride = undefined;
    if (smtpUser && smtpPass && smtpHost) {
      smtpOverride = {
        host: smtpHost,
        port: String(smtpPort),
        user: smtpUser,
        pass: smtpPass,
      };
    }

    // Build forward HTML
    const forwardHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        <p>---------- Forwarded message ---------</p>
        <p>From: <b>${email.from.name || email.from.email}</b> &lt;${email.from.email}&gt;</p>
        <p>Date: ${email.date?.toDate?.()?.toLocaleString?.() || 'original date'}</p>
        <p>Subject: ${email.subject}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
        <div>
          ${email.bodyHtml || email.bodyText?.replace(/\n/g, '<br/>') || ''}
        </div>
      </div>
    `;

    // Send email
    await sendEmail({
      to: toEmail,
      subject: `Fwd: ${email.subject}`,
      html: forwardHtml,
      replyTo: smtpUser || process.env.SMTP_USER,
      smtpOverride,
    });

    return { success: true };
  } catch (error: any) {
    console.error('[forwardEmail] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── 17. Delete Email ────────────────────────────────────────────────────────

export async function deleteEmail(emailId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminDb = getAdminDb();
    await adminDb.collection('emails').doc(emailId).delete();
    return { success: true };
  } catch (error: any) {
    console.error('[deleteEmail] Error:', error);
    return { success: false, error: error.message };
  }
}

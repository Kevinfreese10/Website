import { getAdminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { draftEmailReply } from '@/ai/flows/draft-email-reply';
import { extractEmailActions } from '@/ai/flows/extract-email-actions';
import type { Email } from './types';

/**
 * Runs the automation engine on a newly synced email.
 * - Auto-archives spam/marketing emails.
 * - Auto-creates and links tasks for SARS or urgent emails.
 * - Pre-generates AI reply drafts so they load instantly in the UI.
 */
export async function runEmailAutomation(emailId: string): Promise<{ success: boolean; actionsTaken: string[]; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('emails').doc(emailId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, actionsTaken: [], error: 'Email not found' };
    }

    const email = docSnap.data() as Email;
    const actionsTaken: string[] = [];
    const updates: Record<string, any> = {};

    // 1. Auto-Archive Spam/Marketing
    if (email.aiCategory === 'spam_marketing') {
      updates.status = 'archived';
      actionsTaken.push('auto_archived_spam');
      
      // Perform update and return early since it's spam
      await docRef.update(updates);
      return { success: true, actionsTaken };
    }

    // 2. Automatic task creation disabled per user request (tasks are created manually via UI)

    // 3. Pre-generate AI Reply Draft
    if (!email.aiDraftReply) {
      try {
        console.log(`[Automation Engine] Pre-generating AI draft reply for email: ${emailId}`);
        const draftResult = await draftEmailReply({
          subject: email.subject,
          body: email.bodyText,
          senderName: email.from.name || email.from.email,
          category: email.aiCategory || 'other',
        });

        if (draftResult.success && draftResult.data) {
          updates.aiDraftReply = draftResult.data.replyBody;
          updates.aiDraftReplySubject = draftResult.data.replySubject;
          actionsTaken.push('auto_generated_reply_draft');
        }
      } catch (draftErr: any) {
        console.error(`[Automation Engine] Failed to pre-generate draft for email ${emailId}:`, draftErr.message);
      }
    }

    // Apply all updates to the email document
    if (Object.keys(updates).length > 0) {
      await docRef.update(updates);
    }

    return { success: true, actionsTaken };
  } catch (error: any) {
    console.error(`[Automation Engine] Error running automation for email ${emailId}:`, error);
    return { success: false, actionsTaken: [], error: error.message };
  }
}

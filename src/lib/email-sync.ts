import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as imapSimple from 'imap-simple';
import { simpleParser } from 'mailparser';
import { triageEmail } from '@/ai/flows/triage-email';
import { summarizeEmail } from '@/ai/flows/summarize-email';
import { extractEmailActions } from '@/ai/flows/extract-email-actions';
import type { EmailContact, EmailAttachment } from '@/lib/types';

export async function syncEmailsInternal(): Promise<{ success: boolean; count?: number; totalProcessed?: number; error?: string }> {
  try {
    const adminDb = getAdminDb();

    // 1. Get last sync date from Firestore
    const settingsDoc = await adminDb.collection('emailSettings').doc('lastSync').get();
    const lastSyncData = settingsDoc.exists ? settingsDoc.data() : null;
    let lastSyncDate: Date | null = lastSyncData?.syncedAt?.toDate?.() || null;

    // Check if the emails collection is empty (e.g. if cleared by developer)
    const emailsCountSnap = await adminDb.collection('emails').limit(1).get();
    if (emailsCountSnap.empty) {
      console.log('[Email Sync] emails collection is empty. Resetting lastSyncDate to null.');
      lastSyncDate = null;
    }

    // 2. Fetch connection details and connect to IMAP
    const connDoc = await adminDb.collection('emailSettings').doc('connection').get();
    const connData = connDoc.exists ? connDoc.data() : null;

    const imapUser = connData?.imapUser || process.env.IMAP_USER;
    const imapPass = connData?.imapPass || process.env.IMAP_PASS;
    const imapHost = connData?.imapHost || process.env.IMAP_HOST;
    const imapPort = Number(connData?.imapPort || process.env.IMAP_PORT || 993);

    if (!imapUser || !imapPass || !imapHost) {
      return { success: false, error: 'IMAP connection details are not configured. Please configure them in Settings.' };
    }

    const config = {
      imap: {
        user: imapUser,
        password: imapPass,
        host: imapHost,
        port: imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 30000,
        authTimeout: 30000,
      },
    };

    const connection = await imapSimple.connect(config);

    // 3. Open INBOX
    await connection.openBox('INBOX');
    
    // Fetch auto-archive rules
    const rulesDoc = await adminDb.collection('emailSettings').doc('rules').get();
    const autoArchiveSenders: string[] = rulesDoc.exists ? (rulesDoc.data()?.autoArchiveSenders || []) : [];

    // 4. Search for emails since last sync (or last week if first sync)
    const searchDate = lastSyncDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Format date to DD-Mon-YYYY for standard IMAP query compatibility
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDateStr = `${String(searchDate.getDate()).padStart(2, '0')}-${months[searchDate.getMonth()]}-${searchDate.getFullYear()}`;
    
    const searchCriteria = [['SINCE', formattedDateStr]];
    const fetchOptions = { bodies: [''], markSeen: false };
    const messages = await connection.search(searchCriteria, fetchOptions);

    console.log(`[Email Sync] Found ${messages.length} messages to process.`);

    let newEmailCount = 0;
    const aiTasks: { docRef: any; emailDoc: any; fromContact: any; messageId: string }[] = [];

    // 5. Process each message
    for (const item of messages) {
      try {
        const rawEmail = item.parts.find((p: any) => p.which === '');
        if (!rawEmail) continue;

        const parsed = await simpleParser(rawEmail.body);

        // 6. Extract fields & clean Message-ID
        const rawMessageId = parsed.messageId || `generated-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const messageId = rawMessageId.replace(/^<|>$/g, '').trim();

        // 7. Check for duplicates
        const existingSnap = await adminDb
          .collection('emails')
          .where('messageId', '==', messageId)
          .limit(1)
          .get();

        if (!existingSnap.empty) {
          continue; // Skip duplicate
        }

        // Thread stitching: Check In-Reply-To and References
        let threadId = `thread-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const inReplyTo = parsed.inReplyTo ? parsed.inReplyTo.replace(/^<|>$/g, '').trim() : '';
        
        const referencesRaw = parsed.references;
        const referencesList: string[] = [];
        if (referencesRaw) {
          if (Array.isArray(referencesRaw)) {
            referencesList.push(...referencesRaw.map(r => r.replace(/^<|>$/g, '').trim()));
          } else if (typeof referencesRaw === 'string') {
            referencesList.push(...referencesRaw.split(/\s+/).map(r => r.replace(/^<|>$/g, '').trim()));
          }
        }

        // Search for parent email by message ID matching In-Reply-To or references
        let parentEmailSnap: any = null;
        if (inReplyTo) {
          parentEmailSnap = await adminDb.collection('emails')
            .where('messageId', '==', inReplyTo)
            .limit(1)
            .get();
        }

        if ((!parentEmailSnap || parentEmailSnap.empty) && referencesList.length > 0) {
          for (const refId of referencesList) {
            const refSnap = await adminDb.collection('emails')
              .where('messageId', '==', refId)
              .limit(1)
              .get();
            if (!refSnap.empty) {
              parentEmailSnap = refSnap;
              break;
            }
          }
        }

        if (parentEmailSnap && !parentEmailSnap.empty) {
          const parentDoc = parentEmailSnap.docs[0];
          const parentData = parentDoc.data();
          if (parentData.threadId) {
            threadId = parentData.threadId;
          } else {
            // Stitch parent into the thread
            await parentDoc.ref.update({ threadId });
          }
        }

        // Parse contacts
        const fromContact: EmailContact = {
          name: parsed.from?.value?.[0]?.name || '',
          email: parsed.from?.value?.[0]?.address || '',
        };

        const toContacts: EmailContact[] = (parsed.to
          ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to])
          : []
        ).flatMap((addr: any) =>
          (addr.value || []).map((v: any) => ({
            name: v.name || '',
            email: v.address || '',
          }))
        );

        const ccContacts: EmailContact[] = (parsed.cc
          ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc])
          : []
        ).flatMap((addr: any) =>
          (addr.value || []).map((v: any) => ({
            name: v.name || '',
            email: v.address || '',
          }))
        );

        // Parse attachments (metadata only)
        const attachments: EmailAttachment[] = (parsed.attachments || []).map((att: any) => ({
          filename: att.filename || 'untitled',
          contentType: att.contentType || 'application/octet-stream',
          size: att.size || 0,
        }));

        // Truncate body strings to protect against Firestore 1MB document size limit
        let bodyHtml = parsed.html || null;
        if (bodyHtml && bodyHtml.length > 600000) {
          bodyHtml = bodyHtml.substring(0, 600000) + '\n\n[HTML Content Truncated due to database size limits]';
        }

        let bodyText = parsed.text || '';
        if (bodyText && bodyText.length > 150000) {
          bodyText = bodyText.substring(0, 150000) + '\n\n[Text Content Truncated due to database size limits]';
        }

        // 8. Store in Firestore
        const isAutoArchived = fromContact?.email && autoArchiveSenders.includes(fromContact.email.toLowerCase());
        
        const emailDoc = {
          messageId,
          threadId,
          from: fromContact,
          to: toContacts,
          cc: ccContacts.length > 0 ? ccContacts : null,
          subject: parsed.subject || '(No Subject)',
          bodyText,
          bodyHtml,
          date: parsed.date ? new Date(parsed.date) : new Date(),
          receivedAt: FieldValue.serverTimestamp(),
          attachments,
          status: (isAutoArchived ? 'archived' : 'unread') as 'unread' | 'archived',
          isStarred: false,
        };

        const safeDocId = messageId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const docRef = adminDb.collection('emails').doc(safeDocId);
        await docRef.set(emailDoc, { merge: true });
        newEmailCount++;

        // Add to AI background tasks queue
        aiTasks.push({
          docRef,
          emailDoc,
          fromContact,
          messageId,
        });
      } catch (msgError: any) {
        console.error('[Email Sync] Error processing individual message:', msgError.message);
        continue;
      }
    }

    // 10. Close IMAP connection
    connection.end();

    // 11. Update last sync timestamp
    await adminDb.collection('emailSettings').doc('lastSync').set(
      { syncedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    // 12. Helper for Rate-Limit Retries (exponential backoff)
    async function runWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
      try {
        return await fn();
      } catch (error: any) {
        const errorMsg = error?.message || '';
        const isRateLimit = errorMsg.includes('429') || 
                            errorMsg.toLowerCase().includes('rate limit') || 
                            errorMsg.includes('RESOURCE_EXHAUSTED');
        if (isRateLimit && retries > 0) {
          console.warn(`[Rate Limit Retry] Hit 429. Retrying in ${delay}ms... (Retries remaining: ${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return runWithRetry(fn, retries - 1, delay * 2);
        }
        throw error;
      }
    }

    // 13. Run AI triage, summarization, and automation rule engine in the background
    if (aiTasks.length > 0) {
      console.log(`[Email Sync API] Starting background AI processing for ${aiTasks.length} emails.`);
      // Run asynchronously without awaiting so the sync returns immediately
      const processAiTasks = async () => {
        const { runEmailAutomation } = await import('@/lib/email-automation-engine');
        for (const task of aiTasks) {
          try {
            const emailId = task.docRef.id;
            console.log(`[Email Sync API] Running triage/summarize for emailId: ${emailId}`);
            
            const [triageResult, summaryResult, actionsResult] = await Promise.all([
              runWithRetry(() => triageEmail({
                subject: task.emailDoc.subject,
                body: task.emailDoc.bodyText,
                senderEmail: task.fromContact.email,
                senderName: task.fromContact.name || task.fromContact.email,
              })),
              runWithRetry(() => summarizeEmail({
                subject: task.emailDoc.subject,
                body: task.emailDoc.bodyText,
                senderName: task.fromContact.name || task.fromContact.email,
              })),
              runWithRetry(() => extractEmailActions({
                subject: task.emailDoc.subject,
                body: task.emailDoc.bodyText,
                senderEmail: task.fromContact.email,
                senderName: task.fromContact.name || task.fromContact.email,
              })),
            ]);

            const aiUpdate: Record<string, any> = {};

            if (triageResult.success && triageResult.data) {
              if (triageResult.data.category) aiUpdate.aiCategory = triageResult.data.category;
              if (triageResult.data.priority) aiUpdate.aiPriority = triageResult.data.priority;
              if (triageResult.data.sentiment) aiUpdate.aiSentiment = triageResult.data.sentiment;
            }

            if (summaryResult.success && summaryResult.data) {
              if (summaryResult.data.summary) aiUpdate.aiSummary = summaryResult.data.summary;
            }

            if (actionsResult.success && actionsResult.data) {
              const formattedActions = actionsResult.data.actionItems.map(
                (item: any) => `[${item.type.replace('_', ' ').toUpperCase()}] (${item.priority.toUpperCase()}) ${item.description}${item.suggestedDueDate ? ` (Due: ${item.suggestedDueDate})` : ''}`
              );
              if (formattedActions.length > 0) aiUpdate.aiActionItems = formattedActions;
            }

            if (Object.keys(aiUpdate).length > 0) {
              await task.docRef.update(aiUpdate);
            }

            // Trigger automation rules (auto-archive, auto-task, auto-draft)
            await runEmailAutomation(emailId);
            
          } catch (aiError: any) {
            console.error(`[Email Sync API] Failed processing AI for ${task.messageId}:`, aiError.message);
          }
        }
        console.log(`[Email Sync API] Background AI processing complete.`);
      };
      
      // Fire and forget
      processAiTasks().catch(err => console.error('[Email Sync API] Background processing error:', err));
    }

    console.log(`[Email Sync] Complete. ${newEmailCount} new emails synced.`);

    return {
      success: true,
      count: newEmailCount,
      totalProcessed: messages.length,
    };
  } catch (error: any) {
    console.error('[Email Sync] API error:', error);
    return {
      success: false,
      error: error.message || 'Email sync failed',
    };
  }
}

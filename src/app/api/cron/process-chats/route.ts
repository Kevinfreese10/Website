import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendChatWelcomeSummaryEmail } from '@/app/actions/chat-actions';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const adminDb = getAdminDb();
    const now = new Date();
    // 5 minutes ago
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const snapshot = await adminDb.collection('chatbotConversations').get();
    let processedCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // We only care about conversations that have a user attached
      if (!data.userEmail || data.userEmail === 'Anonymous' || data.userEmail === '') continue;

      const lastActiveAt = data.lastActiveAt?.toDate?.() || new Date(data.updatedAt);
      
      // Close idle conversations AND send summary email immediately
      if (!data.closed && lastActiveAt < fiveMinutesAgo) {
        // Generate summary using Gemini
        const chatHistoryText = (data.messages || []).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
        
        let summary = '';
        if (data.messages && data.messages.length > 2) {
          try {
            const { text } = await generateText({
              model: google('gemini-2.5-flash'),
              prompt: `Summarize the following chat conversation between a user (${data.userName || 'Guest'}) and a support bot/agent. Be concise, professional, and highlight any requested services, issues, or next steps. Do not include the closing message in the summary.\n\nConversation:\n${chatHistoryText}`,
            });
            summary = text;
          } catch (err) {
            console.error("Gemini summary error:", err);
            summary = "We discussed your accounting and compliance needs with My Accountant. We will be in touch shortly to assist you further.";
          }
        } else {
           summary = "Thank you for reaching out to My Accountant. We are ready to assist you whenever you need.";
        }

        // Send email
        await sendChatWelcomeSummaryEmail(doc.id, data.userEmail, data.userName || 'Guest', summary);
        
        const closingMessage = {
          role: 'bot',
          content: "Since we haven't heard from you in a while, we have closed this conversation. A summary of our chat has been emailed to you.",
          timestamp: new Date().toISOString()
        };
        
        await doc.ref.update({
          closed: true,
          closedAt: FieldValue.serverTimestamp(),
          summaryEmailSent: true,
          summaryText: summary,
          messages: FieldValue.arrayUnion(closingMessage)
        });
        processedCount++;
        continue;
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (error: any) {
    console.error("Cron Error processing chats:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

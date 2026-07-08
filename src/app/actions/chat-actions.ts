'use server';

import { render } from '@react-email/components';
import { sendEmail } from '@/lib/email';
import React from 'react';
import ChatNotificationEmail from '@/components/emails/ChatNotificationEmail';
import ChatInviteEmail from '@/components/emails/ChatInviteEmail';
import ChatWelcomeSummaryEmail from '@/components/emails/ChatWelcomeSummaryEmail';
import { SITE_URL } from '@/lib/constants';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function sendChatNotificationEmail(
  conversationId: string,
  recipientEmail: string,
  recipientName: string,
  lastMessagePreview: string
) {
  try {
    const actionUrl = `${SITE_URL}?resumeChat=${conversationId}`;
    const emailHtml = await render(
      React.createElement(ChatNotificationEmail, {
        recipientName: recipientName || 'Guest',
        lastMessagePreview,
        actionUrl,
      })
    );

    await sendEmail({
      to: recipientEmail.trim().toLowerCase(),
      subject: `Live Chat Reply from My Accountant Support`,
      html: emailHtml,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error sending chat notification email:", error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export async function sendChatInviteEmail(
  conversationId: string,
  recipientEmail: string,
  recipientName: string,
  senderName: string = 'Kevin Freese'
) {
  try {
    const actionUrl = `${SITE_URL}?resumeChat=${conversationId}`;
    const emailHtml = await render(
      React.createElement(ChatInviteEmail, {
        recipientName: recipientName || 'Guest',
        senderName,
        actionUrl,
      })
    );

    await sendEmail({
      to: recipientEmail.trim().toLowerCase(),
      subject: `${senderName} is ready to chat with you`,
      html: emailHtml,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error sending chat invite email:", error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export async function sendChatWelcomeSummaryEmail(
  conversationId: string,
  recipientEmail: string,
  recipientName: string,
  summaryText: string
) {
  try {
    const actionUrl = `${SITE_URL}?resumeChat=${conversationId}`;
    const emailHtml = await render(
      React.createElement(ChatWelcomeSummaryEmail, {
        recipientName: recipientName || 'Guest',
        summaryText,
        actionUrl,
      })
    );

    await sendEmail({
      to: recipientEmail.trim().toLowerCase(),
      bcc: ['kev@thinkestry.co.za'],
      subject: `Welcome to My Accountant! Here is a summary of our chat`,
      html: emailHtml,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error sending chat welcome summary email:", error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function generateFollowUpEmailDraft(chatHistoryText: string, clientName: string) {
  try {
    const { object } = await generateObject({
      model: googleProvider('gemini-2.5-flash'),
      schema: z.object({
        subject: z.string().describe('The subject line of the email.'),
        body: z.string().describe('The body of the email in plain text.'),
      }),
      prompt: `Based on the following chat conversation, generate a professional follow-up email from a human advisor at "My Accountant".
The email should ask the client if they still need assistance and include a mention/link to the specific product or service they were inquiring about. 
Be polite, concise, and helpful. 

CRITICAL RULES:
1. Address the client by their first name (extracted from "${clientName}") in the greeting, instead of using generic terms like "Dear Client".
2. You MUST use proper formatting. Include newline characters (\\n\\n) to separate paragraphs, the greeting, and the sign-off. Do NOT return a single solid block of text.
3. If you include a link to a page, you MUST use the full absolute URL (e.g., instead of just "/products", use "${SITE_URL}/products").
4. The email signature MUST always be exactly:
Kevin Freese
The My Accountant Team
010 109 1625

Conversation History:
${chatHistoryText}
`,
    });
    return { success: true, draft: object };
  } catch (error: any) {
    console.error("Error generating follow-up email draft:", error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export async function sendFollowUpEmail(chatId: string, toEmail: string, subject: string, textBody: string) {
  try {
    // Send the email
    await sendEmail({
      to: toEmail.trim().toLowerCase(),
      cc: ['kev@thinkestry.co.za'],
      subject,
      html: textBody.replace(/\n/g, '<br />'), // Convert plain text newlines to HTML breaks
    });

    // Update the chat with a system message indicating the email was sent
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('chatbotConversations').doc(chatId);
    
    const systemMsg = {
      role: 'agent',
      content: `System: Follow-up email sent to ${toEmail} with subject: "${subject}"`,
      timestamp: new Date().toISOString()
    };

    await docRef.update({
      messages: FieldValue.arrayUnion(systemMsg),
      updatedAt: FieldValue.serverTimestamp(),
      closed: true,
      closedAt: FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error sending follow-up email:", error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

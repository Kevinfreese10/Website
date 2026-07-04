'use server';

import { render } from '@react-email/components';
import { sendEmail } from '@/lib/email';
import React from 'react';
import ChatNotificationEmail from '@/components/emails/ChatNotificationEmail';
import ChatInviteEmail from '@/components/emails/ChatInviteEmail';
import ChatWelcomeSummaryEmail from '@/components/emails/ChatWelcomeSummaryEmail';
import { SITE_URL } from '@/lib/constants';

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

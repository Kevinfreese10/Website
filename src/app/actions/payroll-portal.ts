'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { render } from '@react-email/components';
import React from 'react';
import AIPayrollInviteEmail from '@/components/emails/AIPayrollInviteEmail';
import crypto from 'crypto';
import { getVerifiedAuthContext, verifyAiPayrollClientAccess } from '@/lib/server-auth';

export async function invitePayrollClient({
  clientId,
  email,
  name,
  companyName,
  idToken,
}: {
  clientId: string;
  email: string;
  name: string;
  companyName: string;
  idToken?: string;
}) {
  try {
    // This action creates Firebase Auth users and writes `payrollClientId` onto a user document,
    // which is what routes that user into a payroll client's portal and authorises them for it.
    // Unauthenticated, it was an account-provisioning and cross-tenant linking primitive: an
    // attacker could attach their own account to any employer's payroll.
    const authCtx = await getVerifiedAuthContext(idToken);
    if (!authCtx) {
      return { success: false, error: 'Unauthorized: A valid authentication token is required.' };
    }
    if (!(await verifyAiPayrollClientAccess(authCtx, clientId))) {
      return { success: false, error: 'Forbidden: You do not have access to this payroll client.' };
    }

    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();
    const cleanEmail = email.toLowerCase().trim();

    // 1. Check if client exists in aiPayrollClients
    const clientRef = adminDb.collection('aiPayrollClients').doc(clientId);
    const clientSnap = await clientRef.get();
    if (!clientSnap.exists) {
      return { success: false, error: 'AI Payroll client profile not found.' };
    }

    // 2. Check if a user with this email already exists in Firebase Auth
    let userRecord;
    let uid = '';
    let isNewUser = false;
    let generatedPassword = '';

    try {
      userRecord = await adminAuth.getUserByEmail(cleanEmail);
      uid = userRecord.uid;
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        isNewUser = true;
      } else {
        throw e;
      }
    }

    if (isNewUser) {
      // Create new Firebase Auth user
      generatedPassword = crypto.randomBytes(8).toString('hex') + '1!';
      userRecord = await adminAuth.createUser({
        email: cleanEmail,
        password: generatedPassword,
        displayName: name,
      });
      uid = userRecord.uid;

      // Create users document
      await adminDb.collection('users').doc(uid).set({
        id: uid,
        uid: uid,
        email: cleanEmail,
        name: name,
        companyName: companyName,
        role: 'client',
        source: 'AI Payroll',
        clientSource: 'ai_payroll',
        payrollClientId: clientId,
        createdAt: new Date(),
      });
    } else {
      // Existing user: check if they already have a user document
      const userRef = adminDb.collection('users').doc(uid);
      const userSnap = await userRef.get();
      
      if (userSnap.exists) {
        // Link them
        await userRef.update({
          payrollClientId: clientId,
          clientSource: 'ai_payroll',
          source: 'AI Payroll',
        });
      } else {
        // Create user document for them
        await userRef.set({
          id: uid,
          uid: uid,
          email: cleanEmail,
          name: name,
          companyName: companyName,
          role: 'client',
          source: 'AI Payroll',
          clientSource: 'ai_payroll',
          payrollClientId: clientId,
          createdAt: new Date(),
        });
      }
    }

    // 3. Update the aiPayrollClients document with the portal link and status
    await clientRef.update({
      portalUserId: uid,
      portalUserEmail: cleanEmail,
      portalStatus: 'Invited',
      invitedAt: new Date(),
    });

    // 4. Send Email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za'}/login`;
    const emailHtml = await render(
      React.createElement(AIPayrollInviteEmail, {
        name,
        email: cleanEmail,
        password: isNewUser ? generatedPassword : undefined,
        clientName: companyName,
        loginUrl,
      })
    );

    await sendEmail({
      to: cleanEmail,
      subject: `Invitation to collaborate on AI Payroll for ${companyName}`,
      html: emailHtml,
    });

    return { success: true, isNewUser };
  } catch (err: any) {
    console.error("Error inviting payroll client:", err);
    return { success: false, error: err.message || 'Internal Server Error' };
  }
}

export async function sendNewPayrollNoteNotification({
  clientId,
  noteText,
  authorName,
  attachmentName,
}: {
  clientId: string;
  noteText: string;
  authorName: string;
  attachmentName?: string;
}) {
  try {
    const adminDb = getAdminDb();
    
    // Fetch client company name
    const clientRef = adminDb.collection('aiPayrollClients').doc(clientId);
    const clientSnap = await clientRef.get();
    const companyName = clientSnap.exists ? (clientSnap.data()?.name || 'Unknown Company') : 'Unknown Company';
    
    const subject = `[AI Payroll] New Client Note - ${companyName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-top: 0;">New Note Received</h2>
        <p>A client has posted a new note in the AI Payroll Portal:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2563eb;">
          <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #6b7280;">
            Posted by: ${authorName}
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #1f2937; white-space: pre-wrap;">
            ${noteText || '<i>(No text content)</i>'}
          </p>
          ${attachmentName ? `
            <p style="margin: 10px 0 0 0; font-size: 12px; font-weight: bold; color: #2563eb;">
              📎 Attachment: ${attachmentName}
            </p>
          ` : ''}
        </div>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 10px;">
          This is an automated notification from the My Accountant AI Payroll Portal.
        </p>
      </div>
    `;

    await sendEmail({
      to: ['winifred@myacc.co.za', 'kev@thinkestry.co.za'],
      subject,
      html,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error sending payroll note notification:", err);
    return { success: false, error: err.message || 'Internal Server Error' };
  }
}

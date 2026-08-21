'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { addMonths } from 'date-fns';
import { User } from '@/lib/types';
import { sendEmail } from '@/lib/email';
import { render } from '@react-email/components';
import React from 'react';
import AdminStaffWelcomeEmail from '@/components/emails/AdminStaffWelcomeEmail';
import { getAuthContext } from '@/lib/server-auth';

export async function reactivatePracticeSubscription({ userId, requestorId }: { userId: string; requestorId?: string }) {
    if (requestorId) {
        const authCtx = await getAuthContext(requestorId);
        if (!authCtx?.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin privileges required.' };
        }
    }
    const adminDb = getAdminDb();
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
        'subscription.subscriptionStatus': 'active',
        'subscription.subscriptionEndDate': addMonths(new Date(), 1)
    });
    return { success: true };
}

export async function adminCreateUserAction({
  email,
  password,
  name,
  role = 'client',
  source,
  contactNumber,
  department,
}: {
  email: string;
  password?: string;
  name: string;
  role?: string;
  source?: string;
  contactNumber?: string;
  department?: string;
}) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    const cleanEmail = email.toLowerCase().trim();
    let uid: string;
    let isNewUser = false;

    try {
      const userRecord = await adminAuth.getUserByEmail(cleanEmail);
      uid = userRecord.uid;

      const userDocRef = adminDb.collection('users').doc(uid);
      const userDocSnap = await userDocRef.get();
      if (userDocSnap.exists) {
        return {
          success: false,
          error: 'auth/email-already-in-use',
          message: 'A user account already exists with this email address.',
        };
      }
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        const userRecord = await adminAuth.createUser({
          email: cleanEmail,
          password: password || undefined,
          displayName: name,
        });
        uid = userRecord.uid;
        isNewUser = true;
      } else {
        throw e;
      }
    }

    const userDocRef = adminDb.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();

    const profileData: Record<string, any> = {
      id: uid,
      uid: uid,
      name,
      email: cleanEmail,
      role,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!userDocSnap.exists) {
      profileData.createdAt = FieldValue.serverTimestamp();
    }
    if (source) {
      profileData.source = source;
    }
    if (contactNumber) {
      profileData.contactNumber = contactNumber;
    }
    if (department) {
      profileData.department = department;
    }

    await userDocRef.set(profileData, { merge: true });

    // Send Welcome Email if created via Admin Portal (Staff Manager)
    if (isNewUser && source === 'Admin Portal (Staff Manager)') {
      try {
        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://myaccountant.co.za'}/login`;
        const emailHtml = await render(
          React.createElement(AdminStaffWelcomeEmail, {
            staffName: name,
            email: cleanEmail,
            tempPassword: password,
            loginUrl,
          })
        );
        await sendEmail({
          to: cleanEmail,
          subject: 'Welcome to the My Accountant Team',
          html: emailHtml,
        });
      } catch (emailErr) {
        console.error('Error sending staff welcome email:', emailErr);
        // Do not fail the user creation if email fails
      }
    }

    return {
      success: true,
      uid,
      isNewUser,
    };
  } catch (error: any) {
    console.error("Error in adminCreateUserAction:", error);
    return {
      success: false,
      error: error.code || 'error',
      message: error.message || 'Failed to create user account.',
    };
  }
}

export async function adminDeleteUserAction({ uid }: { uid: string }) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    try {
      await adminAuth.deleteUser(uid);
    } catch (e: any) {
      if (e.code !== 'auth/user-not-found') {
        throw e;
      }
      console.warn(`User ${uid} not found in Firebase Auth during deletion.`);
    }

    await adminDb.collection('users').doc(uid).delete();

    return { success: true };
  } catch (error: any) {
    console.error("Error in adminDeleteUserAction:", error);
    return { success: false, error: error.message || 'Failed to delete user' };
  }
}

export async function adminUpdateUserPasswordAction({ uid, password }: { uid: string; password?: string }) {
  try {
    if (!password || password.length < 6) {
      return { success: false, error: 'invalid-password', message: 'Password must be at least 6 characters.' };
    }
    const adminAuth = getAdminAuth();
    await adminAuth.updateUser(uid, { password });
    return { success: true };
  } catch (error: any) {
    console.error("Error in adminUpdateUserPasswordAction:", error);
    return { success: false, error: error.code || 'error', message: error.message || 'Failed to update user password.' };
  }
}

export async function adminToggleUserActiveAction({ uid, isActive }: { uid: string; isActive: boolean }) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // 1. Update Firestore user document with synchronized status fields
    await adminDb.collection('users').doc(uid).set({
      isActive,
      status: isActive ? 'Active' : 'Deactivated',
      disabled: !isActive,
    }, { merge: true });

    // 2. Enable or disable user in Firebase Authentication and revoke sessions if deactivating
    try {
      await adminAuth.updateUser(uid, { disabled: !isActive });
      if (!isActive) {
        await adminAuth.revokeRefreshTokens(uid);
      }
    } catch (authErr: any) {
      if (authErr.code !== 'auth/user-not-found') {
        console.warn(`Could not update Firebase Auth disabled state for user ${uid}:`, authErr);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in adminToggleUserActiveAction:", error);
    return { success: false, error: error.message || 'Failed to update account active status' };
  }
}


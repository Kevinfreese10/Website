'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { addMonths } from 'date-fns';
import { User } from '@/lib/types';
import { sendEmail } from '@/lib/email';
import { render } from '@react-email/components';
import React from 'react';
import AdminStaffWelcomeEmail from '@/components/emails/AdminStaffWelcomeEmail';
import { getVerifiedAuthContext } from '@/lib/server-auth';

/**
 * Every action in this file performs a privileged operation with the Admin SDK — creating users,
 * setting passwords, deleting accounts, toggling access. They are `'use server'` exports, which
 * means they are directly-callable HTTP endpoints, and they previously performed NO caller
 * verification at all: an anonymous request could set any user's password or create an account
 * with `role: 'admin'`.
 *
 * A verified Firebase ID token belonging to an admin is now required for all of them.
 */
async function requireAdmin(idToken: string | undefined): Promise<{ error: string } | null> {
  const authCtx = await getVerifiedAuthContext(idToken);
  if (!authCtx) {
    return { error: 'Unauthorized: A valid authentication token is required.' };
  }
  if (!authCtx.isAdmin && authCtx.user.role !== 'admin') {
    return { error: 'Forbidden: Admin privileges required.' };
  }
  return null;
}

/**
 * Roles this action is permitted to assign. `role` arrives from the caller, so without an
 * allowlist an admin-authenticated request could still mint arbitrary or typo'd role strings.
 */
const ASSIGNABLE_ROLES = ['client', 'staff', 'cap_staff', 'cap_supervisor', 'partner', 'partner_staff', 'partner_admin', 'admin'];

export async function reactivatePracticeSubscription({ userId, idToken }: { userId: string; idToken?: string }) {
    // Previously gated on `if (requestorId)` — omitting the optional argument skipped the check.
    const authError = await requireAdmin(idToken);
    if (authError) return { success: false, ...authError };

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
  idToken,
}: {
  email: string;
  password?: string;
  name: string;
  role?: string;
  source?: string;
  contactNumber?: string;
  department?: string;
  idToken?: string;
}) {
  try {
    const authError = await requireAdmin(idToken);
    if (authError) return { success: false, ...authError };

    if (!ASSIGNABLE_ROLES.includes(role)) {
      return { success: false, error: 'invalid-role', message: `Role "${role}" is not assignable.` };
    }

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

export async function adminDeleteUserAction({ uid, idToken }: { uid: string; idToken?: string }) {
  try {
    const authError = await requireAdmin(idToken);
    if (authError) return { success: false, ...authError };

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

export async function adminUpdateUserPasswordAction({ uid, password, idToken }: { uid: string; password?: string; idToken?: string }) {
  try {
    const authError = await requireAdmin(idToken);
    if (authError) return { success: false, ...authError };

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

export async function adminToggleUserActiveAction({ uid, isActive, idToken }: { uid: string; isActive: boolean; idToken?: string }) {
  try {
    const authError = await requireAdmin(idToken);
    if (authError) return { success: false, ...authError };

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


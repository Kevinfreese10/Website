'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { addMonths } from 'date-fns';
import { User } from '@/lib/types';

export async function reactivatePracticeSubscription({ userId }: { userId: string }) {
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

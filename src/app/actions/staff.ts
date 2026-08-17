'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { render } from '@react-email/components';
import React from 'react';
import crypto from 'crypto';
import PartnerStaffInviteEmail from '@/components/emails/PartnerStaffInviteEmail';
import { StaffPermissions, PartnerInvite } from '@/lib/types';
import { getVerifiedAuthContext, verifyPartnerAccess } from '@/lib/server-auth';

/**
 * Verifies the caller's Firebase ID token and confirms they're actually authorized to act on
 * the given partner practice (the partner themselves, an active staff member of that practice,
 * or an admin) — closing the gap where these actions used to trust a plain, client-supplied
 * partnerId string with no check that the caller was really that partner.
 */
async function requirePartnerAccess(idToken: string, partnerId: string) {
  const authCtx = await getVerifiedAuthContext(idToken);
  if (!authCtx) return { ok: false as const, error: 'Unauthorized' };
  if (!(await verifyPartnerAccess(authCtx.userId, partnerId))) {
    return { ok: false as const, error: 'Unauthorized: you do not have access to this practice' };
  }
  return { ok: true as const, authCtx };
}

// Action 1: sendStaffInvite
export async function sendStaffInvite({
  partnerId,
  invitedByName,
  invitedEmail,
  staffRole,
  permissions,
  idToken,
}: {
  partnerId: string;
  invitedByName: string;
  invitedEmail: string;
  staffRole: 'partner_admin' | 'partner_staff';
  permissions: StaffPermissions;
  idToken: string;
}) {
  try {
    const access = await requirePartnerAccess(idToken, partnerId);
    if (!access.ok) return { success: false, error: access.error };

    const adminDb = getAdminDb();
    const cleanEmail = invitedEmail.toLowerCase().trim();

    // 1. Get partner user document
    const partnerSnap = await adminDb.collection('users').doc(partnerId).get();
    if (!partnerSnap.exists) {
      return { success: false, error: 'Partner user not found' };
    }
    const partnerData = partnerSnap.data();

    // 2. Validate seat limit (max 3 active staff including owner)
    const staffSnap = await adminDb.collection('users')
      .where('partnerId', '==', partnerId)
      .where('role', 'in', ['partner_staff', 'partner_admin'])
      .get();

    let activeStaffCount = 1; // Owner counts as 1 seat
    staffSnap.docs.forEach(doc => {
      if (doc.data().isActive !== false) {
        activeStaffCount++;
      }
    });

    const pendingInvitesSnap = await adminDb.collection('partnerInvites')
      .where('partnerId', '==', partnerId)
      .where('status', '==', 'pending')
      .get();
    
    // Filter out expired invites
    const now = new Date();
    let pendingInviteCount = 0;
    pendingInvitesSnap.docs.forEach(doc => {
      const expiresAt = doc.data().expiresAt?.toDate?.() || new Date(doc.data().expiresAt);
      if (expiresAt > now) {
        pendingInviteCount++;
      }
    });

    const seatLimit = partnerData?.partnerSubscription?.staffSeatLimit ?? 1;
    if (activeStaffCount + pendingInviteCount >= seatLimit) {
      return { success: false, error: 'Seat limit reached. Upgrade to add more staff.' };
    }

    // 3. Check if email already exists as active staff for this partner
    const existingUserSnap = await adminDb.collection('users')
      .where('partnerId', '==', partnerId)
      .where('email', '==', cleanEmail)
      .get();

    if (!existingUserSnap.empty) {
      const existingUser = existingUserSnap.docs[0].data();
      if (existingUser.isActive !== false) {
        return { success: false, error: 'A user with this email is already an active staff member of your practice.' };
      }
    }

    // 4. Generate token and create invite document
    const token = crypto.randomUUID();
    const expiresAtDate = new Date();
    expiresAtDate.setHours(expiresAtDate.getHours() + 72); // 72 hours from now

    const inviteData: PartnerInvite = {
      id: token,
      partnerId,
      partnerName: partnerData?.name || '',
      partnerCompanyName: partnerData?.companyName || '',
      invitedEmail: cleanEmail,
      invitedByName,
      staffRole,
      permissions,
      token,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: expiresAtDate,
    };

    await adminDb.collection('partnerInvites').doc(token).set(inviteData);

    // 5. Send Invite Email
    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/partner-invite/${token}`;
    const emailHtml = await render(
      React.createElement(PartnerStaffInviteEmail, {
        inviteeName: '',
        partnerCompanyName: partnerData?.companyName || 'our practice',
        partnerContactName: partnerData?.name || 'the owner',
        inviteRole: staffRole === 'partner_admin' ? 'Partner Admin' : 'Staff Member',
        acceptUrl,
        expiryHours: 72,
      })
    );

    await sendEmail({
      to: cleanEmail,
      subject: `Invitation to join ${partnerData?.companyName || 'Practice'} on My Accountant`,
      html: emailHtml,
    });

    return { success: true, inviteId: token };
  } catch (e: any) {
    console.error('Error sending staff invite:', e);
    return { success: false, error: e.message || 'Internal Server Error' };
  }
}

// Action 2: deactivateStaffMember
export async function deactivateStaffMember({
  callerPartnerId,
  staffUid,
  idToken,
}: {
  callerPartnerId: string;
  staffUid: string;
  idToken: string;
}) {
  try {
    const access = await requirePartnerAccess(idToken, callerPartnerId);
    if (!access.ok) return { success: false, error: access.error };

    const adminDb = getAdminDb();
    const staffRef = adminDb.collection('users').doc(staffUid);
    const staffSnap = await staffRef.get();
    if (!staffSnap.exists) {
      return { success: false, error: 'Staff member not found' };
    }
    const staffData = staffSnap.data();
    if (staffData?.partnerId !== callerPartnerId) {
      return { success: false, error: 'Unauthorized: Partner ID mismatch' };
    }

    await staffRef.update({ isActive: false });

    // Also disable user in Firebase Authentication and revoke sessions
    try {
      const adminAuth = getAdminAuth();
      await adminAuth.updateUser(staffUid, { disabled: true });
      await adminAuth.revokeRefreshTokens(staffUid);
    } catch (authErr: any) {
      if (authErr.code !== 'auth/user-not-found') {
        console.warn(`Could not disable Firebase Auth user ${staffUid}:`, authErr);
      }
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to deactivate staff member' };
  }
}

// Action 3: reactivateStaffMember
export async function reactivateStaffMember({
  callerPartnerId,
  staffUid,
  idToken,
}: {
  callerPartnerId: string;
  staffUid: string;
  idToken: string;
}) {
  try {
    const access = await requirePartnerAccess(idToken, callerPartnerId);
    if (!access.ok) return { success: false, error: access.error };

    const adminDb = getAdminDb();

    // Check seat limit first
    const staffSnap = await adminDb.collection('users')
      .where('partnerId', '==', callerPartnerId)
      .where('role', 'in', ['partner_staff', 'partner_admin'])
      .get();

    let activeStaffCount = 1; // Owner
    staffSnap.docs.forEach(doc => {
      if (doc.id !== staffUid && doc.data().isActive !== false) {
        activeStaffCount++;
      }
    });

    const pendingInvitesSnap = await adminDb.collection('partnerInvites')
      .where('partnerId', '==', callerPartnerId)
      .where('status', '==', 'pending')
      .get();
    
    const now = new Date();
    let pendingInviteCount = 0;
    pendingInvitesSnap.docs.forEach(doc => {
      const expiresAt = doc.data().expiresAt?.toDate?.() || new Date(doc.data().expiresAt);
      if (expiresAt > now) {
        pendingInviteCount++;
      }
    });

    const partnerSnap = await adminDb.collection('users').doc(callerPartnerId).get();
    const seatLimit = partnerSnap.data()?.partnerSubscription?.staffSeatLimit ?? 1;

    if (activeStaffCount + pendingInviteCount >= seatLimit) {
      return { success: false, error: 'Cannot reactivate. Seat limit reached.' };
    }

    const staffRef = adminDb.collection('users').doc(staffUid);
    const staffSnapDoc = await staffRef.get();
    if (!staffSnapDoc.exists) {
      return { success: false, error: 'Staff member not found' };
    }
    const staffData = staffSnapDoc.data();
    if (staffData?.partnerId !== callerPartnerId) {
      return { success: false, error: 'Unauthorized: Partner ID mismatch' };
    }

    await staffRef.update({ isActive: true });

    // Also re-enable in Firebase Authentication
    try {
      const adminAuth = getAdminAuth();
      await adminAuth.updateUser(staffUid, { disabled: false });
    } catch (authErr: any) {
      if (authErr.code !== 'auth/user-not-found') {
        console.warn(`Could not enable Firebase Auth user ${staffUid}:`, authErr);
      }
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to reactivate staff member' };
  }
}

// Action 4: updateStaffPermissions
export async function updateStaffPermissions({
  callerPartnerId,
  staffUid,
  permissions,
  idToken,
}: {
  callerPartnerId: string;
  staffUid: string;
  permissions: StaffPermissions;
  idToken: string;
}) {
  try {
    const access = await requirePartnerAccess(idToken, callerPartnerId);
    if (!access.ok) return { success: false, error: access.error };

    const adminDb = getAdminDb();
    const staffRef = adminDb.collection('users').doc(staffUid);
    const staffSnap = await staffRef.get();
    if (!staffSnap.exists) {
      return { success: false, error: 'Staff member not found' };
    }
    const staffData = staffSnap.data();
    if (staffData?.partnerId !== callerPartnerId) {
      return { success: false, error: 'Unauthorized: Partner ID mismatch' };
    }

    await staffRef.update({ permissions });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to update permissions' };
  }
}

// Action 5: revokeInvite
export async function revokeInvite({
  callerPartnerId,
  token,
  idToken,
}: {
  callerPartnerId: string;
  token: string;
  idToken: string;
}) {
  try {
    const access = await requirePartnerAccess(idToken, callerPartnerId);
    if (!access.ok) return { success: false, error: access.error };

    const adminDb = getAdminDb();
    const inviteRef = adminDb.collection('partnerInvites').doc(token);
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists) {
      return { success: false, error: 'Invite not found' };
    }
    const inviteData = inviteSnap.data();
    if (inviteData?.partnerId !== callerPartnerId) {
      return { success: false, error: 'Unauthorized: Partner ID mismatch' };
    }

    await inviteRef.update({ status: 'expired' });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to revoke invite' };
  }
}

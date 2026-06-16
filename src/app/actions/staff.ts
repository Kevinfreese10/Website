'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { render } from '@react-email/components';
import React from 'react';
import crypto from 'crypto';
import PartnerStaffInviteEmail from '@/components/emails/PartnerStaffInviteEmail';
import { StaffPermissions, PartnerInvite } from '@/lib/types';

// Action 1: sendStaffInvite
export async function sendStaffInvite({
  partnerId,
  invitedByName,
  invitedEmail,
  staffRole,
  permissions,
}: {
  partnerId: string;
  invitedByName: string;
  invitedEmail: string;
  staffRole: 'partner_admin' | 'partner_staff';
  permissions: StaffPermissions;
}) {
  try {
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

    const seatLimit = partnerData?.partnerSubscription?.staffSeatLimit ?? 3;
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
}: {
  callerPartnerId: string;
  staffUid: string;
}) {
  try {
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
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to deactivate staff member' };
  }
}

// Action 3: reactivateStaffMember
export async function reactivateStaffMember({
  callerPartnerId,
  staffUid,
}: {
  callerPartnerId: string;
  staffUid: string;
}) {
  try {
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
    const seatLimit = partnerSnap.data()?.partnerSubscription?.staffSeatLimit ?? 3;

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
}: {
  callerPartnerId: string;
  staffUid: string;
  permissions: StaffPermissions;
}) {
  try {
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
}: {
  callerPartnerId: string;
  token: string;
}) {
  try {
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

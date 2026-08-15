'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Server-validated role/permission assignment for the two flows that need to elevate
 * a user beyond the default 'client' role. These fields are deliberately blocked from
 * direct client self-writes in firestore.rules (see isSafeSelfWrite) — this file is the
 * only place that is allowed to set them, and it always decides the value itself rather
 * than trusting whatever the client sends.
 */

const DEFAULT_PARTNER_SUBSCRIPTION = {
    status: 'active' as const,
    // Effectively "no expiry" for the free tier, matching prior client-side default.
    currentPeriodEnd: new Date('2099-12-31'),
    aiCompanyLimit: 0,
    aiPayrollLimit: 0,
    staffSeatLimit: 1,
    hasTaskManager: false,
};

/**
 * Promotes the calling (already-authenticated) user to a partner account.
 * Used by the public partner-signup form, for both brand-new accounts and
 * existing clients upgrading to a partner account.
 */
export async function becomePartnerAction(idToken: string) {
    if (!idToken) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const decoded = await getAuth().verifyIdToken(idToken);
        const uid = decoded.uid;
        const adminDb = getAdminDb();

        const userRef = adminDb.collection('users').doc(uid);
        const userSnap = await userRef.get();
        const existingRole = userSnap.exists ? userSnap.data()?.role : undefined;

        // Never let this action be used to "downgrade" an existing staff/admin account,
        // or re-elevate a role that isn't a plain client/partner already.
        const blockedRoles = ['admin', 'staff', 'cap_staff', 'cap_supervisor', 'partner_admin', 'partner_staff'];
        if (existingRole && blockedRoles.includes(existingRole)) {
            return { success: false, error: 'This account type cannot be converted to a partner account.' };
        }

        await userRef.set({
            role: 'partner',
            partnerTier: 'growth',
            status: 'Active',
            creditBalance: userSnap.exists ? (userSnap.data()?.creditBalance ?? 0) : 0,
            partnerSubscription: userSnap.exists && userSnap.data()?.partnerSubscription
                ? userSnap.data()?.partnerSubscription
                : DEFAULT_PARTNER_SUBSCRIPTION,
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error('Error in becomePartnerAction:', error);
        return { success: false, error: 'Could not activate partner account.' };
    }
}

/**
 * Redeems a staff invite token for the calling (already-authenticated) user.
 * Loads the invite server-side rather than trusting client-supplied staffRole/
 * permissions/partnerId, and cross-checks the invite's target email against the
 * verified token's email before granting anything.
 */
export async function acceptPartnerInviteAction(idToken: string, inviteToken: string) {
    if (!idToken || !inviteToken) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const decoded = await getAuth().verifyIdToken(idToken);
        const uid = decoded.uid;
        const adminDb = getAdminDb();

        const inviteRef = adminDb.collection('partnerInvites').doc(inviteToken);
        const inviteSnap = await inviteRef.get();

        if (!inviteSnap.exists) {
            return { success: false, error: 'This invitation could not be found.' };
        }

        const invite = inviteSnap.data()!;
        const expiresAt = invite.expiresAt?.toDate?.() || new Date(invite.expiresAt);

        if (invite.status !== 'pending') {
            return { success: false, error: 'This invitation has already been used or revoked.' };
        }
        if (expiresAt < new Date()) {
            return { success: false, error: 'This invitation has expired. Please ask your practice owner to send a new one.' };
        }
        if (!decoded.email || decoded.email.toLowerCase() !== String(invite.invitedEmail || '').toLowerCase()) {
            return { success: false, error: 'This invitation was issued to a different email address.' };
        }

        await adminDb.collection('users').doc(uid).set({
            role: invite.staffRole,
            partnerId: invite.partnerId,
            permissions: invite.permissions || null,
            isActive: true,
        }, { merge: true });

        await inviteRef.update({ status: 'accepted', acceptedAt: FieldValue.serverTimestamp() });

        return { success: true };
    } catch (error) {
        console.error('Error in acceptPartnerInviteAction:', error);
        return { success: false, error: 'Could not complete account setup.' };
    }
}

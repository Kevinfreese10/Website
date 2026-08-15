'use server';

import { getAdminDb } from './firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { User, StaffPermissions } from './types';

export interface AuthContext {
  userId: string;
  user: User;
  isOwner: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  isPartner: boolean;
}

/**
 * Validates a user ID and returns their authenticated context and role permissions.
 * Never throws if user is missing — returns null so actions can handle error response gracefully.
 */
export async function getAuthContext(userId: string): Promise<AuthContext | null> {
  if (!userId || typeof userId !== 'string') return null;

  try {
    const adminDb = getAdminDb();
    const userSnap = await adminDb.collection('users').doc(userId).get();
    
    if (!userSnap.exists) return null;
    
    const user = { id: userSnap.id, ...userSnap.data() } as User;
    
    // Check if user is active
    if (user.status === 'Inactive' || user.status === 'Archived' || user.isActive === false) {
      return null;
    }

    const isAdmin = user.role === 'admin' || user.role === 'staff';
    const isPartner = user.role === 'partner' || user.role === 'partner_admin' || user.role === 'partner_staff';
    const isOwner = user.role === 'partner' || user.role === 'partner_admin';
    const isStaff = user.role === 'partner_staff';

    return {
      userId: user.id,
      user,
      isOwner,
      isStaff,
      isAdmin,
      isPartner,
    };
  } catch (err) {
    console.error('[server-auth] Error validating auth context:', err);
    return null;
  }
}

/**
 * Verifies if the given user has permission for a partner practice ID.
 * Returns true if the user IS the partner, or is an active staff member of that partner.
 */
export async function verifyPartnerAccess(userId: string, targetPartnerId: string): Promise<boolean> {
  if (!userId || !targetPartnerId) return false;
  if (userId === targetPartnerId) return true;

  const authCtx = await getAuthContext(userId);
  if (!authCtx) return false;

  // Admins always have access
  if (authCtx.isAdmin) return true;

  // Check if caller's partnerId matches targetPartnerId
  const userPartnerId = authCtx.user.partnerId || authCtx.user.id;
  return userPartnerId === targetPartnerId;
}

/**
 * Verifies a Firebase ID token and returns the caller's auth context.
 * This is the trusted alternative to accepting a plain, client-supplied user ID string —
 * the token is cryptographically signed by Firebase and cannot be spoofed by a caller
 * simply passing someone else's uid as an argument.
 */
export async function getVerifiedAuthContext(idToken: string | undefined | null): Promise<AuthContext | null> {
  if (!idToken || typeof idToken !== 'string') return null;

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return await getAuthContext(decoded.uid);
  } catch (err) {
    console.error('[server-auth] Error verifying ID token:', err);
    return null;
  }
}

/**
 * Verifies a Firebase ID token and returns just the verified email address, without requiring
 * a Firestore /users/{uid} document to already exist. Used right after signup, when the
 * welcome-email flow fires before (or racing) the profile doc write — getVerifiedAuthContext
 * would return null in that window since it looks up the Firestore profile. The email on the
 * decoded token is still cryptographically trustworthy on its own.
 */
export async function verifyIdTokenEmail(idToken: string | undefined | null): Promise<string | null> {
  if (!idToken || typeof idToken !== 'string') return null;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return decoded.email || null;
  } catch (err) {
    console.error('[server-auth] Error verifying ID token for email:', err);
    return null;
  }
}

/**
 * True when the caller (already resolved via getVerifiedAuthContext) is allowed to act on
 * the given AI Accountant client record: admins always; a partner/staff caller only when
 * their practice created that client, or the client was individually shared with them —
 * mirroring the same createdBy/sharedWith query used to list a partner's own clients.
 */
export async function verifyAiAccountantClientAccess(authCtx: AuthContext | null, clientId: string): Promise<boolean> {
  if (!authCtx || !clientId) return false;
  if (authCtx.isAdmin) return true;
  if (!authCtx.isPartner) return false;

  try {
    const adminDb = getAdminDb();
    const clientSnap = await adminDb.collection('aiAccountantClients').doc(clientId).get();
    if (!clientSnap.exists) return false;

    const clientData = clientSnap.data()!;
    const practiceId = authCtx.user.partnerId || authCtx.userId;
    const sharedWith: string[] = clientData.sharedWith || [];

    return clientData.createdBy === practiceId || sharedWith.includes(authCtx.userId);
  } catch (err) {
    console.error('[server-auth] Error verifying AI Accountant client access:', err);
    return false;
  }
}

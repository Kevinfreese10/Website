'use server';

import { getAdminDb } from './firebase-admin';
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

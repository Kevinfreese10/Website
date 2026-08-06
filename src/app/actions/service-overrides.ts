'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { headers } from 'next/headers';

export async function saveServiceOverrideAction({
  idToken,
  serviceId,
  overrideData,
}: {
  idToken: string;
  serviceId: string;
  overrideData: {
    title: string;
    price: number;
    description: string;
    longDescription: string;
    turnaroundTime: string;
    whatsIncluded: string[];
    clientRequirements: string[];
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
  };
}) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // 1. Verify the caller's identity
    const decoded = await adminAuth.verifyIdToken(idToken);
    const callerUid = decoded.uid;

    // 2. Confirm caller is a partner or partner_admin
    const callerSnap = await adminDb.collection('users').doc(callerUid).get();
    if (!callerSnap.exists) {
      return { success: false, error: 'Caller user not found.' };
    }
    const callerData = callerSnap.data()!;
    const allowedRoles = ['partner', 'partner_admin'];
    if (!allowedRoles.includes(callerData.role)) {
      return { success: false, error: 'Unauthorized: only partners can update service overrides.' };
    }

    // Resolve the partnerId (owner's UID)
    const partnerId = callerData.role === 'partner' ? callerUid : callerData.partnerId;
    if (!partnerId) {
      return { success: false, error: 'Could not resolve partner ID.' };
    }

    // 3. Fetch the global service to get the authoritative retail price floor
    const serviceSnap = await adminDb.collection('services').doc(serviceId).get();
    if (!serviceSnap.exists) {
      return { success: false, error: 'Service not found.' };
    }
    const serviceData = serviceSnap.data()!;
    const retailFloor: number = serviceData.price;

    // 4. Enforce price floor — partner cannot sell below our retail price
    if (typeof overrideData.price === 'number' && overrideData.price < retailFloor) {
      return {
        success: false,
        error: `Selling price cannot be lower than My Accountant's retail price of R${retailFloor.toFixed(2)}. Partners must sell at or above our standard rates.`,
      };
    }

    // 5. Write the override via Admin SDK (bypasses Firestore client rules)
    const overrideRef = adminDb
      .collection('users')
      .doc(partnerId)
      .collection('serviceOverrides')
      .doc(serviceId);

    await overrideRef.set(overrideData);

    return { success: true };
  } catch (e: any) {
    console.error('saveServiceOverrideAction error:', e);
    return { success: false, error: e.message || 'Internal server error.' };
  }
}

export async function deleteServiceOverrideAction({
  idToken,
  serviceId,
}: {
  idToken: string;
  serviceId: string;
}) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    const decoded = await adminAuth.verifyIdToken(idToken);
    const callerUid = decoded.uid;

    const callerSnap = await adminDb.collection('users').doc(callerUid).get();
    if (!callerSnap.exists) return { success: false, error: 'Caller user not found.' };

    const callerData = callerSnap.data()!;
    const partnerId = callerData.role === 'partner' ? callerUid : callerData.partnerId;
    if (!partnerId) return { success: false, error: 'Could not resolve partner ID.' };

    const overrideRef = adminDb
      .collection('users')
      .doc(partnerId)
      .collection('serviceOverrides')
      .doc(serviceId);

    await overrideRef.delete();

    return { success: true };
  } catch (e: any) {
    console.error('deleteServiceOverrideAction error:', e);
    return { success: false, error: e.message || 'Internal server error.' };
  }
}

export async function bulkUpdateServiceOverridesAction({
  idToken,
  updates,
}: {
  idToken: string;
  updates: Array<{ serviceId: string; overrideData: Record<string, any> }>;
}) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    const decoded = await adminAuth.verifyIdToken(idToken);
    const callerUid = decoded.uid;

    const callerSnap = await adminDb.collection('users').doc(callerUid).get();
    if (!callerSnap.exists) return { success: false, error: 'Caller user not found.' };

    const callerData = callerSnap.data()!;
    const partnerId = callerData.role === 'partner' ? callerUid : callerData.partnerId;
    if (!partnerId) return { success: false, error: 'Could not resolve partner ID.' };

    // Fetch all service retail prices in parallel
    const serviceSnaps = await Promise.all(
      updates.map(u => adminDb.collection('services').doc(u.serviceId).get())
    );

    const batch = adminDb.batch();
    const violations: string[] = [];

    updates.forEach((u, idx) => {
      const serviceSnap = serviceSnaps[idx];
      if (!serviceSnap.exists) return;

      const retailFloor: number = serviceSnap.data()!.price;
      const proposedPrice: number | undefined = u.overrideData.price;

      // Clamp to retail floor — never allow below
      const safePrice =
        typeof proposedPrice === 'number'
          ? Math.max(proposedPrice, retailFloor)
          : retailFloor;

      if (typeof proposedPrice === 'number' && proposedPrice < retailFloor) {
        violations.push(serviceSnap.data()!.title || u.serviceId);
      }

      const overrideRef = adminDb
        .collection('users')
        .doc(partnerId)
        .collection('serviceOverrides')
        .doc(u.serviceId);

      batch.set(overrideRef, { ...u.overrideData, price: safePrice }, { merge: true });
    });

    await batch.commit();

    return {
      success: true,
      clampedCount: violations.length,
      clampedServices: violations,
    };
  } catch (e: any) {
    console.error('bulkUpdateServiceOverridesAction error:', e);
    return { success: false, error: e.message || 'Internal server error.' };
  }
}

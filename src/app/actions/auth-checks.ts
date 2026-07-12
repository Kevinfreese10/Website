'use server';

import { getAdminDb } from '@/lib/firebase-admin';

export async function checkSlugAvailability(slug: string) {
    try {
        const adminDb = getAdminDb();
        const snap = await adminDb.collection('users').where('landingPage.slug', '==', slug.toLowerCase().trim()).get();
        return { success: true, isAvailable: snap.empty };
    } catch (e) {
        console.error("Check slug availability failed:", e);
        return { success: false, isAvailable: false };
    }
}

export async function checkIfEmailExists(email: string) {
    try {
        const adminDb = getAdminDb();
        const snap = await adminDb.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get();
        return { success: true, exists: !snap.empty };
    } catch (e) {
        console.error("Check email existence failed:", e);
        return { success: false, exists: false };
    }
}

export async function checkExistingUserByEmail(email: string): Promise<{ exists: boolean; id?: string; name?: string; phone?: string; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const collectionsToTry = ['users', 'aiAccountantClients', 'adminClients', 'partnerClients'];
    const cleanEmail = email.trim();
    
    // Check all collections in parallel to minimize latency on signup/checkout checks
    const promises = collectionsToTry.map(async (colName) => {
      const snap = await adminDb.collection(colName)
        .where('email', 'in', [cleanEmail, cleanEmail.toLowerCase()])
        .limit(1)
        .get();
        
      if (!snap.empty) {
        const userData = snap.docs[0].data();
        const fullName = userData.name || userData.companyName || 'Existing Client';
        return {
          exists: true,
          id: snap.docs[0].id,
          name: fullName,
          phone: userData.contactNumber || userData.cellNumber || userData.phone || ''
        };
      }
      return null;
    });

    const results = await Promise.all(promises);
    const found = results.find(r => r !== null);
    
    return found || { exists: false };
  } catch (error: any) {
    console.error("Error in checkExistingUserByEmail:", error);
    return { exists: false, error: error.message || 'Failed to check existing user' };
  }
}

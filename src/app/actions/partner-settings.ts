'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { encrypt } from '@/lib/encryption';
import { getAuth } from 'firebase-admin/auth';

export async function saveGeminiKey(idToken: string, apiKey: string) {
    try {
        if (!idToken) {
            return { success: false, error: 'Unauthorized' };
        }
        
        const decodedClaims = await getAuth().verifyIdToken(idToken);
        const partnerId = decodedClaims.uid;
        const adminDb = getAdminDb();
        
        // Encrypt the API key before saving
        let encryptedKey = '';
        if (apiKey && apiKey.trim().length > 0) {
            encryptedKey = encrypt(apiKey.trim());
        }

        await adminDb.collection('users').doc(partnerId).update({
            geminiApiKey: encryptedKey || null
        });

        return { success: true };
    } catch (error) {
        console.error("Error saving Gemini key:", error);
        return { success: false, error: 'Failed to save Gemini key' };
    }
}

export async function syncCustomDomainMapping(idToken: string, oldDomain: string | null, newDomain: string | null, slug: string) {
    try {
        if (!idToken) return { success: false, error: 'Unauthorized' };
        
        await getAuth().verifyIdToken(idToken);
        const adminDb = getAdminDb();
        const batch = adminDb.batch();
        
        if (oldDomain && oldDomain !== newDomain) {
            batch.delete(adminDb.collection('domainMappings').doc(oldDomain));
        }
        
        if (newDomain) {
            batch.set(adminDb.collection('domainMappings').doc(newDomain), { slug });
        }
        
        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error("Error syncing custom domain:", error);
        return { success: false, error: 'Failed to sync domain' };
    }
}

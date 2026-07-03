'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { encrypt } from '@/lib/encryption';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';

export async function saveGeminiKey(apiKey: string) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;
        if (!sessionCookie) {
            return { success: false, error: 'Unauthorized' };
        }
        
        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
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

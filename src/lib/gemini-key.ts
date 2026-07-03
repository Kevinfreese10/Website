import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { decrypt } from '@/lib/encryption';
import { getCustomAi } from '@/ai/genkit';

/**
 * Fetches the currently authenticated partner's custom Gemini API key (if set),
 * decrypts it, and returns a custom Genkit AI instance. 
 * Falls back to the default AI instance if no custom key is configured.
 */
export async function getPartnerAiInstance() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;
        if (!sessionCookie) return getCustomAi(); // Fallback to default

        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
        const userDoc = await getAdminDb().collection('users').doc(decodedClaims.uid).get();
        
        if (userDoc.exists) {
            const data = userDoc.data();
            if (data?.geminiApiKey) {
                const decryptedKey = decrypt(data.geminiApiKey);
                return getCustomAi(decryptedKey);
            }
        }
    } catch (error) {
        console.error("Failed to load partner custom AI key:", error);
    }
    
    // Fallback to default
    return getCustomAi();
}

'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { encrypt } from '@/lib/encryption';
import { getAuth } from 'firebase-admin/auth';
import { revalidatePath } from 'next/cache';

const RESERVED_SLUGS = [
  'admin', 'login', 'signup', 'api', 'dashboard', 'partner', 'p', 
  'products', 'blog', 'about', 'contact', 'compliance', 'terms', 
  'popia', 'refund-policy', 'support', 'calculators', 'reviews'
];

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

/**
 * Securely synchronize a custom domain mapping with ownership validation.
 */
export async function syncCustomDomainMapping(idToken: string, oldDomain: string | null, newDomain: string | null, slug: string) {
    try {
        if (!idToken) return { success: false, error: 'Unauthorized' };
        
        const decodedClaims = await getAuth().verifyIdToken(idToken);
        const partnerId = decodedClaims.uid;
        const adminDb = getAdminDb();

        const cleanOld = oldDomain ? oldDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
        const cleanNew = newDomain ? newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
        const cleanSlug = slug.trim().toLowerCase();

        // 1. Verify partner's actual slug
        const partnerDoc = await adminDb.collection('users').doc(partnerId).get();
        if (!partnerDoc.exists) {
            return { success: false, error: 'Partner account not found' };
        }
        const partnerData = partnerDoc.data();
        const actualSlug = partnerData?.landingPage?.slug;
        if (actualSlug && actualSlug !== cleanSlug) {
            return { success: false, error: 'Slug does not match authenticated partner profile.' };
        }

        const batch = adminDb.batch();

        // 2. Safely remove old domain mapping with ownership check
        if (cleanOld && cleanOld !== cleanNew) {
            const oldMappingRef = adminDb.collection('domainMappings').doc(cleanOld);
            const oldMappingSnap = await oldMappingRef.get();
            if (oldMappingSnap.exists) {
                const mappingData = oldMappingSnap.data();
                // Only delete if owned by this partner or if unassigned legacy mapping
                if (!mappingData?.partnerId || mappingData.partnerId === partnerId || partnerData?.landingPage?.customDomain === cleanOld) {
                    batch.delete(oldMappingRef);
                } else {
                    console.warn(`[syncCustomDomainMapping] Partner ${partnerId} attempted to delete domain ${cleanOld} owned by ${mappingData.partnerId}`);
                }
            }
        }

        // 3. Claim new domain mapping with conflict prevention
        if (cleanNew) {
            const newMappingRef = adminDb.collection('domainMappings').doc(cleanNew);
            const newMappingSnap = await newMappingRef.get();
            if (newMappingSnap.exists) {
                const existingData = newMappingSnap.data();
                if (existingData?.partnerId && existingData.partnerId !== partnerId) {
                    return { 
                        success: false, 
                        error: `The domain "${cleanNew}" is already registered to another partner. If you own this domain, please contact support.` 
                    };
                }
            }

            batch.set(newMappingRef, { 
                slug: cleanSlug,
                partnerId,
                updatedAt: new Date().toISOString()
            });
        }

        await batch.commit();
        return { success: true };
    } catch (error: any) {
        console.error("Error syncing custom domain:", error);
        return { success: false, error: error?.message || 'Failed to sync custom domain.' };
    }
}

/**
 * Check if a storefront URL slug is available for a partner.
 */
export async function checkSlugAvailability(idToken: string, slug: string) {
    try {
        if (!idToken) return { available: false, message: 'Unauthorized' };
        
        const decodedClaims = await getAuth().verifyIdToken(idToken);
        const partnerId = decodedClaims.uid;
        const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

        if (!cleanSlug || cleanSlug.length < 3) {
            return { available: false, message: 'Slug must be at least 3 characters long.' };
        }

        if (RESERVED_SLUGS.includes(cleanSlug)) {
            return { available: false, message: 'This web address is a reserved system path and cannot be used.' };
        }

        const adminDb = getAdminDb();
        const querySnapshot = await adminDb
            .collection('users')
            .where('landingPage.slug', '==', cleanSlug)
            .get();

        if (!querySnapshot.empty) {
            const isOwnedBySelf = querySnapshot.docs.every(doc => doc.id === partnerId);
            if (!isOwnedBySelf) {
                return { available: false, message: 'This web address is already in use by another practice.' };
            }
        }

        return { available: true };
    } catch (error: any) {
        console.error("Error checking slug availability:", error);
        return { available: false, message: 'Failed to verify slug availability.' };
    }
}

/**
 * Instantly revalidate partner storefront routes on demand.
 */
export async function revalidatePartnerStorefront(slug: string) {
    try {
        const cleanSlug = slug.trim().toLowerCase();
        if (!cleanSlug) return { success: false };

        revalidatePath(`/p/${cleanSlug}`);
        revalidatePath(`/p/${cleanSlug}/products`);
        revalidatePath(`/p/${cleanSlug}/refund-policy`);
        revalidatePath(`/p/${cleanSlug}/terms`);
        revalidatePath(`/p/${cleanSlug}/popia`);

        return { success: true };
    } catch (error) {
        console.error("Error revalidating partner storefront:", error);
        return { success: false };
    }
}


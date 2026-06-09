'use server';

import { getAdminDb } from '@/lib/firebase-admin';

interface FacebookSettings {
    pageId: string;
    pageAccessToken: string;
    pageName?: string;
    pagePictureUrl?: string;
}

export async function testFacebookConnectionAction(pageId: string, pageAccessToken: string) {
    if (!pageId || !pageAccessToken) {
        return { success: false, error: "Page ID and Access Token are required." };
    }

    try {
        const cleanPageId = pageId.trim();
        const cleanToken = pageAccessToken.trim();
        let resolvedPageToken = cleanToken;

        // 1. Try to query /me/accounts in case the user provided their User Access Token.
        // If it's a User Access Token, this will list the pages they manage and we can extract the correct Page Access Token.
        try {
            const accountsUrl = `https://graph.facebook.com/v20.0/me/accounts?access_token=${cleanToken}`;
            const accountsRes = await fetch(accountsUrl, { method: 'GET', cache: 'no-store' });
            const accountsData = await accountsRes.json();
            
            if (accountsData && Array.isArray(accountsData.data)) {
                const targetPage = accountsData.data.find((p: any) => p.id === cleanPageId);
                if (targetPage && targetPage.access_token) {
                    resolvedPageToken = targetPage.access_token;
                    console.log(`Successfully resolved Page Access Token for Page ID ${cleanPageId} from User Token.`);
                }
            }
        } catch (accountsErr) {
            console.warn("Failed to check /me/accounts (token might be a direct page token already):", accountsErr);
        }

        // 2. Query page details with the resolved token
        const url = `https://graph.facebook.com/v20.0/${cleanPageId}?fields=name,picture&access_token=${resolvedPageToken}`;
        const res = await fetch(url, { method: 'GET', cache: 'no-store' });
        const data = await res.json();

        if (data.error) {
            return { 
                success: false, 
                error: data.error.message || "Failed to connect to Facebook Page." 
            };
        }

        return {
            success: true,
            pageName: data.name,
            pagePictureUrl: data.picture?.data?.url || null,
            resolvedPageToken: resolvedPageToken
        };
    } catch (e: any) {
        console.error("Facebook connection test error:", e);
        return { success: false, error: e.message || "Network error occurred." };
    }
}

/**
 * Saves Facebook settings for a specific user to Firestore.
 */
export async function saveFacebookSettingsAction(
    userId: string, 
    pageId: string, 
    pageAccessToken: string,
    pageName: string,
    pagePictureUrl: string
) {
    if (!userId) {
        return { success: false, error: "User authentication ID is required." };
    }

    try {
        const adminDb = getAdminDb();
        const userRef = adminDb.collection('users').doc(userId);
        
        await userRef.update({
            facebookSettings: {
                pageId: pageId.trim(),
                pageAccessToken: pageAccessToken.trim(),
                pageName: pageName.trim(),
                pagePictureUrl: pagePictureUrl || null
            }
        });

        return { success: true };
    } catch (e: any) {
        console.error("Facebook settings save error:", e);
        return { success: false, error: e.message || "Failed to save settings to Firestore." };
    }
}

/**
 * Posts ad content directly to the user's connected Facebook page.
 */
export async function postToFacebookPageAction(userId: string, message: string) {
    if (!userId) {
        return { success: false, error: "User authentication ID is required." };
    }
    if (!message) {
        return { success: false, error: "Post message cannot be empty." };
    }

    try {
        const adminDb = getAdminDb();
        const userDoc = await adminDb.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            return { success: false, error: "User account not found." };
        }

        const userData = userDoc.data();
        const facebookSettings: FacebookSettings | undefined = userData?.facebookSettings;

        if (!facebookSettings || !facebookSettings.pageId || !facebookSettings.pageAccessToken) {
            return { 
                success: false, 
                error: "Facebook Page integration is not set up. Please configure it first." 
            };
        }

        const { pageId, pageAccessToken } = facebookSettings;
        const postUrl = `https://graph.facebook.com/v20.0/${pageId}/feed`;

        const res = await fetch(postUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                access_token: pageAccessToken
            }),
            cache: 'no-store'
        });

        const responseData = await res.json();

        if (responseData.error) {
            return { 
                success: false, 
                error: responseData.error.message || "Facebook Graph API returned an error." 
            };
        }

        return { 
            success: true, 
            postId: responseData.id 
        };
    } catch (e: any) {
        console.error("Facebook post error:", e);
        return { success: false, error: e.message || "Failed to post content to Facebook Page." };
    }
}

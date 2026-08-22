'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { getVerifiedAuthContext } from '@/lib/server-auth';

/**
 * These actions read and use a live Facebook Page access token and publish content as that Page.
 * They previously took `userId` as a plain caller-supplied argument with no verification, so
 * anyone could post arbitrary content (including links and images) to the practice's own Facebook
 * Page or any partner's, and could overwrite the stored integration settings.
 */
async function requireSelfOrAdmin(idToken: string | undefined, userId: string) {
  const authCtx = await getVerifiedAuthContext(idToken);
  if (!authCtx) return { success: false as const, error: 'Unauthorized: A valid authentication token is required.' };
  const isAdmin = authCtx.isAdmin || authCtx.user.role === 'admin';
  if (!isAdmin && authCtx.userId !== userId) {
    return { success: false as const, error: 'Forbidden: You may only manage your own connected page.' };
  }
  return null;
}

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
    pagePictureUrl: string,
    idToken?: string
) {
    if (!userId) {
        return { success: false, error: "User authentication ID is required." };
    }

    const authError = await requireSelfOrAdmin(idToken, userId);
    if (authError) return authError;

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
export async function postToFacebookPageAction(
    userId: string, 
    message: string, 
    options?: { link?: string; imageUrl?: string; postMode?: 'link' | 'photo' },
    idToken?: string
) {
    if (!userId) {
        return { success: false, error: "User authentication ID is required." };
    }
    if (!message) {
        return { success: false, error: "Post message cannot be empty." };
    }

    const authError = await requireSelfOrAdmin(idToken, userId);
    if (authError) return authError;

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
        const postMode = options?.postMode || 'link';

        if (postMode === 'photo' && options?.imageUrl) {
            // Post as a photo post with the image URL
            const postUrl = `https://graph.facebook.com/v20.0/${pageId}/photos`;
            const res = await fetch(postUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: options.imageUrl,
                    caption: message,
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
                postId: responseData.post_id || responseData.id 
            };
        } else {
            // Post as a feed status update (with optional link preview)
            const postUrl = `https://graph.facebook.com/v20.0/${pageId}/feed`;
            const body: Record<string, any> = {
                message: message,
                access_token: pageAccessToken
            };

            if (options?.link) {
                body.link = options.link;
                
                // Force Facebook to re-scrape the URL to clear cache and update latest title/image
                try {
                    const scrapeUrl = `https://graph.facebook.com/v20.0/?id=${encodeURIComponent(options.link)}&scrape=true&access_token=${pageAccessToken}`;
                    const scrapeRes = await fetch(scrapeUrl, { method: 'POST', cache: 'no-store' });
                    const scrapeData = await scrapeRes.json();
                    if (scrapeData.error) {
                        console.warn("Facebook scrape warning:", scrapeData.error.message);
                    } else {
                        console.log(`Successfully forced Facebook re-scrape for: ${options.link}`);
                    }
                } catch (scrapeErr) {
                    console.warn("Failed to trigger Facebook scrape:", scrapeErr);
                }
            }

            const res = await fetch(postUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
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
        }
    } catch (e: any) {
        console.error("Facebook post error:", e);
        return { success: false, error: e.message || "Failed to post content to Facebook Page." };
    }
}

import { getAdminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import { SITE_URL, STATIC_OG_IMAGE } from './constants';

// Store cache in globalThis to persist across hot-module reloads in Next.js development mode
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache TTL
const g = globalThis as any;
if (g.isSeoCachePreloaded === undefined) {
  g.seoCache = {};
  g.isSeoCachePreloaded = false;
  g.seoCacheLastFetchTime = 0;
  g.activePreloadPromise = null;
}

async function ensureSeoCache() {
  const now = Date.now();
  if (g.isSeoCachePreloaded && (now - g.seoCacheLastFetchTime < CACHE_TTL)) {
    return;
  }
  
  if (g.activePreloadPromise) {
    return g.activePreloadPromise;
  }

  g.activePreloadPromise = (async () => {
    try {
      const adminDb = getAdminDb();
      const snap = await adminDb.collection('staticSeo').get();
      const cache: Record<string, any> = {};
      snap.forEach(doc => {
        cache[doc.id] = doc.data();
      });
      g.seoCache = cache;
      g.isSeoCachePreloaded = true;
      g.seoCacheLastFetchTime = Date.now();
    } catch (e) {
      console.error("Error preloading SEO cache:", e);
    } finally {
      g.activePreloadPromise = null;
    }
  })();

  return g.activePreloadPromise;
}

// Trigger background preload immediately when module is imported on server start
ensureSeoCache().catch(err => console.error("Initial SEO cache preloading failed:", err));

/**
 * Fetches dynamic SEO overrides for static pages from Firestore.
 * Ensures absolute URLs and explicit image objects for og:image to satisfy social scrapers.
 */
export function getStaticPageMetadata(pageId: string, defaults: Metadata): Metadata | Promise<Metadata> {
  const canonicalUrl = `${SITE_URL}${pageId === 'home' ? '' : `/${pageId}`}`;
  
  const rawDefaultTitle = defaults.title;
  let title = typeof rawDefaultTitle === 'string'
    ? rawDefaultTitle
    : (rawDefaultTitle as any)?.absolute ?? (rawDefaultTitle as any)?.default ?? 'My Accountant';
  let description = String(defaults.description || '');
  let imageUrl = STATIC_OG_IMAGE;
  let imageAlt = title;

  const buildMetadata = (data: any): Metadata => {
    if (data) {
      title = String(data.metaTitle?.trim() || data.title?.trim() || title);
      description = String(data.metaDescription?.trim() || data.description?.trim() || description);
      if (data.seoImageUrl) {
        imageUrl = data.seoImageUrl;
        // Ensure URL is absolute
        if (imageUrl.startsWith('/')) {
            imageUrl = `${SITE_URL}${imageUrl}`;
        }
      }
    }

    // Deduplicate repeated brand suffix (e.g., "| My Accountant | My Accountant" or "| My Accountant Partner Program | My Accountant")
    title = title.replace(/(\|\s*My Accountant(?:\s+Partner\s+Program)?)\s*\|\s*My Accountant\s*$/i, '$1');
    while (/\|\s*My Accountant\s*\|\s*My Accountant\s*$/i.test(title)) {
      title = title.replace(/\s*\|\s*My Accountant\s*$/i, '');
    }

    // Trim description cleanly at word boundary if > 158 chars
    if (description.length > 158) {
      const sliced = description.slice(0, 155);
      const lastSpace = sliced.lastIndexOf(' ');
      const cut = lastSpace > 100 ? sliced.slice(0, lastSpace) : sliced;
      description = `${cut.replace(/[.,;:\s]+$/, '')}...`;
    }

    imageAlt = data?.seoImageLabel || title;

    return {
      ...defaults,
      title: { absolute: title },
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
          title,
          description,
          url: canonicalUrl,
          siteName: 'My Accountant',
          locale: 'en_ZA',
          type: 'website',
          images: [
              { 
                url: imageUrl, 
                width: 1200, 
                height: 630,
                alt: imageAlt
              }
          ],
      },
      twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [imageUrl],
      }
    };
  };

  // Synchronous path for cache hits: returns Metadata directly to keep head rendering synchronous
  if (g.isSeoCachePreloaded) {
    const data = g.seoCache[pageId];
    return buildMetadata(data);
  }

  // Asynchronous path for first load: returns Promise<Metadata> with a timeout
  const fetchPromise = ensureSeoCache().then(() => {
    const data = g.seoCache[pageId];
    return buildMetadata(data);
  });

  const timeoutPromise = new Promise<Metadata>((resolve) =>
    setTimeout(() => {
      console.warn(`[SEO Metadata Timeout] Preloading cache timed out for page: ${pageId}. Using defaults.`);
      resolve(buildMetadata(undefined));
    }, 3500)
  );

  return Promise.race([fetchPromise, timeoutPromise]);
}

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

export function getAdminApp() {
  if (getApps().length === 0) {
    // 1. Check if a service account JSON string is provided in env
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
      try {
        const credentials = JSON.parse(serviceAccountJson);
        return initializeApp({
          credential: cert(credentials),
          projectId: credentials.project_id || "studio-2604127518-57889"
        });
      } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", e);
      }
    }

    // 2. Check if a service account file path is provided in env
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      try {
        const credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        return initializeApp({
          credential: cert(credentials),
          projectId: credentials.project_id || "studio-2604127518-57889"
        });
      } catch (e) {
        console.error("Failed to load service account key from file path:", e);
      }
    }

    // 3. Fallback: search the Downloads folder for the correct service account key file
    const downloadsPath = 'C:/Users/kev/Downloads';
    if (fs.existsSync(downloadsPath)) {
      try {
        const files = fs.readdirSync(downloadsPath);
        const keyFile = files.find(f => f.toLowerCase().includes('studio-2604127518-57889') && f.endsWith('.json'));
        if (keyFile) {
          const fullPath = `${downloadsPath}/${keyFile}`;
          const credentials = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          return initializeApp({
            credential: cert(credentials),
            projectId: credentials.project_id || "studio-2604127518-57889"
          });
        }
      } catch (e) {
        console.error("Failed to search Downloads folder for service account key:", e);
      }
    }

    // 4. Fallback to hardcoded path as last resort
    const hardcodedPaths = [
      'C:/Users/kev/Downloads/my-accountant-2-64964159-8c80f-firebase-adminsdk-fbsvc-bbe7506850.json'
    ];
    for (const p of hardcodedPaths) {
      if (fs.existsSync(p)) {
        try {
          const credentials = JSON.parse(fs.readFileSync(p, 'utf8'));
          return initializeApp({
            credential: cert(credentials),
            projectId: credentials.project_id || "studio-2604127518-57889"
          });
        } catch (e) {
          console.error(`Failed to load service account key from fallback path ${p}:`, e);
        }
      }
    }

    // 5. Default initialization (works on GCP/App Hosting)
    initializeApp({
      projectId: "studio-2604127518-57889"
    });
  }
}

export function getAdminDb() {
  getAdminApp();
  return getFirestore();
}

export function getAdminAuth() {
  getAdminApp();
  return getAuth();
}

// Helper to recursively serialize firestore timestamps and custom objects to clean JSON values
export function serializeDbData(data: any): any {
  if (data === null || data === undefined) return data;
  
  // Handle Array
  if (Array.isArray(data)) {
    return data.map(item => serializeDbData(item));
  }

  // Handle firestore Timestamp (Node SDK uses admin firestore.Timestamp, which has toDate)
  if (data && typeof data === 'object' && typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  // Handle standard Object
  if (typeof data === 'object') {
    const serialized: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      serialized[key] = serializeDbData(data[key]);
    }
    return serialized;
  }

  return data;
}

export async function getPartnerBySlug(slug: string) {
  const db = getAdminDb();
  const snapshot = await db.collection("users")
    .where("landingPage.enabled", "==", true)
    .where("landingPage.slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    ...serializeDbData(data),
    id: doc.id,
    uid: doc.id,
  } as any;
}

export async function getServices() {
  const db = getAdminDb();
  const snapshot = await db.collection("services").orderBy("title").get();
  return snapshot.docs.map(doc => ({
    ...serializeDbData(doc.data()),
    id: doc.id
  } as any));
}

export async function getService(slug: string) {
  const db = getAdminDb();
  const snapshot = await db.collection("services")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return {
    ...serializeDbData(doc.data()),
    id: doc.id
  } as any;
}

export async function getPartnerOverrides(partnerId: string) {
  const db = getAdminDb();
  const snapshot = await db.collection('users').doc(partnerId).collection('serviceOverrides').get();
  const overrides: Record<string, any> = {};
  snapshot.docs.forEach(doc => {
    overrides[doc.id] = serializeDbData(doc.data());
  });
  return overrides;
}

export async function getPartnerOverride(partnerId: string, serviceId: string) {
  const db = getAdminDb();
  const snap = await db.collection('users').doc(partnerId).collection('serviceOverrides').doc(serviceId).get();
  return snap.exists ? serializeDbData(snap.data()) : null;
}

export async function getCategories() {
  const db = getAdminDb();
  const snapshot = await db.collection("categories").orderBy("order").get();
  return snapshot.docs.map(doc => ({
    ...serializeDbData(doc.data()),
    id: doc.id
  } as any));
}


import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

function logInit(msg: string) {
  console.log(`[Firebase Admin] ${msg}`);
}

export function getAdminApp() {
  // If already initialized, return the existing app immediately
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // 1. Prefer FIREBASE_SERVICE_ACCOUNT env var (JSON string)
  //    Set this in Firebase App Hosting secrets for production.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      logInit('Initializing using FIREBASE_SERVICE_ACCOUNT env var...');
      const credentials = JSON.parse(serviceAccountJson);
      const app = initializeApp({
        credential: cert(credentials),
        projectId: credentials.project_id || 'studio-2604127518-57889',
      });
      logInit('Succeeded initializing using FIREBASE_SERVICE_ACCOUNT env var.');
      return app;
    } catch (e: any) {
      logInit(`Failed to parse FIREBASE_SERVICE_ACCOUNT: ${e.message}`);
    }
  }

  // 2. Optionally accept a file path via env var (local dev — set in .env.local, never hardcoded)
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountPath) {
    if (fs.existsSync(serviceAccountPath)) {
      try {
        logInit(`Initializing using FIREBASE_SERVICE_ACCOUNT_KEY path: ${serviceAccountPath}`);
        const credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        const app = initializeApp({
          credential: cert(credentials),
          projectId: credentials.project_id || 'studio-2604127518-57889',
        });
        logInit('Succeeded initializing using FIREBASE_SERVICE_ACCOUNT_KEY.');
        return app;
      } catch (e: any) {
        logInit(`Failed to load service account key from path: ${e.message}`);
      }
    } else {
      logInit(`FIREBASE_SERVICE_ACCOUNT_KEY path does not exist: ${serviceAccountPath}`);
    }
  }

  // 3. Fall back to Application Default Credentials — automatically available on Firebase App Hosting / GCP
  logInit('Falling back to Application Default Credentials (ADC)...');
  const app = initializeApp({
    projectId: 'studio-2604127518-57889',
  });
  logInit('Initialized with Application Default Credentials successfully.');
  return app;
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
  const snapshot = await db.collection('users')
    .where('landingPage.enabled', '==', true)
    .where('landingPage.slug', '==', slug)
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
  const snapshot = await db.collection('services').orderBy('title').get();
  return snapshot.docs.map(doc => ({
    ...serializeDbData(doc.data()),
    id: doc.id
  } as any));
}

export async function getService(slug: string) {
  const db = getAdminDb();
  const snapshot = await db.collection('services')
    .where('slug', '==', slug)
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
  const snapshot = await db.collection('categories').orderBy('order').get();
  return snapshot.docs.map(doc => ({
    ...serializeDbData(doc.data()),
    id: doc.id
  } as any));
}

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


import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp({
      projectId: "studio-2604127518-57889"
    });
  }
  return getFirestore();
}

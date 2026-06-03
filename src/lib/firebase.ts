
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence, memoryLocalCache } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "AIzaSyAxu9Wf1LY0q828bpZxq0US_ckbgONv6eI",
  authDomain: "studio-2604127518-57889.firebaseapp.com",
  projectId: "studio-2604127518-57889",
  storageBucket: "studio-2604127518-57889.firebasestorage.app",
  messagingSenderId: "248831476160",
  appId: "1:248831476160:web:bb7a5968b7dd2e1318c825",
  measurementId: "G-LVKV0215TP"
};

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

// Use a global variable to ensure Firebase is initialized only once.
let firebaseServices: FirebaseServices | null = null;
let persistenceEnabled = false;

function initializeFirebase(): FirebaseServices {
  if (firebaseServices) {
    return firebaseServices;
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (typeof window !== 'undefined' && !persistenceEnabled) {
    enableIndexedDbPersistence(db, {
        forceOwnership: true,
      })
      .then(() => {
        persistenceEnabled = true;
        console.log("Firestore persistence enabled.");
      })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore persistence failed: Multiple tabs open. Using in-memory cache.');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore persistence not supported in this browser.');
        } else {
            console.error("Error enabling Firestore persistence:", err);
        }
      });
  }

  firebaseServices = { app, auth, db };
  return firebaseServices;
}

// Immediately initialize and export the services.
const { app: firebaseApp, auth, db } = initializeFirebase();

let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(firebaseApp);
}

export { firebaseApp, auth, db, analytics };

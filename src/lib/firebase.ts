
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore 
} from 'firebase/firestore';
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

// Use a global variable to ensure Firebase is initialized only once across hot reloads.
let firebaseServices: FirebaseServices | null = null;

function initializeFirebase(): FirebaseServices {
  if (firebaseServices) {
    return firebaseServices;
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  let db: Firestore;
  if (typeof window !== 'undefined') {
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      // If Firestore is already initialized on this app instance, get existing instance
      db = getFirestore(app);
    }
  } else {
    db = getFirestore(app);
  }

  firebaseServices = { app, auth, db };
  return firebaseServices;
}

// Immediately initialize and export the services.
const { app: firebaseApp, auth, db } = initializeFirebase();

let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(firebaseApp);
  } catch {
    // Analytics ignored if blocked or unsupported
  }
}

export { firebaseApp, auth, db, analytics };

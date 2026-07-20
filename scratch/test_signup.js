require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
    try {
        const email = `test.partner.${Date.now()}@example.com`;
        console.log(`Creating user ${email}`);
        const userCredential = await createUserWithEmailAndPassword(auth, email, 'password123');
        const uid = userCredential.user.uid;
        console.log(`User created with UID ${uid}`);
        
        const docRef = doc(db, 'users', uid);
        await setDoc(docRef, {
            name: "Test User",
            email: email,
            role: "partner",
        });
        console.log("Successfully wrote to users collection.");
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit();
}

run();

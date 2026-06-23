import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const credentials = {
  email: "info@myacc.co.za",
  pass: "Thinkestry10$"
};

const keys = [
  { name: "Key from firebase.ts", key: "AIzaSyAxu9Wf1LY0q828bpZxq0US_ckbgONv6eI" },
  { name: "Key from test_client_auth.js", key: "AIzaSyD6-yfkYDj_ONK_tZdHhQy3RITU8F9zrU8" }
];

async function testKey(name: string, apiKey: string) {
  const firebaseConfig = {
    projectId: "studio-2604127518-57889",
    appId: "1:248831476160:web:bb7a5968b7dd2e1318c825",
    storageBucket: "studio-2604127518-57889.firebasestorage.app",
    apiKey: apiKey,
    authDomain: "studio-2604127518-57889.firebaseapp.com",
    messagingSenderId: "248831476160"
  };

  try {
    console.log(`\nTesting: ${name} (${apiKey})`);
    const app = initializeApp(firebaseConfig, name); // use unique app name to avoid collision
    const auth = getAuth(app);
    const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.pass);
    console.log(`SUCCESS! Signed in User UID: ${userCredential.user.uid}`);
    return true;
  } catch (error: any) {
    console.error(`FAILED with error: code=${error.code}, message=${error.message}`);
    return false;
  }
}

async function main() {
  for (const k of keys) {
    await testKey(k.name, k.key);
  }
}

main();

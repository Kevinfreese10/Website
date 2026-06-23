import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  projectId: "studio-2604127518-57889",
  appId: "1:248831476160:web:bb7a5968b7dd2e1318c825",
  storageBucket: "studio-2604127518-57889.firebasestorage.app",
  apiKey: "AIzaSyAxu9Wf1LY0q828bpZxq0US_ckbgONv6eI", // default key
  authDomain: "studio-2604127518-57889.firebaseapp.com",
  messagingSenderId: "248831476160"
};

const usersToTest = [
  { email: "kev@thinkestry.co.za" },
  { email: "info@myacc.co.za" },
  { email: "temp-admin@myacc.co.za" },
  { email: "winifred@myacc.co.za" }
];

const passwordsToTest = [
  "Thinkestry10$",
  "Thinkestry10",
  "KhaiFreese11",
  "KhaiFreese10",
  "KhaiFreese"
];

async function main() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  for (const user of usersToTest) {
    for (const pass of passwordsToTest) {
      try {
        console.log(`Trying: ${user.email} / ${pass}`);
        const userCredential = await signInWithEmailAndPassword(auth, user.email, pass);
        console.log(`>>> SUCCESS! Signed in ${user.email} with ${pass}. UID: ${userCredential.user.uid}`);
        return;
      } catch (error: any) {
        // Quietly continue if credentials are wrong
      }
    }
  }
  console.log("No user/password combination succeeded.");
}

main();

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  "projectId": "studio-2604127518-57889",
  "appId": "1:248831476160:web:4ad085282b5fd36518c825",
  "storageBucket": "studio-2604127518-57889.firebasestorage.app",
  "apiKey": "AIzaSyD6-yfkYDj_ONK_tZdHhQy3RITU8F9zrU8",
  "authDomain": "studio-2604127518-57889.firebaseapp.com",
  "messagingSenderId": "248831476160"
};

async function main() {
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        console.log("Attempting to sign in to Firebase Auth...");
        const userCredential = await signInWithEmailAndPassword(auth, "info@myacc.co.za", "Thinkestry10$");
        console.log("SUCCESSFULLY SIGNED IN! User ID:", userCredential.user.uid);

        console.log("Fetching client doc...");
        const docRef = doc(db, 'aiAccountantClients', 'MVa8u4DGCjfAaSG8ILWr');
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            console.log("No such client doc found!");
            return;
        }

        const data = docSnap.data();
        console.log("Client Name:", data.name);
        console.log("Is VAT Registered:", data.isVatRegistered);

    } catch (e) {
        console.error("Error:", e);
    }
}

main();

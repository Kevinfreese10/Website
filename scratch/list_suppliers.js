const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');

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
        const db = getFirestore(app);

        console.log("Fetching clients...");
        const clientsSnap = await getDocs(collection(db, 'aiAccountantClients'));
        let targetClientId = null;
        clientsSnap.forEach(doc => {
            const data = doc.data();
            console.log(`Client ID: ${doc.id} | Name: ${data.name || data.companyName}`);
            if ((data.name || "").includes("Carte Blanche S39") || (data.companyName || "").includes("Carte Blanche S39")) {
                targetClientId = doc.id;
            }
        });

        if (!targetClientId) {
            console.log("Could not find Carte Blanche S39 client!");
            return;
        }

        console.log(`\nTarget Client ID found: ${targetClientId}`);

        // Fetch suppliers
        const suppliersSnap = await getDocs(collection(db, `aiAccountantClients/${targetClientId}/suppliers`));
        console.log(`\n--- Suppliers (${suppliersSnap.size}) ---`);
        suppliersSnap.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id} | Name: "${data.name}"`);
        });

        // Fetch customers
        const customersSnap = await getDocs(collection(db, `aiAccountantClients/${targetClientId}/customers`));
        console.log(`\n--- Customers (${customersSnap.size}) ---`);
        customersSnap.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id} | Name: "${data.name}"`);
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

main();

import { db } from '../src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
    try {
        console.log("Fetching all documents from 'settings' collection...");
        const snap = await getDocs(collection(db, 'settings'));
        snap.forEach(doc => {
            console.log(`Document ID: ${doc.id}`);
            console.log("Data:", JSON.stringify(doc.data(), null, 2));
            console.log("------------------------------------------");
        });
        process.exit(0);
    } catch (e: any) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}

main();

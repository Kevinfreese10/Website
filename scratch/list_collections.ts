import { db } from '../src/lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

async function main() {
    try {
        console.log("Listing some documents to infer collections...");
        // Since client-side Firestore cannot list collections directly without admin SDK,
        // we can try fetching from common collections.
        const commonCollections = ['users', 'orders', 'services', 'settings', 'config', 'partners', 'resellers', 'clients'];
        
        for (const col of commonCollections) {
            const q = query(collection(db, col), limit(1));
            try {
                const snap = await getDocs(q);
                console.log(`Collection '${col}': ${snap.empty ? 'Empty or Not Found' : 'Exists (has docs)'}`);
                if (!snap.empty) {
                    console.log(`  Sample doc from '${col}':`, snap.docs[0].id);
                }
            } catch (err: any) {
                console.log(`Collection '${col}': Error/No Access (${err.message})`);
            }
        }
        process.exit(0);
    } catch (e: any) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}

main();

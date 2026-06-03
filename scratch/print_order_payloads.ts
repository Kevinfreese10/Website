import { db } from '../src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
    try {
        const snap = await getDocs(collection(db, 'orders'));
        snap.forEach(doc => {
            const data = doc.data();
            if (data.itnHistory && data.itnHistory.length > 0) {
                console.log(`==========================================`);
                console.log(`Order ID: ${data.id}`);
                data.itnHistory.forEach((itn: any, idx: number) => {
                    console.log(`  ITN [${idx}] Status: ${itn.status} | Message: ${itn.message}`);
                    if (itn.payload) {
                        console.log("  Payload:", JSON.stringify(itn.payload, null, 2));
                    }
                });
            }
        });
        process.exit(0);
    } catch (e: any) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}

main();

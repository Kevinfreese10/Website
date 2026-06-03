import { db } from '../src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function main() {
    try {
        console.log("Fetching Order 9918...");
        const docSnap = await getDoc(doc(db, 'orders', '9918'));
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Status:", data.status);
            console.log("ITN History length:", data.itnHistory ? data.itnHistory.length : 0);
            if (data.itnHistory && data.itnHistory.length > 0) {
                console.log("First ITN History entry:");
                console.log("Received Signature:", data.itnHistory[0].payload.signature);
                console.log("Payload keys:", Object.keys(data.itnHistory[0].payload));
                console.log("Payload values:", JSON.stringify(data.itnHistory[0].payload, null, 2));
            }
        } else {
            console.log("Order 9918 not found!");
        }
        process.exit(0);
    } catch (e: any) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}

main();

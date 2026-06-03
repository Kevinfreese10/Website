import { db } from '../src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function main() {
    const snap = await getDoc(doc(db, 'orders', '9943'));
    const data = snap.data();
    console.log("ITN History for 9943:");
    data?.itnHistory.forEach((itn: any, idx: number) => {
        console.log(`\nEntry #${idx}:`);
        console.log(`Status: ${itn.status}`);
        console.log(`Message: ${itn.message}`);
        if (itn.payload) {
            console.log(`Signature: ${itn.payload.signature}`);
        }
    });
    process.exit(0);
}

main();

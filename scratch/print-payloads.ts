import { db } from '../src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function main() {
    const snap9469 = await getDoc(doc(db, 'orders', '9469'));
    const snap9943 = await getDoc(doc(db, 'orders', '9943'));
    
    console.log("=== 9469 (MATCHED FOR KhaiFreese10) ===");
    const itn9469 = snap9469.data()?.itnHistory.find((x: any) => x.payload && x.payload.signature === '7afec059c3d6de3318df8a3080280b74');
    console.log(JSON.stringify(itn9469?.payload, null, 2));

    console.log("\n=== 9943 (NO MATCH) ===");
    const itn9943 = snap9943.data()?.itnHistory.find((x: any) => x.payload && x.payload.signature === '07c52fd82f98cdc00aa66cddfe50b069');
    console.log(JSON.stringify(itn9943?.payload, null, 2));
    
    process.exit(0);
}

main();

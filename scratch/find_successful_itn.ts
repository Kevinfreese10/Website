import { db } from '../src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
    try {
        const snap = await getDocs(collection(db, 'orders'));
        let successCount = 0;
        let totalCount = 0;
        
        snap.forEach(doc => {
            const data = doc.data();
            totalCount++;
            if (data.itnHistory && data.itnHistory.length > 0) {
                data.itnHistory.forEach((itn: any) => {
                    if (itn.status === 'Success' && !itn.message.includes('manual')) {
                        console.log(`🎉 SUCCESS ITN FOUND! Order ${data.id}`);
                        console.log("ITN Entry:", JSON.stringify(itn, null, 2));
                        successCount++;
                    }
                });
            }
        });
        
        console.log(`\nChecked ${totalCount} orders. Found ${successCount} successful PayFast ITNs.`);
        process.exit(0);
    } catch (e: any) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}

main();

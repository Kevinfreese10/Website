import { db } from '../src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
    try {
        console.log('Fetching all orders with ITN history...');
        const querySnapshot = await getDocs(collection(db, 'orders'));
        let found = false;
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.itnHistory && data.itnHistory.length > 0) {
                console.log(`Order #${doc.id}: status=${data.status}, ITN count=${data.itnHistory.length}`);
                data.itnHistory.forEach((itn: any, idx: number) => {
                    console.log(`  ITN #${idx}: status=${itn.status}, message="${itn.message}"`);
                });
                found = true;
            }
        });
        if (!found) {
            console.log('No orders with ITN history found.');
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

main();

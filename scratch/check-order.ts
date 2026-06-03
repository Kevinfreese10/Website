import { db } from '../src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function main() {
    try {
        console.log('Fetching order 9945 via client SDK...');
        const orderRef = doc(db, 'orders', '9945');
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) {
            console.log('Order 9945 not found!');
            return;
        }
        console.log('Order ID:', orderSnap.id);
        console.log('Order Data:', JSON.stringify(orderSnap.data(), null, 2));
    } catch (error) {
        console.error('Error fetching order:', error);
    }
}

main();

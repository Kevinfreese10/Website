import { db } from '../src/lib/firebase';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';

async function main() {
    try {
        console.log('Updating order 9945 status to Processing...');
        const orderRef = doc(db, 'orders', '9945');
        
        await updateDoc(orderRef, {
            status: 'Processing',
            itnHistory: arrayUnion({
                status: 'Success',
                message: 'Payment verified and order set to Processing via manual reconciliation script.',
                receivedAt: Timestamp.now(),
                payload: { manual: true }
            })
        });
        
        console.log('Order 9945 successfully updated to Processing!');
    } catch (error) {
        console.error('Error updating order:', error);
    }
}

main();

import { firebaseApp } from '../src/lib/firebase';
import { getFirestore, doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

async function processOrder9922() {
  const db = getFirestore(firebaseApp);
  const orderId = '9922';
  const partnerId = 'C0NIhgQKgtSqo7CUjPs4KpHavtJ3';
  
  console.log("Starting manual reconciliation for Order 9922...");
  
  try {
    // 1. Update Order 9922 status and history
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: 'Processing',
      itnHistory: arrayUnion({
        status: 'Success',
        message: 'Payment verified and processed via manual administrator reconciliation.',
        receivedAt: new Date(),
        payload: {
          manual_process: "true",
          processed_by: "administrator_system"
        }
      })
    });
    console.log("✅ Order 9922 status successfully updated to 'Processing'.");

    // 2. Activate Partner and increment credit balance by R2,475 (50% of R4,950 setup fee)
    const partnerRef = doc(db, 'users', partnerId);
    await updateDoc(partnerRef, {
      status: 'Active',
      creditBalance: increment(2475)
    });
    console.log("✅ Partner profile successfully activated and R2,475 setup credit incremented.");
    
  } catch (error: any) {
    console.error("❌ Manual reconciliation failed:", error.message);
    console.error(error.stack);
  }
}

processOrder9922();

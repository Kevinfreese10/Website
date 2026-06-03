import { firebaseApp } from '../src/lib/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

async function checkPartner() {
  const db = getFirestore(firebaseApp);
  const partnerId = 'C0NIhgQKgtSqo7CUjPs4KpHavtJ3';
  
  console.log(`Checking Partner ID: ${partnerId} using client-side SDK...`);
  
  try {
    const docRef = doc(db, 'users', partnerId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log("Partner found!");
      console.log("Partner Data:", JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log("Partner not found in 'users' collection.");
    }
  } catch (error: any) {
    console.error("Error fetching partner:", error.message);
  }
}

checkPartner();

import { getAdminDb } from '../src/lib/firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function checkOrder() {
  try {
    const db = getAdminDb();
    console.log('Querying order 9815...');
    const snapshot = await db.collection('orders').doc('9815').get();
    
    if (!snapshot.exists) {
      console.log('Order 9815 document not found by doc ID! Trying to query by field "id"...');
      const querySnap = await db.collection('orders').where('id', '==', '9815').get();
      if (querySnap.empty) {
        console.log('Order 9815 not found by id field either.');
        return;
      }
      console.log('Found order via field id query. Doc ID:', querySnap.docs[0].id);
      console.log('Data:', JSON.stringify(querySnap.docs[0].data(), null, 2));
      return;
    }
    
    console.log('Found order by doc ID 9815:');
    console.log('Data:', JSON.stringify(snapshot.data(), null, 2));
  } catch (error) {
    console.error('Error checking order:', error);
  }
}

checkOrder().then(() => process.exit(0));

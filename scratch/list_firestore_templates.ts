import { getAdminDb } from '../src/lib/firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function listTemplates() {
  const db = getAdminDb();
  const snap = await db.collection('templates').get();
  console.log(`Found ${snap.size} templates in Firestore 'templates' collection:`);
  snap.docs.forEach(doc => {
    console.log(`\nID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });

  // Also check order 10136
  const order10136 = await db.collection('orders').doc('10136').get();
  if (order10136.exists) {
    console.log('\n=== ORDER 10136 DATA ===');
    console.log('Generated Drafts:', JSON.stringify(order10136.data()?.generatedDrafts, null, 2));
    const notes10136 = await db.collection('orders').doc('10136').collection('notes').get();
    console.log('Notes 10136:');
    notes10136.docs.forEach(n => console.log(n.data()));
  }
}

listTemplates().catch(console.error);

import { getAdminDb } from '../src/lib/firebase-admin';

async function run() {
  const db = getAdminDb();
  const servSnap = await db.collection('services').get();
  
  let shortDesc = 0;
  let longDesc = 0;
  
  servSnap.forEach(d => {
    const data = d.data();
    const desc = (data.metaDescription || '').trim();
    if (desc.length < 80) {
      shortDesc++;
      console.log(`[Short desc (${desc.length})]: "${desc}" (Title: ${data.title})`);
    } else if (desc.length > 160) {
      longDesc++;
      console.log(`[Long desc (${desc.length})]: "${desc}" (Title: ${data.title})`);
    }
  });
  console.log(`Short desc: ${shortDesc}, Long desc: ${longDesc}, Total: ${servSnap.size}`);
}

run().catch(console.error);

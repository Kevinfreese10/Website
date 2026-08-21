import { config } from 'dotenv';
config({ path: '.env.local' });
import { getAdminDb } from '../src/lib/firebase-admin.ts';

async function main() {
  const adminDb = getAdminDb();
  console.log('=== Orphaned Product Overrides Audit ===');

  // Query all partners
  const partnersSnap = await adminDb.collection('users')
    .where('role', 'in', ['partner', 'partner_admin'])
    .get();

  console.log(`Auditing serviceOverrides subcollections for ${partnersSnap.docs.length} partners...\n`);

  for (const partnerDoc of partnersSnap.docs) {
    const partnerData = partnerDoc.data();
    const isPaid = partnerData.platformFeePaid === true;
    const email = partnerData.email;

    const overridesSnap = await partnerDoc.ref.collection('serviceOverrides').get();

    console.log(`Partner: ${email} | Paid: ${isPaid ? 'YES' : 'NO'} | Overrides count: ${overridesSnap.docs.length}`);
    
    if (overridesSnap.docs.length > 0) {
      overridesSnap.docs.forEach(doc => {
        const ovData = doc.data();
        console.log(`   - Override ID: ${doc.id} | Custom Title: ${ovData.title || 'N/A'} | Price: R${ovData.price || 'N/A'}`);
      });
    }
  }
}

main().catch(console.error);

import { config } from 'dotenv';
config({ path: '.env.local' });
import { getAdminDb } from '../src/lib/firebase-admin.ts';

async function main() {
  const adminDb = getAdminDb();
  console.log('=== Partner Landing Pages Audit ===');

  const partnersSnap = await adminDb.collection('users')
    .where('role', 'in', ['partner', 'partner_admin'])
    .get();

  console.log(`Total Partner documents found: ${partnersSnap.docs.length}`);

  const results: any[] = [];

  partnersSnap.docs.forEach(doc => {
    const data = doc.data();
    results.push({
      id: doc.id,
      email: data.email,
      name: data.name,
      companyName: data.companyName,
      platformFeePaid: data.platformFeePaid ?? false,
      landingPageEnabled: data.landingPage?.enabled ?? false,
      practiceSlug: data.practiceSlug || null,
      status: data.status || 'Active',
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
    });
  });

  console.log('\n--- Full Partner Audit Table ---');
  console.table(results);

  const paidPartners = results.filter(p => p.platformFeePaid === true);
  const unpaidPartnersWithLandingEnabled = results.filter(p => p.platformFeePaid !== true && p.landingPageEnabled === true);
  const unpaidPartners = results.filter(p => p.platformFeePaid !== true);

  console.log(`\n✅ Partners with platformFeePaid === true: ${paidPartners.length}`);
  paidPartners.forEach(p => console.log(`   - ${p.email} (${p.companyName || p.name}) | Slug: ${p.practiceSlug}`));

  console.log(`\n⚠️  Unpaid partners with landingPage.enabled === true: ${unpaidPartnersWithLandingEnabled.length}`);
  unpaidPartnersWithLandingEnabled.forEach(p => console.log(`   - ${p.email} (${p.companyName || p.name}) | Slug: ${p.practiceSlug}`));

  console.log(`\n⛔ Total Unpaid Partners: ${unpaidPartners.length}`);
}

main().catch(console.error);

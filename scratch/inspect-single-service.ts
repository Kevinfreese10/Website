import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { getAdminDb } from '../src/lib/firebase-admin';

async function inspectSlugs() {
  const db = getAdminDb();
  const slugs = [
    'sole-proprietor-income-tax-return-itr12',
    'external-company-registration',
    'coida-registration',
    'vat-registration',
    'beneficial-ownership-declaration'
  ];

  for (const slug of slugs) {
    const snap = await db.collection('services').where('slug', '==', slug).get();
    if (snap.empty) {
      console.log(`Slug: ${slug} NOT FOUND`);
    } else {
      const data = snap.docs[0].data();
      console.log(`\nSlug: "${slug}"`);
      console.log(`- Title: "${data.title}"`);
      console.log(`- Description: "${data.description}"`);
      console.log(`- metaDescription: "${data.metaDescription}"`);
      console.log(`- keys: ${Object.keys(data).join(', ')}`);
    }
  }
}

inspectSlugs().catch(console.error);

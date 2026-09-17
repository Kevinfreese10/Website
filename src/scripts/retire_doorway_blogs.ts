import { getAdminDb } from '../lib/firebase-admin';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const DOORWAY_SLUGS = [
  'my-accoutant-sa-best-accountants-your-financial-partner', // Notice the typo in title and slug
  'my-accountant-the-best-accountants-in-cape-town',
  'find-the-best-accountant-near-me-my-accountant-guide',
  'my-accountant-your-best-accountant-in-randburg',
  'why-my-accountant-is-the-best-in-sa-your-financial-partner',
  'my-accountant-midrands-top-choice-for-financial-excellence',
  'my-accountant-the-best-accountant-in-johannesburg',
  'find-the-best-accountant-in-roodepoort-my-accountant',
  'my-accountant-the-best-accountant-in-sandton',
  'my-accountant-best-accountants-in-durban-explored',
  'my-accountant-sas-best-accounting--tax-firm-guide'
];

async function retireDoorwayBlogs() {
  const db = getAdminDb();
  const backupData: Record<string, any>[] = [];

  console.log('Searching for doorway blog posts in Firestore...');

  for (const slug of DOORWAY_SLUGS) {
    const snap = await db.collection('blogPosts').where('slug', '==', slug).get();
    if (!snap.empty) {
      for (const doc of snap.docs) {
        const data = doc.data();
        backupData.push({ id: doc.id, ...data });
        console.log(`Found doorway post: [${slug}] "${data.title}" (Doc ID: ${doc.id})`);
        
        // Also archive into archivedBlogPosts collection in Firestore for safety
        await db.collection('archivedBlogPosts').doc(doc.id).set({
          ...data,
          archivedAt: new Date().toISOString(),
          archiveReason: 'Doorway page audit cleanup (301 redirected to local/service pages)',
        });

        // Delete from active blogPosts collection
        await db.collection('blogPosts').doc(doc.id).delete();
        console.log(`Successfully archived and removed [${slug}] from active blogPosts.`);
      }
    } else {
      console.log(`Post with slug [${slug}] not found in blogPosts (already removed or different slug).`);
    }
  }

  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupFile = path.join(backupDir, `doorway_blogs_backup_${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  console.log(`Local backup written to ${backupFile}`);
  console.log(`Total posts retired: ${backupData.length}`);
  process.exit(0);
}

retireDoorwayBlogs().catch((err) => {
  console.error('Error retiring doorway blogs:', err);
  process.exit(1);
});

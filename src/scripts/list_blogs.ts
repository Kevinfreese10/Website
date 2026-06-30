import { getAdminDb } from '../lib/firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function listBlogs() {
    const db = getAdminDb();
    const blogSnap = await db.collection('blogPosts').get();
    blogSnap.docs.forEach(doc => {
        console.log(`Slug: ${doc.data().slug}, Title: ${doc.data().title}`);
    });
    process.exit(0);
}

listBlogs().catch(console.error);

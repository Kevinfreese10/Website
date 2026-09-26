import { getAdminDb } from '../src/lib/firebase-admin';

async function checkPost() {
  const db = getAdminDb();
  const doc = await db.collection('blogPosts').doc('NHaTQqDokqYz1STpfFX9').get();
  const content = doc.data()!.content;
  const olIdx = content.indexOf('<ol');
  console.log('--- Substring from <ol> to end of content ---');
  console.log(content.substring(olIdx));
}
checkPost().catch(console.error);

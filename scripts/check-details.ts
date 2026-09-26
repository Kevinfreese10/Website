import { getAdminDb } from '../src/lib/firebase-admin';

async function checkDetails() {
  const db = getAdminDb();
  
  console.log('=== BmXeaVKj7HlX0hHeis3x ===');
  const d1 = (await db.collection('blogPosts').doc('BmXeaVKj7HlX0hHeis3x').get()).data()!;
  console.log('Title:', d1.title);
  console.log('Content length:', d1.content?.length);
  console.log('Last 200 chars:', JSON.stringify(d1.content?.slice(-200)));

  console.log('\n=== yvHjOj1gwpiaMZMp8oXA ===');
  const d2 = (await db.collection('blogPosts').doc('yvHjOj1gwpiaMZMp8oXA').get()).data()!;
  console.log('Title:', d2.title);
  console.log('Content length:', d2.content?.length);
  console.log('Last 200 chars:', JSON.stringify(d2.content?.slice(-200)));
}

checkDetails().catch(console.error);

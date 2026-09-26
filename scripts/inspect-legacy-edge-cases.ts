import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  
  const ids = [
    'NHaTQqDokqYz1STpfFX9',
    'BmXeaVKj7HlX0hHeis3x',
    'yvHjOj1gwpiaMZMp8oXA',
    'SCWeQaAJIsAjh3L9xrIz',
    'BPXcPqPy6eVydBREP4wc'
  ];

  for (const id of ids) {
    const doc = await db.collection('blogPosts').doc(id).get();
    if (!doc.exists) {
      console.log(`Document ${id} does not exist!`);
      continue;
    }
    const data = doc.data()!;
    console.log('====================================================');
    console.log(`ID: ${id}`);
    console.log(`Slug: ${data.slug}`);
    console.log(`Title: ${data.title}`);
    console.log(`Content length: ${data.content?.length}`);
    console.log(`Content ending (last 300 chars):`);
    console.log(JSON.stringify(data.content?.slice(-300)));
    console.log('====================================================\n');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  console.log("Fetching all documents from 'categories' collection...");
  const snapshot = await db.collection("categories").get();
  
  console.log(`Found ${snapshot.size} document(s) in 'categories':`);
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`- ID: "${doc.id}", Name: "${data.name}", Order: ${data.order}`);
  }
}

main().catch(err => {
  console.error("Error running script:", err);
});

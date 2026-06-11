import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  console.log("Fetching unique categories...");
  const snapshot = await db.collection("services").get();
  
  const categories = new Set<string>();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.category) {
      categories.add(data.category);
    }
  }
  
  console.log("Unique categories found in Firestore:");
  for (const cat of Array.from(categories).sort()) {
    console.log(`- "${cat}"`);
  }
}

main().catch(err => {
  console.error("Error running script:", err);
});

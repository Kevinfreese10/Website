import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  console.log("Fetching all services from Firestore...");
  const snapshot = await db.collection("services").get();
  
  console.log(`Found ${snapshot.size} service(s) in Firestore:`);
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`- ID: "${doc.id}", Title: "${data.title}", Slug: "${data.slug}"`);
  }
}

main().catch(err => {
  console.error("Error running script:", err);
});

import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseApp } from '../src/lib/firebase';
import { generateStructuredData } from '../src/lib/schema/productSchema';
import * as dotenv from 'dotenv';

dotenv.config();

const db = getFirestore(firebaseApp);

async function checkServicePrices() {
  console.log("Fetching services from Firestore...");
  const snap = await getDocs(collection(db, "services"));
  console.log(`Found ${snap.docs.length} services.`);

  for (const doc of snap.docs) {
    const service = { id: doc.id, ...doc.data() } as any;
    try {
      const schema = generateStructuredData(service);
      const offer = schema.offers;
      console.log(`Product: "${service.title}" (Slug: ${service.slug})`);
      console.log(`  - Raw Price field:`, JSON.stringify(service.price));
      console.log(`  - isPriceTbc:`, service.isPriceTbc);
      console.log(`  - Output Offer Price:`, offer ? offer.price : 'NO OFFER');
      console.log(`  - Output Offer Currency:`, offer ? offer.priceCurrency : 'NO OFFER');
      if (!offer || !offer.price || isNaN(parseFloat(offer.price))) {
        console.error(`  >>> WARNING: Invalid price generated!`);
      }
    } catch (e: any) {
      console.error(`  >>> ERROR generating schema for "${service.title}":`, e.message);
    }
    console.log("-----------------------------------------");
  }
}

checkServicePrices().catch(console.error);

const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    console.error('Failed to initialize admin app:', e);
    process.exit(1);
  }
}

async function run() {
  const db = admin.firestore();
  console.log('--- STARTING CATALOG DB AUDIT FIXES ---');
  
  // 1. DUPLICATE CLEANUP
  // We identify the redundant documents by exact title matching to ensure accuracy.
  const duplicatesToDelete = [
    "Complex Individual Income Tax Return (ITR12) Filing", 
    "Tax Clearance Certificate & TCS PIN",
    "Income Tax Return for Sole Proprietors (ITR12)",
    "IRP6 Provisional Tax Return Filing for Trading Entities"
  ];
  
  console.log('\n[1] Cleaning up duplicates...');
  for (const title of duplicatesToDelete) {
    const snap = await db.collection('services').where('title', '==', title).get();
    if (snap.empty) {
      console.log(`- NOT FOUND: ${title} (Already deleted or renamed)`);
    } else {
      for (const doc of snap.docs) {
        // UNCOMMENT THIS LINE TO ACTUALLY DELETE:
        // await doc.ref.delete();
        console.log(`- DELETED (Dry Run): ${title} (ID: ${doc.id})`);
      }
    }
  }

  // 2. VAT REGISTRATION THRESHOLD FIX
  console.log('\n[2] Fixing VAT Registration threshold typo...');
  const vatSnap = await db.collection('services').where('title', '==', 'VAT Registration').get();
  if (!vatSnap.empty) {
    const vatDoc = vatSnap.docs[0];
    const vatData = vatDoc.data();
    
    // We update the clientRequirements array to fix the R120,000 typo to R50,000 (voluntary) or R1m (compulsory).
    // Assuming the typo is a direct string match in the array:
    if (vatData.clientRequirements && Array.isArray(vatData.clientRequirements)) {
      const updatedReqs = vatData.clientRequirements.map(req => 
        req.includes('R120 000') || req.includes('R120,000') 
          ? req.replace(/R120\s?000/g, 'R50 000 (Voluntary) or R1 Million (Compulsory)')
          : req
      );
      
      // UNCOMMENT THIS LINE TO ACTUALLY UPDATE:
      // await vatDoc.ref.update({ clientRequirements: updatedReqs });
      console.log(`- UPDATED (Dry Run): VAT Registration clientRequirements threshold fixed.`);
    }
  } else {
    console.log(`- NOT FOUND: VAT Registration service`);
  }

  // 3. ITR12 CATEGORY MISCATEGORIZATION
  console.log('\n[3] Fixing ITR12 Miscategorizations...');
  const itr12TitlesToFix = [
    "Individual Income Tax Return (ITR12) Simple"
    // The "Complex" version's miscategorized copy should be deleted in step 1, 
    // but the remaining one should be checked to ensure it's in "SARS Services"
  ];
  
  for (const title of itr12TitlesToFix) {
    const snap = await db.collection('services').where('title', '==', title).get();
    if (!snap.empty) {
      for (const doc of snap.docs) {
        if (doc.data().category !== 'SARS Services') {
          // UNCOMMENT THIS LINE TO ACTUALLY UPDATE:
          // await doc.ref.update({ category: 'SARS Services' });
          console.log(`- MOVED (Dry Run): ${title} -> SARS Services (was ${doc.data().category})`);
        } else {
          console.log(`- SKIPPED: ${title} is already in SARS Services`);
        }
      }
    }
  }

  console.log('\n--- AUDIT FIXES COMPLETE ---');
  console.log('NOTE: This was a DRY RUN. Edit the script to uncomment the update/delete lines when ready.');
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');

const serviceAccountPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!global._firebaseAdminInitialized) {
  initializeApp({
    credential: cert(serviceAccount)
  });
  global._firebaseAdminInitialized = true;
}

const db = getFirestore();
const auth = getAuth();

async function run() {
  console.log("=== SEARCHING FOR PHONE 228 OR TOGO PHONES ===");
  const ordersSnap = await db.collection('orders').get();
  
  const suspiciousPhoneOrders = [];
  ordersSnap.forEach(doc => {
    const d = doc.data();
    const phone = d.customerPhone || d.phone || d.billingAddress?.phone;
    if (phone && (phone.includes('22872871236') || phone.startsWith('228') || phone.startsWith('+228'))) {
      suspiciousPhoneOrders.push({ id: doc.id, ...d });
    }
  });

  console.log(`Found ${suspiciousPhoneOrders.length} orders with +228 / Togo phones:`);
  suspiciousPhoneOrders.forEach(o => {
    console.log(`Order ${o.id} | Email: ${o.customerEmail || o.email} | Name: ${o.customerName} | Phone: ${o.customerPhone} | Status: ${o.status}`);
  });

  console.log("\n=== CHECKING AUTH USER STATUS ===");
  try {
    const u = await auth.getUser('UGNd2PyOlTS6aBvbWJvOOwjTh2a2');
    console.log("User UGNd2PyOlTS6aBvbWJvOOwjTh2a2 disabled?", u.disabled);
  } catch(e) {
    console.log("Error getting user:", e.message);
  }
}

run().catch(console.error);

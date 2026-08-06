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

const suspiciousEmails = [
  'prenamdogo116@gmail.com',
  'erastossim@gmail.com'
];

async function run() {
  console.log("=== CHECKING AUTH USERS ===");
  for (const email of suspiciousEmails) {
    try {
      const user = await auth.getUserByEmail(email);
      console.log(`Auth User found for ${email}:`, {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
        disabled: user.disabled,
      });
    } catch (e) {
      console.log(`Auth User NOT found for ${email}:`, e.message);
    }
  }

  console.log("\n=== CHECKING FIRESTORE USERS COLLECTION ===");
  const usersSnap = await db.collection('users').get();
  usersSnap.forEach(doc => {
    const data = doc.data();
    if (data.email && suspiciousEmails.some(e => data.email.toLowerCase() === e.toLowerCase())) {
      console.log(`User Doc ID ${doc.id}:`, data);
    }
  });

  console.log("\n=== CHECKING FIRESTORE ORDERS COLLECTION FOR TARGET EMAILS ===");
  const ordersSnap = await db.collection('orders').get();
  console.log(`Total orders in DB: ${ordersSnap.size}`);
  
  const targetOrders = [];
  const allOrders = [];

  ordersSnap.forEach(doc => {
    const d = doc.data();
    allOrders.push({ id: doc.id, ...d });
    
    const emailMatches = [
      d.email,
      d.userEmail,
      d.customerEmail,
      d.billingAddress?.email,
      d.contactEmail,
      d.clientEmail
    ].some(e => e && suspiciousEmails.some(se => se.toLowerCase() === String(e).toLowerCase()));

    if (emailMatches) {
      targetOrders.push({ id: doc.id, ...d });
    }
  });

  console.log(`\nFound ${targetOrders.length} orders matching suspicious emails:`);
  targetOrders.forEach(o => {
    console.log(JSON.stringify(o, null, 2));
  });

  console.log("\n=== CHECKING MOST RECENT 30 ORDERS OVERALL ===");
  allOrders.sort((a, b) => {
    const getTime = (val) => {
      if (!val) return 0;
      if (typeof val.toDate === 'function') return val.toDate().getTime();
      if (val._seconds) return val._seconds * 1000;
      return new Date(val).getTime() || 0;
    };
    return getTime(b.createdAt || b.date) - getTime(a.createdAt || a.date);
  });

  allOrders.slice(0, 30).forEach(o => {
    const dateVal = o.createdAt || o.date;
    const dateStr = dateVal && typeof dateVal.toDate === 'function' ? dateVal.toDate().toISOString() : JSON.stringify(dateVal);
    const email = o.email || o.userEmail || o.customerEmail || o.billingAddress?.email || o.userId;
    console.log(`Order ${o.id} | Date: ${dateStr} | Email: ${email} | Status: ${o.status} | Total: R${o.totalAmount || o.total || o.amount} | Service: ${o.serviceName || o.title || o.serviceId || JSON.stringify(o.items)}`);
  });
}

run().catch(console.error);

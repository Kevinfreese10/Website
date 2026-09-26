import { getAdminDb } from '../src/lib/firebase-admin';

async function check() {
  const db = getAdminDb();
  const orderIds = ['10234', '10233', '10235'];
  
  for (const id of orderIds) {
    const doc = await db.collection('orders').doc(id).get();
    if (!doc.exists) {
      console.log(`Order ${id} NOT FOUND`);
      continue;
    }
    const d = doc.data();
    console.log(`\n================ ORDER ${id} ================`);
    console.log('Customer Email:', d?.customerEmail);
    console.log('Customer Name:', d?.customerName);
    console.log('Customer Phone:', d?.customerPhone);
    console.log('Direct Phone field:', d?.phone);
    console.log('Contact Number field:', d?.contactNumber);
    console.log('Cell field:', d?.cell);
    console.log('Billing Details:', JSON.stringify(d?.billingDetails, null, 2));
    console.log('Status:', d?.status);
    console.log('Payment Status:', d?.paymentStatus);
    console.log('Payment Method:', d?.paymentMethod);
    console.log('Total:', d?.total);
  }

  // Also check user sales@vyomoverseas.com
  console.log('\n================ USER sales@vyomoverseas.com ================');
  const userSnap = await db.collection('users').where('email', '==', 'sales@vyomoverseas.com').get();
  if (userSnap.empty) {
    console.log('No user found with email sales@vyomoverseas.com in users collection');
  } else {
    for (const u of userSnap.docs) {
      const ud = u.data();
      console.log('User Doc ID:', u.id);
      console.log('Email:', ud.email);
      console.log('Phone:', ud.phone || ud.phoneNumber || ud.cellNumber || ud.mobile);
      console.log('All phone-related keys:', Object.keys(ud).filter(k => /phone|cell|mobile|contact/i.test(k)));
      console.log('Billing Details in user:', ud.billingDetails);
      console.log('Full user keys:', Object.keys(ud));
    }
  }
}

check()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function updateAll() {
  const newPass = 'W0=LP2i_yVzQ8EQL';

  console.log('Updating Firestore emailSettings/connection with new password...');
  await db.collection('emailSettings').doc('connection').set({
    smtpHost: 'mail.myacc.co.za',
    smtpPort: 465,
    smtpUser: 'no_reply@myacc.co.za',
    smtpPass: newPass,
    imapHost: 'mail.myacc.co.za',
    imapPort: 993,
    imapUser: 'no_reply@myacc.co.za',
    imapPass: newPass
  }, { merge: true });

  const adminSnap = await db.collection('users').where('role', '==', 'admin').get();
  for (const u of adminSnap.docs) {
    await u.ref.update({
      'smtpDetails.pass': newPass,
      'smtpDetails.user': 'no_reply@myacc.co.za',
      'smtpDetails.host': 'mail.myacc.co.za',
      'smtpDetails.port': '465',
      'imapDetails.pass': newPass,
      'imapDetails.user': 'no_reply@myacc.co.za',
      'imapDetails.host': 'mail.myacc.co.za',
      'imapDetails.port': '993',
    });
  }

  console.log('✅ Firestore updated successfully with new password!');
}

updateAll().catch(console.error);

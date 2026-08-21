const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixEmailSettings() {
  console.log('Updating emailSettings/connection with working mail.myacc.co.za settings...');
  await db.collection('emailSettings').doc('connection').set({
    smtpHost: 'mail.myacc.co.za',
    smtpPort: 465,
    smtpUser: 'no_reply@myacc.co.za',
    smtpPass: 'MikeOxlong10$',
    imapHost: 'mail.myacc.co.za',
    imapPort: 993,
    imapUser: 'no_reply@myacc.co.za',
    imapPass: 'MikeOxlong10$'
  }, { merge: true });

  console.log('✅ Updated emailSettings/connection successfully!');

  // Also update admin user smtpDetails to working configuration
  const userRef = db.collection('users').doc('LRM285EOq3gwNMKayY6vtzooaC03');
  await userRef.update({
    smtpDetails: {
      host: 'mail.myacc.co.za',
      port: '465',
      user: 'no_reply@myacc.co.za',
      pass: 'MikeOxlong10$'
    },
    imapDetails: {
      host: 'mail.myacc.co.za',
      port: '993',
      user: 'no_reply@myacc.co.za',
      pass: 'MikeOxlong10$',
      secure: true
    }
  });
  console.log('✅ Updated admin user profile email credentials!');
}

fixEmailSettings().catch(console.error);

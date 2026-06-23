import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  try {
    const db = getAdminDb();
    const usersSnap = await db.collection('users').get();
    console.log(`Total users: ${usersSnap.size}`);
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- ID/UID: ${doc.id}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Role: ${data.role}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  PartnerId: ${data.partnerId}`);
    });

    const settingsDoc = await db.collection('emailSettings').doc('connection').get();
    if (settingsDoc.exists) {
      const data = settingsDoc.data() || {};
      console.log('\nEmail settings (connection):');
      console.log(`- imapHost: ${data.imapHost}`);
      console.log(`- imapPort: ${data.imapPort}`);
      console.log(`- imapUser: ${data.imapUser}`);
      console.log(`- smtpHost: ${data.smtpHost}`);
      console.log(`- smtpPort: ${data.smtpPort}`);
      console.log(`- smtpUser: ${data.smtpUser}`);
    } else {
      console.log('\nNo connection email settings found.');
    }
  } catch (error: any) {
    console.error('Error:', error);
  }
}

main();

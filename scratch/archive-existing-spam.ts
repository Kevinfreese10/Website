import { getAdminDb } from '../src/lib/firebase-admin';
import dotenv from 'dotenv';

// Load environment variables (contains project_id or service keys if needed)
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function archiveExistingSpam() {
  try {
    console.log('Connecting to Firestore...');
    const adminDb = getAdminDb();
    
    console.log('Querying emails with category "spam_marketing" that are not archived...');
    const snap = await adminDb.collection('emails')
      .where('aiCategory', '==', 'spam_marketing')
      .get();
      
    console.log(`Found ${snap.size} spam emails.`);
    
    let archivedCount = 0;
    const batch = adminDb.batch();
    
    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.status !== 'archived') {
        batch.update(doc.ref, { status: 'archived' });
        archivedCount++;
      }
    }
    
    if (archivedCount > 0) {
      await batch.commit();
      console.log(`Successfully archived ${archivedCount} existing spam emails.`);
    } else {
      console.log('All spam emails are already archived.');
    }
  } catch (error: any) {
    console.error('Error archiving spam:', error.message);
  }
}

archiveExistingSpam();

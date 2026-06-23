import * as imapSimple from 'imap-simple';
import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  try {
    const adminDb = getAdminDb();
    
    // Fetch connection details from Firestore
    console.log('[IMAP Test] Fetching credentials from Firestore...');
    const connDoc = await adminDb.collection('emailSettings').doc('connection').get();
    const connData = connDoc.exists ? connDoc.data() : null;
    
    const imapUser = connData?.imapUser;
    const imapPass = connData?.imapPass;
    const imapHost = connData?.imapHost;
    const imapPort = Number(connData?.imapPort || 993);

    console.log(`[IMAP Test] Configuration:`);
    console.log(`- Host: ${imapHost}`);
    console.log(`- Port: ${imapPort}`);
    console.log(`- User: ${imapUser}`);
    console.log(`- Pass length: ${imapPass ? imapPass.length : 0}`);

    if (!imapUser || !imapPass || !imapHost) {
      console.error('[IMAP Test] Missing credentials in Firestore.');
      return;
    }

    const config = {
      imap: {
        user: imapUser,
        password: imapPass,
        host: imapHost,
        port: imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 30000,
        authTimeout: 30000,
      },
    };

    console.log('[IMAP Test] Connecting to IMAP server...');
    const start = Date.now();
    const connection = await imapSimple.connect(config);
    console.log(`[IMAP Test] Connected successfully! (took ${Date.now() - start}ms)`);

    console.log('[IMAP Test] Opening INBOX...');
    await connection.openBox('INBOX');
    console.log('[IMAP Test] INBOX opened successfully.');

    console.log('[IMAP Test] Searching for emails since 7 days ago...');
    const searchDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDateStr = `${String(searchDate.getDate()).padStart(2, '0')}-${months[searchDate.getMonth()]}-${searchDate.getFullYear()}`;
    const searchCriteria = [['SINCE', formattedDateStr]];
    
    console.log(`[IMAP Test] Search date: ${formattedDateStr}`);
    const messages = await connection.search(searchCriteria, { bodies: ['HEADER'] });
    console.log(`[IMAP Test] Search completed. Found ${messages.length} messages.`);

    connection.end();
    console.log('[IMAP Test] Connection closed.');
  } catch (error: any) {
    console.error('[IMAP Test] Connection/Auth failed with error:', error);
  }
}

main();

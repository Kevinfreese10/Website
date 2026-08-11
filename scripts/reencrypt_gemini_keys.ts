import * as admin from 'firebase-admin';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin (assuming default credentials)
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

const ALGORITHM = 'aes-256-cbc';
const OLD_ENCRYPTION_KEY = 'default-secret-key-must-be-32-chars!'.padEnd(32, 'X').substring(0, 32);
const NEW_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!NEW_ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not set in environment.');
}
if (NEW_ENCRYPTION_KEY.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters long.');
}

const IV_LENGTH = 16;

function oldDecrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift() as string, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(OLD_ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

function newEncrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(NEW_ENCRYPTION_KEY as string), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function run() {
    console.log('Starting re-encryption of Gemini keys...');
    
    // Assuming keys are stored in a 'partners' collection or similar.
    // The audit document doesn't specify the exact collection.
    // Replace 'partners' with the actual collection name.
    const snapshot = await db.collection('partners').get();
    
    let updatedCount = 0;
    
    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.geminiApiKey) {
            try {
                // Try decrypting with old key
                const decrypted = oldDecrypt(data.geminiApiKey);
                
                // If successful, re-encrypt with new key
                const newlyEncrypted = newEncrypt(decrypted);
                
                await doc.ref.update({ geminiApiKey: newlyEncrypted });
                updatedCount++;
                console.log(`Successfully re-encrypted key for document: ${doc.id}`);
            } catch (error) {
                console.warn(`Failed to decrypt key for document: ${doc.id} (It may already be encrypted with the new key, or the key is invalid)`);
            }
        }
    }
    
    console.log(`Finished. Re-encrypted ${updatedCount} keys.`);
}

run().catch(console.error);

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import { rollForwardPayrollAction } from './src/app/actions';

const serviceAccountKeyPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));

// Only initialize if apps length is 0 to avoid duplicates if actions.ts imports it
import { getApps } from 'firebase-admin/app';
if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

// We need to patch getAdminDb if actions.ts expects it to be initialized differently, 
// but since we are running locally with firebase-admin imported, let's see what happens.
// Wait, actions.ts imports getAdminDb from '@/lib/firebaseAdmin'. We can't easily mock it if it's already using it.
// Let's just execute the logic locally.

const db = getFirestore();

async function testRollForward() {
    const clientId = 'Nt6RiGoHounSUkh7JqvV';
    
    try {
        console.log('Testing roll forward...');
        const res = await rollForwardPayrollAction({ clientId });
        console.log('Result:', res);
    } catch (e: any) {
        console.error('Error in rollForwardPayrollAction:', e);
    }
}

testRollForward();

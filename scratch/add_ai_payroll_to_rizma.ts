import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function updateRizma() {
  const db = getAdminDb();
  const userId = 'wZW23eE0R7UW9TOIriEquBpZD8p2';
  const userRef = db.collection('users').doc(userId);
  const doc = await userRef.get();
  
  if (!doc.exists) {
    console.log('User not found');
    return;
  }

  const currentModules = doc.data()?.allowedModules || [];
  const updatedModules = Array.from(new Set([...currentModules, 'AI Payroll']));

  await userRef.update({
    allowedModules: updatedModules,
    updatedAt: new Date().toISOString(),
  });

  console.log('Updated Rizma allowedModules to:', updatedModules);
}

updateRizma().catch(console.error);

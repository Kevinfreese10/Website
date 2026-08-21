import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkClient() {
  const db = getAdminDb();
  const cDoc = await db.collection('aiPayrollClients').doc('Nt6RiGoHounSUkh7JqvV').get();
  console.log('Maleha Data:', cDoc.data());
}

checkClient().catch(console.error);

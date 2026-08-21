import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminStorage } from '../src/lib/firebase-admin';

async function downloadFromStorage() {
  const bucketName = 'studio-2604127518-57889.firebasestorage.app';
  const bucket = getAdminStorage().bucket(bucketName);
  const outDir = path.resolve('scratch/order_10143_audit');

  const files = [
    {
      name: '06_July.pdf',
      storagePath: 'uploads/MBF4y9HOVlZH3BG7JRop9v8tG7M2/orders/10143/notes/1787298725542-06 July.pdf',
    },
    {
      name: '06_June.pdf',
      storagePath: 'uploads/MBF4y9HOVlZH3BG7JRop9v8tG7M2/orders/10143/notes/1787298725543-06 June.pdf',
    },
    {
      name: '06_August.pdf',
      storagePath: 'uploads/MBF4y9HOVlZH3BG7JRop9v8tG7M2/orders/10143/notes/1787298725543-06 August.pdf',
    },
  ];

  for (const f of files) {
    const dest = path.join(outDir, f.name);
    console.log(`Downloading ${f.storagePath}...`);
    try {
      await bucket.file(f.storagePath).download({ destination: dest });
      console.log(`✓ Saved ${f.name} (${fs.statSync(dest).size} bytes)`);
    } catch (err) {
      console.error(`✗ Error downloading ${f.storagePath}:`, (err as any)?.message);
    }
  }
}

downloadFromStorage().catch(console.error);

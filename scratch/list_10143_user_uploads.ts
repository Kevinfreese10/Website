import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminStorage } from '../src/lib/firebase-admin';

async function listUserUploads() {
  const bucketName = 'studio-2604127518-57889.firebasestorage.app';
  const bucket = getAdminStorage().bucket(bucketName);
  const [files] = await bucket.getFiles({ prefix: 'uploads/MBF4y9HOVlZH3BG7JRop9v8tG7M2/' });

  console.log(`Found ${files.length} files for user MBF4y9HOVlZH3BG7JRop9v8tG7M2:`);
  for (const f of files) {
    const [meta] = await f.getMetadata();
    console.log(`- ${f.name} (${meta.size} bytes, type: ${meta.contentType})`);
  }
}

listUserUploads().catch(console.error);

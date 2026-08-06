import fs from 'fs';
import { resolve } from 'path';

['.env', '.env.local'].forEach(file => {
  const envPath = resolve(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const [key, ...vals] = line.split('=');
      if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
  }
});

import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  const snap = await db.collection('users').get();
  const partners = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter(u => u.role === 'partner' || u.role === 'partner_admin');

  console.log(`Total partners: ${partners.length}`);
  partners.forEach(p => {
    console.log(`- ${p.email} | role: ${p.role} | platformFeePaid: ${p.platformFeePaid}`);
  });
}

main().catch(console.error);

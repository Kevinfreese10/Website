/**
 * migrate_platform_fee.ts
 *
 * One-shot migration: stamps `platformFeePaid` on every partner document.
 *
 * Paid partners (whitelist):   platformFeePaid = true
 * All other partners:          platformFeePaid = false, landingPage.enabled = false
 *
 * Usage (from repo root):
 *   npx ts-node --project tsconfig.server.json scratch/migrate_platform_fee.ts
 *
 * DRY RUN: set DRY_RUN=true in your shell to preview without writing.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getAdminDb } from '../src/lib/firebase-admin';

// ---------------------------------------------------------------------------
// 1. Load .env.local from cwd
// ---------------------------------------------------------------------------
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes (single or double)
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
  console.log(`✔  Loaded environment from ${envPath}`);
} else {
  console.warn(`⚠️  No .env.local found at ${envPath} — relying on existing environment variables.`);
}

// ---------------------------------------------------------------------------
// 2. Configuration
// ---------------------------------------------------------------------------
const DRY_RUN = process.env.DRY_RUN === 'true';

/** Partners who have paid the R1,950 platform fee. */
const PAID_PARTNER_EMAILS = new Set([
  'reseller@myacc.co.za',
  'nic@nala-bts.co.za',
]);

// ---------------------------------------------------------------------------
// 3. Migration
// ---------------------------------------------------------------------------
async function run() {
  if (DRY_RUN) {
    console.log('🔍  DRY RUN mode — no writes will be committed.\n');
  }

  const db = getAdminDb();

  // Query all partner users
  const snapshot = await db
    .collection('users')
    .where('role', '==', 'partner')
    .get();

  let totalProcessed = 0;
  let paidCount = 0;
  let freeCount = 0;

  let batch = db.batch();
  let batchCount = 0;
  const BATCH_LIMIT = 400; // Firestore max is 500; stay comfortably below

  const commitBatch = async () => {
    if (!DRY_RUN && batchCount > 0) {
      await batch.commit();
      batch = db.batch();
    }
  };

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const email: string = data.email ?? '(no email)';
    const ref = docSnap.ref;

    if (PAID_PARTNER_EMAILS.has(email)) {
      // --- Paid partner ---
      if (!DRY_RUN) {
        batch.update(ref, { platformFeePaid: true });
        batchCount++;
      }
      console.log(`✅  ${email} - platformFeePaid set to true`);
      paidCount++;
    } else {
      // --- Unpaid partner ---
      if (!DRY_RUN) {
        batch.update(ref, {
          platformFeePaid: false,
          'landingPage.enabled': false,
        });
        batchCount++;
      }
      console.log(`⚠️  ${email} - platformFeePaid set to false, storefront disabled`);
      freeCount++;
    }

    totalProcessed++;

    // Commit in chunks to avoid exceeding the 500-op batch limit
    if (batchCount >= BATCH_LIMIT) {
      await commitBatch();
      batchCount = 0;
    }
  }

  // Commit any remaining operations
  if (batchCount > 0) {
    await commitBatch();
  }

  // ---------------------------------------------------------------------------
  // 4. Summary
  // ---------------------------------------------------------------------------
  console.log('\n─────────────────────────────────────────');
  console.log(`📊  Migration summary`);
  console.log(`   Total partners processed : ${totalProcessed}`);
  console.log(`   ✅  Paid (fee confirmed)  : ${paidCount}`);
  console.log(`   ⚠️   Free (no fee)         : ${freeCount}`);
  if (DRY_RUN) {
    console.log('\n   (DRY RUN — no documents were modified)');
  }
  console.log('─────────────────────────────────────────\n');
}

run().catch((err) => {
  console.error('❌  Migration failed:', err);
  process.exit(1);
});

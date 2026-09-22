import * as fs from 'fs';
import * as dotenv from 'dotenv';

['c:/myacc/.env.local', 'c:/myacc/.env'].forEach(p => {
  if (fs.existsSync(p)) dotenv.config({ path: p });
});

import { getAdminDb } from '../src/lib/firebase-admin';
import { MASTER_ALLOCATION_RULES } from '../src/lib/master-allocation-rules';

async function migrate() {
  console.log('=== STARTING FIRESTORE ALLOCATION RULES DEDUPLICATION ===');
  const db = getAdminDb();
  const rulesCol = db.collection('allocationRules');

  // 1. Purge obsolete / removed master rules from Firestore
  const rulesToDelete = [
    'master_rtl_checkers',
    'master_rtl_pnp',
    'master_rtl_woolworths',
    'master_rtl_spar',
    'master_rtl_shoprite',
    'master_rtl_makro',
    'master_rtl_game',
    'master_rtl_takealot',
    'master_rtl_westpack',
    'master_trv_gautrain',
  ];

  console.log('1. Deleting obsolete master rules from Firestore...');
  for (const id of rulesToDelete) {
    await rulesCol.doc(id).delete();
    console.log(`   Deleted obsolete doc: ${id}`);
  }

  // 2. Sync updated MASTER_ALLOCATION_RULES into Firestore
  console.log(`2. Syncing ${MASTER_ALLOCATION_RULES.length} clean master rules into Firestore...`);
  const nowIso = new Date().toISOString();

  // Batch writes in chunks of 400
  for (let i = 0; i < MASTER_ALLOCATION_RULES.length; i += 400) {
    const chunk = MASTER_ALLOCATION_RULES.slice(i, i + 400);
    const batch = db.batch();
    for (const rule of chunk) {
      const docRef = rulesCol.doc(rule.id);
      batch.set(docRef, {
        id: rule.id,
        keywords: rule.keywords,
        category: rule.category,
        categoryLabel: rule.categoryLabel,
        defaultAccountCode: rule.defaultAccountCode,
        defaultAccountName: rule.defaultAccountName,
        legacyAccountCode: rule.legacyAccountCode || null,
        accountId: rule.defaultAccountCode,
        accountType: 'account',
        vatType: rule.vatType,
        description: rule.description,
        priority: rule.priority || 10,
        scope: 'global_master',
        updatedAt: nowIso,
      }, { merge: true });
    }
    await batch.commit();
  }
  console.log('   Master rules synced successfully.');

  // 3. Collect all claimed keywords from MASTER_ALLOCATION_RULES
  const claimedKeywords = new Set<string>();
  const keywordToRule = new Map<string, string>();

  for (const r of MASTER_ALLOCATION_RULES) {
    for (const kw of r.keywords || []) {
      const upper = kw.trim().toUpperCase();
      claimedKeywords.add(upper);
      keywordToRule.set(upper, `[${r.id}] ${r.description}`);
    }
  }

  // 4. Fetch all non-master (umbrella) rules and prune collisions
  console.log('3. Pruning collisions from non-master/umbrella rules...');
  const snap = await rulesCol.get();
  const nonMasterDocs = snap.docs.filter(d => !d.id.startsWith('master_'));
  console.log(`   Found ${nonMasterDocs.length} non-master rules to check.`);

  let prunedCount = 0;
  let deletedCount = 0;
  const updateBatch = db.batch();
  let batchOps = 0;

  for (const docSnap of nonMasterDocs) {
    const data = docSnap.data();
    const origKeywords = (data.keywords || []) as string[];
    const remainingKeywords: string[] = [];
    const removedKeywords: string[] = [];

    for (const kw of origKeywords) {
      const upper = kw.trim().toUpperCase();
      if (!upper) continue;

      if (claimedKeywords.has(upper)) {
        removedKeywords.push(upper);
      } else {
        // Claim it for this non-master rule to avoid duplicates among non-master rules
        claimedKeywords.add(upper);
        keywordToRule.set(upper, `[${docSnap.id}] ${data.description}`);
        remainingKeywords.push(upper);
      }
    }

    if (remainingKeywords.length === 0) {
      console.log(`   [DELETE RULE] Doc ${docSnap.id} ("${data.description}") has no remaining keywords.`);
      updateBatch.delete(docSnap.ref);
      deletedCount++;
      batchOps++;
    } else if (removedKeywords.length > 0) {
      console.log(`   [PRUNED] Doc ${docSnap.id} ("${data.description}"): removed ${removedKeywords.length} keywords (${removedKeywords.slice(0, 5).join(', ')}${removedKeywords.length > 5 ? '...' : ''}), kept ${remainingKeywords.length}.`);
      updateBatch.update(docSnap.ref, {
        keywords: remainingKeywords,
        updatedAt: nowIso,
      });
      prunedCount++;
      batchOps++;
    }

    if (batchOps >= 400) {
      await updateBatch.commit();
      batchOps = 0;
    }
  }

  if (batchOps > 0) {
    await updateBatch.commit();
  }

  console.log(`\n=== MIGRATION COMPLETE ===`);
  console.log(`Deleted empty rules: ${deletedCount}`);
  console.log(`Pruned duplicate keywords from: ${prunedCount} rules`);
}

migrate().then(() => process.exit(0)).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

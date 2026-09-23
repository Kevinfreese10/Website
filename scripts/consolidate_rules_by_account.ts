import * as fs from 'fs';
import * as dotenv from 'dotenv';

['c:/myacc/.env.local', 'c:/myacc/.env'].forEach(p => {
  if (fs.existsSync(p)) dotenv.config({ path: p });
});

import { getAdminDb } from '../src/lib/firebase-admin';
import { consolidateAllocationRules } from '../src/lib/allocation-rule-consolidator';
import { AllocationRule } from '../src/lib/types';

async function main() {
  const db = getAdminDb();
  console.log('--- STARTING CONSOLIDATION BY ACCOUNT ---');

  // 1. Scan and consolidate ALL clients in aiAccountantClients collection
  const clientsSnap = await db.collection('aiAccountantClients').get();
  console.log(`Found ${clientsSnap.size} clients in aiAccountantClients.`);

  for (const clientDoc of clientsSnap.docs) {
    const data = clientDoc.data();
    const rawRules: AllocationRule[] = data.allocationRules || [];
    console.log(`Client ID "${clientDoc.id}" (${data.companyName || data.name || data.email}): ${rawRules.length} rules.`);

    if (rawRules.length > 0) {
      const consolidated = consolidateAllocationRules(rawRules, {
        chartOfAccounts: data.chartOfAccounts || [],
        isVatRegistered: data.isVatRegistered || false,
      });

      console.log(`  -> Consolidated to ${consolidated.length} unique rules (cleaned ${rawRules.length - consolidated.length} duplicates).`);

      await clientDoc.ref.update({
        allocationRules: consolidated,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // 2. Consolidate global allocationRules collection using Batches for speed
  console.log('\n--- CONSOLIDATING GLOBAL allocationRules COLLECTION ---');
  const globalSnap = await db.collection('allocationRules').get();
  console.log(`Found ${globalSnap.size} total docs in allocationRules collection.`);

  const docsByAccount = new Map<string, FirebaseFirestore.QueryDocumentSnapshot[]>();

  for (const doc of globalSnap.docs) {
    const data = doc.data();
    const accId = data.accountId || data.defaultAccountCode;
    if (!accId) continue;
    const key = `${data.accountType || 'account'}:${accId}`;
    const list = docsByAccount.get(key) || [];
    list.push(doc);
    docsByAccount.set(key, list);
  }

  console.log(`Unique account keys in global collection: ${docsByAccount.size}`);
  let deletedCount = 0;
  let mergedCount = 0;

  // Collect batch operations
  let batch = db.batch();
  let opCount = 0;

  for (const [key, docs] of docsByAccount.entries()) {
    if (docs.length <= 1) continue;

    mergedCount++;
    const primaryDoc = docs.find(d => d.data().scope === 'global_master') || docs[0];
    const mergedKws = new Set<string>();

    for (const d of docs) {
      const kws = d.data().keywords;
      if (Array.isArray(kws)) {
        for (const k of kws) {
          if (k && typeof k === 'string') mergedKws.add(k.trim().toUpperCase());
        }
      }
    }

    const sortedKws = Array.from(mergedKws).sort();

    batch.update(primaryDoc.ref, {
      keywords: sortedKws,
      updatedAt: new Date().toISOString(),
    });
    opCount++;

    for (const d of docs) {
      if (d.id !== primaryDoc.id) {
        batch.delete(d.ref);
        deletedCount++;
        opCount++;

        if (opCount >= 400) {
          await batch.commit();
          batch = db.batch();
          opCount = 0;
        }
      }
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }

  console.log(`Global consolidation complete: Merged ${mergedCount} accounts, deleted ${deletedCount} duplicate docs.`);
  console.log('--- ALL CONSOLIDATION COMPLETE ---');
}

main().catch(err => {
  console.error('Consolidation failed:', err);
  process.exit(1);
});

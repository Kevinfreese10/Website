import * as fs from 'fs';
import * as dotenv from 'dotenv';

['c:/myacc/.env.local', 'c:/myacc/.env'].forEach(p => {
  if (fs.existsSync(p)) dotenv.config({ path: p });
});

import { getAdminDb } from '../src/lib/firebase-admin';
import { MASTER_ALLOCATION_RULES } from '../src/lib/master-allocation-rules';

async function audit() {
  console.log('=== AUDITING MASTER_ALLOCATION_RULES (code) ===');
  console.log('Count:', MASTER_ALLOCATION_RULES.length);

  const codeKwMap = new Map<string, Array<{ id: string; description: string; account: string; vatType: string }>>();
  for (const r of MASTER_ALLOCATION_RULES) {
    for (const kw of r.keywords || []) {
      const upper = kw.trim().toUpperCase();
      if (!codeKwMap.has(upper)) codeKwMap.set(upper, []);
      codeKwMap.get(upper)!.push({
        id: r.id,
        description: r.description,
        account: `${r.defaultAccountCode} - ${r.defaultAccountName}`,
        vatType: r.vatType,
      });
    }
  }

  const codeDupes = Array.from(codeKwMap.entries()).filter(([_, list]) => list.length > 1);
  console.log('Duplicate keywords in code:', codeDupes.length);
  for (const [kw, list] of codeDupes) {
    console.log(`\n[CODE DUPE] KEYWORD: "${kw}" (${list.length} rules):`);
    for (const item of list) {
      console.log(`  - [${item.id}] "${item.description}" -> ${item.account} | VAT: ${item.vatType}`);
    }
  }

  console.log('\n=== AUDITING FIRESTORE allocationRules COLLECTION ===');
  try {
    const db = getAdminDb();
    const snap = await db.collection('allocationRules').get();
    console.log('Firestore allocationRules total count:', snap.size);

    const fsKwMap = new Map<string, Array<{ id: string; description: string; account: string; vatType: string }>>();
    const allRules: any[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      allRules.push({ id: docSnap.id, ...data });
      const kws = data.keywords || [];
      for (const kw of kws) {
        const upper = kw.trim().toUpperCase();
        if (!fsKwMap.has(upper)) fsKwMap.set(upper, []);
        fsKwMap.get(upper)!.push({
          id: docSnap.id,
          description: data.description,
          account: `${data.accountId || data.defaultAccountCode || ''}`,
          vatType: data.vatType,
        });
      }
    });

    const fsDupes = Array.from(fsKwMap.entries()).filter(([_, list]) => list.length > 1);
    console.log('Duplicate keywords in Firestore:', fsDupes.length);
    for (const [kw, list] of fsDupes) {
      console.log(`\n[FIRESTORE DUPE] KEYWORD: "${kw}" (${list.length} rules):`);
      for (const item of list) {
        console.log(`  - [${item.id}] "${item.description}" -> ${item.account} | VAT: ${item.vatType}`);
      }
    }

    fs.writeFileSync('scripts/audit_output.json', JSON.stringify({
      codeDupes: codeDupes.map(([kw, list]) => ({ keyword: kw, count: list.length, rules: list })),
      fsDupes: fsDupes.map(([kw, list]) => ({ keyword: kw, count: list.length, rules: list })),
      totalFsRules: snap.size,
      totalCodeRules: MASTER_ALLOCATION_RULES.length,
      allFsRules: allRules
    }, null, 2));

  } catch (err: any) {
    console.error('Failed to query Firestore:', err.message);
  }
}

audit().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});

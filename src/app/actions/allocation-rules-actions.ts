'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { getVerifiedAuthContext } from '@/lib/server-auth';
import { MASTER_ALLOCATION_RULES } from '@/lib/master-allocation-rules';
import { BankCleaner } from '@/lib/bank-cleaner';
import { AllocationRule } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Synchronizes the 150+ South African Master Allocation Rules into Firestore `allocationRules` collection.
 */
export async function syncMasterAllocationRulesAction({ idToken }: { idToken: string }) {
  const authCtx = await getVerifiedAuthContext(idToken);
  if (!authCtx || !authCtx.isAdmin) {
    throw new Error('Unauthorized: Admin access required to sync master allocation rules.');
  }

  const db = getAdminDb();
  const rulesCol = db.collection('allocationRules');

  let added = 0;
  let updated = 0;

  const chunks = [];
  for (let i = 0; i < MASTER_ALLOCATION_RULES.length; i += 400) {
    chunks.push(MASTER_ALLOCATION_RULES.slice(i, i + 400));
  }

  const nowIso = new Date().toISOString();

  for (const chunk of chunks) {
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
        accountId: rule.defaultAccountCode,
        accountType: 'account',
        vatType: rule.vatType,
        description: rule.description,
        priority: rule.priority || 10,
        scope: 'global_master',
        updatedAt: nowIso,
      }, { merge: true });
      added++;
    }
    await batch.commit();
  }

  return { success: true, count: MASTER_ALLOCATION_RULES.length, added, updated };
}

/**
 * Automatically creates an allocation rule from a manually allocated transaction.
 */
export async function createRuleFromAllocationAction({
  idToken,
  clientId,
  transactionDescription,
  accountId,
  accountType = 'account',
  vatType = 'standard',
  customKeyword,
  isGlobal = false,
}: {
  idToken: string;
  clientId: string;
  transactionDescription: string;
  accountId: string;
  accountType?: string;
  vatType?: string;
  customKeyword?: string;
  isGlobal?: boolean;
}) {
  const authCtx = await getVerifiedAuthContext(idToken);
  if (!authCtx) {
    throw new Error('Unauthorized');
  }

  const db = getAdminDb();

  // Extract clean root keyword if not provided
  let keyword = (customKeyword || '').trim().toUpperCase();
  if (!keyword) {
    const cleaned = BankCleaner.process(transactionDescription);
    keyword = (cleaned.cleanDescription || cleaned.merchantKey || transactionDescription).toUpperCase().trim();
    // Strip trailing digits/dates if present
    keyword = keyword.replace(/\s+\d{2,}[\/-]\d{2,}.*$/, '').trim();
  }

  if (!keyword || keyword.length < 2) {
    throw new Error('Could not derive a valid keyword from transaction description.');
  }

  const ruleId = `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newRule: AllocationRule = {
    id: ruleId,
    keywords: [keyword],
    accountId,
    accountType,
    vatType,
    description: `Auto-created rule for ${keyword}`,
    priority: 10,
    scope: isGlobal ? 'global' : 'client',
  };

  if (isGlobal && authCtx.isAdmin) {
    await db.collection('allocationRules').doc(ruleId).set({
      ...newRule,
      createdAt: new Date().toISOString(),
      createdBy: authCtx.userId,
    });
  } else {
    // Add to client's allocationRules array
    const clientRef = db.collection('aiAccountantClients').doc(clientId);
    await clientRef.update({
      allocationRules: FieldValue.arrayUnion(newRule),
      updatedAt: new Date().toISOString(),
    });
  }

  return { success: true, rule: newRule, derivedKeyword: keyword };
}

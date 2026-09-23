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
        legacyAccountCode: rule.legacyAccountCode || null,
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
  vatType = 'standard_rated_purchases',
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

  const canonicalVat = (
    vatType === 'standard' || vatType === 'standard_vat' ? 'standard_rated_purchases' :
    vatType === 'zero_rated' ? 'zero_rated_purchases' :
    vatType === 'exempt' ? 'exempt_purchases' :
    vatType === 'vat_disallowed' ? 'no_vat' :
    vatType
  ) || 'standard_rated_purchases';

  const ruleId = `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newRule: AllocationRule = {
    id: ruleId,
    keywords: [keyword],
    accountId,
    accountType,
    vatType: canonicalVat,
    description: `Auto-created rule for ${keyword}`,
    priority: 10,
    scope: isGlobal ? 'global' : 'client',
  };

  if (isGlobal && authCtx.isAdmin) {
    // Check if a global rule for this account already exists
    const accountRulesSnap = await db.collection('allocationRules')
      .where('accountId', '==', accountId)
      .limit(1)
      .get();

    if (!accountRulesSnap.empty) {
      const existingDoc = accountRulesSnap.docs[0];
      const existingKws: string[] = existingDoc.data().keywords || [];
      if (!existingKws.includes(keyword)) {
        await existingDoc.ref.update({
          keywords: Array.from(new Set([...existingKws, keyword])).sort(),
          updatedAt: new Date().toISOString(),
        });
      }
      return { success: true, rule: { ...existingDoc.data(), keywords: [...existingKws, keyword] } as AllocationRule, derivedKeyword: keyword };
    }

    await db.collection('allocationRules').doc(ruleId).set({
      ...newRule,
      createdAt: new Date().toISOString(),
      createdBy: authCtx.userId,
    });
  } else {
    // Add or append to client's single rule for this account
    const clientRef = db.collection('aiAccountantClients').doc(clientId);
    const clientDoc = await clientRef.get();
    const clientData = clientDoc.data();
    const existingClientRules: AllocationRule[] = clientData?.allocationRules || [];

    const existingAccountRuleIndex = existingClientRules.findIndex(r => r.accountId === accountId);
    let updatedClientRules: AllocationRule[];

    if (existingAccountRuleIndex >= 0) {
      const existingRule = existingClientRules[existingAccountRuleIndex];
      const mergedKws = Array.from(new Set([...(existingRule.keywords || []), keyword])).sort();
      updatedClientRules = existingClientRules.map((r, i) => 
        i === existingAccountRuleIndex ? { ...r, keywords: mergedKws } : r
      );
    } else {
      updatedClientRules = [...existingClientRules, newRule];
    }

    await clientRef.update({
      allocationRules: updatedClientRules,
      updatedAt: new Date().toISOString(),
    });
  }

  return { success: true, rule: newRule, derivedKeyword: keyword };
}

/**
 * Consolidates all allocation rules for a client and across the global database
 * so each account has strictly 1 rule with all deduplicated keywords.
 */
export async function consolidateRulesAction({
  idToken,
  clientId,
}: {
  idToken: string;
  clientId?: string;
}) {
  const authCtx = await getVerifiedAuthContext(idToken);
  if (!authCtx) {
    throw new Error('Unauthorized');
  }

  const db = getAdminDb();
  const { consolidateAllocationRules } = await import('@/lib/allocation-rule-consolidator');

  let clientRulesBefore = 0;
  let clientRulesAfter = 0;

  // 1. Consolidate client rules if clientId is provided
  if (clientId) {
    const clientRef = db.collection('aiAccountantClients').doc(clientId);
    const clientDoc = await clientRef.get();
    if (clientDoc.exists) {
      const data = clientDoc.data();
      const rawRules: AllocationRule[] = data?.allocationRules || [];
      clientRulesBefore = rawRules.length;

      const consolidated = consolidateAllocationRules(rawRules, {
        chartOfAccounts: data?.chartOfAccounts || [],
        isVatRegistered: data?.isVatRegistered || false,
      });
      clientRulesAfter = consolidated.length;

      await clientRef.update({
        allocationRules: consolidated,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // 2. Consolidate global allocationRules in Firestore collection
  let globalDuplicatesDeleted = 0;
  let globalUniqueAccounts = 0;

  if (authCtx.isAdmin) {
    const globalSnap = await db.collection('allocationRules').get();
    const globalDocsByAccount = new Map<string, FirebaseFirestore.QueryDocumentSnapshot[]>();

    for (const doc of globalSnap.docs) {
      const data = doc.data();
      const accId = data.accountId || data.defaultAccountCode;
      if (!accId) continue;
      const key = `${data.accountType || 'account'}:${accId}`;
      const list = globalDocsByAccount.get(key) || [];
      list.push(doc);
      globalDocsByAccount.set(key, list);
    }

    globalUniqueAccounts = globalDocsByAccount.size;

    for (const [_, docs] of globalDocsByAccount.entries()) {
      if (docs.length <= 1) continue;

      // Primary doc is the one with global_master scope or the first
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

      // Update primary doc with all merged keywords
      await primaryDoc.ref.update({
        keywords: sortedKws,
        updatedAt: new Date().toISOString(),
      });

      // Delete secondary duplicate docs
      for (const d of docs) {
        if (d.id !== primaryDoc.id) {
          await d.ref.delete();
          globalDuplicatesDeleted++;
        }
      }
    }
  }

  return {
    success: true,
    clientRulesBefore,
    clientRulesAfter,
    clientCleaned: clientRulesBefore - clientRulesAfter,
    globalUniqueAccounts,
    globalDuplicatesDeleted,
  };
}


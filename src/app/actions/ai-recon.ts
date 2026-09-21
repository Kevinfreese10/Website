'use server';
import { getVerifiedAuthContext, verifyAiAccountantClientAccess, AuthContext } from '@/lib/server-auth';

import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ImportedTransaction, AllocationRule, SmartAllocationResult, User } from '@/lib/types';
import { BankCleaner, matchesRuleKeyword, matchRuleGuideDetails } from '@/lib/bank-cleaner';
import { resolveAccountForCategory } from '@/lib/chart-of-accounts-mapper';
import { proposeRegroupsPure, consolidateMerchantGroupsIterative } from '@/lib/regroup-engine';

/**
 * Verifies the caller's Firebase ID token and, unless they're an admin, that their practice
 * actually created or was shared this specific AI Accountant client. Throws on any failure —
 * every action below calls this first, before touching Firestore.
 */
async function requireAiAccountantAccess(idToken: string, clientId: string): Promise<AuthContext> {
    const authCtx = await getVerifiedAuthContext(idToken);
    if (!authCtx || !(authCtx.isAdmin || authCtx.isPartner)) {
        throw new Error('Unauthorized');
    }
    if (!(await verifyAiAccountantClientAccess(authCtx, clientId))) {
        throw new Error('Unauthorized: you do not have access to this client');
    }
    return authCtx;
}

export async function extractStatementChunk({ chunkBase64, idToken }: { chunkBase64: string, idToken: string }) {
    const authCtx = await getVerifiedAuthContext(idToken);
    if (!authCtx || !(authCtx.isAdmin || authCtx.isPartner)) throw new Error('Unauthorized');

    try {
        const { extractStatementData } = await import('@/ai/flows/extract-statement-data');
        const result = await extractStatementData({ statementFile: chunkBase64 });
        return { success: true, transactions: result.transactions };
    } catch (e) {
        console.error("Chunk extraction failed:", e);
        return { success: false, error: "Failed to extract data" };
    }
}

export async function prepareAiAccountantAnalysis({ clientId, bankAccountId, idToken }: { clientId: string, bankAccountId: string, idToken: string }) {
    await requireAiAccountantAccess(idToken, clientId);

    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', '==', 'new')
        .get();

    const docs = snap.docs.filter(d => {
        const data = d.data();
        return data.isExpense === true || data.amount < 0;
    });

    if (docs.length === 0) return { count: 0 };

    const chunks = [];
    for (let i = 0; i < docs.length; i += 450) {
        chunks.push(docs.slice(i, i + 450));
    }
    for (const chunk of chunks) {
        const batch = adminDb.batch();
        chunk.forEach(d => batch.update(d.ref, { status: 'ai_processing' }));
        await batch.commit();
    }

    return { count: docs.length };
}

export async function runAiAccountantAnalysis({ clientId, bankAccountId, initiatorEmail, idToken }: { clientId: string, bankAccountId: string, initiatorEmail: string, idToken: string }) {
    await requireAiAccountantAccess(idToken, clientId);

    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', '==', 'ai_processing')
        .get();

    if (snap.empty) return;

    const clientDoc = await adminDb.collection('aiAccountantClients').doc(clientId).get();
    const clientData = clientDoc.data() as User;
    let allRules = [...(clientData.allocationRules || [])];
    if (!clientData.disableGlobalRules) {
        const globalSnap = await adminDb.collection('allocationRules').get();
        allRules = [...allRules, ...globalSnap.docs.map(d => ({ ...d.data(), id: d.id } as AllocationRule))];
    }

    const historySnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('status', 'in', ['allocated', 'reviewed'])
        .get();

    const historyCounts = new Map<string, Map<string, number>>();
    historySnap.docs.forEach(doc => {
        const tx = doc.data() as ImportedTransaction;
        if (!tx.allocatedTo || !tx.allocatedTo.value) return;
        const key = tx.merchantKey || BankCleaner.process(tx.description).merchantKey;
        if (!key) return;

        if (!historyCounts.has(key)) {
            historyCounts.set(key, new Map());
        }
        const allocations = historyCounts.get(key)!;
        const allocKey = `${tx.allocatedTo.type || 'account'}:${tx.allocatedTo.value}|${tx.vatType || 'no_vat'}`;
        allocations.set(allocKey, (allocations.get(allocKey) || 0) + 1);
    });

    const bestHistoryMap = new Map<string, { allocatedTo: { value: string, type: 'account' | 'supplier' | 'customer' }, vatType: string }>();
    historyCounts.forEach((allocations, merchantKey) => {
        let bestKey = '';
        let maxCount = -1;
        allocations.forEach((count, key) => {
            if (count > maxCount) {
                maxCount = count;
                bestKey = key;
            }
        });
        if (bestKey) {
            const [typeVal, vatType] = bestKey.split('|');
            const [type, value] = typeVal.split(':');
            bestHistoryMap.set(merchantKey, {
                allocatedTo: { value, type: type as any },
                vatType
            });
        }
    });

    const chunks = [];
    for (let i = 0; i < snap.docs.length; i += 450) {
        chunks.push(snap.docs.slice(i, i + 450));
    }
    for (const chunk of chunks) {
        const batch = adminDb.batch();
        for (const d of chunk) {
            const tx = d.data() as ImportedTransaction;
            const result = BankCleaner.process(tx.description);

            const match = allRules.find(r => 
                r && Array.isArray(r.keywords) && r.keywords.some(kw => typeof kw === 'string' && kw.trim() && (matchesRuleKeyword(result.cleanDescription, kw) || matchesRuleKeyword(tx.description, kw)))
            );

            if (match) {
                const matchedKw = match.keywords.find(kw => typeof kw === 'string' && kw.trim() && (matchesRuleKeyword(result.cleanDescription, kw) || matchesRuleKeyword(tx.description, kw)));
                const guideDetails = matchedKw ? (matchRuleGuideDetails(result.cleanDescription, matchedKw).matched ? matchRuleGuideDetails(result.cleanDescription, matchedKw) : matchRuleGuideDetails(tx.description, matchedKw)) : null;
                const isGuide = guideDetails?.matchType === 'guide';
                
                let targetAccountId = match.accountId;
                let targetAccountType = match.accountType || 'account';
                if (clientData.chartOfAccounts && clientData.chartOfAccounts.length > 0) {
                    const resolved = resolveAccountForCategory(clientData.chartOfAccounts, match);
                    if (resolved) {
                        targetAccountId = resolved.accountNumber;
                        targetAccountType = resolved.accountType;
                    }
                }

                batch.update(d.ref, {
                    ...result,
                    status: 'ai_review',
                    smartAllocationResult: {
                        accountId: targetAccountId,
                        accountType: targetAccountType,
                        vatType: match.vatType,
                        confidence: isGuide ? (guideDetails?.confidence || 90) : 100,
                        summary: isGuide ? `Guide match found for rule keyword "${matchedKw}".` : `Match found for rule keyword.`,
                        ruleId: match.id,
                        matchedKeyword: matchedKw,
                        matchType: isGuide ? 'guide' : 'exact'
                    },
                    allocationSource: 'rule'
                });
            } else {
                const historyMatch = bestHistoryMap.get(result.merchantKey);
                if (historyMatch) {
                    batch.update(d.ref, {
                        ...result,
                        status: 'ai_review',
                        smartAllocationResult: {
                            accountId: historyMatch.allocatedTo.value,
                            accountType: historyMatch.allocatedTo.type || 'account',
                            vatType: historyMatch.vatType || 'no_vat',
                            confidence: 95,
                            summary: `Matched with past transaction allocation history.`
                        },
                        allocationSource: 'history'
                    });
                } else {
                    batch.update(d.ref, {
                        ...result,
                        status: 'ai_review',
                        allocationSource: 'none'
                    });
                }
            }
        }
        await batch.commit();
    }
}

export async function moveTransactionToNew({ clientId, transactionId, idToken }: { clientId: string, transactionId: string, idToken: string }) {
    await requireAiAccountantAccess(idToken, clientId);

    const adminDb = getAdminDb();
    const txRef = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(transactionId);
    const snap = await txRef.get();
    if (!snap.exists) return;
    const data = snap.data();
    const processed = BankCleaner.process(data?.description || '');

    await txRef.update({
        status: 'new',
        allocatedTo: FieldValue.delete(),
        vatType: FieldValue.delete(),
        smartAllocationResult: FieldValue.delete(),
        allocationSource: FieldValue.delete(),
        merchantKey: processed.merchantKey,
        cleanDescription: processed.cleanDescription,
    });
}

export async function bulkMoveTransactionsToNew({ clientId, transactionIds, idToken }: { clientId: string, transactionIds: string[], idToken: string }) {
    await requireAiAccountantAccess(idToken, clientId);

    const adminDb = getAdminDb();
    const chunks = [];
    for (let i = 0; i < transactionIds.length; i += 400) {
        chunks.push(transactionIds.slice(i, i + 400));
    }
    for (const chunk of chunks) {
        const batch = adminDb.batch();
        const refs = chunk.map(id => adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(id));
        const snaps = await adminDb.getAll(...refs);

        snaps.forEach(snap => {
            if (!snap.exists) return;
            const data = snap.data();
            const processed = BankCleaner.process(data?.description || '');
            batch.update(snap.ref, {
                status: 'new',
                allocatedTo: FieldValue.delete(),
                vatType: FieldValue.delete(),
                smartAllocationResult: FieldValue.delete(),
                allocationSource: FieldValue.delete(),
                merchantKey: processed.merchantKey,
                cleanDescription: processed.cleanDescription,
            });
        });

        await batch.commit();
    }
    return { count: transactionIds.length };
}

export async function researchMerchantWithAi({ clientId, transactionIds, description, chartOfAccounts, isVatRegistered, isExpense, idToken }: {
    clientId: string;
    transactionIds: string[];
    description: string;
    chartOfAccounts: string;
    isVatRegistered: boolean;
    isExpense?: boolean;
    idToken: string;
}) {
    await requireAiAccountantAccess(idToken, clientId);

    try {
        const { suggestTransactionAllocation } = await import('@/ai/flows/suggest-transaction-allocation');
        const res = await suggestTransactionAllocation({
            description,
            chartOfAccounts,
            isVatRegistered
        });

        if (clientId && transactionIds && transactionIds.length > 0 && res && res.accountId) {
            const adminDb = getAdminDb();
            const batchSize = 400;
            for (let i = 0; i < transactionIds.length; i += batchSize) {
                const chunk = transactionIds.slice(i, i + batchSize);
                const batch = adminDb.batch();
                chunk.forEach((id: string) => {
                    const ref = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(id);
                    batch.update(ref, {
                        smartAllocationResult: {
                            accountId: res.accountId,
                            vatType: res.vatType,
                            confidence: res.confidence,
                            summary: res.summary,
                            suggestedKeyword: res.suggestedKeyword
                        }
                    });
                });
                await batch.commit();
            }
        }

        return res as SmartAllocationResult;
    } catch (err) {
        console.error("Error in researchMerchantWithAi:", err);
        return {
            accountId: '',
            vatType: 'no_vat',
            confidence: 0,
            summary: 'AI research is currently unavailable due to a network connection error.',
            suggestedKeyword: (description || '').toUpperCase()
        } as SmartAllocationResult;
    }
}

export async function updateGlobalMerchantDb(data: any) {
    console.log("Global DB Update:", data);
}

export async function resetAiAccountantAnalysis({ clientId, bankAccountId, idToken }: { clientId: string, bankAccountId: string, idToken: string }) {
    await requireAiAccountantAccess(idToken, clientId);

    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', 'in', ['ai_processing', 'ai_review'])
        .get();

    if (snap.empty) return { count: 0 };

    const chunks = [];
    for (let i = 0; i < snap.docs.length; i += 450) {
        chunks.push(snap.docs.slice(i, i + 450));
    }
    for (const chunk of chunks) {
        const batch = adminDb.batch();
        chunk.forEach(d => batch.update(d.ref, { status: 'new', smartAllocationResult: FieldValue.delete() }));
        await batch.commit();
    }

    return { count: snap.size };
}

export async function reanalyzeAndRegroupTransactions({ clientId, bankAccountId, initiatorEmail, idToken }: { clientId: string, bankAccountId: string, initiatorEmail: string, idToken: string }) {
    await requireAiAccountantAccess(idToken, clientId);

    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', 'in', ['ai_processing', 'ai_review'])
        .get();

    if (snap.empty) return { count: 0 };

    const chunks = [];
    for (let i = 0; i < snap.docs.length; i += 450) {
        chunks.push(snap.docs.slice(i, i + 450));
    }
    for (const chunk of chunks) {
        const batch = adminDb.batch();
        chunk.forEach(d => {
            batch.update(d.ref, {
                status: 'ai_processing',
                smartAllocationResult: FieldValue.delete(),
                merchantKey: FieldValue.delete(),
                cleanDescription: FieldValue.delete(),
                rawDescription: FieldValue.delete()
            });
        });
        await batch.commit();
    }

    // Re-run analysis with the same, already-verified caller token.
    await runAiAccountantAnalysis({ clientId, bankAccountId, initiatorEmail, idToken });

    return { count: snap.size };
}

export async function proposeRegroups({ clientId, bankAccountId, idToken }: { clientId: string, bankAccountId: string, idToken: string }) {
    await requireAiAccountantAccess(idToken, clientId);

    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', '==', 'ai_review')
        .get();

    const txs = snap.docs.map(d => ({ ...d.data(), id: d.id } as ImportedTransaction));
    const groupsMap = new Map<string, { key: string; count: number; transactions: ImportedTransaction[] }>();
    
    txs.forEach(t => {
        const k = t.merchantKey || 'UNKNOWN';
        if (!groupsMap.has(k)) {
            groupsMap.set(k, { key: k, count: 0, transactions: [] });
        }
        const g = groupsMap.get(k)!;
        g.count++;
        g.transactions.push(t);
    });

    const pureProposals = proposeRegroupsPure(Array.from(groupsMap.values()));

    // Flatten pure proposals into individual source -> targetKey proposals for UI and caller compatibility
    const proposals: any[] = [];
    for (const prop of pureProposals) {
        for (const src of prop.sources) {
            const srcGroup = groupsMap.get(src);
            const targetGroup = groupsMap.get(prop.targetKey);
            proposals.push({
                fromKey: src,
                toKey: prop.targetKey,
                targetKey: prop.targetKey,
                sources: [src],
                fromImpact: srcGroup?.count || 0,
                toImpact: targetGroup?.count || 0,
                totalCount: (srcGroup?.count || 0) + (targetGroup?.count || 0),
                score: Math.round(prop.similarity * 100),
                confidence: prop.isSafe ? 'High' : 'Medium',
                reason: prop.reason,
                similarity: prop.similarity,
                isSafe: prop.isSafe,
                fromTxIds: (srcGroup?.transactions || []).map(t => t.id),
                fromExamples: [srcGroup?.transactions?.[0]?.description || src],
                toExamples: [targetGroup?.transactions?.[0]?.description || prop.targetKey]
            });
        }
    }

    return proposals;
}

export async function applyRegroups({ clientId, merges, userId, idToken }: { clientId: string, merges: any[], userId: string, idToken: string }) {
    await requireAiAccountantAccess(idToken, clientId);

    const adminDb = getAdminDb();
    const updates: { docRef: FirebaseFirestore.DocumentReference; toKey: string }[] = [];

    merges.forEach(m => {
        const toKey = m.toKey || m.targetKey;
        if (m.fromTxIds && Array.isArray(m.fromTxIds) && toKey) {
            m.fromTxIds.forEach((id: string) => {
                const ref = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(id);
                updates.push({ docRef: ref, toKey });
            });
        }
    });

    // Firestore has a hard limit of 500 operations per batch.
    // Chunk updates into batches of 450 documents to remain safely below the limit.
    const CHUNK_SIZE = 450;
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
        const chunk = updates.slice(i, i + CHUNK_SIZE);
        const batch = adminDb.batch();
        chunk.forEach(u => {
            batch.update(u.docRef, { merchantKey: u.toKey });
        });
        await batch.commit();
    }
}

export async function autoConsolidateSmartMatchQueue({ clientId, bankAccountId, idToken }: {
    clientId: string;
    bankAccountId: string;
    idToken: string;
}): Promise<{
    totalMergesApplied: number;
    originalGroupCount: number;
    finalGroupCount: number;
    passesExecuted: number;
    updatedCount: number;
}> {
    await requireAiAccountantAccess(idToken, clientId);

    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', 'in', ['ai_review', 'ai_processing', 'new'])
        .get();

    if (snap.empty) {
        return { totalMergesApplied: 0, originalGroupCount: 0, finalGroupCount: 0, passesExecuted: 0, updatedCount: 0 };
    }

    const txs: (ImportedTransaction & { id: string })[] = [];
    snap.docs.forEach(d => {
        const data = d.data() as ImportedTransaction;
        if (data.status === 'ai_review' || data.status === 'ai_processing' || data.isExpense === true || (data.amount < 0 && data.isExpense !== false)) {
            txs.push({ ...data, id: d.id });
        }
    });

    if (txs.length === 0) {
        return { totalMergesApplied: 0, originalGroupCount: 0, finalGroupCount: 0, passesExecuted: 0, updatedCount: 0 };
    }

    // Group by existing merchantKey (or compute from description)
    const groupMap = new Map<string, { key: string; count: number; transactions: any[] }>();
    txs.forEach(t => {
        const key = t.merchantKey || BankCleaner.process(t.description || '').merchantKey || 'UNKNOWN';
        if (!groupMap.has(key)) {
            groupMap.set(key, { key, count: 0, transactions: [] });
        }
        const g = groupMap.get(key)!;
        g.count++;
        g.transactions.push(t);
    });

    const initialGroups = Array.from(groupMap.values());
    const originalGroupCount = initialGroups.length;

    // Run iterative consolidation until convergence
    const result = consolidateMerchantGroupsIterative(initialGroups, 5);

    if (result.totalMergesApplied === 0) {
        return {
            totalMergesApplied: 0,
            originalGroupCount,
            finalGroupCount: originalGroupCount,
            passesExecuted: result.passesExecuted,
            updatedCount: 0
        };
    }

    // Persist all updated merchantKeys to Firestore
    const updates: { docRef: FirebaseFirestore.DocumentReference; toKey: string }[] = [];
    result.merges.forEach(m => {
        if (m.fromTxIds && Array.isArray(m.fromTxIds) && m.toKey) {
            m.fromTxIds.forEach((id: string) => {
                const ref = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(id);
                updates.push({ docRef: ref, toKey: m.toKey });
            });
        }
    });

    const CHUNK_SIZE = 450;
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
        const chunk = updates.slice(i, i + CHUNK_SIZE);
        const batch = adminDb.batch();
        chunk.forEach(u => {
            batch.update(u.docRef, { merchantKey: u.toKey });
        });
        await batch.commit();
    }

    return {
        totalMergesApplied: result.totalMergesApplied,
        originalGroupCount,
        finalGroupCount: result.consolidatedGroups.length,
        passesExecuted: result.passesExecuted,
        updatedCount: updates.length
    };
}

export async function proposeAiRegroups({ clientId, bankAccountId, selectedMerchantKeys, idToken }: {
    clientId: string;
    bankAccountId: string;
    selectedMerchantKeys?: string[];
    idToken: string;
}) {
    await requireAiAccountantAccess(idToken, clientId);

    const { aiSmartRegroup } = await import('@/ai/flows/ai-smart-regroup');
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', '==', 'ai_review')
        .get();

    const txs = snap.docs.map(d => ({ ...d.data(), id: d.id } as ImportedTransaction));
    const groupData: any[] = [];
    const merchantMap: Record<string, string[]> = {};

    txs.forEach(t => {
        const key = t.merchantKey || 'UNKNOWN';
        if (!merchantMap[key]) {
            merchantMap[key] = [];
            groupData.push({ key, example: t.description || '', count: 0 });
        }
        merchantMap[key].push(t.id);
    });

    groupData.forEach(g => g.count = merchantMap[g.key].length);

    const res = await aiSmartRegroup({ groups: groupData });
    return res.proposals
        .filter(p => merchantMap[p.fromKey] && merchantMap[p.fromKey].length > 0)
        .map(p => ({
            ...p,
            fromTxIds: merchantMap[p.fromKey],
            fromImpact: merchantMap[p.fromKey].length,
            toImpact: merchantMap[p.toKey]?.length || 0,
            score: p.confidence,
            reason: p.reasoning,
            fromExamples: [txs.find(t => (t.merchantKey || 'UNKNOWN') === p.fromKey)?.description || ''],
            toExamples: [txs.find(t => (t.merchantKey || 'UNKNOWN') === p.toKey)?.description || '']
        }));
}

export async function analyzeClientCommentAndSuggest({ clientId, transactionIds, comment, merchantKey, examples, chartOfAccounts, isVatRegistered, idToken }: {
    clientId: string;
    transactionIds: string[];
    comment: string;
    merchantKey?: string;
    examples?: string[];
    chartOfAccounts?: string;
    isVatRegistered?: boolean;
    idToken: string;
}) {
    await requireAiAccountantAccess(idToken, clientId);

    const { analyzeClientComment } = await import('@/ai/flows/analyze-client-comment');
    const res = await analyzeClientComment({
        comment,
        merchantKey: merchantKey || '',
        examples: examples || [],
        chartOfAccounts: chartOfAccounts || '',
        isVatRegistered: !!isVatRegistered
    });

    const adminDb = getAdminDb();
    const batchSize = 400;
    for (let i = 0; i < transactionIds.length; i += batchSize) {
        const chunk = transactionIds.slice(i, i + batchSize);
        const batch = adminDb.batch();
        chunk.forEach((id: string) => {
            const ref = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(id);
            batch.update(ref, {
                clientComment: comment,
                smartAllocationResult: {
                    accountId: res.accountId,
                    vatType: res.vatType,
                    confidence: res.confidence,
                    summary: `AI Analysis of client comment: ${res.reasoning}`
                }
            });
        });
        await batch.commit();
    }

    return res;
}

export async function matchTransactionsToSuppliers({ clientId, bankAccountId, idToken }: { clientId: string, bankAccountId: string, idToken: string }) {
    await requireAiAccountantAccess(idToken, clientId);

    const adminDb = getAdminDb();
    const supSnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('suppliers').get();
    const suppliers = supSnap.docs.map(d => ({ id: d.id, name: d.data().name.toUpperCase() }));

    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', 'in', ['new', 'ai_review'])
        .get();

    const docs = snap.docs.filter(d => {
        const data = d.data();
        return data.isExpense === true || data.amount < 0;
    });

    const batch = adminDb.batch();
    let count = 0;

    docs.forEach(d => {
        const tx = d.data() as ImportedTransaction;
        const match = suppliers.find(s => tx.description.toUpperCase().includes(s.name) || BankCleaner.getSimilarity(tx.description, s.name).score > 0.9);
        if (match) {
            batch.update(d.ref, {
                status: 'reviewed',
                allocatedTo: { value: match.id, type: 'supplier' },
                vatType: 'no_vat',
                allocatedAt: FieldValue.serverTimestamp(),
                allocationSource: 'manual'
            });
            count++;
        }
    });

    if (count > 0) await batch.commit();
    return { count };
}

export async function finalizeChatAllocation({ clientId, transactionId, accountId, vatType, explanation, idToken }: {
    clientId: string;
    transactionId: string;
    accountId: string;
    vatType: string;
    explanation: string;
    idToken: string;
}) {
    await requireAiAccountantAccess(idToken, clientId);

    const adminDb = getAdminDb();
    const txRef = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(transactionId);
    await txRef.update({
        status: 'reviewed',
        allocatedTo: { value: accountId, type: 'account' },
        vatType: vatType,
        clientExplanation: explanation,
        allocatedAt: FieldValue.serverTimestamp(),
        allocationSource: 'chat'
    });
}

export async function analyzeSpreadsheetAllocationsAction({
    clientId,
    spreadsheetData,
    idToken
}: {
    clientId: string;
    spreadsheetData: string;
    idToken: string;
}) {
    await requireAiAccountantAccess(idToken, clientId);

    try {
        const adminDb = getAdminDb();

        const clientDoc = await adminDb.collection('aiAccountantClients').doc(clientId).get();
        if (!clientDoc.exists) {
            return { success: false, error: "Client not found" };
        }
        const clientData = clientDoc.data() as any;
        const chartOfAccounts = clientData.chartOfAccounts || [];
        const isVatRegistered = !!clientData.isVatRegistered;

        const txsSnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
            .where('status', 'in', ['new', 'ai_review', 'ai_processing'])
            .get();

        const unallocatedTransactions = txsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (unallocatedTransactions.length === 0) {
            return { success: true, matches: [], summary: "No unallocated transactions found to match." };
        }

        const custSnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('customers').get();
        const customers = custSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const supSnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('suppliers').get();
        const suppliers = supSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const { allocateFromSpreadsheet } = await import('@/ai/flows/allocate-from-spreadsheet');
        const result = await allocateFromSpreadsheet({
            spreadsheetData,
            unallocatedTransactions,
            chartOfAccounts: JSON.stringify(chartOfAccounts),
            customers,
            suppliers,
            isVatRegistered
        });

        return { success: true, ...result };
    } catch (e: any) {
        console.error("Spreadsheet analysis action failed:", e);
        return { success: false, error: e.message || "Failed to analyze spreadsheet" };
    }
}

export async function applySpreadsheetAllocationsAction({
    clientId,
    allocations,
    idToken
}: {
    clientId: string;
    allocations: {
        transactionId: string;
        accountId: string;
        accountType: 'account' | 'supplier' | 'customer';
        vatType: string;
        explanation: string;
    }[];
    idToken: string;
}) {
    await requireAiAccountantAccess(idToken, clientId);

    try {
        const adminDb = getAdminDb();
        const txCollection = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions');

        const batchSize = 400;
        for (let i = 0; i < allocations.length; i += batchSize) {
            const chunk = allocations.slice(i, i + batchSize);
            const batch = adminDb.batch();
            chunk.forEach(alloc => {
                const ref = txCollection.doc(alloc.transactionId);
                batch.update(ref, {
                    status: 'reviewed',
                    allocatedTo: {
                        value: alloc.accountId,
                        type: alloc.accountType
                    },
                    vatType: alloc.vatType,
                    clientExplanation: alloc.explanation,
                    allocatedAt: FieldValue.serverTimestamp(),
                    allocationSource: 'chat'
                });
            });
            await batch.commit();
        }

        return { success: true, count: allocations.length };
    } catch (e: any) {
        console.error("Apply spreadsheet allocations action failed:", e);
        return { success: false, error: e.message || "Failed to apply allocations" };
    }
}

export async function matchTransactionsToHistory({ clientId, bankAccountId, idToken }: { clientId: string, bankAccountId: string, idToken: string }) {
    await requireAiAccountantAccess(idToken, clientId);

    const adminDb = getAdminDb();

    const activeSnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', '==', 'ai_review')
        .get();

    if (activeSnap.empty) return { count: 0 };

    const historySnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('status', 'in', ['allocated', 'reviewed'])
        .get();

    if (historySnap.empty) return { count: 0 };

    const historyCounts = new Map<string, Map<string, number>>();
    historySnap.docs.forEach(doc => {
        const tx = doc.data() as ImportedTransaction;
        if (!tx.allocatedTo || !tx.allocatedTo.value) return;
        const key = tx.merchantKey || BankCleaner.process(tx.description).merchantKey;
        if (!key) return;

        if (!historyCounts.has(key)) {
            historyCounts.set(key, new Map());
        }
        const allocations = historyCounts.get(key)!;
        const allocKey = `${tx.allocatedTo.type || 'account'}:${tx.allocatedTo.value}|${tx.vatType || 'no_vat'}`;
        allocations.set(allocKey, (allocations.get(allocKey) || 0) + 1);
    });

    const bestHistoryMap = new Map<string, { allocatedTo: { value: string, type: 'account' | 'supplier' | 'customer' }, vatType: string }>();
    historyCounts.forEach((allocations, merchantKey) => {
        let bestKey = '';
        let maxCount = -1;
        allocations.forEach((count, key) => {
            if (count > maxCount) {
                maxCount = count;
                bestKey = key;
            }
        });
        if (bestKey) {
            const [typeVal, vatType] = bestKey.split('|');
            const [type, value] = typeVal.split(':');
            bestHistoryMap.set(merchantKey, {
                allocatedTo: { value, type: type as any },
                vatType
            });
        }
    });

    const batch = adminDb.batch();
    let count = 0;

    activeSnap.docs.forEach(doc => {
        const tx = doc.data() as ImportedTransaction;
        if (tx.allocationSource === 'rule') return;

        const key = tx.merchantKey || BankCleaner.process(tx.description).merchantKey;
        const match = bestHistoryMap.get(key);
        if (match) {
            batch.update(doc.ref, {
                smartAllocationResult: {
                    accountId: match.allocatedTo.value,
                    accountType: match.allocatedTo.type || 'account',
                    vatType: match.vatType || 'no_vat',
                    confidence: 95,
                    summary: `Matched with past transaction allocation history.`
                },
                allocationSource: 'history'
            });
            count++;
        }
    });

    if (count > 0) {
        await batch.commit();
    }

    return { count };
}

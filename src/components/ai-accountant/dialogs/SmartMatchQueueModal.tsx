'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter 
} from "@/components/ui/dialog";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { 
    Sparkles, 
    Layers, 
    Zap, 
    ArrowRight, 
    Loader2, 
    AlertCircle, 
    Save 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BankCleaner, matchesRuleKeyword } from '@/lib/bank-cleaner';
import { proposeRegroupsPure, RegroupProposal } from '@/lib/regroup-engine';
import { MASTER_ALLOCATION_RULES } from '@/lib/master-allocation-rules';
import { 
    analyzeMerchantGroupDetective, 
    DetectiveInputTransaction, 
    DetectiveContext, 
    WebGroundingResult, 
    DetectiveAnalysisResult 
} from '@/lib/detective-engine';
import { applyRegroups, suggestTransactionAllocationWeb } from '@/app/actions';
import { getAuth } from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    updateDoc, 
    getDoc, 
    collection, 
    getDocs, 
    writeBatch, 
    setDoc, 
    serverTimestamp 
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { 
    ImportedTransaction, 
    ChartOfAccount, 
    VatType, 
    AllocationRule 
} from '@/lib/types';
import { renderClueIcon, getClueBadgeStyle } from '../clue-badge-helpers';
import { 
    SmartMatchResult, 
    SmartMatchQueueModalProps, 
    formatPrice 
} from '../types';

const db = getFirestore(firebaseApp);

async function getIdToken(): Promise<string> {
    const token = await getAuth(firebaseApp).currentUser?.getIdToken();
    if (!token) throw new Error('You must be signed in to do this.');
    return token;
}

export function SmartMatchQueueModal({
    open,
    onOpenChange,
    selectedTransactions,
    client,
    globalRules = [],
    onRulesSaved
}: SmartMatchQueueModalProps) {
    const { toast } = useToast();
    const [phase, setPhase] = useState<'idle' | 'review_merges' | 'running' | 'results' | 'saving'>('idle');
    const [progress, setProgress] = useState<{ processed: number; total: number }>({ processed: 0, total: 0 });
    const [results, setResults] = useState<SmartMatchResult[]>([]);
    const [selectedForRules, setSelectedForRules] = useState<Set<string>>(new Set());
    const [ruleEdits, setRuleEdits] = useState<Map<string, string>>(new Map());
    const [accountEdits, setAccountEdits] = useState<Map<string, string>>(new Map());
    const [ruleScopes, setRuleScopes] = useState<Map<string, 'client' | 'global_practice'>>(new Map());
    const [safeProposals, setSafeProposals] = useState<RegroupProposal[]>([]);
    const [isApplyingModalMerges, setIsApplyingModalMerges] = useState(false);
    const [currentDistinctGroups, setCurrentDistinctGroups] = useState<any[]>([]);
    const [currentGroupMap, setCurrentGroupMap] = useState<Map<string, any>>(new Map());
    const isAbortedRef = useRef(false);
    const isMatchingRef = useRef(false);
    const sessionKeyRef = useRef<string | null>(null);
    const selectedTransactionsRef = useRef(selectedTransactions);
    const clientRef = useRef(client);
    const globalRulesRef = useRef(globalRules);

    useEffect(() => {
        selectedTransactionsRef.current = selectedTransactions;
    }, [selectedTransactions]);

    useEffect(() => {
        clientRef.current = client;
    }, [client]);

    useEffect(() => {
        globalRulesRef.current = globalRules;
    }, [globalRules]);

    const txIdsKey = useMemo(() => (selectedTransactions || []).map(t => t.id).join(','), [selectedTransactions]);

    const handleScopeChange = (groupId: string, scope: 'client' | 'global_practice') => {
        setRuleScopes(prev => {
            const next = new Map(prev);
            next.set(groupId, scope);
            return next;
        });
    };

    const runSmartMatch = useCallback(async (groupsToRun: any[]) => {
        const currentClient = clientRef.current;
        const currentGlobalRules = globalRulesRef.current || [];
        const currentTxs = selectedTransactionsRef.current || [];

        const coaJson = JSON.stringify(
            (currentClient?.chartOfAccounts || []).map((a: ChartOfAccount) => ({
                id: a.id,
                accountNumber: a.accountNumber || a.code || a.id,
                description: a.description || a.name || ''
            }))
        );

        const allRules = [...(currentClient?.allocationRules || []), ...currentGlobalRules];
        const matchedResults: SmartMatchResult[] = [];
        const initialSelected = new Set<string>();
        const initialEdits = new Map<string, string>();
        const initialScopes = new Map<string, 'client' | 'global_practice'>();

        // Build detective context once for the batch
        const allDetectiveTxs: DetectiveInputTransaction[] = currentTxs.map(t => ({
            id: t.id,
            description: t.description,
            amount: Number(t.amount) || 0,
            date: t.date,
            isExpense: t.isExpense,
            bankAccountId: t.bankAccountId,
            paymentChannel: t.paymentChannel,
            merchantKey: t.merchantKey,
            structuralClues: t.structuralClues
        }));

        const detectiveContext: DetectiveContext = {
            allBatchTransactions: allDetectiveTxs,
            clientRules: currentClient?.allocationRules || [],
            globalRules: currentClient?.disableGlobalRules ? [] : (globalRules || []),
            masterRules: currentClient?.disableGlobalRules ? [] : MASTER_ALLOCATION_RULES,
            chartOfAccounts: currentClient?.chartOfAccounts || [],
            isVatRegistered: currentClient?.isVatRegistered
        };

        // Phase 1: Instant Tier 1 Detective Evaluation (purely local heuristics, rules, SARS, Sweeps, Brands)
        interface WorkItem {
            group: any;
            groupTxs: DetectiveInputTransaction[];
            tier1Res: DetectiveAnalysisResult;
            matchingRule?: AllocationRule;
            needsWeb: boolean;
        }

        const workItems: WorkItem[] = groupsToRun.map(group => {
            const groupTxs: DetectiveInputTransaction[] = (group.transactions || []).map((t: any) => ({
                id: t.id,
                description: t.description,
                amount: Number(t.amount) || 0,
                date: t.date,
                isExpense: t.isExpense,
                bankAccountId: t.bankAccountId,
                paymentChannel: t.paymentChannel,
                merchantKey: t.merchantKey,
                structuralClues: t.structuralClues
            }));

            const tier1Res = analyzeMerchantGroupDetective(group.groupKey, groupTxs, detectiveContext);
            
            // Check if an existing rule actually matches this merchant's keywords or description
            const matchingRule = allRules.find(r => 
                (r.keywords || []).some(kw => matchesRuleKeyword(group.groupKey, kw) || matchesRuleKeyword(group.description, kw))
            );

            // Needs Web Grounding if no existing rule matches and Tier 1 has low confidence or no suggested account
            const needsWeb = !matchingRule && (!tier1Res.isAutoAllocatable || !tier1Res.suggestedAccountId);

            return {
                group,
                groupTxs,
                tier1Res,
                matchingRule,
                needsWeb
            };
        });

        const webCandidates = workItems.filter(w => w.needsWeb);
        let completedCount = workItems.length - webCandidates.length;
        setProgress({ processed: completedCount, total: workItems.length });

        // Phase 2: Bounded Concurrent Web Research with Strict 7-Second Timeout (only for unknown groups)
        const webResultsMap = new Map<string, WebGroundingResult | undefined>();
        const CONCURRENCY = 3;

        for (let b = 0; b < webCandidates.length; b += CONCURRENCY) {
            if (isAbortedRef.current) break;
            const chunk = webCandidates.slice(b, b + CONCURRENCY);

            await Promise.all(chunk.map(async (item) => {
                if (isAbortedRef.current) return;
                try {
                    const timeoutPromise = new Promise<undefined>((resolve) => 
                        setTimeout(() => resolve(undefined), 7000)
                    );
                    const callPromise = suggestTransactionAllocationWeb({
                        description: item.group.description,
                        chartOfAccounts: coaJson,
                        isVatRegistered: currentClient?.isVatRegistered,
                        apiKey: currentClient?.geminiApiKey,
                        paymentChannel: item.groupTxs[0]?.paymentChannel,
                        amount: item.groupTxs[0]?.amount
                    }).then(output => {
                        if (output && output.confidence > 0) {
                            return {
                                merchantName: output.merchantName,
                                merchantCategory: output.merchantCategory,
                                suggestedAccountId: output.accountId,
                                suggestedVatType: output.vatType,
                                confidence: output.confidence,
                                suggestedKeyword: output.suggestedKeyword,
                                rationale: output.rationale,
                                cipcRegistered: output.cipcRegistered,
                                vatVendorStatus: output.vatVendorStatus
                            } as WebGroundingResult;
                        }
                        return undefined;
                    }).catch(err => {
                        console.warn(`Web grounding skipped/failed for ${item.group.groupKey}:`, err);
                        return undefined;
                    });

                    const webResult = await Promise.race([callPromise, timeoutPromise]);
                    if (webResult) {
                        webResultsMap.set(item.group.groupId, webResult);
                    }
                } catch (e) {
                    // Ignore error, fallback cleanly to Tier 1
                } finally {
                    completedCount++;
                    if (!isAbortedRef.current) {
                        setProgress({ processed: Math.min(completedCount, workItems.length), total: workItems.length });
                    }
                }
            }));
        }

        // Phase 3: Synthesize Final Results
        for (const item of workItems) {
            const webResult = webResultsMap.get(item.group.groupId);
            const finalDetectiveRes = webResult 
                ? analyzeMerchantGroupDetective(item.group.groupKey, item.groupTxs, detectiveContext, webResult)
                : item.tier1Res;

            const acc = (currentClient?.chartOfAccounts || []).find((a: ChartOfAccount) => a.id === finalDetectiveRes.suggestedAccountId || a.accountNumber === finalDetectiveRes.suggestedAccountId);
            const accountLabel = acc ? `${acc.accountNumber || acc.id} - ${acc.description}` : (finalDetectiveRes.suggestedAccountLabel || finalDetectiveRes.suggestedAccountId || '');
            
            // Only associate an existingRule if a rule's keywords actually matched this merchant
            const existingRule = item.matchingRule || (finalDetectiveRes.suggestedAccountId ? allRules.find(r => 
                r.accountId === finalDetectiveRes.suggestedAccountId && 
                (r.keywords || []).some(kw => matchesRuleKeyword(item.group.groupKey, kw) || matchesRuleKeyword(item.group.description, kw))
            ) : undefined);

            const res: SmartMatchResult = {
                groupId: item.group.groupId,
                groupKey: item.group.groupKey,
                description: item.group.description,
                transactionCount: item.group.transactions.length,
                totalAmount: item.group.totalAmount,
                transactionIds: item.group.transactions.map((t: any) => t.id),
                merchantName: webResult?.merchantName || finalDetectiveRes.cleanDescription || item.group.groupKey,
                merchantCategory: webResult?.merchantCategory || 'General',
                suggestedAccountId: finalDetectiveRes.suggestedAccountId || '',
                suggestedAccountLabel: accountLabel,
                vatType: finalDetectiveRes.suggestedVatType,
                confidence: finalDetectiveRes.compositeConfidence,
                suggestedKeyword: (webResult?.suggestedKeyword || item.group.groupKey).toUpperCase(),
                existingRule,
                badges: finalDetectiveRes.badges,
                ruleScoping: finalDetectiveRes.ruleScoping,
                isAutoAllocatable: finalDetectiveRes.isAutoAllocatable && Boolean(finalDetectiveRes.suggestedAccountId),
                status: finalDetectiveRes.status
            };

            matchedResults.push(res);
            if (res.isAutoAllocatable) {
                initialSelected.add(item.group.groupId);
            }
            initialEdits.set(item.group.groupId, res.suggestedKeyword);
            initialScopes.set(item.group.groupId, finalDetectiveRes.ruleScoping);
        }

        if (!isAbortedRef.current) {
            setResults(matchedResults);
            setSelectedForRules(initialSelected);
            setRuleEdits(initialEdits);
            setRuleScopes(initialScopes);
            setPhase('results');
        }
    }, [globalRules]);

    const startMatching = useCallback((groupsToRun: any[]) => {
        isAbortedRef.current = false;
        setPhase('running');
        setProgress({ processed: 0, total: groupsToRun.length });
        setResults([]);
        setSelectedForRules(new Set());
        setRuleEdits(new Map());
        setAccountEdits(new Map());
        setRuleScopes(new Map());
        runSmartMatch(groupsToRun);
    }, [runSmartMatch]);

    useEffect(() => {
        if (!open) {
            isAbortedRef.current = true;
            isMatchingRef.current = false;
            sessionKeyRef.current = null;
            setPhase('idle');
            return;
        }

        const currentSession = txIdsKey;
        if (sessionKeyRef.current === currentSession && isMatchingRef.current) {
            return;
        }
        sessionKeyRef.current = currentSession;
        isMatchingRef.current = true;
        isAbortedRef.current = false;

        const txs = selectedTransactionsRef.current;
        if (!txs || txs.length === 0) {
            setPhase('idle');
            return;
        }

        // 1. Group selected transactions by merchantKey / normalized description
        const groupMap = new Map<string, {
            groupId: string;
            groupKey: string;
            description: string;
            transactions: ImportedTransaction[];
            totalAmount: number;
        }>();

        for (const tx of txs) {
            const processed = BankCleaner.process(tx.description || '');
            const rawKey = (tx.merchantKey || tx.cleanDescription || processed.merchantKey || processed.cleanDescription || tx.description || '').trim();
            const normalizedKey = rawKey.toUpperCase() || 'UNKNOWN';
            
            if (!groupMap.has(normalizedKey)) {
                groupMap.set(normalizedKey, {
                    groupId: `grp_${groupMap.size + 1}_${normalizedKey.substring(0, 12).replace(/[^A-Z0-9]/g, '_')}`,
                    groupKey: normalizedKey,
                    description: tx.description,
                    transactions: [],
                    totalAmount: 0,
                });
            }

            const g = groupMap.get(normalizedKey)!;
            g.transactions.push(tx);
            g.totalAmount += (Number(tx.amount) || 0);
        }

        const distinctGroups = Array.from(groupMap.values());
        setCurrentGroupMap(groupMap);
        setCurrentDistinctGroups(distinctGroups);

        // Pre-flight check for safe regroup proposals
        const initialGroupsForRegroup = distinctGroups.map(g => ({
            key: g.groupKey,
            count: g.transactions.length,
            transactions: g.transactions
        }));

        const proposals = proposeRegroupsPure(initialGroupsForRegroup);
        const detectedSafe = proposals.filter(p => p.isSafe);

        if (detectedSafe.length > 0) {
            setSafeProposals(detectedSafe);
            setPhase('review_merges');
        } else {
            setSafeProposals([]);
            startMatching(distinctGroups);
        }
    }, [open, txIdsKey, startMatching]);

    const handleMergeAllSafeInModal = async () => {
        setIsApplyingModalMerges(true);
        try {
            const updatedGroupMap = new Map(currentGroupMap);
            const mergesToPersist: { fromKey: string; toKey: string; fromTxIds: string[] }[] = [];

            for (const prop of safeProposals) {
                let targetG = updatedGroupMap.get(prop.targetKey);
                if (!targetG) {
                    const firstSrc = updatedGroupMap.get(prop.sources[0]);
                    if (firstSrc) {
                        targetG = {
                            groupId: `grp_${updatedGroupMap.size + 1}_${prop.targetKey.substring(0, 12).replace(/[^A-Z0-9]/g, '_')}`,
                            groupKey: prop.targetKey,
                            description: firstSrc.description,
                            transactions: [],
                            totalAmount: 0
                        };
                        updatedGroupMap.set(prop.targetKey, targetG);
                    }
                }

                if (targetG) {
                    for (const srcKey of prop.sources) {
                        const srcG = updatedGroupMap.get(srcKey);
                        if (srcG && srcKey !== prop.targetKey) {
                            targetG.transactions.push(...srcG.transactions);
                            targetG.totalAmount += srcG.totalAmount;
                            mergesToPersist.push({
                                fromKey: srcKey,
                                toKey: prop.targetKey,
                                fromTxIds: srcG.transactions.map((t: any) => t.id)
                            });
                            updatedGroupMap.delete(srcKey);
                        }
                    }
                }
            }

            if (client?.uid && mergesToPersist.length > 0) {
                try {
                    const idToken = await getIdToken();
                    await applyRegroups({
                        clientId: client.uid,
                        merges: mergesToPersist,
                        userId: client.uid,
                        idToken
                    });
                } catch (persistErr) {
                    console.warn("Could not persist regroups to DB, proceeding in-memory:", persistErr);
                }
            }

            toast({
                title: "Safe Regroups Applied",
                description: `Consolidated ${safeProposals.length} merchant group variant(s) before AI research.`
            });

            const collapsedGroups = Array.from(updatedGroupMap.values());
            setCurrentDistinctGroups(collapsedGroups);
            setCurrentGroupMap(updatedGroupMap);
            setSafeProposals([]);
            startMatching(collapsedGroups);
        } catch (err) {
            console.error("Error applying safe merges in modal:", err);
            toast({ title: "Failed to merge groups", variant: "destructive" });
        } finally {
            setIsApplyingModalMerges(false);
        }
    };

    const handleSkipSafeMerges = () => {
        setSafeProposals([]);
        startMatching(currentDistinctGroups);
    };

    const handleCancel = () => {
        isAbortedRef.current = true;
        isMatchingRef.current = false;
        sessionKeyRef.current = null;
        setPhase('idle');
        onOpenChange(false);
    };

    const handleToggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedForRules(new Set(results.map(r => r.groupId)));
        } else {
            setSelectedForRules(new Set());
        }
    };

    const handleToggleSelectRow = (groupId: string, checked: boolean) => {
        setSelectedForRules(prev => {
            const next = new Set(prev);
            if (checked) {
                next.add(groupId);
            } else {
                next.delete(groupId);
            }
            return next;
        });
    };

    const handleKeywordEdit = (groupId: string, value: string) => {
        setRuleEdits(prev => {
            const next = new Map(prev);
            next.set(groupId, value);
            return next;
        });
    };

    const handleAccountEdit = (groupId: string, accountId: string) => {
        setAccountEdits(prev => {
            const next = new Map(prev);
            next.set(groupId, accountId);
            return next;
        });
    };

    const handleSaveRules = async () => {
        if (!client?.uid || selectedForRules.size === 0) return;
        setPhase('saving');

        try {
            const selectedResults = results.filter(r => selectedForRules.has(r.groupId));

            const clientDocRef = doc(db, 'aiAccountantClients', client.uid);
            const clientSnap = await getDoc(clientDocRef);
            const latestClientData = clientSnap.data();
            let currentClientRules: AllocationRule[] = [...(latestClientData?.allocationRules || client.allocationRules || [])];

            // Fetch current global rules from 'allocationRules' collection
            const globalRulesSnap = await getDocs(collection(db, 'allocationRules'));
            const globalRulesDocs = globalRulesSnap.docs.map(d => ({ docId: d.id, ...d.data() } as AllocationRule & { docId: string }));

            let createdCount = 0;
            let updatedCount = 0;
            const allTxUpdates: Array<{ txId: string; accountId: string; vatType: VatType; ruleId: string }> = [];

            for (const result of selectedResults) {
                const keyword = (ruleEdits.get(result.groupId) || result.suggestedKeyword).trim().toUpperCase();
                const accountId = accountEdits.get(result.groupId) || result.suggestedAccountId;
                const scope = ruleScopes.get(result.groupId) || result.ruleScoping;
                
                if (!keyword || !accountId) continue;

                let assignedRuleId = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

                if (scope === 'global_practice') {
                    // Update/create Global Practice Level Rule in 'allocationRules' collection
                    const existingGlobal = globalRulesDocs.find(r => r.accountId === accountId);
                    if (existingGlobal) {
                        const existingGlobalKeywords = existingGlobal.keywords || [];
                        if (!existingGlobalKeywords.includes(keyword)) {
                            const updatedGlobalKeywords = Array.from(new Set([...existingGlobalKeywords, keyword]));
                            await updateDoc(doc(db, 'allocationRules', existingGlobal.docId), {
                                keywords: updatedGlobalKeywords
                            });
                            existingGlobal.keywords = updatedGlobalKeywords;
                        }
                        assignedRuleId = existingGlobal.docId || existingGlobal.id || assignedRuleId;
                        updatedCount++;
                    } else {
                        const newGlobalDocRef = doc(collection(db, 'allocationRules'));
                        assignedRuleId = newGlobalDocRef.id;
                        const newGlobalRule = {
                            description: result.merchantName ? `${result.merchantName}` : `Rule for ${keyword}`,
                            keywords: [keyword],
                            accountId: accountId,
                            vatType: result.vatType || 'no_vat',
                            scope: 'global',
                            priority: 99,
                            createdAt: serverTimestamp()
                        };
                        await setDoc(newGlobalDocRef, newGlobalRule);
                        globalRulesDocs.push({ ...newGlobalRule, id: newGlobalDocRef.id, docId: newGlobalDocRef.id });
                        createdCount++;
                    }
                } else {
                    // Update/create Client Level Rule
                    const existingRuleIndex = currentClientRules.findIndex(r => r.accountId === accountId);
                    if (existingRuleIndex !== -1) {
                        const existingRule = currentClientRules[existingRuleIndex];
                        const existingKeywords = existingRule.keywords || [];
                        if (!existingKeywords.includes(keyword)) {
                            currentClientRules[existingRuleIndex] = {
                                ...existingRule,
                                keywords: Array.from(new Set([...existingKeywords, keyword]))
                            };
                            updatedCount++;
                        }
                        assignedRuleId = existingRule.id || assignedRuleId;
                    } else {
                        const newRule: AllocationRule = {
                            id: assignedRuleId,
                            description: `Auto-rule for ${keyword}`,
                            keywords: [keyword],
                            accountId: accountId,
                            vatType: result.vatType || 'no_vat',
                            type: 'hard',
                            scope: 'client',
                            priority: 99
                        };
                        currentClientRules.push(newRule);
                        createdCount++;
                    }
                }

                for (const txId of result.transactionIds) {
                    allTxUpdates.push({
                        txId,
                        accountId,
                        vatType: result.vatType || 'no_vat',
                        ruleId: assignedRuleId
                    });
                }
            }

            // Commit client rules update
            await updateDoc(clientDocRef, { allocationRules: currentClientRules });

            // Commit transaction document allocations in Firestore in batches of 450
            const BATCH_SIZE = 450;
            for (let b = 0; b < allTxUpdates.length; b += BATCH_SIZE) {
                const chunk = allTxUpdates.slice(b, b + BATCH_SIZE);
                const batch = writeBatch(db);
                for (const item of chunk) {
                    const txRef = doc(db, 'aiAccountantClients', client.uid, 'transactions', item.txId);
                    batch.update(txRef, {
                        status: 'reviewed',
                        allocatedTo: { value: item.accountId, type: 'account' },
                        vatType: client.isVatRegistered ? item.vatType : 'no_vat',
                        allocationSource: 'rule',
                        matchedRuleId: item.ruleId,
                        allocatedAt: new Date().toISOString()
                    });
                }
                await batch.commit();
            }

            toast({
                title: 'Rules Created & Transactions Allocated',
                description: `${selectedResults.length} merchant group(s) processed. ${createdCount} new rule(s), ${updatedCount} updated, ${allTxUpdates.length} transaction(s) committed to reviewed.`
            });

            onRulesSaved();
            onOpenChange(false);
        } catch (err) {
            console.error("Error saving rules and allocating transactions:", err);
            toast({
                title: 'Error Saving Rules',
                description: 'Could not save the allocation rules to Firestore.',
                variant: 'destructive'
            });
            setPhase('results');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl lg:max-w-7xl w-[95vw] max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Sparkles className="h-5 w-5 text-emerald-500" />
                        AI Smart Match Queue
                    </DialogTitle>
                    <DialogDescription>
                        Analyses selected transactions by merchant group using the 9-Clue Detective Allocation Engine and AI web search grounding (≥ 80% confidence) to auto-allocate transactions and create scoped allocation rules.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 flex-1 overflow-y-auto min-h-[320px]">
                    {phase === 'review_merges' && (
                        <div className="space-y-4">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <Layers className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-bold text-sm text-emerald-950">
                                            {safeProposals.length} Safe Merchant Regroup(s) Detected
                                        </h3>
                                        <p className="text-xs text-emerald-800 mt-1">
                                            Found branch numbers, store locators, or typo variants that belong to canonical brands. Merging them now consolidates your merchant groups and saves AI web research requests.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleMergeAllSafeInModal}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0 shadow-sm"
                                    disabled={isApplyingModalMerges}
                                >
                                    {isApplyingModalMerges ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4 fill-white" />}
                                    Merge All Safe Proposals ({safeProposals.length})
                                </Button>
                            </div>

                            <ScrollArea className="max-h-[50vh] pr-2">
                                <div className="space-y-3">
                                    {safeProposals.map((prop, idx) => (
                                         <div key={idx} className="p-3 rounded-lg border bg-white shadow-sm flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="flex-1">
                                                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider mb-1 text-destructive">Merge From ({prop.sources.length})</Badge>
                                                    <p className="font-semibold text-xs text-destructive truncate">{prop.sources.join(', ')}</p>
                                                    <p className="text-[10px] text-muted-foreground">{prop.totalCount} transaction(s)</p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <div className="flex-1">
                                                    <Badge variant="default" className="text-[9px] uppercase tracking-wider mb-1 bg-emerald-600">Canonical Root</Badge>
                                                    <p className="font-semibold text-xs text-emerald-900 truncate">{prop.targetKey}</p>
                                                    <p className="text-[10px] text-muted-foreground">{prop.reason}</p>
                                                </div>
                                            </div>
                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                                                {Math.round(prop.similarity * 100)}% Match
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {phase === 'running' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
                            <div className="relative">
                                <div className="h-16 w-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin flex items-center justify-center" />
                                <Sparkles className="h-6 w-6 text-emerald-500 absolute inset-0 m-auto" />
                            </div>
                            <div className="space-y-2 max-w-sm">
                                <h3 className="font-semibold text-lg">Analyzing Merchant Groups...</h3>
                                <p className="text-sm text-muted-foreground">
                                    Instant 9-Clue Detective Engine matching with grounded AI research for unknown merchants.
                                </p>
                            </div>
                            <div className="w-full max-w-md space-y-2">
                                <Progress value={progress.total > 0 ? (progress.processed / progress.total) * 100 : 0} className="h-2" />
                                <p className="text-xs text-muted-foreground font-mono">
                                    Processed {progress.processed} of {progress.total} groups ({selectedTransactions.length} total transactions)...
                                </p>
                            </div>
                        </div>
                    )}

                    {phase === 'saving' && (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                            <h3 className="font-semibold text-lg">Saving Rules to Client Database...</h3>
                            <p className="text-sm text-muted-foreground">Updating allocation rules with selected keywords.</p>
                        </div>
                    )}

                    {phase === 'results' && (
                        <div className="space-y-4">
                            {results.length === 0 ? (
                                <div className="text-center py-12 space-y-3">
                                    <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
                                    <h3 className="font-semibold text-base">No Matches Found</h3>
                                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                        None of the analyzed transactions could be processed.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border gap-4 flex-wrap">
                                        <span>Found <strong className="text-foreground">{results.filter(r => r.isAutoAllocatable).length}</strong> high-confidence (≥ 80%) merchant group match(es) covering <strong className="text-foreground">{results.filter(r => r.isAutoAllocatable).reduce((sum, r) => sum + r.transactionCount, 0)}</strong> of {selectedTransactions.length} selected transaction(s).</span>
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <span className="font-semibold text-emerald-600">{selectedForRules.size} group(s) selected</span>
                                            {selectedForRules.size > 0 && (
                                                <Select
                                                    onValueChange={(accountId) => {
                                                        setAccountEdits(prev => {
                                                            const next = new Map(prev);
                                                            selectedForRules.forEach(groupId => {
                                                                next.set(groupId, accountId);
                                                            });
                                                            return next;
                                                        });
                                                        toast({
                                                            title: "Bulk Allocations Applied",
                                                            description: `Allocated ${selectedForRules.size} selected group(s).`
                                                        });
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 text-xs font-semibold w-[200px] bg-white border border-input shadow-sm">
                                                        <SelectValue placeholder="Bulk allocate selected..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(client?.chartOfAccounts || []).map((acc: ChartOfAccount) => (
                                                            <SelectItem key={acc.id} value={acc.id} className="text-xs">
                                                                {acc.accountNumber || acc.id} - {acc.description}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border rounded-lg overflow-x-auto shadow-sm bg-card">
                                        <Table className="w-full">
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="w-10 px-2 text-center">
                                                        <Checkbox 
                                                            checked={results.length > 0 && selectedForRules.size === results.length} 
                                                            onCheckedChange={(c) => handleToggleSelectAll(!!c)} 
                                                        />
                                                    </TableHead>
                                                    <TableHead className="w-[230px]">Merchant Group & Clues</TableHead>
                                                    <TableHead className="w-[150px]">Identified Merchant</TableHead>
                                                    <TableHead className="w-[280px]">Suggested GL Account</TableHead>
                                                    <TableHead className="w-[115px]">Rule Scope</TableHead>
                                                    <TableHead className="w-[95px] text-center">Confidence</TableHead>
                                                    <TableHead className="w-[145px]">Rule Keyword</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {results.map(r => {
                                                    const isChecked = selectedForRules.has(r.groupId);
                                                    const currentKeyword = ruleEdits.get(r.groupId) ?? r.suggestedKeyword;

                                                    return (
                                                        <TableRow key={r.groupId} className={cn(isChecked && "bg-emerald-500/5")}>
                                                            <TableCell className="px-2 text-center">
                                                                <Checkbox 
                                                                    checked={isChecked} 
                                                                    onCheckedChange={(checked) => handleToggleSelectRow(r.groupId, !!checked)} 
                                                                />
                                                            </TableCell>
                                                            <TableCell className="w-[230px] max-w-[230px]">
                                                                <div className="font-semibold text-xs text-foreground truncate" title={r.groupKey}>
                                                                    {r.groupKey}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                                                        {r.transactionCount} {r.transactionCount === 1 ? 'tx' : 'txs'} • R {formatPrice(r.totalAmount)}
                                                                    </Badge>
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5" title={r.description}>
                                                                    {r.description}
                                                                </div>
                                                                {r.badges && r.badges.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                                        {r.badges.map((b, bIdx) => (
                                                                            <span
                                                                                key={bIdx}
                                                                                title={`${b.detail} (+${b.confidenceContribution}%)`}
                                                                                className={cn(
                                                                                    "inline-flex items-center gap-1 text-[9px] px-1 py-0.5 rounded border font-medium",
                                                                                    getClueBadgeStyle(b.type)
                                                                                )}
                                                                            >
                                                                                {renderClueIcon(b.type)}
                                                                                <span>{b.label}</span>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="w-[150px] max-w-[150px]">
                                                                <div className="font-semibold text-xs text-foreground truncate" title={r.merchantName}>
                                                                    {r.merchantName}
                                                                </div>
                                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 mt-0.5 font-normal truncate max-w-full block w-fit" title={r.merchantCategory}>
                                                                    {r.merchantCategory}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="w-[280px] max-w-[280px]">
                                                                <div className="space-y-1">
                                                                    <Select
                                                                        value={(accountEdits.get(r.groupId) || r.suggestedAccountId) || undefined}
                                                                        onValueChange={(val) => handleAccountEdit(r.groupId, val)}
                                                                    >
                                                                        <SelectTrigger className="h-9 text-xs font-medium w-full bg-background border border-input shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors px-2.5 whitespace-nowrap overflow-hidden">
                                                                            <SelectValue className="truncate block text-left" placeholder="Select account..." />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {(client?.chartOfAccounts || []).map((acc: ChartOfAccount) => (
                                                                                <SelectItem key={acc.id} value={acc.id} className="text-xs">
                                                                                    {acc.accountNumber || acc.id} - {acc.description}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    {r.existingRule && (
                                                                        <div className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded px-2 py-0.5 flex items-center gap-1.5 font-medium leading-tight mt-1" title={`Rule: ${r.existingRule.description || r.existingRule.keywords.join(', ')}`}>
                                                                            <Zap className="h-3 w-3 fill-emerald-500 text-emerald-500 shrink-0 inline" />
                                                                            <span className="truncate">Rule: {r.existingRule.description || r.existingRule.keywords.join(', ')}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="w-[115px]">
                                                                <Select
                                                                    value={ruleScopes.get(r.groupId) || r.ruleScoping}
                                                                    onValueChange={(val) => handleScopeChange(r.groupId, val as 'client' | 'global_practice')}
                                                                >
                                                                    <SelectTrigger className="h-8 text-xs font-semibold w-full bg-background border border-input shadow-sm px-2">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="client" className="text-xs">
                                                                            Client
                                                                        </SelectItem>
                                                                        <SelectItem value="global_practice" className="text-xs">
                                                                            Practice
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </TableCell>
                                                            <TableCell className="w-[95px] text-center">
                                                                <Badge 
                                                                    className={cn(
                                                                        "font-bold text-[10px]",
                                                                        r.confidence >= 80 
                                                                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                                            : "bg-amber-100 text-amber-800 border-amber-300"
                                                                    )}
                                                                >
                                                                    {r.confidence}%
                                                                </Badge>
                                                                {!r.isAutoAllocatable && (
                                                                    <div className="text-[9px] text-amber-700 font-semibold mt-0.5 leading-tight">
                                                                        Review Needed (&lt;80%)
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="w-[145px]">
                                                                <Input 
                                                                    value={currentKeyword}
                                                                    onChange={(e) => handleKeywordEdit(r.groupId, e.target.value.toUpperCase())}
                                                                    className="h-8 text-xs uppercase font-mono bg-background border-input focus:border-primary shadow-sm px-2"
                                                                    placeholder="KEYWORD"
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 bg-muted/30 border-t flex items-center justify-between sm:justify-between">
                    <div>
                        {phase === 'running' && (
                            <Button variant="ghost" size="sm" onClick={handleCancel}>
                                Cancel Analysis
                            </Button>
                        )}
                        {phase === 'review_merges' && (
                            <Button variant="ghost" size="sm" onClick={handleCancel}>
                                Cancel
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {phase === 'review_merges' && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleSkipSafeMerges}
                                    disabled={isApplyingModalMerges}
                                >
                                    Skip & Run AI Match ({currentDistinctGroups.length} groups)
                                </Button>
                                <Button
                                    onClick={handleMergeAllSafeInModal}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                    disabled={isApplyingModalMerges}
                                >
                                    {isApplyingModalMerges ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4 fill-white" />}
                                    Merge All Safe Proposals ({safeProposals.length})
                                </Button>
                            </>
                        )}
                        {phase === 'results' && results.length > 0 && (
                            <Button 
                                onClick={handleSaveRules} 
                                disabled={selectedForRules.size === 0}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Create Rules for Selected ({selectedForRules.size} groups)
                            </Button>
                        )}
                        {phase !== 'review_merges' && (
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={phase === 'saving'}>
                                {phase === 'results' ? 'Close' : 'Cancel'}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

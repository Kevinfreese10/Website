'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
    Loader2, 
    Sparkles, 
    CheckCircle2, 
    RotateCw, 
    ChevronLeft, 
    ChevronRight, 
    MessageSquare, 
    History, 
    RotateCcw, 
    Save, 
    StopCircle, 
    Zap, 
    Layers, 
    ArrowRight, 
    FileSpreadsheet,
    Search,
    ChevronDown,
    AlertTriangle 
} from 'lucide-react';
import { 
    getFirestore, 
    doc, 
    collection, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    writeBatch, 
    onSnapshot, 
    serverTimestamp, 
    arrayUnion, 
    deleteField 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ImportedTransaction, User, AllocationRule, SmartAllocationResult, ClientCustomer, Supplier } from '@/lib/types';
import { TransactionGroup, RuleFormValues } from './types';
import { cn } from '@/lib/utils';
import { BankCleaner, matchesRuleKeyword } from '@/lib/bank-cleaner';
import { resolveAccountForCategory } from '@/lib/chart-of-accounts-mapper';
import { allVatTypes } from '@/lib/vat-types';
import { AccountSelector } from '@/components/accounting/AccountSelector';
import { format } from 'date-fns';
import * as XLSX from 'xlsx-js-style';
import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
    proposeRegroups, 
    proposeAiRegroups, 
    applyRegroups, 
    autoConsolidateSmartMatchQueue, 
    moveTransactionToNew, 
    bulkMoveTransactionsToNew, 
    updateGlobalMerchantDb, 
    researchMerchantWithAi, 
    analyzeClientCommentAndSuggest, 
    resetAiAccountantAnalysis, 
    reanalyzeAndRegroupTransactions, 
    matchTransactionsToHistory 
} from '@/app/actions';
import { 
    CreateGeneralAccountDialog, 
    GroupTransactionsDialog,
    CreateRuleDialog 
} from './dialogs';
import { useDebounce } from '@/hooks/use-debounce';
import { MerchantGroupCard } from './components/MerchantGroupCard';

const db = getFirestore(firebaseApp);
// Requirement R2: Page size reduced from 200 to 25 to prevent DOM overload (>15k nodes -> <2k nodes)
const PAGE_SIZE = 25;

async function getIdToken(): Promise<string> {
    const token = await getAuth(firebaseApp).currentUser?.getIdToken();
    if (!token) throw new Error('You must be signed in to do this.');
    return token;
}

export interface SmartMatchQueueTabProps {
    client: User | null;
    bankAccountId: string | null;
    onAccountCreated: () => void;
    onAllocationComplete?: () => void;
    globalRules?: AllocationRule[];
    customers?: ClientCustomer[];
    suppliers?: Supplier[];
}

export const SmartMatchQueueTab = ({ 
    client, 
    bankAccountId, 
    onAccountCreated, 
    onAllocationComplete,
    globalRules,
    customers = [],
    suppliers = []
}: SmartMatchQueueTabProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [groups, setGroups] = useState<TransactionGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRechecking, setIsRechecking] = useState(false);
    const [isReseting, setIsReseting] = useState(false);
    const [isReanalyzing, setIsReanalyzing] = useState(false);
    const [isCreateGeneralAccountOpen, setIsCreateGeneralAccountOpen] = useState(false);
    const [approvalSettings, setApprovalSettings] = useState<any>({});
    const [groupComments, setGroupComments] = useState<any>({});
    const [isAnalyzingComment, setIsAnalyzingComment] = useState<string | null>(null);
    const [viewingGroup, setViewingGroup] = useState<TransactionGroup | null>(null);
    const [isMovingBack, setIsMovingBack] = useState<string | null>(null);
    const [isResearchingId, setIsResearchingId] = useState<string | null>(null);
    const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>([]);
    const [onlySelectedGroups, setOnlySelectedGroups] = useState(false);
    const [isSavingDrafts, setIsSavingDrafts] = useState(false);
    const [isHistoryMatching, setIsHistoryMatching] = useState(false);
    
    // Regroup states
    const [isRegrouping, setIsRegrouping] = useState(false);
    const [isAiRegrouping, setIsAiRegrouping] = useState(false);
    const [proposedMerges, setProposedMerges] = useState<any[]>([]);
    const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
    const [isApplyingMerges, setIsApplyingMerges] = useState(false);
    const [selectedMerges, setSelectedMerges] = useState<string[]>([]);

    // Rule Creation on Approval state
    const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
    const [ruleDefaultValues, setRuleDefaultValues] = useState<Partial<RuleFormValues>>({});
    const [stagedGroupForRule, setStagedGroupForRule] = useState<TransactionGroup | null>(null);

    // Destructive AI reanalyze confirmation
    const [isReanalyzeAlertOpen, setIsReanalyzeAlertOpen] = useState(false);

    // Bulk AI research states
    const [isBulkResearching, setIsBulkResearching] = useState(false);
    const [bulkResearchProgress, setBulkResearchProgress] = useState<{ done: number; total: number } | null>(null);

    const [sortBy, setSortBy] = useState<'alpha' | 'count'>('alpha');
    const [searchTerm, setSearchTerm] = useState('');
    // Requirement R3: 300ms debounce ensures instantaneous keystrokes with 0ms lag
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // REAL-TIME PROGRESS CALCULATION
    const [workflowTransactions, setWorkflowTransactions] = useState<ImportedTransaction[]>([]);

    const filteredGroups = useMemo(() => {
        let sorted = [...groups];
        if (debouncedSearchTerm.trim()) {
            const term = debouncedSearchTerm.toUpperCase();
            sorted = sorted.filter(g => 
                g.merchantKey.toUpperCase().includes(term) ||
                g.transactions.some(tx => 
                    (tx.description || '').toUpperCase().includes(term) ||
                    (tx.cleanDescription || '').toUpperCase().includes(term) ||
                    (tx.reference || '').toUpperCase().includes(term)
                )
            );
        }
        if (sortBy === 'count') {
            sorted.sort((a, b) => b.transactions.length - a.transactions.length);
        } else {
            sorted.sort((a, b) => a.merchantKey.localeCompare(b.merchantKey));
        }
        return sorted;
    }, [groups, sortBy, debouncedSearchTerm]);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy, groups.length, debouncedSearchTerm]);

    const paginatedGroups = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredGroups.slice(start, start + PAGE_SIZE);
    }, [filteredGroups, currentPage]);

    const totalPages = Math.ceil(filteredGroups.length / PAGE_SIZE);
    
    useEffect(() => {
        if (!client?.uid || !bankAccountId) return;
        const transRef = collection(db, 'aiAccountantClients', client.uid, 'transactions');
        const q = query(transRef, where('bankAccountId', '==', bankAccountId), where('status', 'in', ['ai_processing', 'ai_review']));
        
        const unsubscribe = onSnapshot(q, (snap) => {
            const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ImportedTransaction));
            setWorkflowTransactions(txs);
            
            // Build groups reactively (fast key extraction without redundant regex reprocessing)
            const merchantGroups: { [key: string]: ImportedTransaction[] } = {};
            txs.forEach(tx => {
                const key = tx.merchantKey || tx.cleanDescription || (tx.description ? BankCleaner.clean(tx.description).clean : 'UNKNOWN');
                if (!merchantGroups[key]) merchantGroups[key] = [];
                merchantGroups[key].push(tx);
            });

            const initialGroups: TransactionGroup[] = Object.entries(merchantGroups).map(([key, groupTxs]) => ({
                merchantKey: key,
                transactions: groupTxs,
                suggestion: groupTxs[0].smartAllocationResult || null,
                status: groupTxs[0].status === 'ai_processing' ? ('server_researching' as const) : ('ready' as const)
            })).sort((a, b) => a.merchantKey.localeCompare(b.merchantKey));

            setGroups(initialGroups);
            
            // Update settings for ALL new groups, providing defaults for unmatched ones
            setApprovalSettings((prev: any) => {
                const newSettings = { ...prev };
                initialGroups.forEach(g => { 
                    if (!newSettings[g.merchantKey]) {
                        const hasLowConfidence = g.suggestion && g.suggestion.confidence < 20;
                        newSettings[g.merchantKey] = { 
                            accountId: (g.suggestion && !hasLowConfidence) ? g.suggestion.accountId : '', 
                            vatType: g.suggestion?.vatType || 'no_vat', 
                            createRule: !g.suggestion || hasLowConfidence
                        }; 
                    }
                });
                return newSettings;
            });

            // Initialize comments from Firestore
            setGroupComments((prev: any) => {
                const newComments = { ...prev };
                initialGroups.forEach(g => {
                    if (g.transactions[0].clientComment) {
                        newComments[g.merchantKey] = g.transactions[0].clientComment;
                    }
                });
                return newComments;
            });
            
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [client?.uid, bankAccountId]);

    // Requirement R2: Completely removed rogue background auto-consolidation useEffect on tab mount!
    // Auto-consolidation is retained exclusively on-demand via handleAutoConsolidate.

    const progressStats = useMemo(() => {
        const total = workflowTransactions.length;
        const processed = workflowTransactions.filter(tx => tx.status === 'ai_review').length;
        const percentage = total > 0 ? (processed / total) * 100 : 0;
        return { total, processed, percentage };
    }, [workflowTransactions]);

    const handleAutoConsolidate = async () => {
        if (!client?.uid || !bankAccountId) return;
        setIsRegrouping(true);
        toast({ title: "Consolidating Groups", description: "Running iterative consolidation to convergence..." });
        try {
            const token = await getIdToken();
            const res = await autoConsolidateSmartMatchQueue({
                idToken: token,
                clientId: client.uid,
                bankAccountId
            });
            if (res.totalMergesApplied > 0) {
                toast({
                    title: "Merchant Groups Consolidated",
                    description: `Consolidated ${res.originalGroupCount} groups into ${res.finalGroupCount} canonical groups across ${res.passesExecuted} passes (${res.updatedCount} transactions unified).`
                });
            } else {
                toast({
                    title: "Groups Fully Consolidated",
                    description: "All merchant groups are already at maximum consolidation."
                });
            }
        } catch (e: any) {
            console.error("Auto-consolidation error:", e);
            toast({ title: "Consolidation Failed", description: e?.message || "Error consolidating groups.", variant: "destructive" });
        } finally {
            setIsRegrouping(false);
        }
    };

    const handleCombinedRegroup = async () => {
        if (!client?.uid || !bankAccountId) return;
        setIsRegrouping(true);
        setIsAiRegrouping(true);
        toast({ title: "Deep Search Started", description: "Analyzing merchant relationships..." });
        
        try {
            const [standardProposals, aiProposals] = await Promise.all([
                proposeRegroups({ idToken: await getIdToken(), clientId: client.uid, bankAccountId }),
                proposeAiRegroups({ 
                    idToken: await getIdToken(), 
                    clientId: client.uid, 
                    bankAccountId,
                    selectedMerchantKeys: onlySelectedGroups ? selectedGroupKeys : undefined
                })
            ]);

            const combinedMap = new Map();
            
            // Standard proposals first
            standardProposals.forEach((p: any) => {
                combinedMap.set(`${p.fromKey}::${p.toKey}`, p);
            });
            
            // AI proposals add or merge txIds
            aiProposals.forEach((p: any) => {
                const key = `${p.fromKey}::${p.toKey}`;
                if (combinedMap.has(key)) {
                    const existing = combinedMap.get(key);
                    const mergedTxIds = Array.from(new Set([...existing.fromTxIds, ...p.fromTxIds]));
                    combinedMap.set(key, { ...p, fromTxIds: mergedTxIds });
                } else {
                    combinedMap.set(key, p);
                }
            });

            const combinedProposals = Array.from(combinedMap.values());
            setProposedMerges(combinedProposals);
            setSelectedMerges(combinedProposals.map(p => `${p.fromKey}::${p.toKey}`));
            
            if (combinedProposals.length > 0) {
                setIsMergeDialogOpen(true);
            } else {
                toast({ title: "No Merges Found", description: "No merchant merges were proposed." });
            }
        } catch (e) {
            toast({ title: "Smart Regroup Failed", variant: "destructive" });
        } finally {
            setIsRegrouping(false);
            setIsAiRegrouping(false);
        }
    };

    const handleApplyRegroups = async () => {
        if (!client?.uid || !user?.id) return;
        setIsApplyingMerges(true);
        try {
            const mergesToApply = proposedMerges
                .filter(p => selectedMerges.includes(`${p.fromKey}::${p.toKey}`))
                .map(p => ({ fromKey: p.fromKey, toKey: p.toKey, fromTxIds: p.fromTxIds }));

            await applyRegroups({ idToken: await getIdToken(), clientId: client.uid, merges: mergesToApply, userId: user.id });
            toast({ title: "Regrouping Applied", description: `Successfully merged ${mergesToApply.length} merchant groups.` });
            setIsMergeDialogOpen(false);
        } catch (e) {
            toast({ title: "Failed to apply merges", variant: "destructive" });
        } finally {
            setIsApplyingMerges(false);
        }
    };

    const handleApplySafeRegroups = async () => {
        if (!client?.uid || !user?.id) return;
        const safeMerges = proposedMerges.filter(p => p.isSafe);
        if (safeMerges.length === 0) return;
        setIsApplyingMerges(true);
        try {
            const mergesToApply = safeMerges.map(p => ({ fromKey: p.fromKey, toKey: p.toKey, fromTxIds: p.fromTxIds }));
            await applyRegroups({ idToken: await getIdToken(), clientId: client.uid, merges: mergesToApply, userId: user.id });
            toast({ title: "Safe Regroups Applied", description: `Successfully merged ${mergesToApply.length} safe merchant groups.` });
            setIsMergeDialogOpen(false);
        } catch (e) {
            toast({ title: "Failed to apply safe merges", variant: "destructive" });
        } finally {
            setIsApplyingMerges(false);
        }
    };

    const handleRecheckRules = async () => {
        if (!client?.uid) return;
        setIsRechecking(true);
        try {
            const clientRef = doc(db, 'aiAccountantClients', client.uid);
            const clientSnap = await getDoc(clientRef);
            const latestClient = clientSnap.data() as User;
            
            let allRules = [...(latestClient.allocationRules || [])];
            if (!latestClient.disableGlobalRules) {
                const rulesQuery = collection(db, "allocationRules");
                const rulesSnap = await getDocs(rulesQuery);
                const globalRulesList = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as AllocationRule));
                allRules = [...allRules, ...globalRulesList];
            }
            allRules.sort((a, b) => (a.priority || 99) - (b.priority || 99));

            const updatedGroups = groups.map(group => {
                const description = group.transactions[0].description;
                const match = allRules.find(r => r.keywords.some(kw => matchesRuleKeyword(description, kw)));
                
                if (match) {
                    const keyword = match.keywords.find(kw => matchesRuleKeyword(description, kw));
                    let targetAccountId = match.accountId;
                    let targetAccountType = match.accountType || 'account';
                    if (client.chartOfAccounts && client.chartOfAccounts.length > 0) {
                        const resolved = resolveAccountForCategory(client.chartOfAccounts, match);
                        if (resolved) {
                            targetAccountId = resolved.accountNumber;
                            targetAccountType = resolved.accountType;
                        }
                    }
                    const newSuggestion: SmartAllocationResult = {
                        accountId: targetAccountId,
                        accountType: targetAccountType,
                        vatType: client.isVatRegistered ? match.vatType : 'no_vat',
                        confidence: 100,
                        summary: `Matched latest existing allocation rule for ${keyword}.`,
                        ruleId: match.id,
                        matchedKeyword: keyword
                    };
                    
                    setApprovalSettings((prev: any) => ({
                        ...prev,
                        [group.merchantKey]: {
                            accountId: match.accountId,
                            vatType: newSuggestion.vatType,
                            createRule: false
                        }
                    }));

                    return {
                        ...group,
                        suggestion: newSuggestion,
                        status: 'ready' as const,
                        transactions: group.transactions.map(tx => ({...tx, allocationSource: 'rule' as const}))
                    };
                }
                return group;
            });

            setGroups(updatedGroups);
            toast({ title: "Rules Rechecked", description: "Groups updated based on the latest allocation rules." });
        } catch (e) {
            toast({ title: "Recheck Failed", variant: "destructive" });
        } finally {
            setIsRechecking(false);
        }
    };

    const handleResetAnalysis = async () => {
        if (!client?.uid || !bankAccountId) return;
        setIsReseting(true);
        try {
            const res = await resetAiAccountantAnalysis({ idToken: await getIdToken(), clientId: client.uid, bankAccountId });
            toast({ title: "Analysis Stopped", description: `${res.count} transactions have been reset to 'new'.` });
        } catch (e) {
            toast({ title: "Reset Failed", variant: "destructive" });
        } finally {
            setIsReseting(false);
        }
    };

    const handleReanalyzeAndRegroup = async () => {
        if (!client?.uid || !bankAccountId || !user?.email) return;
        setIsReanalyzing(true);
        try {
            const res = await reanalyzeAndRegroupTransactions({ 
                idToken: await getIdToken(), 
                clientId: client.uid, 
                bankAccountId, 
                initiatorEmail: user.email 
            });
            toast({ 
                title: "Reanalysis Started", 
                description: `${res.count} transactions are being reanalyzed and regrouped.` 
            });
        } catch (e) {
            toast({ title: "Reanalysis Failed", variant: "destructive" });
        } finally {
            setIsReanalyzing(false);
        }
    };

    const handleMatchHistory = async () => {
        if (!client?.uid || !bankAccountId) return;
        setIsHistoryMatching(true);
        try {
            const res = await matchTransactionsToHistory({ idToken: await getIdToken(), clientId: client.uid, bankAccountId });
            toast({ 
                title: "History Matching Complete", 
                description: `${res.count} transactions matched using your past allocation history.` 
            });
        } catch (e) {
            console.error(e);
            toast({ title: "Matching Failed", variant: "destructive" });
        } finally {
            setIsHistoryMatching(false);
        }
    };

    const handleSaveDrafts = async () => {
        if (!client?.uid) return;
        setIsSavingDrafts(true);
        try {
            const batch = writeBatch(db);
            const transRef = collection(db, 'aiAccountantClients', client.uid, 'transactions');
            
            workflowTransactions.forEach(tx => {
                const key = tx.merchantKey || tx.cleanDescription || 'UNKNOWN';
                const settings = approvalSettings[key];
                
                if (settings && settings.accountId) {
                    batch.update(doc(transRef, tx.id), {
                        smartAllocationResult: {
                            accountId: settings.accountId,
                            vatType: settings.vatType || 'no_vat',
                            confidence: 100,
                            summary: "Draft allocation saved by practitioner."
                        },
                        allocationSource: 'manual' 
                    });
                }
            });
            
            await batch.commit();
            toast({ title: "Draft Allocations Saved" });
        } catch (e) {
            toast({ title: "Save Failed", variant: "destructive" });
        } finally {
            setIsSavingDrafts(false);
        }
    };

    const commitGroupApproval = async (group: TransactionGroup, settings: any, skipRuleCreation = false) => {
        if (!client?.uid) return;

        // Phase 1: Snapshot previous state for rollback
        const previousGroups = [...groups];
        const previousSelectedKeys = [...selectedGroupKeys];
        const targetAccount = client.chartOfAccounts?.find(a => a.id === settings.accountId)?.description || settings.accountId;

        // Phase 1: Instant Local UI Mutation (0ms delay)
        setGroups(prev => prev.filter(g => g.merchantKey !== group.merchantKey));
        setSelectedGroupKeys(prev => prev.filter(k => k !== group.merchantKey));

        // Phase 1: Non-blocking feedback toast
        toast({ 
            title: "Group Approved", 
            description: `Allocated ${group.transactions.length} transaction${group.transactions.length > 1 ? 's' : ''} for ${group.merchantKey} to ${targetAccount}.` 
        });

        // Phase 2: Background Network Dispatch
        try {
            const batch = writeBatch(db);
            const transRef = collection(db, 'aiAccountantClients', client.uid, 'transactions');
            group.transactions.forEach(tx => {
                batch.update(doc(transRef, tx.id), {
                    status: 'reviewed',
                    allocatedTo: { value: settings.accountId, type: group.suggestion?.accountType || 'account' },
                    vatType: settings.vatType || 'no_vat',
                    allocatedAt: serverTimestamp(),
                    allocationSource: tx.allocationSource || 'ai',
                    matchedRuleId: group.suggestion?.ruleId || deleteField(),
                    matchedKeyword: group.suggestion?.matchedKeyword || deleteField()
                });
            });
            
            updateGlobalMerchantDb({
                merchantKey: group.merchantKey,
                accountId: settings.accountId,
                vatType: settings.vatType || 'no_vat'
            }).catch(err => console.warn("Global merchant DB update background error:", err));

            if (settings.createRule && !skipRuleCreation) {
                const ruleId = `rule_${Math.random().toString(36).substr(2, 9)}`;
                batch.update(doc(db, 'aiAccountantClients', client.uid), { 
                    allocationRules: arrayUnion({ 
                        id: ruleId, 
                        description: `Auto-categorization for ${group.merchantKey}`, 
                        keywords: [group.merchantKey.toUpperCase()], 
                        accountId: settings.accountId, 
                        accountType: group.suggestion?.accountType || 'account',
                        vatType: settings.vatType || 'no_vat', 
                        type: 'hard', 
                        scope: 'client', 
                        priority: 99 
                    }) 
                });
            }
            await batch.commit();

            // Phase 3: Trigger balance aggregation & lifecycle sync
            onAllocationComplete?.();
            onAccountCreated();
        } catch (e) { 
            console.error("Firestore approval commit failed:", e);
            // Phase 4: Automatic Rollback
            setGroups(previousGroups);
            setSelectedGroupKeys(previousSelectedKeys);
            toast({ 
                title: "Approval Failed", 
                description: `Could not approve ${group.merchantKey}. Changes have been rolled back.`, 
                variant: "destructive" 
            }); 
        }
    };

    const handleApproveGroup = async (group: TransactionGroup) => {
        if (!client?.uid) return;
        const settings = approvalSettings[group.merchantKey];
        if (!settings || !settings.accountId) {
            toast({ title: "Missing Allocation", description: "Please select an account before approving.", variant: "destructive" });
            return;
        }

        // If createRule is enabled, open the Rule Creation modal pre-filled for practitioner review
        if (settings.createRule) {
            setStagedGroupForRule(group);
            setRuleDefaultValues({
                keywords: group.merchantKey.toUpperCase(),
                accountId: settings.accountId,
                accountType: (group.suggestion?.accountType as any) || 'account',
                vatType: settings.vatType || 'no_vat',
                description: `Auto-categorization for ${group.merchantKey}`,
                scope: 'client',
                mode: 'new'
            });
            setIsCreateRuleOpen(true);
            return;
        }

        // Fast path: direct instant commit when createRule is unchecked
        await commitGroupApproval(group, settings);
    };

    const handleRuleDialogSaved = async () => {
        if (stagedGroupForRule) {
            const groupToApprove = stagedGroupForRule;
            const settings = approvalSettings[groupToApprove.merchantKey];
            setStagedGroupForRule(null);
            if (settings) {
                // Rule was already created and saved by CreateRuleDialog; commit approval skipping duplicate rule creation
                await commitGroupApproval(groupToApprove, settings, true);
            }
        }
        onAccountCreated();
    };

    const handleApproveReadyOnly = async () => {
        if (!client?.uid) return;
        const readyGroups = groups.filter(g => g.transactions.some(tx => tx.status === 'ready') && approvalSettings[g.merchantKey]?.accountId);
        if (readyGroups.length === 0) {
            toast({ title: "No ready allocations found." });
            return;
        }

        const readyKeys = new Set(readyGroups.map(g => g.merchantKey));
        const previousGroups = [...groups];
        const previousSelectedKeys = [...selectedGroupKeys];

        // Phase 1: Instant Local UI Mutation (0ms delay)
        setGroups(prev => prev.filter(g => !readyKeys.has(g.merchantKey)));
        setSelectedGroupKeys(prev => prev.filter(k => !readyKeys.has(k)));
        toast({ title: `Approved ${readyGroups.length} ready groups!` });

        // Phase 2: Background Network Dispatch
        try {
            const batch = writeBatch(db);
            const transRef = collection(db, 'aiAccountantClients', client.uid, 'transactions');
            readyGroups.forEach(group => {
                const settings = approvalSettings[group.merchantKey];
                group.transactions.forEach(tx => {
                    batch.update(doc(transRef, tx.id), {
                        status: 'reviewed',
                        allocatedTo: { value: settings.accountId, type: group.suggestion?.accountType || 'account' },
                        vatType: settings.vatType || 'no_vat',
                        allocatedAt: serverTimestamp(),
                        allocationSource: tx.allocationSource || 'manual',
                        matchedRuleId: group.suggestion?.ruleId || deleteField(),
                        matchedKeyword: group.suggestion?.matchedKeyword || deleteField()
                    });
                });
            });
            await batch.commit();

            // Phase 3: Trigger balance aggregation & lifecycle sync
            onAllocationComplete?.();
            onAccountCreated();
        } catch (e) { 
            console.error("Ready approval commit failed:", e);
            // Phase 4: Automatic Rollback
            setGroups(previousGroups);
            setSelectedGroupKeys(previousSelectedKeys);
            toast({ title: "Approval Failed", variant: "destructive" }); 
        }
    };

    const handleApproveAllWithAllocations = async (onlySelected = false) => {
        if (!client?.uid) return;
        
        let allocatableGroups = groups.filter(g => approvalSettings[g.merchantKey]?.accountId);
        if (onlySelected && selectedGroupKeys.length > 0) {
            allocatableGroups = allocatableGroups.filter(g => selectedGroupKeys.includes(g.merchantKey));
        }

        if (allocatableGroups.length === 0) {
            toast({ title: "No allocations found to finalize." });
            return;
        }

        const allocKeys = new Set(allocatableGroups.map(g => g.merchantKey));
        const previousGroups = [...groups];
        const previousSelectedKeys = [...selectedGroupKeys];

        // Phase 1: Instant Local UI Mutation (0ms delay)
        setGroups(prev => prev.filter(g => !allocKeys.has(g.merchantKey)));
        setSelectedGroupKeys(prev => prev.filter(k => !allocKeys.has(k)));
        toast({ title: `Approved ${allocatableGroups.length} groups!` });

        // Phase 2: Background Network Dispatch
        try {
            const transRef = collection(db, 'aiAccountantClients', client.uid, 'transactions');
            const updates: { txId: string; data: any }[] = [];

            allocatableGroups.forEach(group => {
                const settings = approvalSettings[group.merchantKey];
                group.transactions.forEach(tx => {
                    updates.push({
                        txId: tx.id,
                        data: {
                            status: 'reviewed',
                            allocatedTo: { value: settings.accountId, type: group.suggestion?.accountType || 'account' },
                            vatType: settings.vatType || 'no_vat',
                            allocatedAt: serverTimestamp(),
                            allocationSource: tx.allocationSource || 'manual',
                            matchedRuleId: group.suggestion?.ruleId || deleteField(),
                            matchedKeyword: group.suggestion?.matchedKeyword || deleteField()
                        }
                    });
                });
                
                updateGlobalMerchantDb({
                    merchantKey: group.merchantKey,
                    accountId: settings.accountId,
                    vatType: settings.vatType || 'no_vat'
                }).catch(err => console.warn("Global merchant DB update background error:", err));
            });

            for (let i = 0; i < updates.length; i += 400) {
                const chunk = updates.slice(i, i + 400);
                const batch = writeBatch(db);
                chunk.forEach(({ txId, data }) => {
                    batch.update(doc(transRef, txId), data);
                });
                await batch.commit();
            }

            // Phase 3: Trigger balance aggregation & lifecycle sync
            onAllocationComplete?.();
            onAccountCreated();
        } catch (e) { 
            console.error("Bulk approval commit failed:", e);
            // Phase 4: Automatic Rollback
            setGroups(previousGroups);
            setSelectedGroupKeys(previousSelectedKeys);
            toast({ title: "Bulk Approval Failed", variant: "destructive" }); 
        }
    };

    const handleMoveSingleTransactionToNew = async (txId: string) => {
        if (!client?.uid) return;
        setIsMovingBack(txId);
        try {
            await moveTransactionToNew({ idToken: await getIdToken(), clientId: client.uid, transactionId: txId });
            toast({ title: "Transaction Moved to Individual Group" });
        } catch (e) { 
            toast({ title: "Failed to move", variant: "destructive" }); 
        } finally { 
            setIsMovingBack(null); 
        }
    };

    const handleSplitGroupToNew = async (txIds: string[]) => {
        if (!client?.uid || !txIds.length) return;
        try {
            await bulkMoveTransactionsToNew({ idToken: await getIdToken(), clientId: client.uid, transactionIds: txIds });
            toast({ title: `Split ${txIds.length} transactions into individual merchant groups` });
            setViewingGroup(null);
        } catch (e) { 
            toast({ title: "Failed to split group", variant: "destructive" }); 
        }
    };

    const handleResearchWithAi = async (group: TransactionGroup) => {
        if (!client) return;
        setIsResearchingId(group.merchantKey);
        try {
            const res = await researchMerchantWithAi({ 
                idToken: await getIdToken(),
                clientId: client.uid,
                transactionIds: group.transactions.map(t => t.id),
                description: group.transactions[0].description,
                chartOfAccounts: JSON.stringify(client.chartOfAccounts || []),
                isVatRegistered: !!client.isVatRegistered,
                isExpense: true
            });
            const hasLowConfidence = res.confidence < 20;
            setApprovalSettings((prev: any) => ({
                ...prev,
                [group.merchantKey]: {
                    ...prev[group.merchantKey],
                    accountId: hasLowConfidence ? '' : res.accountId,
                    vatType: res.vatType,
                    createRule: true
                }
            }));
            setGroups((prev: TransactionGroup[]) => prev.map(g => {
                if (g.merchantKey === group.merchantKey) {
                    return {
                        ...g,
                        suggestion: {
                            accountId: res.accountId,
                            accountType: 'account',
                            vatType: res.vatType,
                            confidence: res.confidence,
                            summary: res.summary || `AI research suggested ${res.accountId}`,
                        },
                        status: hasLowConfidence ? 'pending' : 'ready'
                    };
                }
                return g;
            }));
            toast({ title: "Research Complete" });
        } catch (error) {
            console.error("Research Failed", error);
            toast({ title: "Research Failed", variant: "destructive" });
        } finally {
            setIsResearchingId(null);
        }
    };

    const handleBulkResearchWithAi = async () => {
        if (!client || selectedGroupKeys.length === 0) return;
        const groupsToResearch = groups.filter(g => selectedGroupKeys.includes(g.merchantKey));
        if (groupsToResearch.length === 0) return;

        setIsBulkResearching(true);
        setBulkResearchProgress({ done: 0, total: groupsToResearch.length });

        toast({
            title: "Bulk AI Research Started",
            description: `Researching ${groupsToResearch.length} selected merchant groups in parallel...`
        });

        let completed = 0;
        const chunkSize = 4;
        
        try {
            const token = await getIdToken();
            const chartOfAccountsStr = JSON.stringify(client.chartOfAccounts || []);

            for (let i = 0; i < groupsToResearch.length; i += chunkSize) {
                const chunk = groupsToResearch.slice(i, i + chunkSize);
                await Promise.all(chunk.map(async (group) => {
                    try {
                        const res = await researchMerchantWithAi({
                            idToken: token,
                            clientId: client.uid,
                            transactionIds: group.transactions.map(t => t.id),
                            description: group.transactions[0]?.description || group.merchantKey,
                            chartOfAccounts: chartOfAccountsStr,
                            isVatRegistered: !!client.isVatRegistered,
                            isExpense: true
                        });
                        const hasLowConfidence = res.confidence < 20;

                        setApprovalSettings((prev: any) => ({
                            ...prev,
                            [group.merchantKey]: {
                                ...prev[group.merchantKey],
                                accountId: hasLowConfidence ? '' : res.accountId,
                                vatType: res.vatType,
                                createRule: true
                            }
                        }));

                        setGroups((prev: TransactionGroup[]) => prev.map(g => {
                            if (g.merchantKey === group.merchantKey) {
                                return {
                                    ...g,
                                    suggestion: {
                                        accountId: res.accountId,
                                        accountType: 'account',
                                        vatType: res.vatType,
                                        confidence: res.confidence,
                                        summary: res.summary || `AI research suggested ${res.accountId}`,
                                    },
                                    status: hasLowConfidence ? 'pending' : 'ready'
                                };
                            }
                            return g;
                        }));
                    } catch (err) {
                        console.error(`Research failed for ${group.merchantKey}:`, err);
                    } finally {
                        completed++;
                        setBulkResearchProgress({ done: completed, total: groupsToResearch.length });
                    }
                }));
            }

            toast({
                title: "Bulk AI Research Completed",
                description: `Finished researching ${groupsToResearch.length} merchant groups.`
            });
        } catch (e: any) {
            console.error("Bulk AI research error:", e);
            toast({
                title: "Bulk Research Failed",
                description: e?.message || "An error occurred during bulk AI research.",
                variant: "destructive"
            });
        } finally {
            setIsBulkResearching(false);
            setBulkResearchProgress(null);
        }
    };

    const handleAnalyzeComment = async (group: TransactionGroup, commentOverride?: string) => {
        const comment = commentOverride !== undefined ? commentOverride : groupComments[group.merchantKey];
        if (!comment || !client?.uid) {
            toast({ title: "Comment Required", description: "Please enter a client comment to analyze.", variant: "destructive" });
            return;
        }

        setIsAnalyzingComment(group.merchantKey);
        try {
            const result = await analyzeClientCommentAndSuggest({ 
                idToken: await getIdToken(),
                clientId: client.uid,
                transactionIds: group.transactions.map(t => t.id),
                comment,
                merchantKey: group.merchantKey,
                examples: group.transactions.slice(0, 3).map(t => t.description),
                chartOfAccounts: JSON.stringify(client.chartOfAccounts || []),
                isVatRegistered: !!client.isVatRegistered
            });

            setApprovalSettings((prev: any) => ({
                ...prev,
                [group.merchantKey]: {
                    ...prev[group.merchantKey],
                    accountId: result.accountId,
                    vatType: result.vatType
                }
            }));

            toast({ title: "Comment Analyzed", description: result.reasoning });
        } catch (e) {
            toast({ title: "Analysis Failed", variant: "destructive" });
        } finally {
            setIsAnalyzingComment(null);
        }
    };

    const handleDownloadExcel = () => {
        if (!client) return;
        const wb = XLSX.utils.book_new();
        
        const rows: (string | number)[][] = [['Merchant Group / Description', 'Date', 'Amount', 'Allocate To', 'VAT Type']];
        const validations: any[] = [];
        let currentRow = 2;

        filteredGroups.forEach(group => {
            rows.push([group.merchantKey, '', '', '', '']);
            validations.push({
                sqref: `D${currentRow}:D${currentRow}`,
                type: 'list',
                formula1: 'Validation!$A$2:$A$500'
            });
            validations.push({
                sqref: `E${currentRow}:E${currentRow}`,
                type: 'list',
                formula1: 'Validation!$B$2:$B$10'
            });
            currentRow++;

            group.transactions.forEach(tx => {
                rows.push([
                    `  ${tx.description}`,
                    format(new Date(tx.date), 'dd/MM/yyyy'),
                    tx.amount,
                    '',
                    ''
                ]);
                currentRow++;
            });
            rows.push([]);
            currentRow++;
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!dataValidation'] = validations;
        XLSX.utils.book_append_sheet(wb, ws, 'Unallocated Groups');

        const valData = [['GL Accounts', 'VAT Types']];
        const accounts = client.chartOfAccounts || [];
        const maxLen = Math.max(accounts.length, allVatTypes.length);
        for(let i = 0; i < maxLen; i++) {
            valData.push([
                accounts[i]?.description || '',
                allVatTypes[i]?.label || ''
            ]);
        }
        const valWs = XLSX.utils.aoa_to_sheet(valData);
        XLSX.utils.book_append_sheet(wb, valWs, 'Validation');

        XLSX.writeFile(wb, `SmartMatch_Review_${client.name}.xlsx`);
    };

    if (isLoading) {
        return (
            <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center py-12">
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span className="sr-only">Loading…</span>
            </div>
        );
    }

    const allocatedCount = groups.filter(g => approvalSettings[g.merchantKey]?.accountId).length;
    const isCurrentlyProcessing = workflowTransactions.some(tx => tx.status === 'ai_processing');

    return (
        <div className="space-y-6 p-4">
            <CreateGeneralAccountDialog client={client} onAccountCreated={onAccountCreated} open={isCreateGeneralAccountOpen} onOpenChange={setIsCreateGeneralAccountOpen} />
            <GroupTransactionsDialog open={!!viewingGroup} onOpenChange={(o) => !o && setViewingGroup(null)} group={viewingGroup} onMoveToNew={handleMoveSingleTransactionToNew} onSplitGroup={handleSplitGroupToNew} />
            
            {/* Regroup Proposals Dialog */}
            <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Proposed Merchant Regroups</DialogTitle>
                        <DialogDescription>
                            Review the suggested merges identified by our fuzzy matching engine. No changes will be made until you apply them.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-4">
                            {proposedMerges.map((merge, i) => {
                                const mergeId = `${merge.fromKey}::${merge.toKey}`;
                                const isSelected = selectedMerges.includes(mergeId);
                                return (
                                    <div key={i} className={cn("p-4 rounded-lg border-2 transition-all", isSelected ? "border-primary bg-primary/5" : "border-muted opacity-60")}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 flex items-center gap-4">
                                                <div className="flex-1">
                                                    <Badge variant="outline" className="text-[10px] mb-1 uppercase tracking-widest">Merge From</Badge>
                                                    <p className="font-bold text-sm text-destructive">{merge.fromKey}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1">{merge.fromImpact} transactions</p>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                                                <div className="flex-1">
                                                    <Badge variant="default" className="text-[10px] mb-1 uppercase tracking-widest">Merge Into</Badge>
                                                    <p className="font-bold text-sm text-primary">{merge.toKey}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1">{merge.toImpact} existing transactions</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="flex items-center gap-2 justify-end mb-2">
                                                    <Badge className={cn("text-[10px]", merge.confidence === 'High' ? 'bg-green-600' : 'bg-yellow-500')}>{merge.score}% Match</Badge>
                                                    <Checkbox checked={isSelected} onCheckedChange={(checked) => setSelectedMerges(p => checked ? [...p, mergeId] : p.filter(id => id !== mergeId))} />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground italic max-w-[150px]">{merge.reason}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase">Examples (From)</p>
                                                {merge.fromExamples.map((ex: string, j: number) => <p key={j} className="text-[10px] text-muted-foreground truncate italic">"{ex}"</p>)}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase">Examples (Into)</p>
                                                {merge.toExamples.map((ex: string, j: number) => <p key={j} className="text-[10px] text-muted-foreground truncate italic">"{ex}"</p>)}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {proposedMerges.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                    <p className="font-semibold">No redundant groups found.</p>
                                    <p className="text-sm">The current grouping looks clean based on the latest algorithm.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                        <div>
                            {proposedMerges.filter(p => p.isSafe).length > 0 && (
                                <Button
                                    variant="outline"
                                    className="bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 font-bold"
                                    onClick={handleApplySafeRegroups}
                                    disabled={isApplyingMerges}
                                >
                                    <Zap className="mr-2 h-4 w-4 text-emerald-600 fill-emerald-600" />
                                    Merge All Safe ({proposedMerges.filter(p => p.isSafe).length})
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={() => setIsMergeDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleApplyRegroups} disabled={selectedMerges.length === 0 || isApplyingMerges}>
                                {isApplyingMerges && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Apply {selectedMerges.length} Merges
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isCurrentlyProcessing && (
                <Card className="border-primary bg-primary/5 shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <CardHeader className="py-3 px-4 border-b border-primary/10">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
                                <RotateCw className="h-4 w-4 animate-spin" />
                                Smart Identification in Progress...
                            </CardTitle>
                            <span className="text-xs font-bold text-primary tabular-nums">
                                {workflowTransactions.filter(tx => tx.status === 'ai_review').length} / {workflowTransactions.length} items
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                        <Progress value={progressStats.percentage} className="h-2" />
                        <p className="text-[10px] text-muted-foreground italic">
                            Currently cleaning descriptions and matching against rules, history, and global smart database. This is a deterministic app-based process.
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border border-dashed gap-4 flex-wrap">
                <div className="space-y-1">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        Review Identifiable Merchants
                        <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">
                            {groups.length} {groups.length === 1 ? 'group' : 'groups'}
                        </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground">Approve matched transactions or research unknown ones with AI.</p>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                    <div className="flex items-center space-x-2 mr-4 border-r pr-4 border-muted">
                        <Checkbox 
                            id="only-selected" 
                            checked={onlySelectedGroups} 
                            onCheckedChange={(v) => setOnlySelectedGroups(!!v)} 
                        />
                        <Label htmlFor="only-selected" className="text-xs font-medium cursor-pointer">Analyze selected only</Label>
                    </div>

                    {selectedGroupKeys.length > 0 && (
                        <div className="flex items-center gap-2 mr-4 border-r pr-4 border-muted">
                            <span className="text-xs font-semibold text-muted-foreground shrink-0">Bulk Allocate ({selectedGroupKeys.length}):</span>
                            <AccountSelector 
                                client={client}
                                showAccounts={true}
                                showCustomers={false}
                                showSuppliers={false}
                                value=""
                                onChange={(selection) => {
                                    setApprovalSettings((prev: any) => {
                                        const newSettings = { ...prev };
                                        selectedGroupKeys.forEach(key => {
                                            newSettings[key] = {
                                                ...newSettings[key],
                                                accountId: selection.value
                                            };
                                        });
                                        return newSettings;
                                    });
                                    toast({
                                        title: "Bulk Allocation Set",
                                        description: `Allocated ${selectedGroupKeys.length} selected groups.`
                                    });
                                }}
                                placeholder="Select account..."
                                className="w-[180px] h-8 text-xs bg-white"
                            />
                            {client?.isVatRegistered && (
                                <Select 
                                    value=""
                                    onValueChange={(v) => {
                                        setApprovalSettings((prev: any) => {
                                            const newSettings = { ...prev };
                                            selectedGroupKeys.forEach(key => {
                                                newSettings[key] = {
                                                    ...newSettings[key],
                                                    vatType: v
                                                };
                                            });
                                            return newSettings;
                                        });
                                        toast({
                                            title: "Bulk VAT Set",
                                            description: `Set VAT type for ${selectedGroupKeys.length} selected groups.`
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-8 text-xs font-semibold w-[120px] bg-white border">
                                        <SelectValue placeholder="Set VAT..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allVatTypes.map(vt => <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkResearchWithAi}
                                disabled={isBulkResearching}
                                className="h-8 text-xs font-semibold border-purple-300 text-purple-700 hover:bg-purple-50 shrink-0"
                            >
                                {isBulkResearching ? (
                                    <>
                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                        Researching {bulkResearchProgress ? `(${bulkResearchProgress.done}/${bulkResearchProgress.total})` : '...'}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-purple-600 fill-purple-200" />
                                        Research Selected with AI ({selectedGroupKeys.length})
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={() => handleApproveAllWithAllocations(true)}
                                disabled={selectedGroupKeys.filter(key => approvalSettings[key]?.accountId).length === 0}
                                className="h-8 text-xs font-bold bg-green-600 hover:bg-green-700 text-white shadow-sm ml-2 shrink-0"
                            >
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve Selected ({selectedGroupKeys.filter(key => approvalSettings[key]?.accountId).length})
                            </Button>
                        </div>
                    )}

                    <div className="flex items-center gap-1 mr-4 border-r pr-4 border-muted text-xs font-semibold">
                        <span className="text-muted-foreground mr-1.5">Sort:</span>
                        <Button
                            variant={sortBy === 'alpha' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setSortBy('alpha')}
                            className="h-8 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                        >
                            A-Z
                        </Button>
                        <Button
                            variant={sortBy === 'count' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setSortBy('count')}
                            className="h-8 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                        >
                            Most Transactions
                        </Button>
                    </div>
                    
                    <Button variant="outline" onClick={handleDownloadExcel} disabled={groups.length === 0}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Excel
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isRegrouping || groups.length < 2} className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/5 font-semibold">
                                {isRegrouping ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Layers className="mr-1.5 h-3.5 w-3.5 text-primary" />}
                                Group Merging
                                <ChevronDown className="ml-1.5 h-3 w-3 opacity-70" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 bg-white">
                            <DropdownMenuItem onClick={handleAutoConsolidate} disabled={isRegrouping || groups.length < 2} className="cursor-pointer text-xs">
                                <Zap className="mr-2 h-4 w-4 text-emerald-600" />
                                <span>Consolidate Groups (Convergence)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCombinedRegroup} disabled={isRegrouping || isAiRegrouping || groups.length < 2} className="cursor-pointer text-xs">
                                <Layers className="mr-2 h-4 w-4 text-primary" />
                                <span>Review Merge Proposals</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isRechecking || isHistoryMatching || isReanalyzing} className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/5 font-semibold">
                                {isRechecking || isHistoryMatching || isReanalyzing ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <RotateCw className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                )}
                                Re-matching Tools
                                <ChevronDown className="ml-1.5 h-3 w-3 opacity-70" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64 bg-white">
                            <DropdownMenuItem onClick={handleRecheckRules} disabled={isRechecking} className="cursor-pointer text-xs">
                                <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
                                <span>Recheck Rules</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleMatchHistory} disabled={isHistoryMatching || groups.length === 0} className="cursor-pointer text-xs">
                                <History className="mr-2 h-4 w-4 text-indigo-600" />
                                <span>Match from History</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={() => setIsReanalyzeAlertOpen(true)} 
                                disabled={isReanalyzing || groups.length === 0} 
                                className="cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
                                <span>Full AI Reanalyze & Regroup</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" onClick={handleSaveDrafts} disabled={isSavingDrafts || groups.length === 0} className="border-primary/30 text-primary hover:bg-primary/5">
                        {isSavingDrafts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Drafts
                    </Button>
                    {isCurrentlyProcessing && (
                        <Button variant="destructive" onClick={handleResetAnalysis} disabled={isReseting}>
                            {isReseting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <StopCircle className="mr-2 h-4 w-4" />}
                            Stop & Reset
                        </Button>
                    )}
                    
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search merchants or descriptions..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="pl-8 w-60 h-8 text-xs bg-white" 
                        />
                    </div>
                    
                    <Button onClick={() => handleApproveReadyOnly()} disabled={groups.filter(g => g.transactions.some(tx => tx.status === 'ready') && approvalSettings[g.merchantKey]?.accountId).length === 0} className="bg-blue-600 hover:bg-blue-700 text-white mr-2">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Ready ({groups.filter(g => g.transactions.some(tx => tx.status === 'ready') && approvalSettings[g.merchantKey]?.accountId).length})
                    </Button>
                    <Button onClick={() => handleApproveAllWithAllocations(onlySelectedGroups)} disabled={allocatedCount === 0} className="bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> {onlySelectedGroups ? `Approve Selected (${selectedGroupKeys.length})` : `Approve All with Allocations (${allocatedCount})`}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {paginatedGroups.map((group) => (
                    <MerchantGroupCard
                        key={group.merchantKey}
                        group={group}
                        isSelected={selectedGroupKeys.includes(group.merchantKey)}
                        approvalSetting={approvalSettings[group.merchantKey]}
                        initialComment={groupComments[group.merchantKey] || ''}
                        isAnalyzingComment={isAnalyzingComment === group.merchantKey}
                        isResearching={isResearchingId === group.merchantKey}
                        client={client}
                        onToggleSelect={(merchantKey, checked) => setSelectedGroupKeys(p => checked ? [...p, merchantKey] : p.filter(k => k !== merchantKey))}
                        onViewTransactions={(g) => setViewingGroup(g)}
                        onUpdateAccount={(merchantKey, accountId) => setApprovalSettings((p: any) => ({
                            ...p,
                            [merchantKey]: {
                                ...p[merchantKey],
                                accountId
                            }
                        }))}
                        onUpdateVat={(merchantKey, vatType) => setApprovalSettings((p: any) => ({
                            ...p,
                            [merchantKey]: {
                                ...p[merchantKey],
                                vatType
                            }
                        }))}
                        onToggleCreateRule={(merchantKey, createRule) => setApprovalSettings((p: any) => ({
                            ...p,
                            [merchantKey]: {
                                ...p[merchantKey],
                                createRule
                            }
                        }))}
                        onCommentChange={(merchantKey, comment) => setGroupComments((p: any) => ({
                            ...p,
                            [merchantKey]: comment
                        }))}
                        onAnalyzeComment={handleAnalyzeComment}
                        onResearchWithAi={handleResearchWithAi}
                        onApproveGroup={handleApproveGroup}
                    />
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white border p-4 rounded-xl shadow-sm mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setCurrentPage(p => Math.max(1, p - 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === 1}
                        className="font-bold gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <span className="text-sm font-bold text-slate-600">
                        Page <strong className="text-primary">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong> ({filteredGroups.length} total groups)
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setCurrentPage(p => Math.min(totalPages, p + 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === totalPages}
                        className="font-bold gap-2"
                    >
                        Next <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <CreateGeneralAccountDialog client={client} onAccountCreated={onAccountCreated} open={isCreateGeneralAccountOpen} onOpenChange={setIsCreateGeneralAccountOpen} />

            <GroupTransactionsDialog 
                open={!!viewingGroup} 
                onOpenChange={(open) => { if (!open) setViewingGroup(null); }} 
                group={viewingGroup} 
                onMoveToNew={handleMoveSingleTransactionToNew} 
                onSplitGroup={handleSplitGroupToNew} 
            />

            <CreateRuleDialog 
                client={client} 
                onRuleCreated={handleRuleDialogSaved} 
                open={isCreateRuleOpen} 
                onOpenChange={(open) => {
                    setIsCreateRuleOpen(open);
                    if (!open) setStagedGroupForRule(null);
                }} 
                defaultValues={ruleDefaultValues} 
                transactionDescription={stagedGroupForRule?.transactions[0]?.description || stagedGroupForRule?.merchantKey || ''} 
                existingRules={globalRules || []} 
                customers={customers} 
                suppliers={suppliers} 
            />

            <AlertDialog open={isReanalyzeAlertOpen} onOpenChange={setIsReanalyzeAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Reset & Full AI Re-analysis?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will clear all pending AI allocation suggestions in the Smart Match queue, reset transactions to the AI processing stage, and re-run the transaction detective engine from scratch.
                            <br /><br />
                            Are you sure you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => {
                                setIsReanalyzeAlertOpen(false);
                                handleReanalyzeAndRegroup();
                            }}
                            className="bg-destructive hover:bg-destructive/90 text-white font-bold"
                        >
                            Yes, Reanalyze All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export { SmartMatchQueueTab as AIWorkflowTab };

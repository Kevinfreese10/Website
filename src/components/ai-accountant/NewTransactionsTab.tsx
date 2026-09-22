'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    PlusCircle, 
    Search, 
    MoreHorizontal, 
    BookOpen, 
    Sparkles, 
    ArrowUpDown, 
    ChevronLeft, 
    ChevronRight, 
    RotateCw, 
    FileSpreadsheet, 
    Users, 
    Loader2 
} from 'lucide-react';
import { 
    getFirestore, 
    doc, 
    collection, 
    getDocs, 
    query, 
    where, 
    writeBatch, 
    onSnapshot, 
    serverTimestamp, 
    deleteDoc 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
    ImportedTransaction, 
    ChartOfAccount, 
    User, 
    VatType, 
    AllocationRule, 
    ClientCustomer, 
    SmartAllocationResult, 
    Supplier 
} from '@/lib/types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx-js-style';
import { matchesRuleKeyword } from '@/lib/bank-cleaner';
import { resolveAccountForCategory } from '@/lib/chart-of-accounts-mapper';
import { allVatTypes } from '@/lib/vat-types';
import { AccountSelector } from '@/components/accounting/AccountSelector';
import { 
    prepareAiAccountantAnalysis, 
    runAiAccountantAnalysis, 
    autoConsolidateSmartMatchQueue, 
    researchMerchantWithAi, 
    matchTransactionsToSuppliers 
} from '@/app/actions';
import { 
    CreateManualTransactionDialog, 
    EditTransactionDialog, 
    CreateRuleDialog, 
    CreateGeneralAccountDialog, 
    AIAllocationReviewDialog, 
    SplitTransactionDialog, 
    ImportDialog, 
    SmartMatchQueueModal 
} from './dialogs';
import { formatPrice } from './types';
import { useDebounce } from '@/hooks/use-debounce';
import { NewTransactionRow } from './components/NewTransactionRow';

const db = getFirestore(firebaseApp);
const PAGE_SIZE = 50;

async function getIdToken(): Promise<string> {
    const token = await getAuth(firebaseApp).currentUser?.getIdToken();
    if (!token) throw new Error('You must be signed in to do this.');
    return token;
}

export interface NewTransactionsTabProps {
    client: User | null;
    bankAccountId: string;
    globalRules: AllocationRule[];
    onAccountCreated: () => void;
    setActiveTab: (tab: string) => void;
    currentBalance: number;
    customers: ClientCustomer[];
    suppliers: Supplier[];
    onAllocationComplete?: () => void;
    onRefreshBalance?: () => void;
}

export const NewTransactionsTab = React.forwardRef<any, NewTransactionsTabProps>(({ 
    client, 
    bankAccountId, 
    globalRules, 
    onAccountCreated, 
    setActiveTab, 
    currentBalance, 
    customers, 
    suppliers, 
    onAllocationComplete, 
    onRefreshBalance 
}, ref) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeSubTab, setActiveSubTab] = useState<'expenses' | 'income'>('expenses');
    const [allTransactions, setAllTransactions] = useState<ImportedTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [allocations, setAllocations] = useState<any>({});
    const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    // Requirement R3: 300ms debounce ensures instantaneous keystrokes with 0ms lag
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [isCreateRuleOpen, setIsCreateOpen] = useState(false);
    const [isManualTxOpen, setIsManualTxOpen] = useState(false);
    const [isEditTxOpen, setIsEditTxOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<ImportedTransaction | null>(null);
    const [isCreateGeneralAccountOpen, setIsCreateGeneralAccountOpen] = useState(false);
    const [splitTransaction, setSplitTransaction] = useState<ImportedTransaction | null>(null);
    const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
    const [ruleDefaultValues, setRuleDefaultValues] = useState<any>({});
    const [transactionDescriptionForRule, setTransactionDescriptionForRule] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isAiResearching, setIsAiResearching] = useState<string | null>(null);
    const [isAiReviewOpen, setIsAiReviewOpen] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<SmartAllocationResult | null>(null);
    const [selectedTxForAi, setSelectedTxForAi] = useState<ImportedTransaction | null>(null);
    const [isRuleAllocating, setIsRuleAllocating] = useState(false);
    const [isSupplierMatching, setIsSupplierMatching] = useState(false);
    const [isSubmittingToWorkflow, setIsSubmittingToWorkflow] = useState(false);
    const [isSmartMatchOpen, setIsSmartMatchOpen] = useState(false);

    const smartMatchSelectedTxs = useMemo(() => {
        return allTransactions.filter(tx => selectedTransactions.includes(tx.id));
    }, [allTransactions, selectedTransactions]);

    type SortField = 'date' | 'description' | 'amount';
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);

    // REAL-TIME LISTENER FOR NEW TRANSACTIONS ONLY (R2 Scoped Query)
    useEffect(() => {
        if (!client?.uid || !bankAccountId) return;
        setIsLoading(true);
        
        const q = query(
            collection(db, 'aiAccountantClients', client.uid, 'transactions'), 
            where('bankAccountId', '==', bankAccountId),
            where('status', '==', 'new')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data,
                    _time: data.date ? new Date(data.date).getTime() : 0,
                    _absAmount: Math.abs(data.amount || 0)
                } as any;
            });
            setAllTransactions(txs);
            setIsLoading(false);
        }, (error) => {
            console.error("NewTransactionsTab listener error:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [client?.uid, bankAccountId]);

    // CLIENT-SIDE FILTERING, SORTING, AND SEARCHING
    const { filteredTransactions, pagedTransactions, totalPages } = useMemo(() => {
        // 1. Filter by Tab (Expense/Income)
        let filtered = allTransactions.filter(tx => tx.isExpense === (activeSubTab === 'expenses'));

        // 2. Search Filter (CONTAINS) - uses debouncedSearchTerm
        if (debouncedSearchTerm.trim()) {
            const term = debouncedSearchTerm.toUpperCase();
            filtered = filtered.filter(tx => 
                (tx.description || '').toUpperCase().includes(term) || 
                (tx.cleanDescription || '').toUpperCase().includes(term) ||
                (tx.merchantKey || '').toUpperCase().includes(term) ||
                (tx.reference || '').toUpperCase().includes(term)
            );
        }

        // 3. Ultra-fast Sorting using precomputed primitives in memory
        filtered.sort((a: any, b: any) => {
            let diff = 0;
            if (sortField === 'date') {
                diff = (a._time || 0) - (b._time || 0);
            } else if (sortField === 'description') {
                const valA = a.description || '';
                const valB = b.description || '';
                diff = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
            } else {
                diff = (a._absAmount || 0) - (b._absAmount || 0);
            }

            return sortDirection === 'asc' ? diff : -diff;
        });

        // 4. Pagination
        const total = Math.ceil(filtered.length / PAGE_SIZE);
        const start = (currentPage - 1) * PAGE_SIZE;
        const paged = filtered.slice(start, start + PAGE_SIZE);

        return { 
            filteredTransactions: filtered, 
            pagedTransactions: paged, 
            totalPages: total || 1 
        };
    }, [allTransactions, activeSubTab, debouncedSearchTerm, sortField, sortDirection, currentPage]);

    // Reset page when search or tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, activeSubTab]);

    React.useImperativeHandle(ref, () => ({ refetch: () => {} }));

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const commitBatchedUpdates = async <T,>(items: T[], updateFn: (batch: any, item: T) => void, maxChunk = 400) => {
        for (let i = 0; i < items.length; i += maxChunk) {
            const chunk = items.slice(i, i + maxChunk);
            const batch = writeBatch(db);
            chunk.forEach(item => updateFn(batch, item));
            await batch.commit();
        }
    };

    const handleBulkDelete = async () => {
        if (!client?.uid || selectedTransactions.length === 0) return;
        try {
            await commitBatchedUpdates(selectedTransactions, (batch, id) => {
                batch.delete(doc(db, 'aiAccountantClients', client.uid!, 'transactions', id));
            });
            toast({ title: 'Deleted', description: `${selectedTransactions.length} transactions removed.` });
            setSelectedTransactions([]);
            onRefreshBalance?.();
            onAccountCreated();
        } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
    };

    const handleDeleteTransaction = async (txId: string) => {
        if (!client?.uid) return;
        try {
            await deleteDoc(doc(db, 'aiAccountantClients', client.uid, 'transactions', txId));
            toast({ title: 'Deleted', description: 'Transaction removed.' });
            onRefreshBalance?.();
            onAccountCreated();
        } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
    };

    const handleBulkAllocate = async (allocation: { value: string, type: 'account' | 'customer' | 'supplier' }, vatType: VatType) => {
        if (!client?.uid || selectedTransactions.length === 0) return;
        try {
            await commitBatchedUpdates(selectedTransactions, (batch, id) => {
                batch.update(doc(db, 'aiAccountantClients', client.uid!, 'transactions', id), {
                    status: 'reviewed',
                    allocatedTo: allocation,
                    vatType: client.isVatRegistered ? vatType : 'no_vat',
                    allocatedAt: serverTimestamp(),
                    allocationSource: 'manual'
                });
            });
            toast({ title: 'Allocated', description: `${selectedTransactions.length} transactions updated.` });
            setSelectedTransactions([]);
            onAllocationComplete?.();
        } catch (e: any) { toast({ title: 'Error Allocating', description: e?.message || 'Failed to allocate transactions', variant: 'destructive' }); }
    };

    // R2: Scoped strictly to status == 'new'
    const handleAllocateByRules = async () => {
        if (!client?.uid || !bankAccountId) return;
        
        if (activeSubTab === 'income') {
            toast({ title: 'No Rules for Income', description: 'Allocation rules only apply to expense transactions.' });
            return;
        }

        setIsRuleAllocating(true);
        try {
            let allRules = [...(client.allocationRules || [])];
            if (!client.disableGlobalRules) {
                const rulesQuery = collection(db, "allocationRules");
                const rulesSnap = await getDocs(rulesQuery);
                const globalRulesList = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as AllocationRule));
                allRules = [...allRules, ...globalRulesList];
            }
            allRules.sort((a, b) => (a.priority || 99) - (b.priority || 99));

            const transRef = collection(db, 'aiAccountantClients', client.uid, 'transactions');
            const q = query(
                transRef, 
                where('bankAccountId', '==', bankAccountId), 
                where('status', '==', 'new'),
                where('isExpense', '==', true)
            );
            const snapshot = await getDocs(q);

            const matchedDocs: { ref: any; updates: any }[] = [];
            snapshot.docs.forEach(d => {
                const tx = d.data() as ImportedTransaction;
                const txDesc = (tx.cleanDescription || tx.description || '').toUpperCase();
                if (!txDesc) return;
                const match = allRules.find(r => r.keywords.some(kw => matchesRuleKeyword(txDesc, kw)));
                if (match) {
                    const keyword = match.keywords.find(kw => matchesRuleKeyword(txDesc, kw));
                    let targetAccountId = match.accountId;
                    let targetAccountType = match.accountType || 'account';
                    if (client.chartOfAccounts && client.chartOfAccounts.length > 0) {
                        const resolved = resolveAccountForCategory(client.chartOfAccounts, match);
                        if (resolved) {
                            targetAccountId = resolved.accountNumber;
                            targetAccountType = resolved.accountType;
                        }
                    }
                    matchedDocs.push({
                        ref: d.ref,
                        updates: {
                            status: 'reviewed',
                            allocatedTo: { value: targetAccountId, type: targetAccountType },
                            vatType: client.isVatRegistered ? match.vatType : 'no_vat',
                            allocatedAt: serverTimestamp(),
                            allocationSource: 'rule',
                            matchedRuleId: match.id,
                            matchedRuleDescription: match.description,
                            matchedKeyword: keyword
                        }
                    });
                }
            });

            if (matchedDocs.length > 0) {
                await commitBatchedUpdates(matchedDocs, (batch, item) => {
                    batch.update(item.ref, item.updates);
                });
                toast({ title: 'Rules Applied', description: `${matchedDocs.length} transactions auto-allocated across all pages.` });
                onAllocationComplete?.();
            } else { 
                toast({ title: "No Matches", description: "No rules matched any unallocated transactions." }); 
            }
        } catch (e: any) { 
            console.error(e);
            toast({ title: 'Error', description: e?.message || 'Failed to apply rules.', variant: 'destructive' }); 
        } finally { 
            setIsRuleAllocating(false); 
        }
    };

    const handleMatchSuppliers = async () => {
        if (!client?.uid || !bankAccountId) return;
        setIsSupplierMatching(true);
        try {
            const res = await matchTransactionsToSuppliers({ idToken: await getIdToken(), clientId: client.uid, bankAccountId });
            toast({ 
                title: "Supplier Matching Complete", 
                description: `${res.count} transactions fuzzy-matched to your supplier list.` 
            });
        } catch (e: any) {
            console.error('Match suppliers error:', e);
            toast({ title: "Matching Failed", description: e?.message || "Failed to match suppliers", variant: "destructive" });
        } finally {
            setIsSupplierMatching(false);
        }
    };

    const handleSaveAllocations = async () => {
        if (!client?.uid || Object.keys(allocations).length === 0) return;
        setIsSaving(true);
        try {
            const entries = Object.entries(allocations);
            const txCollection = collection(db, 'aiAccountantClients', client.uid, 'transactions');
            await commitBatchedUpdates(entries, (batch, [txId, alloc]: [string, any]) => {
                const tx = filteredTransactions.find(t => t.id === txId);
                const selectedVat = alloc.vatType || tx?.vatType || 'no_vat';
                
                batch.update(doc(txCollection, txId), {
                    status: 'reviewed',
                    allocatedTo: { value: alloc.value, type: alloc.type },
                    vatType: client.isVatRegistered ? selectedVat : 'no_vat',
                    allocatedAt: serverTimestamp(),
                    allocationSource: 'manual',
                });
            });
            toast({ title: "Allocations Saved" });
            setAllocations({});
            onAllocationComplete?.();
        } catch (e) { 
            console.error(e); 
            toast({ title: "Error Saving", variant: "destructive" });
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleRunSmartMatch = async () => {
        if (!client?.uid || !bankAccountId || !user?.email) return;
        setIsSubmittingToWorkflow(true);
        try {
            const lockRes = await prepareAiAccountantAnalysis({ idToken: await getIdToken(), clientId: client.uid, bankAccountId });
            if (lockRes.count > 0) {
                setActiveTab('ai-workflow');
                await runAiAccountantAnalysis({ idToken: await getIdToken(), clientId: client.uid, bankAccountId, initiatorEmail: user.email });
                
                try {
                    const consolRes = await autoConsolidateSmartMatchQueue({
                        idToken: await getIdToken(),
                        clientId: client.uid,
                        bankAccountId
                    });
                    if (consolRes.totalMergesApplied > 0) {
                        toast({
                            title: "Merchant Groups Consolidated",
                            description: `Consolidated ${consolRes.originalGroupCount} groups into ${consolRes.finalGroupCount} canonical groups across ${consolRes.passesExecuted} passes.`
                        });
                    }
                } catch (cErr) {
                    console.error("Auto-consolidation error after smart match:", cErr);
                }

                setIsSubmittingToWorkflow(false);
            } else { 
                toast({ title: "No new expenses found to process." }); 
                setIsSubmittingToWorkflow(false);
            }
        } catch (e) { 
            toast({ title: "Process Failed", variant: "destructive" }); 
            setIsSubmittingToWorkflow(false);
        }
    };

    const handleAiResearch = async (tx: ImportedTransaction) => {
        if (!client) return;
        setIsAiResearching(tx.id);
        setSelectedTxForAi(tx);
        try {
            const res = await researchMerchantWithAi({ 
                idToken: await getIdToken(),
                clientId: client.uid,
                transactionIds: [tx.id],
                description: tx.description,
                chartOfAccounts: JSON.stringify(client.chartOfAccounts || []),
                isVatRegistered: !!client.isVatRegistered,
                isExpense: tx.isExpense
            });
            setAiSuggestion(res);
            setIsAiReviewOpen(true);
        } catch (e) { 
            toast({ title: "Analysis Failed", variant: "destructive" }); 
        } finally { 
            setIsAiResearching(null); 
        }
    };

    const handleAiReviewAction = async (mode: 'new' | 'append' | 'allocate') => {
        if (!aiSuggestion || !selectedTxForAi || !client) return;
        
        if (mode === 'allocate') {
            try {
                const batch = writeBatch(db);
                const transRef = collection(db, 'aiAccountantClients', client.uid, 'transactions');
                batch.update(doc(transRef, selectedTxForAi.id), {
                    status: 'reviewed',
                    allocatedTo: { value: aiSuggestion.accountId, type: aiSuggestion.accountType || 'account' },
                    vatType: aiSuggestion.vatType,
                    allocatedAt: serverTimestamp(),
                    allocationSource: 'ai',
                });
                await batch.commit();
                toast({ title: "Transaction Allocated" });
                setIsAiReviewOpen(false);
                onAllocationComplete?.();
            } catch (e) {
                toast({ title: "Allocation Failed", variant: "destructive" });
            }
            return;
        }

        setTransactionDescriptionForRule(selectedTxForAi.description);
        setRuleDefaultValues({
            mode,
            description: `Rule for: ${aiSuggestion.suggestedKeyword || 'Merchant'}`,
            keywords: aiSuggestion.suggestedKeyword || '',
            accountId: aiSuggestion.accountId,
            accountType: aiSuggestion.accountType || 'account',
            vatType: aiSuggestion.vatType,
            scope: 'client',
        });
        setIsAiReviewOpen(false);
        setIsCreateOpen(true);
    };

    const handleDownloadExcel = () => {
        if (!client) return;
        const wb = XLSX.utils.book_new();
        
        // Main Data
        const rows: (string | number)[][] = [['Date', 'Description', 'Reference', 'Amount', 'Allocate To', 'VAT Type']];
        filteredTransactions.forEach(tx => {
            rows.push([
                format(new Date(tx.date), 'dd/MM/yyyy'),
                tx.description,
                tx.reference || '',
                tx.amount,
                '',
                ''
            ]);
        });
        const ws = XLSX.utils.aoa_to_sheet(rows);
        
        // Add Validation Sheet
        const validationRows = [['GL Accounts', 'VAT Types']];
        const accounts = client.chartOfAccounts || [];
        const maxLen = Math.max(accounts.length, allVatTypes.length);
        for(let i=0; i<maxLen; i++) {
            validationRows.push([
                accounts[i]?.description || '',
                allVatTypes[i]?.label || ''
            ]);
        }
        const valWs = XLSX.utils.aoa_to_sheet(validationRows);
        XLSX.utils.book_append_sheet(wb, valWs, 'Validation');
        
        // Apply Dropdowns (Best effort for Excel)
        if (rows.length > 1) {
            ws['!dataValidation'] = [
                {
                    sqref: `E2:E${rows.length}`,
                    type: 'list',
                    formula1: 'Validation!$A$2:$A$500'
                },
                {
                    sqref: `F2:F${rows.length}`,
                    type: 'list',
                    formula1: 'Validation!$B$2:$B$10'
                }
            ];
        }

        XLSX.utils.book_append_sheet(wb, ws, 'New Transactions');
        XLSX.writeFile(wb, `Unallocated_${activeSubTab}_${client.name}.xlsx`);
    };

    return (
        <div className="space-y-4">
            <CreateManualTransactionDialog 
                client={client} 
                bankAccountId={bankAccountId} 
                open={isManualTxOpen} 
                onOpenChange={(open) => {
                    setIsManualTxOpen(open);
                    if (!open) {
                        onAccountCreated();
                        onRefreshBalance?.();
                        onAllocationComplete?.();
                    }
                }} 
            />
            <EditTransactionDialog 
                client={client} 
                transaction={transactionToEdit} 
                open={isEditTxOpen} 
                onOpenChange={(open) => {
                    setIsEditTxOpen(open);
                    if (!open) {
                        onRefreshBalance?.();
                        onAllocationComplete?.();
                    }
                }} 
            />
            <CreateRuleDialog 
                client={client} 
                onRuleCreated={onAccountCreated} 
                open={isCreateRuleOpen} 
                onOpenChange={setIsCreateOpen} 
                defaultValues={ruleDefaultValues} 
                transactionDescription={transactionDescriptionForRule} 
                existingRules={globalRules} 
                customers={customers} 
                suppliers={suppliers} 
            />
            <CreateGeneralAccountDialog client={client} onAccountCreated={onAccountCreated} open={isCreateGeneralAccountOpen} onOpenChange={setIsCreateGeneralAccountOpen} />
            <AIAllocationReviewDialog open={isAiReviewOpen} onOpenChange={setIsAiReviewOpen} suggestion={aiSuggestion} transaction={selectedTxForAi} onAction={handleAiReviewAction} isVatRegistered={!!client?.isVatRegistered} />
            <SplitTransactionDialog 
                client={client} 
                transaction={splitTransaction} 
                open={isSplitDialogOpen} 
                onOpenChange={setIsSplitDialogOpen} 
                onSplitComplete={() => {
                    onAllocationComplete?.();
                    onRefreshBalance?.();
                }} 
                customers={customers} 
                suppliers={suppliers} 
            />
            
            <Card>
                <CardHeader className="p-0 border-b">
                    <Tabs value={activeSubTab} onValueChange={(v: any) => setActiveSubTab(v)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 rounded-none"><TabsTrigger value="expenses">Expenses</TabsTrigger><TabsTrigger value="income">Income</TabsTrigger></TabsList>
                    </Tabs>
                    <div className="p-4 flex justify-between items-center gap-2 flex-wrap">
                        <div className="flex gap-2 flex-wrap">
                            <ImportDialog 
                                client={client} 
                                bankAccountId={bankAccountId} 
                                currentBalance={currentBalance} 
                                onImportComplete={() => { 
                                    onAccountCreated(); 
                                    onRefreshBalance?.(); 
                                    onAllocationComplete?.(); 
                                }} 
                            />
                            
                            <Button variant="outline" onClick={() => setIsManualTxOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
                            </Button>

                            <Button variant="outline" onClick={handleDownloadExcel} disabled={filteredTransactions.length === 0}>
                                <FileSpreadsheet className="mr-2 h-4 w-4"/> Download Excel
                            </Button>

                            <AccountSelector
                                client={client}
                                customers={customers}
                                suppliers={suppliers}
                                showAccounts={true}
                                showCustomers={true}
                                showSuppliers={true}
                                isVatRegistered={!!client?.isVatRegistered}
                                requireVatSelection={true}
                                disabled={selectedTransactions.length === 0}
                                placeholder="Manual Allocate..."
                                className="w-52"
                                size="default"
                                onChange={(sel, vat) => handleBulkAllocate(sel, vat || 'no_vat')}
                                onCreateAccountClick={() => setIsCreateGeneralAccountOpen(true)}
                            />

                            <Button variant="outline" onClick={handleAllocateByRules} disabled={isRuleAllocating || activeSubTab === 'income'}>
                                {isRuleAllocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <BookOpen className="mr-2 h-4 w-4" />} Apply Rules
                            </Button>

                            <Button variant="outline" onClick={handleMatchSuppliers} disabled={isSupplierMatching || activeSubTab === 'income'} className="font-bold border-primary/20 text-primary hover:bg-primary/5">
                                {isSupplierMatching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Users className="mr-2 h-4 w-4" />} Match Suppliers
                            </Button>

                            <Button 
                                variant="outline" 
                                onClick={() => setIsSmartMatchOpen(true)} 
                                disabled={selectedTransactions.length === 0} 
                                className="font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                            >
                                <Sparkles className="mr-2 h-4 w-4 text-emerald-500" /> Smart Match Queue ({selectedTransactions.length})
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="outline" disabled={selectedTransactions.length === 0}>Actions ...</Button></DropdownMenuTrigger>
                                <DropdownMenuContent><DropdownMenuItem className="text-destructive" onClick={handleBulkDelete}>Delete Selected</DropdownMenuItem></DropdownMenuContent>
                            </DropdownMenu>

                            {activeSubTab === 'expenses' && <Button variant="secondary" onClick={handleRunSmartMatch} disabled={isSubmittingToWorkflow} className="font-bold border-2 border-primary/20"><RotateCw className="mr-2 h-4 w-4" /> Group & Smart Match</Button>}
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                <span className="text-xs font-medium min-w-[60px] text-center">Page {currentPage} of {totalPages}</span>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search descriptions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-64" />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12"><Checkbox checked={pagedTransactions.length > 0 && selectedTransactions.length === pagedTransactions.length} onCheckedChange={(v) => setSelectedTransactions(v ? pagedTransactions.map(tx => tx.id) : [])} /></TableHead>
                                <TableHead><Button variant="ghost" onClick={() => handleSort('date')}>Date <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                                <TableHead><Button variant="ghost" onClick={() => handleSort('description')}>Description <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Allocate To</TableHead>
                                {client?.isVatRegistered && <TableHead className="w-[180px]">VAT Type</TableHead>}
                                <TableHead className="text-right"><Button variant="ghost" onClick={() => handleSort('amount')}>Amount <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? <TableRow><TableCell colSpan={client?.isVatRegistered ? 8 : 7} className="text-center h-24"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow> :
                             pagedTransactions.map(tx => (
                                <NewTransactionRow
                                    key={tx.id}
                                    tx={tx}
                                    isSelected={selectedTransactions.includes(tx.id)}
                                    allocation={allocations[tx.id]}
                                    isAiResearching={isAiResearching === tx.id}
                                    client={client}
                                    customers={customers}
                                    suppliers={suppliers}
                                    onToggleSelect={(id, checked) => setSelectedTransactions(prev => checked ? [...prev, id] : prev.filter(item => item !== id))}
                                    onAllocationChange={(id, alloc) => setAllocations((p: any) => ({ ...p, [id]: alloc }))}
                                    onAiResearch={handleAiResearch}
                                    onEdit={(tx) => {
                                        setTransactionToEdit(tx);
                                        setIsEditTxOpen(true);
                                    }}
                                    onSplit={(tx) => {
                                        setSplitTransaction(tx);
                                        setIsSplitDialogOpen(true);
                                    }}
                                    onCreateRule={(tx) => {
                                        const keyword = tx.cleanDescription?.split(/\s+/)[0] || tx.description.split(/\s+/)[0];
                                        setTransactionDescriptionForRule(tx.description);
                                        setRuleDefaultValues({ description: `Rule for: ${keyword}`, keywords: keyword, accountId: '', vatType: activeSubTab === 'income' ? 'standard_rated_sales' : 'no_vat' });
                                        setIsCreateOpen(true);
                                    }}
                                    onDelete={handleDeleteTransaction}
                                />
                             ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-end p-4 border-t">
                    <Button onClick={handleSaveAllocations} disabled={isSaving || Object.keys(allocations).length === 0}>Save Allocations</Button>
                </CardFooter>
            </Card>

            <SmartMatchQueueModal
                open={isSmartMatchOpen}
                onOpenChange={setIsSmartMatchOpen}
                selectedTransactions={smartMatchSelectedTxs}
                client={client!}
                globalRules={globalRules}
                onRulesSaved={onAccountCreated}
            />
        </div>
    );
});

NewTransactionsTab.displayName = 'NewTransactionsTab';

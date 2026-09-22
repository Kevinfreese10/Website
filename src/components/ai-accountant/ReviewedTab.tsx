'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
    Search, 
    ArrowUpDown, 
    ArrowUp, 
    ArrowDown, 
    ChevronLeft, 
    ChevronRight, 
    RotateCcw, 
    PlusCircle, 
    Sparkles, 
    BookOpen, 
    History, 
    X, 
    Undo2, 
    Layers, 
    ArrowRightLeft, 
    Loader2, 
    AlertTriangle,
    MoreHorizontal 
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
    User, 
    VatType, 
    AllocationRule, 
    ClientCustomer, 
    Supplier 
} from '@/lib/types';
import { format, endOfDay } from 'date-fns';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { cn, sanitizeFirestoreData } from '@/lib/utils';
import { BankCleaner } from '@/lib/bank-cleaner';
import { allVatTypes } from '@/lib/vat-types';
import { AccountSelector } from '@/components/accounting/AccountSelector';
import { createRuleFromAllocationAction } from '@/app/actions/allocation-rules-actions';
import { moveTransactionToNew, bulkMoveTransactionsToNew } from '@/app/actions';
import { 
    RuleViewDialog, 
    SplitTransactionDialog, 
    CreateGeneralAccountDialog 
} from './dialogs';
import { formatPrice } from './types';
import { useDebounce } from '@/hooks/use-debounce';
import { ReviewedTransactionRow } from './components/ReviewedTransactionRow';

const db = getFirestore(firebaseApp);
const PAGE_SIZE = 50;

async function getIdToken(): Promise<string> {
    const token = await getAuth(firebaseApp).currentUser?.getIdToken();
    if (!token) throw new Error('You must be signed in to do this.');
    return token;
}

export function getCurrentFinancialYearRange(endMonthName?: string): DateRange {
    const endMonth = endMonthName ? new Date(`${endMonthName} 1, 2000`).getMonth() : 1; // 1 = February
    const now = new Date();
    const currentMonth = now.getMonth();
    const year = now.getFullYear();

    if (currentMonth > endMonth) {
        return {
            from: new Date(year, endMonth + 1, 1),
            to: endOfDay(new Date(year + 1, endMonth, new Date(year + 1, endMonth + 1, 0).getDate())),
        };
    } else {
        return {
            from: new Date(year - 1, endMonth + 1, 1),
            to: endOfDay(new Date(year, endMonth, new Date(year, endMonth + 1, 0).getDate())),
        };
    }
}

export interface ReviewedTabProps {
    client: User | null;
    bankAccountId: string | null;
    customers: ClientCustomer[];
    suppliers: Supplier[];
    globalRules: AllocationRule[];
    onAccountCreated: () => void;
    onUndoComplete?: () => void;
}

export const ReviewedTab = ({ 
    client, 
    bankAccountId, 
    customers, 
    suppliers, 
    globalRules, 
    onAccountCreated, 
    onUndoComplete 
}: ReviewedTabProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // Requirement R4: Default date range to the current South African Financial Year based on client.yearEnd
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => 
        getCurrentFinancialYearRange(client?.yearEnd)
    );
    
    const [activeSubTab, setActiveSubTab] = useState<'expenses' | 'income'>('expenses');
    const [selectedGlAccountId, setSelectedGlAccountId] = useState<string>("all");
    const [searchAmount, setSearchAmount] = useState("");
    // Requirement R3: 300ms debounce ensures instantaneous keystrokes with 0ms lag
    const debouncedSearchAmount = useDebounce(searchAmount, 300);
    const [searchDescription, setSearchDescription] = useState("");
    const debouncedSearchDescription = useDebounce(searchDescription, 300);

    const [usedAccountIds, setUsedAccountIds] = useState<Set<string>>(new Set());
    const [isMovingBack, setIsMovingBack] = useState<string | null>(null);
    const [isBulkMoving, setIsBulkMoving] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
    const [editedAllocations, setEditedAllocations] = useState<any>({});
    const [viewingRuleData, setViewingRuleData] = useState<{ rule: AllocationRule, keyword?: string } | null>(null);
    const [splitTransaction, setSplitTransaction] = useState<ImportedTransaction | null>(null);
    const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
    const [unsplitConfirmTx, setUnsplitConfirmTx] = useState<ImportedTransaction | null>(null);
    const [isCreateGeneralAccountOpen, setIsCreateGeneralAccountOpen] = useState(false);
    const [rulePromptTx, setRulePromptTx] = useState<{
        tx: ImportedTransaction;
        allocatedAccountId: string;
        allocatedAccountType?: string;
        vatType?: string;
        derivedKeyword: string;
    } | null>(null);
    const [rulePromptKeyword, setRulePromptKeyword] = useState('');
    const [rulePromptIsGlobal, setRulePromptIsGlobal] = useState(false);
    const [isCreatingRuleFromTx, setIsCreatingRuleFromTx] = useState(false);

    const [allTransactions, setAllTransactions] = useState<ImportedTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    type SortField = 'date' | 'description' | 'allocatedTo' | 'amount';
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const uniqueChartOfAccounts = useMemo(() => {
        const coa = [...(client?.chartOfAccounts || [])];
        const unique = Array.from(new Map(coa.map(a => [a.accountNumber, a])).values());
        return unique.sort((a, b) => a.description.toLowerCase().localeCompare(b.description.toLowerCase()));
    }, [client]);

    const allAvailableRules = useMemo(() => {
        const base = [...(client?.allocationRules || [])];
        if (client?.disableGlobalRules) return base;
        return [...base, ...globalRules];
    }, [client?.allocationRules, globalRules, client?.disableGlobalRules]);

    const accountNameMap = useMemo(() => {
        const map = new Map<string, string>();
        client?.chartOfAccounts?.forEach(a => map.set(a.id, a.description));
        customers?.forEach(c => map.set(c.id, c.name));
        suppliers?.forEach(s => map.set(s.id, s.name));
        return map;
    }, [client?.chartOfAccounts, customers, suppliers]);

    // Requirement R4: Scope Firestore query by date range when active; falls back to unconstrained query when "All Dates"
    useEffect(() => {
        if (!client?.uid || !bankAccountId) return;
        setIsLoading(true);
        const transRef = collection(db, 'aiAccountantClients', client.uid, 'transactions');
        
        const constraints: any[] = [
            where('bankAccountId', '==', bankAccountId), 
            where('status', 'in', ['reviewed', 'allocated']),
            where('isExpense', '==', activeSubTab === 'expenses')
        ];

        if (dateRange?.from) {
            constraints.push(where('date', '>=', format(dateRange.from, 'yyyy-MM-dd')));
        }
        if (dateRange?.to) {
            constraints.push(where('date', '<=', format(dateRange.to, 'yyyy-MM-dd') + 'T23:59:59.999Z'));
        }

        const q = query(transRef, ...constraints);
        
        const unsubscribe = onSnapshot(q, (snap) => {
            const txs = snap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    _time: data.date ? new Date(data.date).getTime() : 0,
                    _absAmount: Math.abs(data.amount || 0)
                } as any;
            });
            setAllTransactions(txs);
            
            const ids = new Set<string>();
            txs.forEach(tx => {
                if (tx.allocatedTo?.value) ids.add(tx.allocatedTo.value);
            });
            setUsedAccountIds(ids);
            setIsLoading(false);
        }, (error) => {
            console.error("ReviewedTab listener error:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [
        client?.uid, 
        bankAccountId, 
        activeSubTab, 
        dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null, 
        dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null
    ]);

    const { filteredTransactions, pagedTransactions, totalPages } = useMemo(() => {
        let filtered = [...allTransactions];

        // 1. Filter by GL Account if selected
        if (selectedGlAccountId !== "all") {
            filtered = filtered.filter(tx => tx.allocatedTo?.value === selectedGlAccountId);
        }

        // 2. Filter by searchAmount (absolute value match)
        if (debouncedSearchAmount.trim()) {
            const amount = parseFloat(debouncedSearchAmount);
            if (!isNaN(amount)) {
                filtered = filtered.filter((tx: any) => (tx._absAmount ?? Math.abs(tx.amount)) === Math.abs(amount));
            }
        }

        // 3. Filter by searchDescription
        if (debouncedSearchDescription.trim()) {
            const term = debouncedSearchDescription.toUpperCase();
            filtered = filtered.filter(tx => 
                (tx.description || '').toUpperCase().includes(term) || 
                (tx.cleanDescription || '').toUpperCase().includes(term) ||
                (tx.merchantKey || '').toUpperCase().includes(term) ||
                (tx.reference || '').toUpperCase().includes(term)
            );
        }

        // 4. Memory Filter by Date Range (dateRange.from and dateRange.to)
        if (dateRange?.from) {
            const fromTime = new Date(dateRange.from).getTime();
            filtered = filtered.filter((tx: any) => (tx._time ?? new Date(tx.date).getTime()) >= fromTime);
        }
        if (dateRange?.to) {
            const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            const toTime = toDate.getTime();
            filtered = filtered.filter((tx: any) => (tx._time ?? new Date(tx.date).getTime()) <= toTime);
        }

        // 5. Ultra-fast Sorting using precomputed primitives and O(1) map
        filtered.sort((a: any, b: any) => {
            let diff = 0;
            if (sortField === 'date') {
                diff = (a._time || 0) - (b._time || 0);
            } else if (sortField === 'description') {
                const valA = a.cleanDescription || a.description || '';
                const valB = b.cleanDescription || b.description || '';
                diff = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
            } else if (sortField === 'allocatedTo') {
                const valA = accountNameMap.get(a.allocatedTo?.value || '') || 'Selected Account';
                const valB = accountNameMap.get(b.allocatedTo?.value || '') || 'Selected Account';
                diff = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
            } else {
                diff = (a._absAmount || 0) - (b._absAmount || 0);
            }

            return sortDirection === 'asc' ? diff : -diff;
        });

        // 6. Pagination
        const total = Math.ceil(filtered.length / PAGE_SIZE);
        const start = (currentPage - 1) * PAGE_SIZE;
        const paged = filtered.slice(start, start + PAGE_SIZE);

        return {
            filteredTransactions: filtered,
            pagedTransactions: paged,
            totalPages: total || 1
        };
    }, [allTransactions, selectedGlAccountId, debouncedSearchAmount, debouncedSearchDescription, dateRange, sortField, sortDirection, currentPage, accountNameMap]);

    const transactions = pagedTransactions;
    const canGoPrev = currentPage > 1;
    const canGoNext = currentPage < totalPages;
    const goToNextPage = () => {
        if (canGoNext) setCurrentPage(prev => prev + 1);
    };
    const goToPreviousPage = () => {
        if (canGoPrev) setCurrentPage(prev => prev - 1);
    };
    const refetch = () => {};

    // Reset page and selection when filters or active subtab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeSubTab, selectedGlAccountId, debouncedSearchAmount, debouncedSearchDescription, dateRange]);

    useEffect(() => {
        setSelectedTransactions([]);
    }, [activeSubTab, selectedGlAccountId, currentPage, debouncedSearchAmount, debouncedSearchDescription, dateRange]);

    const handleBulkReallocate = async (allocation: { value: string, type: 'account' | 'customer' | 'supplier' }, vatType: VatType) => {
        if (!client?.uid || selectedTransactions.length === 0) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            const txCollection = collection(db, 'aiAccountantClients', client.uid!, 'transactions');
            
            selectedTransactions.forEach(id => {
                batch.update(doc(txCollection, id), {
                    allocatedTo: allocation,
                    vatType: client.isVatRegistered ? vatType : 'no_vat',
                    allocatedAt: serverTimestamp(),
                    allocationSource: 'manual',
                });
            });
            await batch.commit();
            toast({ title: 'Bulk Reallocation Successful', description: `${selectedTransactions.length} transactions updated.` });
            setSelectedTransactions([]);
            setEditedAllocations({});
            refetch();
        } catch (e) {
            console.error(e);
            toast({ title: "Error Reallocating", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetToNew = async (txId: string) => {
        if (!client?.uid) return;
        setIsMovingBack(txId);
        try {
            await moveTransactionToNew({ idToken: await getIdToken(), clientId: client.uid, transactionId: txId });
            toast({ title: "Allocation Cleared", description: "Transaction moved back to 'New' tab." });
            setSelectedTransactions(prev => prev.filter(id => id !== txId));
            refetch();
            onUndoComplete?.();
            onAccountCreated();
        } catch (e) { 
            toast({ title: "Failed to reset", variant: "destructive" }); 
        } finally { 
            setIsMovingBack(null); 
        }
    };

    const handleUnsplitAndReset = async (tx: ImportedTransaction) => {
        if (!client?.uid || !tx.splitFrom || !tx.parentTxData) return;
        setIsMovingBack(tx.id);
        try {
            const batch = writeBatch(db);
            const txCollection = collection(db, 'aiAccountantClients', client.uid, 'transactions');
            
            const q = query(txCollection, where('splitFrom', '==', tx.splitFrom));
            const snap = await getDocs(q);
            
            snap.docs.forEach(d => {
                batch.delete(d.ref);
            });
            
            const parentData = tx.parentTxData;
            const parentDocRef = doc(txCollection, tx.splitFrom);
            
            const restoredTx = {
                clientId: client.uid,
                bankAccountId: parentData.bankAccountId,
                date: parentData.date,
                description: parentData.description,
                amount: parentData.amount,
                status: 'new',
                isExpense: parentData.isExpense,
                reference: parentData.reference || '',
                ...(parentData.cleanDescription ? { cleanDescription: parentData.cleanDescription } : {}),
                ...(parentData.rawDescription ? { rawDescription: parentData.rawDescription } : {}),
                ...(parentData.merchantKey ? { merchantKey: parentData.merchantKey } : {})
            };
            
            batch.set(parentDocRef, sanitizeFirestoreData(restoredTx));
            
            await batch.commit();
            
            toast({ 
                title: "Transaction Reunited", 
                description: "Split transactions deleted and original transaction restored to 'New'." 
            });
            
            setUnsplitConfirmTx(null);
            refetch();
            onUndoComplete?.();
            onAccountCreated();
        } catch (e) {
            console.error(e);
            toast({ title: "Failed to reunite transaction", variant: "destructive" });
        } finally {
            setIsMovingBack(null);
        }
    };

    const handleBulkMoveToNew = async () => {
        if (!client?.uid || selectedTransactions.length === 0) return;
        setIsBulkMoving(true);
        try {
            const res = await bulkMoveTransactionsToNew({ idToken: await getIdToken(), clientId: client.uid, transactionIds: selectedTransactions });
            toast({ title: "Success", description: `${res.count} transactions moved back to New tab.` });
            setSelectedTransactions([]);
            refetch();
            onUndoComplete?.();
            onAccountCreated();
        } catch (e) {
            toast({ title: "Bulk Move Failed", variant: "destructive" });
        } finally {
            setIsBulkMoving(false);
        }
    };

    const handleDeleteTransaction = async (txId: string) => {
        if (!client?.uid) return;
        try {
            await deleteDoc(doc(db, 'aiAccountantClients', client.uid, 'transactions', txId));
            toast({ title: 'Deleted', description: 'Transaction removed.' });
            setSelectedTransactions(prev => prev.filter(id => id !== txId));
            refetch();
            onUndoComplete?.();
            onAccountCreated();
        } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
    };

    const handleSaveEditedAllocations = async () => {
        if (!client?.uid || Object.keys(editedAllocations).length === 0) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            const txCollection = collection(db, 'aiAccountantClients', client.uid, 'transactions');
            
            Object.entries(editedAllocations).forEach(([txId, alloc]: [string, any]) => {
                const tx = transactions.find(t => t.id === txId);
                if (!tx) return;
                
                batch.update(doc(txCollection, txId), {
                    allocatedTo: alloc.allocatedTo || tx.allocatedTo,
                    vatType: alloc.vatType || tx.vatType || 'no_vat',
                    allocatedAt: serverTimestamp(),
                    allocationSource: 'manual'
                });
            });
            
            await batch.commit();
            toast({ title: "Changes Saved", description: `${Object.keys(editedAllocations).length} transactions updated.` });
            setEditedAllocations({});
            refetch();
        } catch (e) {
            console.error(e);
            toast({ title: "Error Saving", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenCreateRulePrompt = (tx: ImportedTransaction, currentAlloc?: any) => {
        const cleaned = BankCleaner.process(tx.description);
        let kw = (cleaned.cleanDescription || cleaned.merchantKey || tx.description).toUpperCase().trim();
        kw = kw.replace(/\s+\d{2,}[\/-]\d{2,}.*$/, '').trim();
        const alloc = currentAlloc || tx.allocatedTo;
        if (!alloc?.value) {
            toast({ title: "Allocate first", description: "Please select an account before creating an allocation rule.", variant: "destructive" });
            return;
        }
        setRulePromptTx({
            tx,
            allocatedAccountId: alloc.value,
            allocatedAccountType: alloc.type || 'account',
            vatType: tx.vatType || 'standard_rated_purchases',
            derivedKeyword: kw
        });
        setRulePromptKeyword(kw);
        setRulePromptIsGlobal(false);
    };

    const handleConfirmCreateRule = async () => {
        if (!rulePromptTx || !client?.uid) return;
        setIsCreatingRuleFromTx(true);
        try {
            const token = await getIdToken();
            const res = await createRuleFromAllocationAction({
                idToken: token,
                clientId: client.uid,
                transactionDescription: rulePromptTx.tx.description,
                accountId: rulePromptTx.allocatedAccountId,
                accountType: rulePromptTx.allocatedAccountType,
                vatType: rulePromptTx.vatType,
                customKeyword: rulePromptKeyword.trim().toUpperCase(),
                isGlobal: rulePromptIsGlobal
            });
            toast({
                title: "Allocation Rule Created!",
                description: `Rule created for "${res.derivedKeyword}". Future transactions will be auto-allocated to ${accountNameMap.get(rulePromptTx.allocatedAccountId) || rulePromptTx.allocatedAccountId}.`
            });
            setRulePromptTx(null);
            onAccountCreated();
            refetch();
        } catch (e: any) {
            toast({ title: "Failed to create rule", description: e?.message || "Unknown error", variant: "destructive" });
        } finally {
            setIsCreatingRuleFromTx(false);
        }
    };

    return (
        <div className="space-y-4">
            <RuleViewDialog 
                open={!!viewingRuleData} 
                onOpenChange={(open) => !open && setViewingRuleData(null)}
                rule={viewingRuleData?.rule || null}
                matchedKeyword={viewingRuleData?.keyword}
                isVatRegistered={!!client?.isVatRegistered}
            />
            <SplitTransactionDialog 
                client={client} 
                transaction={splitTransaction} 
                open={isSplitDialogOpen} 
                onOpenChange={setIsSplitDialogOpen} 
                onSplitComplete={() => refetch()} 
                customers={customers} 
                suppliers={suppliers} 
            />
            <CreateGeneralAccountDialog 
                client={client} 
                onAccountCreated={onAccountCreated} 
                open={isCreateGeneralAccountOpen} 
                onOpenChange={setIsCreateGeneralAccountOpen} 
            />
            {/* 1-Click Auto-Rule Creation Dialog */}
            <Dialog open={!!rulePromptTx} onOpenChange={(open) => !open && setRulePromptTx(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Create Allocation Rule
                        </DialogTitle>
                        <DialogDescription>
                            Automatically allocate future transactions matching this keyword.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Rule Keyword</Label>
                            <Input
                                value={rulePromptKeyword}
                                onChange={(e) => setRulePromptKeyword(e.target.value.toUpperCase())}
                                placeholder="e.g. MAKRO, SHELL, VODACOM"
                                className="font-mono uppercase font-bold"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Guide-matching allows variations (e.g. &quot;HAND TOOLS&quot; matches &quot;HAND TOOLS SUPPLY&quot;).
                            </p>
                        </div>
                        <div className="rounded-md border p-3 bg-muted/40 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Allocated Account:</span>
                                <span className="font-semibold">{accountNameMap.get(rulePromptTx?.allocatedAccountId || '') || rulePromptTx?.allocatedAccountId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">VAT Treatment:</span>
                                <span className="font-semibold">{rulePromptTx?.vatType || 'no_vat'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Original Transaction:</span>
                                <span className="font-mono text-[10px] truncate max-w-[200px]">{rulePromptTx?.tx.description}</span>
                            </div>
                        </div>
                        {(user?.role === 'admin' || (user as any)?.isAdmin === true) && (
                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox
                                    id="isGlobalRule"
                                    checked={rulePromptIsGlobal}
                                    onCheckedChange={(checked) => setRulePromptIsGlobal(!!checked)}
                                />
                                <Label htmlFor="isGlobalRule" className="text-xs cursor-pointer">
                                    Global Master Rule (Applies across all AI Accountant clients)
                                </Label>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRulePromptTx(null)} disabled={isCreatingRuleFromTx}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmCreateRule} disabled={isCreatingRuleFromTx || !rulePromptKeyword.trim()} className="font-bold">
                            {isCreatingRuleFromTx ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <PlusCircle className="h-4 w-4 mr-1.5" />}
                            Create Rule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {unsplitConfirmTx && (
                <AlertDialog open={!!unsplitConfirmTx} onOpenChange={(open) => !open && setUnsplitConfirmTx(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                Re-unite Split Transaction?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This transaction is part of a split allocation. Moving it back to "New" will delete all sub-transactions belonging to this split and restore the original transaction of <strong>{formatPrice(Math.abs(unsplitConfirmTx.parentTxData?.amount || 0))}</strong>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleUnsplitAndReset(unsplitConfirmTx)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Re-unite & Move
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <Card>
                <CardHeader className="p-0 border-b">
                    <Tabs value={activeSubTab} onValueChange={(v: any) => { setActiveSubTab(v); setSelectedGlAccountId("all"); setEditedAllocations({}); }} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 rounded-none"><TabsTrigger value="expenses">Reviewed Expenses</TabsTrigger><TabsTrigger value="income">Reviewed Income</TabsTrigger></TabsList>
                    </Tabs>
                    <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 w-full md:auto flex-wrap">
                            <AccountSelector
                                client={client}
                                showAccounts={true}
                                showCustomers={false}
                                showSuppliers={false}
                                value={selectedGlAccountId}
                                onChange={(selection) => setSelectedGlAccountId(selection.value)}
                                placeholder="Filter by Account..."
                                allowClear={true}
                                clearText={`All Accounts (${usedAccountIds.size})`}
                                filterAccounts={(acc) => usedAccountIds.has(acc.id)}
                                className="w-full md:w-[240px]"
                            />
                            
                            <div className="relative w-full md:w-40">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="Search Amount..." 
                                    value={searchAmount} 
                                    onChange={(e) => setSearchAmount(e.target.value)} 
                                    className="pl-8 h-10"
                                />
                            </div>

                            <div className="relative w-full md:w-56">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="text" 
                                    placeholder="Search Description..." 
                                    value={searchDescription} 
                                    onChange={(e) => setSearchDescription(e.target.value)} 
                                    className="pl-8 h-10"
                                />
                            </div>

                            {selectedTransactions.length > 0 && (
                                <>
                                <AccountSelector
                                    client={client}
                                    customers={customers}
                                    suppliers={suppliers}
                                    showAccounts={true}
                                    showCustomers={true}
                                    showSuppliers={true}
                                    isVatRegistered={!!client?.isVatRegistered}
                                    requireVatSelection={true}
                                    disabled={isSaving}
                                    placeholder="Bulk Reallocate..."
                                    className="w-52"
                                    size="default"
                                    onChange={(sel, vat) => handleBulkReallocate(sel, vat || 'no_vat')}
                                />

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/5 font-bold gap-2">
                                            {isBulkMoving ? <Loader2 className="h-4 w-4 animate-spin"/> : <RotateCcw className="h-4 w-4" />}
                                            Move {selectedTransactions.length} to New
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Move back to New?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will clear the current allocations for {selectedTransactions.length} selected transactions and move them back to the "New Transactions" tab for re-processing.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleBulkMoveToNew}>Yes, Move Transactions</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                </>
                            )}

                            <div className="flex items-center gap-2 ml-auto md:ml-4">
                                <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={!canGoPrev}><ChevronLeft className="h-4 w-4" /></Button>
                                <span className="text-xs font-medium min-w-[60px] text-center">Page {currentPage} of {totalPages}</span>
                                <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!canGoNext}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <DateRangePicker 
                            value={dateRange} 
                            onDateChange={setDateRange} 
                            financialYearEnd={client?.yearEnd} 
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox 
                                        checked={transactions.length > 0 && selectedTransactions.length === transactions.length} 
                                        onCheckedChange={(v) => setSelectedTransactions(v ? transactions.map(tx => tx.id) : [])} 
                                    />
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('date')} className="hover:bg-transparent p-0 font-semibold flex items-center">
                                        Date
                                        {sortField === 'date' ? (
                                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />
                                        ) : (
                                            <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
                                        )}
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('description')} className="hover:bg-transparent p-0 font-semibold flex items-center">
                                        Description
                                        {sortField === 'description' ? (
                                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />
                                        ) : (
                                            <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
                                        )}
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('allocatedTo')} className="hover:bg-transparent p-0 font-semibold flex items-center">
                                        Allocated To
                                        {sortField === 'allocatedTo' ? (
                                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />
                                        ) : (
                                            <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
                                        )}
                                    </Button>
                                </TableHead>
                                <TableHead>Source</TableHead>
                                {client?.isVatRegistered && <TableHead>VAT Type</TableHead>}
                                <TableHead className="text-right">
                                    <Button variant="ghost" onClick={() => handleSort('amount')} className="hover:bg-transparent p-0 font-semibold flex items-center justify-end w-full">
                                        Amount
                                        {sortField === 'amount' ? (
                                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />
                                        ) : (
                                            <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
                                        )}
                                    </Button>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? <TableRow><TableCell colSpan={client?.isVatRegistered ? 8 : 7} className="text-center h-24"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow> :
                            transactions.map(tx => (
                                <ReviewedTransactionRow
                                    key={tx.id}
                                    tx={tx}
                                    isSelected={selectedTransactions.includes(tx.id)}
                                    editedAllocation={editedAllocations[tx.id]}
                                    client={client}
                                    customers={customers}
                                    suppliers={suppliers}
                                    allAvailableRules={allAvailableRules}
                                    onToggleSelect={(id, checked) => setSelectedTransactions(prev => checked ? [...prev, id] : prev.filter(item => item !== id))}
                                    onAllocationChange={(id, alloc) => setEditedAllocations((p: any) => ({
                                        ...p,
                                        [id]: alloc
                                    }))}
                                    onCancelEdit={(id) => {
                                        const newEdited = { ...editedAllocations };
                                        delete newEdited[id];
                                        setEditedAllocations(newEdited);
                                    }}
                                    onViewRule={(rule, keyword) => setViewingRuleData({ rule, keyword })}
                                    onCreateRulePrompt={handleOpenCreateRulePrompt}
                                    onMoveToNew={(tx) => {
                                        if (tx.isSplitChild && tx.splitFrom) {
                                            setUnsplitConfirmTx(tx);
                                        } else {
                                            handleResetToNew(tx.id);
                                        }
                                    }}
                                    onSplit={(tx) => {
                                        setSplitTransaction(tx);
                                        setIsSplitDialogOpen(true);
                                    }}
                                    onViewLedger={(accountId) => {
                                        window.location.href = `/admin/ai-accountant/${client?.uid}/reports/general-ledger?accountId=${accountId}`;
                                    }}
                                    onDelete={handleDeleteTransaction}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-end p-4 border-t">
                    {Object.keys(editedAllocations).length > 0 && (
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditedAllocations({})}>Cancel Edits</Button>
                            <Button size="sm" onClick={handleSaveEditedAllocations} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save {Object.keys(editedAllocations).length} Changes
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};

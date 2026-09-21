'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileUp, Loader2, PlusCircle, Search, Settings, Trash2, Edit, Pencil, ArrowRightLeft, BookOpen, Sparkles, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, CheckCheck, ChevronsUpDown, MoreHorizontal, RotateCcw, AlertTriangle, Download, BrainCircuit, Play, CheckCircle2, Clock, Undo2, RotateCw, History, Info, X, ArrowRight, MessageSquareQuote, Send, AlertCircle, StopCircle, GripVertical, Layers, FileSpreadsheet, Save, MessageSquare, RefreshCw, Calendar as CalendarIcon, Users, Zap, Unlink, Split, Percent, Repeat, Coins, CreditCard, Building2, ShieldAlert, FileText, ArrowLeftRight, Globe } from 'lucide-react';
import { AiConfidenceBadge } from '@/components/ai/AiConfidenceBadge';
import Papa from 'papaparse';
import { ImportedTransaction, ChartOfAccount, User, VatType, AllocatedTransaction, AllocationRule, ClientCustomer, Invoice, SmartAllocationResult, Supplier } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getFirestore, doc, updateDoc, arrayUnion, getDoc, collection, getDocs, query, orderBy, where, writeBatch, onSnapshot, Timestamp, deleteField, addDoc, limit, serverTimestamp, deleteDoc, setDoc, getCountFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, sanitizeFirestoreData } from '@/lib/utils';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { allVatTypes } from '@/lib/vat-types';
import { BankCleaner, matchesRuleKeyword } from '@/lib/bank-cleaner';
import { resolveAccountForCategory } from '@/lib/chart-of-accounts-mapper';
import { triageTransaction, buildConsistencyMap, TriageContext } from '@/lib/initial-allocation-engine';
import { proposeRegroupsPure, RegroupProposal } from '@/lib/regroup-engine';
import { MASTER_ALLOCATION_RULES } from '@/lib/master-allocation-rules';
import { analyzeMerchantGroupDetective, ClueBadge, ClueType, DetectiveInputTransaction, DetectiveContext, WebGroundingResult, DetectiveAnalysisResult } from '@/lib/detective-engine';
import { createRuleFromAllocationAction } from '@/app/actions/allocation-rules-actions';
import { usePaginatedFirestore } from '@/hooks/use-paginated-firestore';
import { Command, CommandEmpty, CommandInput, CommandList, CommandGroup, CommandSeparator, CommandItem } from "@/components/ui/command";
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parse, addDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { runAiAccountantAnalysis, prepareAiAccountantAnalysis, autoConsolidateSmartMatchQueue, moveTransactionToNew, researchMerchantWithAi, updateGlobalMerchantDb, resetAiAccountantAnalysis, proposeRegroups, applyRegroups, proposeAiRegroups, analyzeClientCommentAndSuggest, bulkMoveTransactionsToNew, matchTransactionsToSuppliers, matchTransactionsToHistory, reanalyzeAndRegroupTransactions, suggestTransactionAllocationWeb } from '@/app/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from "@/components/ui/progress";
import * as XLSX from 'xlsx-js-style';
import AIStatementImportDialog from '@/components/admin/AIStatementImportDialog';
import { Calendar } from '@/components/ui/calendar';
import { AccountSelector } from '@/components/accounting/AccountSelector';

const db = getFirestore(firebaseApp);
const PAGE_SIZE = 50;

/**
 * Fetches a fresh Firebase ID token for the currently signed-in user, to pass to server
 * actions for trusted verification. Throws if nobody is signed in, since every AI Accountant
 * action requires an authenticated, verifiable caller.
 */
async function getIdToken(): Promise<string> {
    const token = await getAuth(firebaseApp).currentUser?.getIdToken();
    if (!token) throw new Error('You must be signed in to do this.');
    return token;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
};

// #region Helper Components

function RuleViewDialog({ open, onOpenChange, rule, matchedKeyword, isVatRegistered }: { open: boolean, onOpenChange: (open: boolean) => void, rule: AllocationRule | null, matchedKeyword?: string | null, isVatRegistered?: boolean }) {
    if (!rule) return null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Allocation Rule Details
                    </DialogTitle>
                    <DialogDescription>Details for rule: <strong>{rule.description}</strong></DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {matchedKeyword && (
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Triggering Keyword</p>
                            <Badge variant="outline" className="text-sm font-bold border-primary/30 text-primary uppercase">
                                {matchedKeyword}
                            </Badge>
                        </div>
                    )}
                    <div className={cn("grid gap-4", isVatRegistered ? "grid-cols-2" : "grid-cols-1")}>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Allocate To</p>
                            <p className="text-sm font-semibold">{rule.accountId}</p>
                        </div>
                        {isVatRegistered && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">VAT Treatment</p>
                                <p className="text-sm font-semibold capitalize">{rule.vatType.replace(/_/g, ' ')}</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">All Rule Keywords</p>
                        <div className="flex flex-wrap gap-1">
                            {rule.keywords.map(kw => (
                                <Badge key={kw} variant="secondary" className={cn("text-[10px]", kw.toUpperCase() === matchedKeyword?.toUpperCase() && "bg-primary text-primary-foreground")}>
                                    {kw}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/admin/ai-accountant/allocation-rules">
                            Manage All Rules <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AIAllocationReviewDialog({ open, onOpenChange, suggestion, transaction, onAction, isVatRegistered }: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void, 
    suggestion: SmartAllocationResult | null, 
    transaction: ImportedTransaction | null,
    onAction: (mode: 'new' | 'append' | 'allocate') => void,
    isVatRegistered?: boolean
}) {
    if (!suggestion || !transaction) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Research Result
                    </DialogTitle>
                    <DialogDescription>
                        Analysis for: <strong>{transaction.description}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                        <div className="flex justify-between items-center">
                            <AiConfidenceBadge confidence={suggestion.confidence} />
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">AI Intelligence Layer</span>
                        </div>
                        <p className="text-sm italic text-muted-foreground leading-relaxed">
                            "{suggestion.summary}"
                        </p>
                    </div>

                    {suggestion.confidence >= 20 ? (
                        <div className={cn("grid gap-4", isVatRegistered ? "grid-cols-2" : "grid-cols-1")}>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Suggested Account</p>
                                <p className="text-sm font-semibold">{suggestion.accountId}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold">{suggestion.accountType || 'account'}</p>
                            </div>
                            {isVatRegistered && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Suggested VAT</p>
                                    <p className="text-sm font-semibold capitalize">{suggestion.vatType.replace(/_/g, ' ')}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-destructive/5 p-4 rounded-xl border border-destructive/10">
                            <p className="text-xs font-semibold text-destructive leading-relaxed">
                                Gemini could not identify a reliable category for this transaction. You will need to allocate it manually.
                            </p>
                        </div>
                    )}

                    {suggestion.suggestedKeyword && suggestion.confidence >= 20 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Suggested Rule Keyword</p>
                            <Badge variant="outline" className="text-sm font-bold border-primary/30 text-primary uppercase">
                                {suggestion.suggestedKeyword}
                            </Badge>
                        </div>
                    )}
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button variant="outline" onClick={() => onAction('new')} className="w-full">
                            Create Rule
                        </Button>
                        <Button variant="outline" onClick={() => onAction('append')} className="w-full">
                            Add to Existing
                        </Button>
                    </div>
                    <Button 
                        onClick={() => onAction('allocate')} 
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        disabled={suggestion.confidence < 20}
                    >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Apply Allocation Only
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ImportDialog({ client, bankAccountId, currentBalance, onImportComplete }: { client: User | null, bankAccountId: string, currentBalance: number, onImportComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [parsedTransactions, setParsedTransactions] = useState<any[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const [lastImportDate, setLastImportDate] = useState<Date | null>(null);
    const [actualBalance, setActualBalance] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Fetch latest import date when dialog opens or bank account changes
    useEffect(() => {
        if (!isOpen || !client?.uid || !bankAccountId) return;
        let isMounted = true;

        const fetchLastImportInfo = async () => {
            try {
                // 1. Check client's chartOfAccounts for this bank account
                const currentAcc = (client.chartOfAccounts || []).find(a => a.id === bankAccountId);
                let latestFromCOA: Date | null = null;
                if (currentAcc?.lastImportDate) {
                    const p = new Date(currentAcc.lastImportDate);
                    if (!isNaN(p.getTime())) latestFromCOA = p;
                }

                // 2. Query transactions for this bank account
                const transRef = collection(db, 'aiAccountantClients', client.uid, 'transactions');
                let latestFromTx: Date | null = null;

                try {
                    const q = query(
                        transRef,
                        where('bankAccountId', '==', bankAccountId),
                        orderBy('date', 'desc'),
                        limit(1)
                    );
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const d = snap.docs[0].data()?.date;
                        if (d) {
                            const p = new Date(d);
                            if (!isNaN(p.getTime())) latestFromTx = p;
                        }
                    }
                } catch (queryErr) {
                    // Fallback query without orderBy in case composite index is not provisioned
                    const qFallback = query(transRef, where('bankAccountId', '==', bankAccountId));
                    const snapFallback = await getDocs(qFallback);
                    let maxTime = 0;
                    snapFallback.docs.forEach(doc => {
                        const d = doc.data()?.date;
                        if (d) {
                            const t = new Date(d).getTime();
                            if (t > maxTime) maxTime = t;
                        }
                    });
                    if (maxTime > 0) latestFromTx = new Date(maxTime);
                }

                let latest: Date | null = null;
                if (latestFromCOA && latestFromTx) {
                    latest = latestFromCOA.getTime() > latestFromTx.getTime() ? latestFromCOA : latestFromTx;
                } else {
                    latest = latestFromCOA || latestFromTx;
                }

                if (isMounted) {
                    setLastImportDate(latest);
                }
            } catch (err) {
                console.error('Error fetching last import date:', err);
            }
        };

        fetchLastImportInfo();
        return () => { isMounted = false; };
    }, [isOpen, client?.uid, bankAccountId, client?.chartOfAccounts]);

    const filteredTransactions = useMemo(() => {
        if (!parsedTransactions.length) return [];
        return parsedTransactions.filter(tx => {
            const txDate = tx.parsedDate || parse(tx.Date, 'dd/MM/yyyy', new Date());
            if (isNaN(txDate.getTime())) return true;
            if (startDate && txDate < new Date(startDate)) return false;
            if (endDate && txDate > new Date(endDate)) return false;
            return true;
        });
    }, [parsedTransactions, startDate, endDate]);

    const fileMinDate = useMemo(() => {
        const validDates = parsedTransactions.map(tx => tx.parsedDate?.getTime()).filter(Boolean) as number[];
        return validDates.length > 0 ? new Date(Math.min(...validDates)) : null;
    }, [parsedTransactions]);

    const excludedPriorCount = useMemo(() => {
        if (!startDate || !parsedTransactions.length) return 0;
        const start = new Date(startDate);
        return parsedTransactions.filter(tx => tx.parsedDate && tx.parsedDate < start).length;
    }, [startDate, parsedTransactions]);

    const isDateGap = useMemo(() => {
        if (!lastImportDate || !fileMinDate) return false;
        const dayAfter = addDays(lastImportDate, 1);
        return fileMinDate.getTime() > dayAfter.getTime();
    }, [lastImportDate, fileMinDate]);

    const importTotal = useMemo(() => {
        return filteredTransactions.reduce((sum, tx) => sum + tx.Amount, 0);
    }, [filteredTransactions]);

    const potentialBalance = currentBalance + importTotal;
    const isValidBalance = actualBalance !== '' && Math.abs(potentialBalance - parseFloat(actualBalance)) < 0.01;

    const parseOFX = (text: string) => {
        const transactions: any[] = [];
        const stmttrnRegex = /<STMTTRN>[\s\S]*?<\/STMTTRN>/g;
        const matches = text.match(stmttrnRegex);
        if (matches) {
            matches.forEach(match => {
                const trnamtMatch = match.match(/<TRNAMT>([\-\d.]+)/);
                const dtpostedMatch = match.match(/<DTPOSTED>(\d{8})/);
                const nameMatch = match.match(/<NAME>([^<]+)/);
                const memoMatch = match.match(/<MEMO>([^<]+)/);

                if (trnamtMatch && dtpostedMatch) {
                    const amount = parseFloat(trnamtMatch[1]);
                    const dateStr = dtpostedMatch[1]; // YYYYMMDD
                    const year = dateStr.substring(0, 4);
                    const month = dateStr.substring(4, 6);
                    const day = dateStr.substring(6, 8);
                    const parsedDate = new Date(`${year}-${month}-${day}T00:00:00`);
                    
                    const description = (nameMatch ? nameMatch[1] : (memoMatch ? memoMatch[1] : '')).trim().toUpperCase();
                    
                    transactions.push({
                        Date: `${day}/${month}/${year}`,
                        parsedDate,
                        Description: description,
                        Amount: amount
                    });
                }
            });
        }

        let closingBalance: number | null = null;
        const balMatch = text.match(/<LEDGERBAL>[\s\S]*?<BALAMT>([\-\d.]+)/i) || text.match(/<AVAILBAL>[\s\S]*?<BALAMT>([\-\d.]+)/i);
        if (balMatch) {
            const b = parseFloat(balMatch[1]);
            if (!isNaN(b)) closingBalance = b;
        }

        return { transactions, closingBalance };
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setIsParsing(true);
            setFile(selectedFile);
            setActualBalance('');
            
            if (selectedFile.name.toLowerCase().endsWith('.ofx')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const text = event.target?.result as string;
                    const { transactions, closingBalance } = parseOFX(text);
                    setParsedTransactions(transactions);

                    if (closingBalance !== null) {
                        setActualBalance(closingBalance.toFixed(2));
                    }
                    
                    if (transactions.length > 0) {
                        const dates = transactions.map(tx => tx.parsedDate.getTime());
                        const minDate = new Date(Math.min(...dates));
                        const maxDate = new Date(Math.max(...dates));

                        if (lastImportDate) {
                            const dayAfter = addDays(lastImportDate, 1);
                            setStartDate(format(dayAfter, 'yyyy-MM-dd'));
                        } else {
                            setStartDate(format(minDate, 'yyyy-MM-dd'));
                        }
                        setEndDate(format(maxDate, 'yyyy-MM-dd'));
                    }
                    setIsParsing(false);
                };
                reader.readAsText(selectedFile);
            } else {
                Papa.parse(selectedFile, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const data = results.data as any[];
                        let extractedClosingBal: number | null = null;

                        const transactions = data.map(row => {
                            const normalizedRow: any = {};
                            Object.keys(row).forEach(k => normalizedRow[k.toLowerCase().trim()] = row[k]);
                            
                            let parsedDate = parse(normalizedRow.date || '', 'dd/MM/yyyy', new Date());
                            if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() < 100) {
                                parsedDate = parse(normalizedRow.date || '', 'dd/MM/yy', new Date());
                            }
                            if (isNaN(parsedDate.getTime())) parsedDate = new Date(normalizedRow.date || '');

                            const rawBal = normalizedRow.balance ?? normalizedRow['bank balance'] ?? normalizedRow['closing balance'] ?? normalizedRow['running balance'];
                            let rowBalance: number | null = null;
                            if (rawBal !== undefined && rawBal !== '') {
                                const parsedBal = parseFloat(String(rawBal).replace(/[^\d.-]/g, ''));
                                if (!isNaN(parsedBal)) rowBalance = parsedBal;
                            }

                            return {
                                Date: normalizedRow.date || '',
                                parsedDate: isNaN(parsedDate.getTime()) ? null : parsedDate,
                                Description: (normalizedRow.description || normalizedRow.desc || '').toUpperCase(),
                                Amount: parseFloat(String(normalizedRow.amount || '').replace(/[^\d.-]/g, '')),
                                rowBalance
                            };
                        }).filter(tx => tx.Date && tx.Description && !isNaN(tx.Amount));

                        // Find chronological closing balance from last transaction row
                        const withDates = [...transactions].filter(t => t.parsedDate && !isNaN(t.parsedDate.getTime()));
                        withDates.sort((a, b) => a.parsedDate!.getTime() - b.parsedDate!.getTime());
                        for (let i = withDates.length - 1; i >= 0; i--) {
                            if (withDates[i].rowBalance !== null && withDates[i].rowBalance !== undefined) {
                                extractedClosingBal = withDates[i].rowBalance;
                                break;
                            }
                        }

                        if (extractedClosingBal !== null) {
                            setActualBalance(extractedClosingBal.toFixed(2));
                        }
                        
                        setParsedTransactions(transactions);
                        
                        if (transactions.length > 0) {
                            const validDates = transactions.map(tx => tx.parsedDate?.getTime()).filter(Boolean) as number[];
                            if (validDates.length > 0) {
                                const minDate = new Date(Math.min(...validDates));
                                const maxDate = new Date(Math.max(...validDates));

                                if (lastImportDate) {
                                    const dayAfter = addDays(lastImportDate, 1);
                                    setStartDate(format(dayAfter, 'yyyy-MM-dd'));
                                } else {
                                    setStartDate(format(minDate, 'yyyy-MM-dd'));
                                }
                                setEndDate(format(maxDate, 'yyyy-MM-dd'));
                            }
                        }
                        setIsParsing(false);
                    }
                });
            }
        }
    };
    const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

    const handleImport = async () => {
        if (!client?.uid || !bankAccountId || filteredTransactions.length === 0) return;
        setIsUploading(true);
        setUploadProgress({ done: 0, total: filteredTransactions.length });
        try {
            const clientRules = [...(client.allocationRules || [])];
            let masterRules = client.disableGlobalRules ? [] : [...MASTER_ALLOCATION_RULES];
            if (!client.disableGlobalRules) {
                try {
                    const rulesQuery = collection(db, "allocationRules");
                    const rulesSnap = await getDocs(rulesQuery);
                    const globalRules = rulesSnap.docs.map(d => ({ ...d.data(), id: d.id } as any));
                    const existingIds = new Set(masterRules.map(r => r.id));
                    for (const gr of globalRules) {
                        if (!existingIds.has(gr.id)) {
                            masterRules.push(gr);
                        }
                    }
                } catch (e) {
                    console.warn("Could not fetch additional firestore allocation rules", e);
                }
            }

            // Fetch historical reviewed/allocated transactions for past history memory consistency lookup
            let historicalTransactions: ImportedTransaction[] = [];
            try {
                const txQuery = query(
                    collection(db, 'aiAccountantClients', client.uid!, 'transactions'),
                    where('status', 'in', ['reviewed', 'allocated'])
                );
                const txSnap = await getDocs(txQuery);
                historicalTransactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() } as ImportedTransaction));
            } catch (e) {
                console.warn("Could not fetch historical transactions for triage history memory", e);
            }
            const historyConsistencyMap = buildConsistencyMap(historicalTransactions);

            const triageCtx: TriageContext = {
                clientRules,
                masterRules,
                disableGlobalRules: client.disableGlobalRules ?? false,
                chartOfAccounts: client.chartOfAccounts || [],
                historicalTransactions,
                historyConsistencyMap,
                isVatRegistered: client.isVatRegistered ?? true,
            };

            const targetClientId = client.id || client.uid!;
            // Build all transaction documents first (synchronously, fast)
            const allTxDocs: { ref: any; data: any }[] = [];
            let matchCount = 0;

            for (const row of filteredTransactions) {
                let parsedDate = parse(row.Date, 'dd/MM/yyyy', new Date());
                
                if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() < 100) {
                    parsedDate = parse(row.Date, 'dd/MM/yy', new Date());
                }
                if (isNaN(parsedDate.getTime())) parsedDate = new Date(row.Date);
                if (isNaN(parsedDate.getTime())) continue;

                const description = row.Description || '';
                const isExpense = row.Amount < 0;

                const triage = triageTransaction(
                    {
                        description,
                        amount: row.Amount,
                        isExpense,
                        date: parsedDate.toISOString(),
                    },
                    triageCtx
                );

                const txData: any = {
                    clientId: targetClientId,
                    date: parsedDate.toISOString(),
                    reference: `CSV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    description: description,
                    amount: row.Amount,
                    isExpense: isExpense,
                    bankAccountId: bankAccountId,
                    status: triage.status,
                    createdAt: serverTimestamp()
                };

                if (triage.rawDescription || description) txData.rawDescription = triage.rawDescription || description;
                if (triage.cleanDescription) txData.cleanDescription = triage.cleanDescription;
                if (triage.merchantKey) txData.merchantKey = triage.merchantKey;
                if (triage.paymentChannel) txData.paymentChannel = triage.paymentChannel;
                if (triage.branchLocation) txData.branchLocation = triage.branchLocation;
                if (triage.structuralClues && Object.keys(triage.structuralClues).length > 0) txData.structuralClues = triage.structuralClues;

                if (triage.isAllocated && triage.accountId) {
                    txData.accountId = triage.accountId;
                    txData.allocatedTo = {
                        value: triage.accountId,
                        type: triage.accountType || 'account'
                    };
                    txData.vatType = triage.vatType || (client.isVatRegistered ? 'standard_rated_purchases' : 'no_vat');
                    txData.allocatedAt = serverTimestamp();
                    txData.allocationSource = triage.source === 'history' ? 'history' : 'rule';
                    
                    if (triage.matchedRuleId) txData.matchedRuleId = triage.matchedRuleId;
                    if (triage.matchedRuleDescription) txData.matchedRuleDescription = triage.matchedRuleDescription;
                    if (triage.matchedKeyword) txData.matchedKeyword = triage.matchedKeyword;
                    
                    matchCount++;
                }

                // Deeply strip any undefined values to strictly ensure WriteBatch compatibility
                const cleanTxData = sanitizeFirestoreData(txData);

                const newRef = doc(collection(db, 'aiAccountantClients', targetClientId, 'transactions'));
                allTxDocs.push({ ref: newRef, data: cleanTxData });
            }

            // Commit in chunks of 450 (safely under Firestore's 500-write limit)
            const CHUNK_SIZE = 450;
            for (let i = 0; i < allTxDocs.length; i += CHUNK_SIZE) {
                const chunk = allTxDocs.slice(i, i + CHUNK_SIZE);
                const batch = writeBatch(db);
                for (const item of chunk) {
                    batch.set(item.ref, sanitizeFirestoreData(item.data));
                }
                await batch.commit();
                setUploadProgress({ done: Math.min(i + CHUNK_SIZE, allTxDocs.length), total: allTxDocs.length });
                // Yield to keep the UI responsive between chunks
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            // Update client's chartOfAccounts with new bankBalance and lastImportDate
            const finalBankBalance = parseFloat(actualBalance);
            if (!isNaN(finalBankBalance)) {
                try {
                    const targetClientId = client.id || client.uid;
                    if (targetClientId) {
                        const clientRef = doc(db, 'aiAccountantClients', targetClientId);
                        const currentCOA = client.chartOfAccounts || [];
                        const updatedAccounts = currentCOA.map(acc => {
                            if (acc.id === bankAccountId) {
                                return {
                                    ...acc,
                                    bankBalance: finalBankBalance,
                                    lastImportDate: endDate || format(new Date(), 'yyyy-MM-dd')
                                };
                            }
                            return acc;
                        });
                        await updateDoc(clientRef, { chartOfAccounts: updatedAccounts });
                    }
                } catch (coaErr) {
                    console.error("Error updating bank account balance in chartOfAccounts:", coaErr);
                }
            }

            toast({ 
                title: "Import Successful", 
                description: `${allTxDocs.length} transactions imported. ${matchCount} expenses auto-allocated by rules. Bank Balance updated to ${formatPrice(finalBankBalance)}.`
            });
            onImportComplete();
            setIsOpen(false);
        } catch (error) {
            console.error("Import error", error);
            toast({ title: "Import Failed", description: "An unexpected error occurred. Please check your data format.", variant: "destructive"});
        } finally {
            setIsUploading(false);
            setUploadProgress(null);
        }
    };


    return (
        <>
            {client && (
                <AIStatementImportDialog 
                    open={isAiDialogOpen}
                    onOpenChange={setIsAiDialogOpen}
                    client={client}
                    bankAccountId={bankAccountId}
                    onImportComplete={onImportComplete}
                />
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-primary text-primary-foreground hover:bg-primary/90 border-none font-bold">
                        <FileUp className="mr-2 h-4 w-4" /> Import Statement
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => setIsOpen(true)}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Standard CSV Upload
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setIsAiDialogOpen(true)}>
                        <Sparkles className="mr-2 h-4 w-4 text-primary" /> AI PDF Extraction
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader><DialogTitle>Import CSV / OFX Bank Statement</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium">Select Statement File</label>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8"
                                onClick={() => {
                                    const csvContent = "data:text/csv;charset=utf-8,Date,Description,Amount\n25/08/2023,Sample Transaction,-150.00";
                                    const encodedUri = encodeURI(csvContent);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", encodedUri);
                                    link.setAttribute("download", "bank_statement_template.csv");
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                            >
                                <Download className="h-3 w-3 mr-2" /> Template
                            </Button>
                        </div>
                        <input id="statement-file" type="file" accept=".csv,.ofx" onChange={handleFileChange} className="w-full text-sm border p-2 rounded-md" />
                        {isParsing && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 animate-spin"/> Parsing...</p>}
                        
                        {parsedTransactions.length > 0 && (
                            <div className="bg-muted/50 p-4 rounded-lg border space-y-4 animate-in fade-in slide-in-from-top-2">
                                {lastImportDate && (
                                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-primary/5 p-2.5 rounded border border-primary/20">
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <Clock className="h-3.5 w-3.5 text-primary" />
                                            Last Recorded Statement Date:
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {format(lastImportDate, 'dd/MM/yyyy')}
                                        </span>
                                    </div>
                                )}

                                {isDateGap && (
                                    <Alert variant="destructive" className="py-2.5">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle className="text-xs font-semibold">Statement Date Gap Detected</AlertTitle>
                                        <AlertDescription className="text-xs mt-0.5">
                                            This file starts on {fileMinDate ? format(fileMinDate, 'dd/MM/yyyy') : 'N/A'}, which is after the expected next day ({format(addDays(lastImportDate!, 1), 'dd/MM/yyyy')}). Please verify no intervening statements are missing.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {excludedPriorCount > 0 && (
                                    <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 p-2.5 rounded border border-amber-200 dark:border-amber-800">
                                        <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                        <span>
                                            <strong>{excludedPriorCount}</strong> earlier transaction(s) dated on or before {lastImportDate ? format(lastImportDate, 'dd/MM/yyyy') : ''} were automatically excluded from the date range to prevent duplicates.
                                        </span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Start Date (Day After Last Import)</label>
                                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">End Date</label>
                                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-8" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Transactions in Range:</span>
                                        <span className="font-bold">{filteredTransactions.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Current Balance:</span>
                                        <span className="font-semibold">{formatPrice(currentBalance)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Import Total:</span>
                                        <span className={cn("font-bold", importTotal < 0 ? "text-destructive" : "text-green-600")}>
                                            {formatPrice(importTotal)}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-sm pt-1 items-center">
                                        <span className="text-muted-foreground font-semibold">New Potential Balance:</span>
                                        <span className="font-bold text-primary text-lg">
                                            {formatPrice(potentialBalance)}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2 border-t">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-semibold">Verify Actual Bank Balance</label>
                                        <span className="text-[11px] text-muted-foreground font-medium">Auto-syncs to Bank Accounts Overview</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">Enter the closing balance from your bank statement. It must match the potential balance above to proceed.</p>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="0.00" 
                                        value={actualBalance}
                                        onChange={e => setActualBalance(e.target.value)}
                                        className={cn(actualBalance && !isValidBalance ? "border-destructive focus-visible:ring-destructive" : "")}
                                    />
                                    {actualBalance && !isValidBalance && (
                                        <p className="text-xs text-destructive flex items-center mt-1"><AlertTriangle className="h-3 w-3 mr-1" /> Balances do not match.</p>
                                    )}
                                    {isValidBalance && (
                                        <p className="text-xs text-green-600 flex items-center mt-1">
                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                            Balance verified. Bank Balance in Bank Accounts Overview will automatically update to {formatPrice(parseFloat(actualBalance))}.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex-col gap-2">
                        {uploadProgress && (
                            <div className="w-full space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Importing transactions...</span>
                                    <span>{uploadProgress.done} / {uploadProgress.total}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${Math.round((uploadProgress.done / uploadProgress.total) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                        <Button type="button" onClick={handleImport} disabled={isUploading || isParsing || filteredTransactions.length === 0 || !isValidBalance}>
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isUploading
                                ? uploadProgress
                                    ? `Importing ${uploadProgress.done} / ${uploadProgress.total}...`
                                    : 'Preparing...'
                                : `Save ${filteredTransactions.length} Transactions`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

const ruleFormSchema = z.object({
  mode: z.enum(['new', 'append']).default('new'),
  existingRuleId: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().min(2),
  accountType: z.enum(['account', 'customer', 'supplier']).default('account'),
  accountId: z.string().optional(),
  vatType: z.string().optional(),
  scope: z.enum(['global', 'client']).default('client'),
});

function CreateRuleDialog({ client, onRuleCreated, open, onOpenChange, defaultValues, existingRules, customers, suppliers }: {
    client: User | null;
    onRuleCreated: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues: Partial<z.infer<typeof ruleFormSchema>>;
    transactionDescription: string | null;
    existingRules: AllocationRule[];
    customers: ClientCustomer[];
    suppliers: Supplier[];
}) {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof ruleFormSchema>>({
        resolver: zodResolver(ruleFormSchema),
        defaultValues: { mode: 'new', scope: 'client', ...defaultValues },
    });

    const watchAccountType = form.watch('accountType');

    useEffect(() => {
        if (open) {
            form.reset({ mode: 'new', scope: 'client', ...defaultValues });
        }
    }, [open, defaultValues, form]);
    
    const handleSave = async (values: z.infer<typeof ruleFormSchema>) => {
        if (!client?.uid) return;
        const keywordsArray = values.keywords.split(',').map(k => k.trim().toUpperCase()).filter(Boolean);

        try {
            if (values.mode === 'append' && values.existingRuleId) {
                const rule = existingRules.find(r => r.id === values.existingRuleId);
                if (rule) {
                    const clientRef = doc(db, 'aiAccountantClients', client.uid);
                    const updatedRules = (client.allocationRules || []).map(r => r.id === rule.id ? { ...r, keywords: Array.from(new Set([...r.keywords, ...keywordsArray])) } : r);
                    await updateDoc(clientRef, { allocationRules: updatedRules });
                }
            } else {
                const newRule = {
                    id: `rule_${Date.now()}`,
                    description: values.description || '',
                    keywords: keywordsArray,
                    accountId: values.accountId || '',
                    accountType: values.accountType,
                    vatType: values.vatType || 'no_vat',
                    type: 'hard' as const,
                    scope: 'client' as const,
                    priority: 99,
                };
                await updateDoc(doc(db, 'aiAccountantClients', client.uid), { allocationRules: arrayUnion(newRule) });
            }

            // Sync keywords to global practice rules collection ('allocationRules')
            if (values.accountId) {
                const globalSnap = await getDocs(collection(db, 'allocationRules'));
                const globalMatch = globalSnap.docs.find(d => d.data().accountId === values.accountId);
                if (globalMatch) {
                    const existingGlobalKws = globalMatch.data().keywords || [];
                    const mergedKws = Array.from(new Set([...existingGlobalKws, ...keywordsArray]));
                    await updateDoc(doc(db, 'allocationRules', globalMatch.id), { keywords: mergedKws });
                } else {
                    const newGlobalDocRef = doc(collection(db, 'allocationRules'));
                    await setDoc(newGlobalDocRef, {
                        description: values.description || `Rule for ${keywordsArray[0] || 'Account'}`,
                        keywords: keywordsArray,
                        accountId: values.accountId,
                        vatType: values.vatType || 'no_vat',
                        type: 'hard',
                        scope: 'global',
                        priority: 99,
                        createdAt: serverTimestamp()
                    });
                }
            }

            toast({ title: 'Practice Rule Saved & Global Rules Updated' });
            onRuleCreated();
            onOpenChange(false);
        } catch(e) {
            console.error("Error saving practice rule:", e);
            toast({ title: 'Error', variant: 'destructive'});
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Create Allocation Rule</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="keywords" render={({ field }) => ( <FormItem><FormLabel>Keywords (comma-separated)</FormLabel><FormControl><Textarea {...field} className="resize-none h-20" /></FormControl><FormMessage /></FormItem> )} />
                        
                        <FormField control={form.control} name="accountType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Allocation Target</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="account">General Ledger Account</SelectItem>
                                        <SelectItem value="customer">Customer Account</SelectItem>
                                        <SelectItem value="supplier">Supplier Account</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="accountId" render={({ field }) => (
                            <FormItem><FormLabel>Select {watchAccountType === 'account' ? 'Account' : watchAccountType === 'customer' ? 'Customer' : 'Supplier'}</FormLabel>
                                <AccountSelector
                                    client={client}
                                    customers={customers}
                                    suppliers={suppliers}
                                    showAccounts={watchAccountType === 'account'}
                                    showCustomers={watchAccountType === 'customer'}
                                    showSuppliers={watchAccountType === 'supplier'}
                                    value={field.value ? { value: field.value, type: watchAccountType as "account" | "customer" | "supplier" } : null}
                                    onChange={(selection) => {
                                        field.onChange(selection.value);
                                    }}
                                    placeholder="Select target..."
                                />
                                <FormMessage />
                            </FormItem>
                        )} />
                        {client?.isVatRegistered && (
                            <FormField control={form.control} name="vatType" render={({ field }) => (
                                <FormItem><FormLabel>VAT Treatment</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select VAT type" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {allVatTypes.map(vt => (
                                                <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}
                        <DialogFooter><Button type="submit" className="w-full">Save Rule</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

const manualTransactionSchema = z.object({
  date: z.date(),
  description: z.string().min(3, "Description is required"),
  amount: z.preprocess(val => Number(val), z.number().refine(val => val !== 0, "Amount cannot be zero")),
  reference: z.string().optional(),
});

function CreateManualTransactionDialog({ client, bankAccountId, open, onOpenChange }: { 
    client: User | null, 
    bankAccountId: string, 
    open: boolean, 
    onOpenChange: (open: boolean) => void 
}) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const form = useForm<z.infer<typeof manualTransactionSchema>>({
        resolver: zodResolver(manualTransactionSchema),
        defaultValues: {
            date: new Date(),
            description: '',
            amount: 0,
            reference: '',
        },
    });

    const handleSave = async (values: z.infer<typeof manualTransactionSchema>) => {
        if (!client?.uid || !bankAccountId) return;
        setIsSaving(true);
        try {
            const isExpense = values.amount < 0;
            const description = values.description.toUpperCase();
            
            let allRules = [...(client.allocationRules || [])];
            if (!client.disableGlobalRules) {
                const rulesRef = collection(db, "allocationRules");
                const rulesSnap = await getDocs(rulesRef);
                const globalRules = rulesSnap.docs.map(d => ({ ...d.data(), id: d.id } as AllocationRule));
                allRules = [...allRules, ...globalRules];
            }
            allRules.sort((a, b) => (a.priority || 99) - (b.priority || 99));
            
            const match = isExpense ? allRules.find(r => r.keywords.some(kw => matchesRuleKeyword(description, kw))) : null;

            const txData: any = {
                clientId: client.uid,
                date: values.date.toISOString(),
                reference: values.reference || `MANUAL-${Date.now()}`,
                description: description,
                rawDescription: description,
                cleanDescription: description,
                amount: values.amount,
                isExpense: isExpense,
                bankAccountId: bankAccountId,
                status: (isExpense && match) ? 'reviewed' : 'new',
                createdAt: serverTimestamp(),
            };

            if (isExpense && match) {
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
                txData.allocatedTo = { value: targetAccountId, type: targetAccountType };
                txData.vatType = client.isVatRegistered ? match.vatType : 'no_vat';
                txData.allocatedAt = serverTimestamp();
                txData.allocationSource = 'rule';
                txData.matchedRuleId = match.id;
                txData.matchedRuleDescription = match.description;
                txData.matchedKeyword = keyword;
            }

            await addDoc(collection(db, 'aiAccountantClients', client.uid, 'transactions'), txData);
            
            toast({ title: 'Transaction Created', description: 'The transaction has been added to the queue.' });
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to create transaction.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Manual Transaction</DialogTitle>
                    <DialogDescription>Enter the details for a single bank entry.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                        <FormField control={form.control} name="date" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g. OFFICE RENT" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="amount" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount (Negative for Expense)</FormLabel>
                                <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                                <FormDescription>Use a negative sign (-) for payments/expenses.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="reference" render={({ field }) => (
                            <FormItem><FormLabel>Reference (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Transaction
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function EditTransactionDialog({ client, transaction, open, onOpenChange }: { 
    client: User | null, 
    transaction: ImportedTransaction | null, 
    open: boolean, 
    onOpenChange: (open: boolean) => void 
}) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const form = useForm<z.infer<typeof manualTransactionSchema>>({
        resolver: zodResolver(manualTransactionSchema),
        defaultValues: {
            date: new Date(),
            description: '',
            amount: 0,
            reference: '',
        },
    });

    useEffect(() => {
        if (transaction) {
            form.reset({
                date: new Date(transaction.date),
                description: transaction.description || '',
                amount: transaction.amount || 0,
                reference: transaction.reference || '',
            });
        }
    }, [transaction, form, open]);

    const handleSave = async (values: z.infer<typeof manualTransactionSchema>) => {
        if (!client?.uid || !transaction?.id) return;
        setIsSaving(true);
        try {
            const isExpense = values.amount < 0;
            const description = values.description.toUpperCase();
            
            let allRules = [...(client.allocationRules || [])];
            if (!client.disableGlobalRules) {
                const rulesRef = collection(db, "allocationRules");
                const rulesSnap = await getDocs(rulesRef);
                const globalRules = rulesSnap.docs.map(d => ({ ...d.data(), id: d.id } as AllocationRule));
                allRules = [...allRules, ...globalRules];
            }
            allRules.sort((a, b) => (a.priority || 99) - (b.priority || 99));
            
            const match = isExpense ? allRules.find(r => r.keywords.some(kw => matchesRuleKeyword(description, kw))) : null;

            const txRef = doc(db, 'aiAccountantClients', client.uid, 'transactions', transaction.id);
            const txData: any = {
                date: values.date.toISOString(),
                reference: values.reference || '',
                description: description,
                rawDescription: description,
                cleanDescription: description,
                amount: values.amount,
                isExpense: isExpense,
            };

            if (isExpense && match) {
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
                txData.status = 'reviewed';
                txData.allocatedTo = { value: targetAccountId, type: targetAccountType };
                txData.vatType = client.isVatRegistered ? match.vatType : 'no_vat';
                txData.allocatedAt = serverTimestamp();
                txData.allocationSource = 'rule';
                txData.matchedRuleId = match.id;
                txData.matchedRuleDescription = match.description;
                txData.matchedKeyword = keyword;
            } else {
                if (transaction.allocationSource === 'rule') {
                    txData.status = 'new';
                    txData.allocatedTo = deleteField();
                    txData.vatType = deleteField();
                    txData.allocatedAt = deleteField();
                    txData.allocationSource = deleteField();
                    txData.matchedRuleId = deleteField();
                    txData.matchedRuleDescription = deleteField();
                    txData.matchedKeyword = deleteField();
                }
            }

            await updateDoc(txRef, txData);
            
            toast({ title: 'Transaction Updated', description: 'The transaction has been successfully updated.' });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to update transaction.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Transaction</DialogTitle>
                    <DialogDescription>Update the details of this bank entry.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                        <FormField control={form.control} name="date" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g. OFFICE RENT" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="amount" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount (Negative for Expense)</FormLabel>
                                <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                                <FormDescription>Use a negative sign (-) for payments/expenses.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="reference" render={({ field }) => (
                            <FormItem><FormLabel>Reference (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Transaction
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function CreateGeneralAccountDialog({ client, onAccountCreated, open, onOpenChange }: { client: User | null; onAccountCreated: () => void; open: boolean; onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const form = useForm({
        resolver: zodResolver(z.object({
            accountNumber: z.string().min(1),
            description: z.string().min(3),
            section: z.enum(['Income Statement', 'Balance Sheet']),
        })),
        defaultValues: { accountNumber: '', description: '', section: 'Income Statement' as const },
    });

    const handleCreateAccount = async (values: any) => {
        if (!client?.uid) return;
        setIsSaving(true);
        try {
            const clientRef = doc(db, 'aiAccountantClients', client.uid);
            await updateDoc(clientRef, { chartOfAccounts: arrayUnion({ ...values, id: values.accountNumber }) });
            toast({ title: 'Account Created' });
            onAccountCreated();
            onOpenChange(false);
        } catch (error) {
            toast({ title: 'Error', description: 'Could not create account.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>Create New Ledger Account</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreateAccount)} className="space-y-4">
                        <FormField control={form.control} name="accountNumber" render={({ field }) => ( <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="section" render={({ field }) => ( <FormItem><FormLabel>Section</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Income Statement">Income Statement</SelectItem><SelectItem value="Balance Sheet">Balance Sheet</SelectItem></SelectContent></Select></FormItem>)} />
                        <DialogFooter><Button type="submit" disabled={isSaving}>Create Account</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function SplitTransactionDialog({ 
    client, 
    transaction, 
    open, 
    onOpenChange, 
    onSplitComplete,
    customers,
    suppliers
}: { 
    client: User | null; 
    transaction: ImportedTransaction | null; 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    onSplitComplete: () => void;
    customers: ClientCustomer[];
    suppliers: Supplier[];
}) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    interface SplitRow {
        amount: string;
        allocatedTo: { value: string, type: 'account' | 'supplier' | 'customer' } | null;
        vatType: string;
    }

    const [rows, setRows] = useState<SplitRow[]>([
        { amount: '', allocatedTo: null, vatType: 'no_vat' },
        { amount: '', allocatedTo: null, vatType: 'no_vat' }
    ]);

    useEffect(() => {
        if (open && transaction) {
            setRows([
                { amount: '', allocatedTo: null, vatType: transaction.isExpense ? 'standard_rated_purchases' : 'standard_rated_sales' },
                { amount: '', allocatedTo: null, vatType: transaction.isExpense ? 'standard_rated_purchases' : 'standard_rated_sales' }
            ]);
        }
    }, [open, transaction]);

    const uniqueChartOfAccounts = React.useMemo(() => {
        const coa = [...(client?.chartOfAccounts || [])];
        const unique = Array.from(new Map(coa.map(a => [a.accountNumber, a])).values());
        return unique.sort((a, b) => a.description.toLowerCase().localeCompare(b.description.toLowerCase()));
    }, [client]);

    const getAllocationName = React.useCallback((allocation: { value: string, type: 'account' | 'supplier' | 'customer' }) => {
        if (allocation.type === 'customer') {
            return customers.find(c => c.id === allocation.value)?.name || 'Selected Customer';
        }
        if (allocation.type === 'supplier') {
            return suppliers.find(s => s.id === allocation.value)?.name || 'Selected Supplier';
        }
        return uniqueChartOfAccounts.find(a => a.id === allocation.value)?.description || 'Selected Account';
    }, [uniqueChartOfAccounts, customers, suppliers]);

    if (!transaction) return null;

    const originalAbs = Math.abs(transaction.amount);
    const currentSum = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const diff = Math.round(originalAbs * 100) - Math.round(currentSum * 100);
    const remaining = diff / 100;
    const isBalanced = diff === 0;

    const handleAddRow = () => {
        setRows([...rows, { amount: '', allocatedTo: null, vatType: transaction.isExpense ? 'standard_rated_purchases' : 'standard_rated_sales' }]);
    };

    const handleRemoveRow = (index: number) => {
        if (rows.length <= 2) return;
        const newRows = [...rows];
        newRows.splice(index, 1);
        setRows(newRows);
    };

    const handleRowChange = (index: number, field: keyof SplitRow, value: any) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const isValid = isBalanced && rows.every(r => {
        const amt = parseFloat(r.amount);
        return !isNaN(amt) && amt > 0 && r.allocatedTo && r.allocatedTo.value;
    });

    const handleSaveSplits = async () => {
        if (!client?.uid || !transaction) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            const txCollection = collection(db, 'aiAccountantClients', client.uid, 'transactions');
            
            // Delete original
            batch.delete(doc(txCollection, transaction.id));
            
            // Create splits
            const sign = transaction.isExpense ? -1 : 1;
            rows.forEach((row, index) => {
                const amtVal = parseFloat(row.amount);
                const subAmount = amtVal * sign;
                const subRef = transaction.reference ? `${transaction.reference}-S${index + 1}` : `CSV-${Date.now()}-S${index + 1}`;
                const subDescription = `${transaction.description} (Split ${index + 1}/${rows.length})`;
                
                const subTxData = {
                    clientId: client.uid,
                    bankAccountId: transaction.bankAccountId,
                    date: transaction.date,
                    description: subDescription,
                    amount: subAmount,
                    status: 'reviewed',
                    isExpense: transaction.isExpense,
                    allocatedTo: {
                        value: row.allocatedTo!.value,
                        type: row.allocatedTo!.type
                    },
                    vatType: client.isVatRegistered ? row.vatType : 'no_vat',
                    reference: subRef,
                    allocatedAt: serverTimestamp(),
                    allocationSource: 'manual',
                    splitFrom: transaction.id,
                    isSplitChild: true,
                    parentTxData: {
                        id: transaction.id,
                        amount: transaction.amount,
                        description: transaction.description,
                        date: transaction.date,
                        reference: transaction.reference || '',
                        bankAccountId: transaction.bankAccountId,
                        isExpense: transaction.isExpense,
                        status: transaction.status,
                        ...(transaction.cleanDescription ? { cleanDescription: transaction.cleanDescription } : {}),
                        ...(transaction.rawDescription ? { rawDescription: transaction.rawDescription } : {}),
                        ...(transaction.merchantKey ? { merchantKey: transaction.merchantKey } : {})
                    }
                };
                
                const newDocRef = doc(txCollection);
                batch.set(newDocRef, sanitizeFirestoreData(subTxData));
            });
            
            await batch.commit();
            toast({ title: 'Transaction Split Successfully', description: `${rows.length} sub-transactions created.` });
            onSplitComplete();
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving splits:", error);
            toast({ title: 'Error Saving Splits', description: 'Failed to split the transaction.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
                <DialogHeader className="pb-4">
                    <DialogTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        Split Transaction Allocation
                    </DialogTitle>
                    <DialogDescription>
                        Split the transaction amount of <strong>{formatPrice(originalAbs)}</strong> into multiple allocations.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted/30 p-3 rounded-lg border text-sm space-y-1 mb-4 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Original Transaction</p>
                        <p className="font-semibold text-foreground mt-0.5">{transaction.description}</p>
                        {transaction.reference && <p className="text-[10px] text-muted-foreground font-mono">Ref: {transaction.reference}</p>}
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Original Amount</p>
                        <p className="text-lg font-mono font-bold text-foreground mt-0.5">{formatPrice(originalAbs)}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[300px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-40">Amount</TableHead>
                                <TableHead>Allocation Target</TableHead>
                                {client?.isVatRegistered && <TableHead className="w-56">VAT Type</TableHead>}
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row, index) => (
                                <TableRow key={index} className="align-middle">
                                    <TableCell className="align-middle">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={row.amount}
                                            onChange={(e) => handleRowChange(index, 'amount', e.target.value)}
                                            className="font-mono text-sm h-9"
                                        />
                                    </TableCell>
                                    <TableCell className="align-middle">
                                        <AccountSelector
                                            client={client}
                                            customers={customers}
                                            suppliers={suppliers}
                                            showAccounts={true}
                                            showCustomers={true}
                                            showSuppliers={true}
                                            value={row.allocatedTo}
                                            size="sm"
                                            placeholder="Select account, supplier, customer..."
                                            onChange={(sel) => handleRowChange(index, 'allocatedTo', sel)}
                                        />
                                    </TableCell>
                                    {client?.isVatRegistered && (
                                        <TableCell className="align-middle">
                                            <Select
                                                value={row.vatType}
                                                onValueChange={(v) => handleRowChange(index, 'vatType', v)}
                                            >
                                                <SelectTrigger className="h-9 text-[10px] w-full"><SelectValue placeholder="Select VAT..." /></SelectTrigger>
                                                <SelectContent>
                                                    {allVatTypes.map(vt => <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    )}
                                    <TableCell className="align-middle text-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveRow(index)}
                                            disabled={rows.length <= 2}
                                            className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Button variant="outline" size="sm" onClick={handleAddRow} className="mt-2 font-semibold">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Split Allocation
                    </Button>
                </div>

                <div className="mt-6 pt-4 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-wrap gap-4 text-sm font-medium">
                        <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Split Total:</span>
                            <span className="font-mono font-bold text-foreground">{formatPrice(currentSum)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Remaining:</span>
                            <span className={cn("font-mono font-bold", isBalanced ? "text-green-600" : "text-destructive")}>
                                {isBalanced ? (
                                    <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4"/> Balanced</span>
                                ) : (
                                    <span>{formatPrice(remaining)}</span>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="w-full md:w-auto">
                            Cancel
                        </Button>
                        <Button onClick={handleSaveSplits} disabled={!isValid || isSaving} className="w-full md:w-auto font-bold">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Split Allocations
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// #endregion

function renderClueIcon(type: ClueType) {
    switch (type) {
        case 'timing':
            return <Clock className="h-3 w-3 shrink-0" />;
        case 'amount':
            return <Percent className="h-3 w-3 shrink-0" />;
        case 'prefix':
            return <Layers className="h-3 w-3 shrink-0" />;
        case 'reference':
            return <ShieldAlert className="h-3 w-3 shrink-0" />;
        case 'cross_ref':
            return <History className="h-3 w-3 shrink-0" />;
        case 'sweep':
            return <ArrowLeftRight className="h-3 w-3 shrink-0" />;
        case 'structure':
            return <CheckCheck className="h-3 w-3 shrink-0" />;
        case 'web':
            return <Globe className="h-3 w-3 shrink-0" />;
        default:
            return <Sparkles className="h-3 w-3 shrink-0" />;
    }
}

function getClueBadgeStyle(type: ClueType) {
    switch (type) {
        case 'timing':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'amount':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'prefix':
            return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'reference':
            return 'bg-red-50 text-red-700 border-red-200';
        case 'cross_ref':
            return 'bg-teal-50 text-teal-700 border-teal-200';
        case 'sweep':
            return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'structure':
            return 'bg-sky-50 text-sky-700 border-sky-200';
        case 'web':
            return 'bg-green-50 text-green-700 border-green-200';
        default:
            return 'bg-slate-50 text-slate-700 border-slate-200';
    }
}

interface SmartMatchResult {
    groupId: string;
    groupKey: string;
    description: string;
    transactionCount: number;
    totalAmount: number;
    transactionIds: string[];
    merchantName: string;
    merchantCategory: string;
    suggestedAccountId: string;
    suggestedAccountLabel: string;
    vatType: VatType;
    confidence: number;
    suggestedKeyword: string;
    existingRule?: AllocationRule;
    badges: ClueBadge[];
    ruleScoping: 'client' | 'global_practice';
    isAutoAllocatable: boolean;
    status: 'reviewed' | 'ai_review';
}

interface SmartMatchQueueModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedTransactions: ImportedTransaction[];
    client: User;
    globalRules?: AllocationRule[];
    onRulesSaved: () => void;
}

function SmartMatchQueueModal({
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
    const isAbortedRef = React.useRef(false);
    const isMatchingRef = React.useRef(false);
    const sessionKeyRef = React.useRef<string | null>(null);
    const selectedTransactionsRef = React.useRef(selectedTransactions);
    const clientRef = React.useRef(client);
    const globalRulesRef = React.useRef(globalRules);

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
    }, []);

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

interface NewTransactionsTabProps {
  client: User;
  bankAccountId: string;
  globalRules: AllocationRule[];
  onAccountCreated: () => void;
  setActiveTab: (tab: string) => void;
  currentBalance: number;
  customers: ClientCustomer[];
  suppliers: Supplier[];
}

const NewTransactionsTab = React.forwardRef<any, NewTransactionsTabProps>(({ client, bankAccountId, globalRules, onAccountCreated, setActiveTab, currentBalance, customers, suppliers }, ref) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeSubTab, setActiveSubTab] = useState<'expenses' | 'income'>('expenses');
    const [allTransactions, setAllTransactions] = useState<ImportedTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [allocations, setAllocations] = useState<any>({});
    const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 250);
        return () => clearTimeout(handler);
    }, [searchTerm]);

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

    // Helper to get display name for an allocated target
    const getAllocationName = useCallback((allocation?: { value: string, type: 'account' | 'customer' | 'supplier' }) => {
        if (!allocation) return 'Select Account...';
        if (allocation.type === 'customer') {
            return customers.find((c: ClientCustomer) => c.id === allocation.value)?.name || 'Selected Customer';
        }
        if (allocation.type === 'supplier') {
            return suppliers.find((s: Supplier) => s.id === allocation.value)?.name || 'Selected Supplier';
        }
        return client?.chartOfAccounts?.find((a: ChartOfAccount) => a.id === allocation.value)?.description || 'Selected Account';
    }, [client?.chartOfAccounts, customers, suppliers]);

    // REAL-TIME LISTENER FOR THE ENTIRE WORK QUEUE FOR THIS ACCOUNT
    useEffect(() => {
        if (!client?.uid || !bankAccountId) return;
        setIsLoading(true);
        
        const q = query(
            collection(db, 'aiAccountantClients', client.uid, 'transactions'), 
            where('bankAccountId', '==', bankAccountId),
            where('status', 'in', ['new', 'ai_processing', 'ai_review'])
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
                tx.description.toUpperCase().includes(term) || 
                tx.cleanDescription?.toUpperCase().includes(term) ||
                tx.merchantKey?.toUpperCase().includes(term) ||
                tx.reference?.toUpperCase().includes(term)
            );
        }

        // 3. Ultra-fast Sorting using precomputed primitives
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

    const handleBulkDelete = async () => {
        if (!client?.uid || selectedTransactions.length === 0) return;
        try {
            const batch = writeBatch(db);
            selectedTransactions.forEach(id => batch.delete(doc(db, 'aiAccountantClients', client.uid!, 'transactions', id)));
            await batch.commit();
            toast({ title: 'Deleted', description: `${selectedTransactions.length} transactions removed.` });
            setSelectedTransactions([]);
        } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
    };

    const handleDeleteTransaction = async (txId: string) => {
        if (!client?.uid) return;
        try {
            await deleteDoc(doc(db, 'aiAccountantClients', client.uid, 'transactions', txId));
            toast({ title: 'Deleted', description: 'Transaction removed.' });
        } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
    };

    const commitBatchedUpdates = async <T,>(items: T[], updateFn: (batch: any, item: T) => void, maxChunk = 400) => {
        for (let i = 0; i < items.length; i += maxChunk) {
            const chunk = items.slice(i, i + maxChunk);
            const batch = writeBatch(db);
            chunk.forEach(item => updateFn(batch, item));
            await batch.commit();
        }
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
        } catch (e: any) { toast({ title: 'Error Allocating', description: e?.message || 'Failed to allocate transactions', variant: 'destructive' }); }
    };

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
                where('status', 'in', ['new', 'ai_review']),
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
                
                // Automatically iteratively consolidate merchant groups until convergence
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
            const res = await researchMerchantWithAi({ idToken: await getIdToken(),
                clientId: client.uid,
                transactionIds: [tx.id],
                description: tx.description,
                chartOfAccounts: JSON.stringify(client.chartOfAccounts || []),
                isVatRegistered: !!client.isVatRegistered,
                isExpense: tx.isExpense
            });
            setAiSuggestion(res);
            setIsAiReviewOpen(true);
        } catch (e) { toast({ title: "Analysis Failed", variant: "destructive" }); } finally { setIsAiResearching(null); }
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
            <CreateManualTransactionDialog client={client} bankAccountId={bankAccountId} open={isManualTxOpen} onOpenChange={setIsManualTxOpen} />
            <EditTransactionDialog client={client} transaction={transactionToEdit} open={isEditTxOpen} onOpenChange={setIsEditTxOpen} />
            <CreateRuleDialog client={client} onRuleCreated={() => {}} open={isCreateRuleOpen} onOpenChange={setIsCreateOpen} defaultValues={ruleDefaultValues} transactionDescription={transactionDescriptionForRule} existingRules={globalRules} customers={customers} suppliers={suppliers} />
            <CreateGeneralAccountDialog client={client} onAccountCreated={onAccountCreated} open={isCreateGeneralAccountOpen} onOpenChange={setIsCreateGeneralAccountOpen} />
            <AIAllocationReviewDialog open={isAiReviewOpen} onOpenChange={setIsAiReviewOpen} suggestion={aiSuggestion} transaction={selectedTxForAi} onAction={handleAiReviewAction} isVatRegistered={!!client?.isVatRegistered} />
            <SplitTransactionDialog 
                client={client} 
                transaction={splitTransaction} 
                open={isSplitDialogOpen} 
                onOpenChange={setIsSplitDialogOpen} 
                onSplitComplete={() => {}} 
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
                                onImportComplete={() => { onAccountCreated(); }} 
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
                                <TableRow key={tx.id}>
                                    <TableCell><Checkbox checked={selectedTransactions.includes(tx.id)} onCheckedChange={(checked) => setSelectedTransactions(prev => checked ? [...prev, tx.id] : prev.filter(id => id !== tx.id))} /></TableCell>
                                    <TableCell>{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{tx.cleanDescription || tx.description}</span>
                                            {tx.cleanDescription && <span className="text-[9px] text-muted-foreground italic">Raw: {tx.description}</span>}
                                            {tx.merchantKey && <Badge variant="secondary" className="w-fit mt-1 text-[9px] font-bold">{tx.merchantKey}</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs opacity-70">{tx.reference}</TableCell>
                                    <TableCell>
                                        <AccountSelector
                                            client={client}
                                            customers={customers}
                                            suppliers={suppliers}
                                            showAccounts={true}
                                            showCustomers={true}
                                            showSuppliers={true}
                                            value={allocations[tx.id]}
                                            size="sm"
                                            placeholder="Select account..."
                                            onChange={(sel) => setAllocations((p: any) => ({
                                                ...p,
                                                [tx.id]: {
                                                    value: sel.value,
                                                    type: sel.type,
                                                    vatType: sel.type === 'account' ? (p[tx.id]?.vatType || tx.vatType || 'no_vat') : 'no_vat'
                                                }
                                            }))}
                                        />
                                    </TableCell>
                                    {client?.isVatRegistered && (
                                        <TableCell>
                                            <Select 
                                                value={allocations[tx.id]?.vatType || tx.vatType || ""} 
                                                onValueChange={(v) => setAllocations((p: any) => ({
                                                    ...p, 
                                                    [tx.id]: { 
                                                        ...(p[tx.id] || { value: '', type: 'account' }), 
                                                        vatType: v 
                                                    }
                                                }))}
                                            >
                                                <SelectTrigger className="h-8 text-[10px] w-full min-w-[120px]"><SelectValue placeholder="Select VAT..." /></SelectTrigger>
                                                <SelectContent>
                                                    {allVatTypes.map(vt => <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    )}
                                    <TableCell className="text-right font-mono">{formatPrice(tx.amount)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleAiResearch(tx)} disabled={isAiResearching === tx.id}>
                                                {isAiResearching === tx.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button aria-label="More actions" variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => {
                                                        setTransactionToEdit(tx);
                                                        setIsEditTxOpen(true);
                                                    }}>Edit Transaction</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => {
                                                        setSplitTransaction(tx);
                                                        setIsSplitDialogOpen(true);
                                                    }}>Split Transaction</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => {
                                                        const keyword = tx.cleanDescription?.split(/\s+/)[0] || tx.description.split(/\s+/)[0];
                                                        setTransactionDescriptionForRule(tx.description);
                                                        setRuleDefaultValues({ description: `Rule for: ${keyword}`, keywords: keyword, accountId: '', vatType: activeSubTab === 'income' ? 'standard_rated_sales' : 'no_vat' });
                                                        setIsCreateOpen(true);
                                                    }}>Create Rule</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Delete Transaction</DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This will permanently delete this transaction from the records. This action cannot be undone.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteTransaction(tx.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
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
                client={client}
                globalRules={globalRules}
                onRulesSaved={onAccountCreated}
            />
        </div>
    );
});
NewTransactionsTab.displayName = 'NewTransactionsTab';

const AIWorkflowTab = ({ client, bankAccountId, onAccountCreated }: { 
    client: User | null; 
    bankAccountId: string | null; 
    onAccountCreated: () => void;
}) => {
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
    const [isSmartMatchOpen, setIsSmartMatchOpen] = useState(false);

    const smartMatchSelectedTxs = useMemo(() => {
        if (selectedGroupKeys.length > 0) {
            return groups.filter(g => selectedGroupKeys.includes(g.merchantKey)).flatMap(g => g.transactions);
        }
        return groups.flatMap(g => g.transactions);
    }, [groups, selectedGroupKeys]);
    
    // Regroup states
    const [isRegrouping, setIsRegrouping] = useState(false);
    const [isAiRegrouping, setIsAiRegrouping] = useState(false);
    const [proposedMerges, setProposedMerges] = useState<any[]>([]);
    const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
    const [isApplyingMerges, setIsApplyingMerges] = useState(false);
    const [selectedMerges, setSelectedMerges] = useState<string[]>([]);

    const [sortBy, setSortBy] = useState<'alpha' | 'count'>('alpha');

    // REAL-TIME PROGRESS CALCULATION
    const [workflowTransactions, setWorkflowTransactions] = useState<ImportedTransaction[]>([]);

    const sortedGroups = useMemo(() => {
        const sorted = [...groups];
        if (sortBy === 'count') {
            sorted.sort((a, b) => b.transactions.length - a.transactions.length);
        } else {
            sorted.sort((a, b) => a.merchantKey.localeCompare(b.merchantKey));
        }
        return sorted;
    }, [groups, sortBy]);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 200;

    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy, groups.length]);

    const paginatedGroups = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedGroups.slice(start, start + PAGE_SIZE);
    }, [sortedGroups, currentPage]);

    const totalPages = Math.ceil(sortedGroups.length / PAGE_SIZE);
    
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

            const initialGroups: TransactionGroup[] = Object.entries(merchantGroups).map(([key, txs]) => ({
                merchantKey: key,
                transactions: txs,
                suggestion: txs[0].smartAllocationResult || null,
                status: txs[0].status === 'ai_processing' ? ('server_researching' as const) : ('ready' as const)
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
                            createRule: !g.suggestion || hasLowConfidence // Default to true if manual identified or low confidence
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

    const hasAutoConsolidatedRef = React.useRef(false);
    useEffect(() => {
        if (groups.length >= 2 && !hasAutoConsolidatedRef.current && !isRegrouping && client?.uid && bankAccountId) {
            hasAutoConsolidatedRef.current = true;
            getIdToken().then(token => {
                return autoConsolidateSmartMatchQueue({
                    idToken: token,
                    clientId: client.uid,
                    bankAccountId
                });
            }).then(res => {
                if (res && res.totalMergesApplied > 0) {
                    toast({
                        title: "Auto-Consolidated Merchant Groups",
                        description: `Consolidated ${res.originalGroupCount} groups into ${res.finalGroupCount} canonical groups across ${res.passesExecuted} passes.`
                    });
                }
            }).catch(err => {
                console.warn("Auto-consolidation on mount skipped:", err);
            });
        }
    }, [groups.length, client?.uid, bankAccountId, isRegrouping]);

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
                proposeAiRegroups({ idToken: await getIdToken(), 
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
            // Fetch fresh rules
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
            const res = await reanalyzeAndRegroupTransactions({ idToken: await getIdToken(), 
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

    const handleApproveGroup = async (group: TransactionGroup) => {
        if (!client?.uid) return;
        const settings = approvalSettings[group.merchantKey];
        if (!settings || !settings.accountId) {
            toast({ title: "Missing Allocation", description: "Please select an account before approving.", variant: "destructive" });
            return;
        }

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
            });

            if (settings.createRule) {
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
            toast({ title: "Group Approved" });
            setGroups(prev => prev.filter(g => g.merchantKey !== group.merchantKey));
        } catch (e) { toast({ title: "Approval Failed", variant: "destructive" }); }
    };

        const handleApproveReadyOnly = async () => {
        if (!client?.uid) return;
        const readyGroups = groups.filter(g => g.transactions.some(tx => tx.status === 'ready') && approvalSettings[g.merchantKey]?.accountId);
        if (readyGroups.length === 0) {
            toast({ title: "No ready allocations found." });
            return;
        }
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
            toast({ title: `Approved ${readyGroups.length} ready groups!` });
        } catch (e) { toast({ title: "Approval Failed", variant: "destructive" }); }
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

        try {
            const batch = writeBatch(db);
            const transRef = collection(db, 'aiAccountantClients', client.uid, 'transactions');
            allocatableGroups.forEach(group => {
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
                
                updateGlobalMerchantDb({
                    merchantKey: group.merchantKey,
                    accountId: settings.accountId,
                    vatType: settings.vatType || 'no_vat'
                });
            });
            await batch.commit();
            toast({ title: `Approved ${allocatableGroups.length} groups!` });
        } catch (e) { toast({ title: "Bulk Approval Failed", variant: "destructive" }); }
    }

    const handleMoveSingleTransactionToNew = async (txId: string) => {
        if (!client?.uid) return;
        setIsMovingBack(txId);
        try {
            await moveTransactionToNew({ idToken: await getIdToken(), clientId: client.uid, transactionId: txId });
            toast({ title: "Transaction Moved to Individual Group" });
        } catch (e) { toast({ title: "Failed to move", variant: "destructive" }); } finally { setIsMovingBack(null); }
    };

    const handleSplitGroupToNew = async (txIds: string[]) => {
        if (!client?.uid || !txIds.length) return;
        try {
            await bulkMoveTransactionsToNew({ idToken: await getIdToken(), clientId: client.uid, transactionIds: txIds });
            toast({ title: `Split ${txIds.length} transactions into individual merchant groups` });
            setViewingGroup(null);
        } catch (e) { toast({ title: "Failed to split group", variant: "destructive" }); }
    };

    const handleResearchWithAi = async (group: TransactionGroup) => {
        if (!client) return;
        setIsResearchingId(group.merchantKey);
        try {
            const res = await researchMerchantWithAi({ idToken: await getIdToken(),
                clientId: client.uid,
                transactionIds: group.transactions.map(t => t.id),
                description: group.transactions[0].description,
                chartOfAccounts: JSON.stringify(client.chartOfAccounts || []),
                isVatRegistered: !!client.isVatRegistered,
                isExpense: true // AI Workflow is exclusively expenses
            });
            const hasLowConfidence = res.confidence < 20;
            setApprovalSettings((prev: any) => ({
                ...prev,
                [group.merchantKey]: {
                    ...prev[group.merchantKey],
                    accountId: hasLowConfidence ? '' : res.accountId,
                    vatType: res.vatType,
                    createRule: true // Default to true if manual allocation required
                }
            }));
            toast({ title: "Research Complete" });
        } catch (error) {
            console.error("Research Failed", error);
            toast({ title: "Research Failed", variant: "destructive" });
        } finally {
            setIsResearchingId(null);
        }
    }

    const handleAnalyzeComment = async (group: TransactionGroup) => {
        const comment = groupComments[group.merchantKey];
        if (!comment || !client?.uid) {
            toast({ title: "Comment Required", description: "Please enter a client comment to analyze.", variant: "destructive" });
            return;
        }

        setIsAnalyzingComment(group.merchantKey);
        try {
            const result = await analyzeClientCommentAndSuggest({ idToken: await getIdToken(),
                clientId: client.uid,
                transactionIds: group.transactions.map(t => t.id),
                comment,
                merchantKey: group.merchantKey,
                examples: group.transactions.slice(0, 3).map(t => t.description),
                chartOfAccounts: JSON.stringify(client.chartOfAccounts || []),
                isVatRegistered: !!client.isVatRegistered
            });

            // Update UI state with the new suggestion
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

        groups.forEach(group => {
            // Header Row for Group
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

            // Individual transactions
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

        // Reference Sheet
        const valData = [['GL Accounts', 'VAT Types']];
        const accounts = client.chartOfAccounts || [];
        const maxLen = Math.max(accounts.length, allVatTypes.length);
        for(let i=0; i<maxLen; i++) {
            valData.push([
                accounts[i]?.description || '',
                allVatTypes[i]?.label || ''
            ]);
        }
        const valWs = XLSX.utils.aoa_to_sheet(valData);
        XLSX.utils.book_append_sheet(wb, ws, 'Validation');

        XLSX.writeFile(wb, `SmartMatch_Review_${client.name}.xlsx`);
    };

    if (isLoading) return <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center py-12"><Loader2 className="animate-spin" aria-hidden="true" /><span className="sr-only">Loading…</span></div>;

    const allocatedCount = groups.filter(g => approvalSettings[g.merchantKey]?.accountId).length;
    const isCurrentlyProcessing = workflowTransactions.some(tx => tx.status === 'ai_processing');

    return (
        <div className="space-y-6 p-4">
            <CreateGeneralAccountDialog client={client} onAccountCreated={() => {}} open={isCreateGeneralAccountOpen} onOpenChange={setIsCreateGeneralAccountOpen} />
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
                    <Button variant="secondary" onClick={handleAutoConsolidate} disabled={isRegrouping || groups.length < 2} className="border-2 border-primary/20 font-bold">
                        {isRegrouping ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4 text-emerald-600 fill-emerald-600" />}
                        Consolidate Groups (Convergence)
                    </Button>
                    <Button variant="outline" onClick={handleCombinedRegroup} disabled={isRegrouping || isAiRegrouping || groups.length < 2} className="border-primary/30 text-primary hover:bg-primary/5 text-xs" title="Review proposed merges">
                        <Layers className="mr-1.5 h-3.5 w-3.5" />
                        Review Proposals
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => setIsSmartMatchOpen(true)} 
                        disabled={groups.length === 0} 
                        className="font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                    >
                        <Sparkles className="mr-2 h-4 w-4 text-emerald-500" />
                        Smart Match Queue {selectedGroupKeys.length > 0 ? `(${selectedGroupKeys.length} selected)` : `(${groups.length} groups)`}
                    </Button>
                    <Button variant="outline" onClick={handleMatchHistory} disabled={isHistoryMatching || groups.length === 0} className="border-primary/30 text-primary hover:bg-primary/5">
                        {isHistoryMatching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <History className="mr-2 h-4 w-4" />}
                        Match from History
                    </Button>
                    <Button variant="outline" onClick={handleRecheckRules} disabled={isRechecking}>
                        {isRechecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RotateCcw className="mr-2 h-4 w-4" />}
                        Recheck Rules
                    </Button>
                    <Button variant="outline" onClick={handleReanalyzeAndRegroup} disabled={isReanalyzing || groups.length === 0} className="border-primary/30 text-primary hover:bg-primary/5">
                        {isReanalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RotateCw className="mr-2 h-4 w-4" />}
                        Reanalyze & Regroup
                    </Button>
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
                    
                    <Button onClick={() => handleApproveReadyOnly()} disabled={groups.filter(g => g.transactions.some(tx => tx.status === 'ready') && approvalSettings[g.merchantKey]?.accountId).length === 0} className="bg-blue-600 hover:bg-blue-700 text-white mr-2">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Ready ({groups.filter(g => g.transactions.some(tx => tx.status === 'ready') && approvalSettings[g.merchantKey]?.accountId).length})
                    </Button>
                    <Button onClick={() => handleApproveAllWithAllocations(onlySelectedGroups)} disabled={allocatedCount === 0} className="bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> {onlySelectedGroups ? `Approve Selected (${selectedGroupKeys.length})` : `Approve All with Allocations (${allocatedCount})`}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {paginatedGroups.map((group) => {
                    const firstTx = group.transactions[0];
                    const sourceLabel = firstTx.allocationSource === 'history' ? 'HISTORY MATCH' : 
                                      firstTx.allocationSource === 'rule' ? 'RULE MATCH' :
                                      firstTx.allocationSource === 'global_db' ? 'SMART DB MATCH' : null;
                    const isSelected = selectedGroupKeys.includes(group.merchantKey);
                    
                    return (
                    <Card 
                        key={group.merchantKey} 
                        className={cn(
                            "overflow-hidden border shadow-sm transition-all", 
                            group.status === 'server_researching' && "opacity-75 border-dashed"
                        )}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-12">
                            <div className="md:col-span-3 p-4 border-r border-b md:border-b-0 bg-muted/10 flex items-start gap-3 relative">
                                <div className="absolute top-2 left-2">
                                    <Checkbox 
                                        checked={isSelected}
                                        onCheckedChange={(checked) => setSelectedGroupKeys(p => checked ? [...p, group.merchantKey] : p.filter(k => k !== group.merchantKey))}
                                    />
                                </div>
                                <div className="space-y-4 flex-grow overflow-hidden ml-6">
                                    <div>
                                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider mb-1">MERCHANT</Badge>
                                        <h4 className="text-xl font-extrabold truncate uppercase leading-tight">{group.merchantKey}</h4>
                                        <Button 
                                            variant="link" 
                                            className="p-0 h-auto text-sm text-primary font-medium hover:no-underline"
                                            onClick={() => setViewingGroup(group)}
                                        >
                                            {group.transactions.length} transactions
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">EXAMPLE REFERENCE</p>
                                        <p className="text-[11px] italic text-muted-foreground leading-snug break-words font-medium">
                                            "{firstTx.description}"
                                        </p>
                                    </div>
                                    {group.status === 'server_researching' && (
                                        <div className="flex items-center gap-2 text-xs text-primary font-bold">
                                            <Loader2 className="h-3 w-3 animate-spin" /> 
                                            Identifying...
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="md:col-span-4 p-4 border-r space-y-4">
                                <div className={cn("grid gap-4", client?.isVatRegistered ? "grid-cols-2" : "grid-cols-1")}>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">ALLOCATE TO</Label>
                                        <AccountSelector 
                                            client={client}
                                            showAccounts={true}
                                            showCustomers={false}
                                            showSuppliers={false}
                                            value={approvalSettings[group.merchantKey]?.accountId || ''}
                                            onChange={(selection) => {
                                                setApprovalSettings((p: any) => ({
                                                    ...p, 
                                                    [group.merchantKey]: {
                                                        ...p[group.merchantKey], 
                                                        accountId: selection.value
                                                    }
                                                }));
                                            }}
                                            placeholder="Select account..."
                                            className="w-full h-10"
                                        />
                                    </div>
                                    {client?.isVatRegistered && (
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">VAT</Label>
                                            <Select value={approvalSettings[group.merchantKey]?.vatType || 'no_vat'} onValueChange={(v) => setApprovalSettings((p: any) => ({...p, [group.merchantKey]: {...p[group.merchantKey], vatType: v}}))}>
                                                <SelectTrigger className="h-10 text-[11px] font-bold"><SelectValue /></SelectTrigger>
                                                <SelectContent>{allVatTypes.map(vt => <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                                        <MessageSquare className="h-3 w-3" /> Client Comment
                                    </Label>
                                    <div className="relative">
                                        <Textarea 
                                            className="min-h-[100px] text-xs font-bold bg-white border-muted-foreground/20 resize-none pr-10" 
                                            placeholder="Explain what this payment was for (e.g. 'Petrol for the trucks'). Khai will use this to suggest an account." 
                                            value={groupComments[group.merchantKey] || ''}
                                            onChange={(e) => setGroupComments((p: any) => ({ ...p, [group.merchantKey]: e.target.value }))}
                                        />
                                        <div className="absolute bottom-2 right-2 flex flex-col gap-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button 
                                                            size="icon" 
                                                            variant="secondary" 
                                                            className="h-8 w-8 rounded-full shadow-sm border" 
                                                            onClick={() => handleAnalyzeComment(group)}
                                                            disabled={isAnalyzingComment === group.merchantKey || !groupComments[group.merchantKey]}
                                                        >
                                                            {isAnalyzingComment === group.merchantKey ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4 text-primary"/>}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Analyze Comment with AI</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-5 p-4 flex flex-col justify-between">
                                <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 flex-grow mb-4">
                                    <div className="mb-3 flex justify-between items-center">
                                        {group.suggestion ? (
                                            <Badge className={cn(
                                                "text-[10px] font-bold py-1 px-3 rounded-full",
                                                group.suggestion.confidence > 80 
                                                ? "bg-green-600 hover:bg-green-600 text-white" 
                                                : group.suggestion.confidence < 20
                                                ? "bg-destructive hover:bg-destructive text-white animate-pulse"
                                                : "bg-yellow-500 hover:bg-yellow-500 text-white"
                                            )}>
                                                {sourceLabel || (group.suggestion.confidence < 20 ? "No Match Found" : `${group.suggestion.confidence}% Match Confidence`)}
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-[10px] font-bold py-1 px-3 rounded-md">
                                                No Match Found
                                            </Badge>
                                        )}
                                        {(!group.suggestion || group.suggestion.confidence < 20) && (
                                            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary font-bold" onClick={() => handleResearchWithAi(group)} disabled={isResearchingId === group.merchantKey}>
                                                {isResearchingId === group.merchantKey ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : <Sparkles className="mr-1 h-3 w-3"/>}
                                                Research with AI
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-xs italic text-muted-foreground leading-relaxed">
                                        {group.suggestion ? group.suggestion.summary : "No historical matches or active rules found for this merchant. Use the 'Research with AI' button or enter a 'Client Comment' to perform a deep analysis across our knowledge bases."}
                                    </p>
                                </div>
                                
                                <div className="flex items-center justify-between mt-auto pt-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`rule-${group.merchantKey}`} 
                                            className="rounded border-muted-foreground/30 data-[state=checked]:bg-primary"
                                            checked={approvalSettings[group.merchantKey]?.createRule} 
                                            onCheckedChange={(v) => setApprovalSettings((p: any) => ({...p, [group.merchantKey]: {...p[group.merchantKey], createRule: !!v}}))} 
                                            disabled={!!sourceLabel}
                                        />
                                        <Label htmlFor={`rule-${group.merchantKey}`} className="text-xs font-bold text-muted-foreground cursor-pointer">Create Client Rule</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            className="bg-primary hover:bg-primary/90 text-white font-bold h-10 px-6 rounded-lg shadow-md" 
                                            onClick={() => handleApproveGroup(group)} 
                                            disabled={!approvalSettings[group.merchantKey]?.accountId}
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Group
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )})}
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
                        Page <strong className="text-primary">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong> ({sortedGroups.length} total groups)
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
            {client && (
                <SmartMatchQueueModal
                    open={isSmartMatchOpen}
                    onOpenChange={setIsSmartMatchOpen}
                    selectedTransactions={smartMatchSelectedTxs}
                    client={client}
                    onRulesSaved={onAccountCreated}
                />
            )}
        </div>
    );
};

const ReviewedTab = ({ client, bankAccountId, customers, suppliers, globalRules, onAccountCreated }: { 
    client: User | null; 
    bankAccountId: string | null; 
    customers: ClientCustomer[]; 
    suppliers: Supplier[];
    globalRules: AllocationRule[];
    onAccountCreated: () => void; 
}) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [activeSubTab, setActiveSubTab] = useState<'expenses' | 'income'>('expenses');
    const [selectedGlAccountId, setSelectedGlAccountId] = useState<string>("all");
    const [searchAmount, setSearchAmount] = useState("");
    const [debouncedSearchAmount, setDebouncedSearchAmount] = useState("");
    const [searchDescription, setSearchDescription] = useState("");
    const [debouncedSearchDescription, setDebouncedSearchDescription] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchDescription(searchDescription);
        }, 250);
        return () => clearTimeout(handler);
    }, [searchDescription]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchAmount(searchAmount);
        }, 250);
        return () => clearTimeout(handler);
    }, [searchAmount]);

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
        // Deduplicate locally
        const unique = Array.from(new Map(coa.map(a => [a.accountNumber, a])).values());
        return unique.sort((a, b) => a.description.toLowerCase().localeCompare(b.description.toLowerCase()));
    }, [client]);

    const allAvailableRules = useMemo(() => {
        const base = [...(client?.allocationRules || [])];
        if (client?.disableGlobalRules) return base;
        return [...base, ...globalRules];
    }, [client?.allocationRules, globalRules, client?.disableGlobalRules]);

    // O(1) Fast lookup map for allocation names instead of linear array searches
    const accountNameMap = useMemo(() => {
        const map = new Map<string, string>();
        client?.chartOfAccounts?.forEach(a => map.set(a.id, a.description));
        customers?.forEach(c => map.set(c.id, c.name));
        suppliers?.forEach(s => map.set(s.id, s.name));
        return map;
    }, [client?.chartOfAccounts, customers, suppliers]);

    const getAllocationName = useCallback((allocatedTo: any) => {
        if (!allocatedTo) return 'Unallocated';
        return accountNameMap.get(allocatedTo.value) || 'Selected Account';
    }, [accountNameMap]);

    useEffect(() => {
        if (!client?.uid || !bankAccountId) return;
        setIsLoading(true);
        const transRef = collection(db, 'aiAccountantClients', client.uid, 'transactions');
        const q = query(transRef, 
            where('bankAccountId', '==', bankAccountId), 
            where('status', 'in', ['reviewed', 'allocated']),
            where('isExpense', '==', activeSubTab === 'expenses')
        );
        
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
    }, [client?.uid, bankAccountId, activeSubTab]);

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

        // 3. Filter by searchDescription (substring match case-insensitive description, cleanDescription, merchantKey, reference)
        if (debouncedSearchDescription.trim()) {
            const term = debouncedSearchDescription.toUpperCase();
            filtered = filtered.filter(tx => 
                (tx.description || '').toUpperCase().includes(term) || 
                (tx.cleanDescription || '').toUpperCase().includes(term) ||
                (tx.merchantKey || '').toUpperCase().includes(term) ||
                (tx.reference || '').toUpperCase().includes(term)
            );
        }

        // 4. Filter by Date Range (dateRange.from and dateRange.to) using fast integer timestamps
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
            setEditedAllocations({}); // Clear any pending individual edits
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
            
            // Query all sub-transactions belonging to this split
            const q = query(txCollection, where('splitFrom', '==', tx.splitFrom));
            const snap = await getDocs(q);
            
            snap.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Recreate parent transaction
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
                                <span className="text-xs font-medium min-w-[60px] text-center">Page {currentPage}</span>
                                <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!canGoNext}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <DateRangePicker onDateChange={setDateRange} />
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
                            transactions.map(tx => {
                                const edited = editedAllocations[tx.id];
                                const currentAlloc = edited?.allocatedTo || tx.allocatedTo;
                                const currentVat = edited?.vatType || tx.vatType || "no_vat";

                                return (
                                <TableRow key={tx.id} className={cn(edited && "bg-primary/5")}>
                                    <TableCell>
                                        <Checkbox 
                                            checked={selectedTransactions.includes(tx.id)} 
                                            onCheckedChange={(checked) => setSelectedTransactions(prev => checked ? [...prev, tx.id] : prev.filter(id => id !== tx.id))} 
                                        />
                                    </TableCell>
                                    <TableCell>{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{tx.cleanDescription || tx.description}</span>
                                            {tx.cleanDescription && <span className="text-[9px] text-muted-foreground italic">Raw: {tx.description}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <AccountSelector
                                            client={client}
                                            customers={customers}
                                            suppliers={suppliers}
                                            showAccounts={true}
                                            showCustomers={true}
                                            showSuppliers={true}
                                            value={currentAlloc}
                                            size="sm"
                                            placeholder="Select account..."
                                            className={cn(edited?.allocatedTo && "border-primary")}
                                            onChange={(sel) => setEditedAllocations((p: any) => ({
                                                ...p,
                                                [tx.id]: {
                                                    ...(p[tx.id] || { vatType: tx.vatType }),
                                                    allocatedTo: { value: sel.value, type: sel.type },
                                                    vatType: sel.type === 'account' ? (p[tx.id]?.vatType || tx.vatType || 'no_vat') : 'no_vat'
                                                }
                                            }))}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {tx.allocationSource === 'rule' ? (
                                            <Badge 
                                                variant="outline" 
                                                className="text-[10px] gap-1 cursor-pointer hover:bg-muted"
                                                onClick={() => {
                                                    const rule = allAvailableRules.find(r => r.id === tx.matchedRuleId);
                                                    if (rule) setViewingRuleData({ rule, keyword: tx.matchedKeyword });
                                                }}
                                            >
                                                <BookOpen className="h-3 w-3"/> Rule
                                            </Badge>
                                        ) : tx.allocationSource === 'ai' ? (
                                            <Badge variant="secondary" className="text-[10px] gap-1"><Sparkles className="h-3 w-3"/> AI</Badge>
                                        ) : tx.allocationSource === 'history' ? (
                                            <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary"><History className="h-3 w-3"/> History</Badge>
                                        ) : tx.allocationSource === 'global_db' ? (
                                            <Badge variant="outline" className="text-[10px] gap-1 border-green-500/30 text-green-600"><RotateCcw className="h-3 w-3"/> Smart DB</Badge>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <Badge variant="secondary" className="text-[10px] opacity-70">Manual</Badge>
                                                {currentAlloc?.value && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-5 w-5 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                                    onClick={() => handleOpenCreateRulePrompt(tx, currentAlloc)}
                                                                >
                                                                    <PlusCircle className="h-3 w-3 text-primary" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Create allocation rule for future transactions</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                    {client?.isVatRegistered && (
                                        <TableCell>
                                            <Select 
                                                value={currentVat} 
                                                onValueChange={(v) => setEditedAllocations((p: any) => ({
                                                    ...p, 
                                                    [tx.id]: { 
                                                        ...(p[tx.id] || { allocatedTo: tx.allocatedTo }), 
                                                        vatType: v 
                                                    }
                                                }))}
                                            >
                                                <SelectTrigger className={cn("h-8 text-[10px] w-full min-w-[120px]", edited?.vatType && "border-primary")}><SelectValue placeholder="Select VAT..." /></SelectTrigger>
                                                <SelectContent>
                                                    {allVatTypes.map(vt => <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    )}
                                    <TableCell className="text-right font-mono">{formatPrice(tx.amount)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {edited && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => {
                                                    const newEdited = { ...editedAllocations };
                                                    delete newEdited[tx.id];
                                                    setEditedAllocations(newEdited);
                                                }}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-label="More actions" variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {currentAlloc?.value && (
                                                        <DropdownMenuItem onClick={() => handleOpenCreateRulePrompt(tx, currentAlloc)}>
                                                            <Sparkles className="h-4 w-4 mr-2 text-primary" />
                                                            Create Allocation Rule
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => {
                                                        if (tx.isSplitChild && tx.splitFrom) {
                                                            setUnsplitConfirmTx(tx);
                                                        } else {
                                                            handleResetToNew(tx.id);
                                                        }
                                                    }} className="text-destructive">
                                                        <Undo2 className="mr-2 h-4 w-4" /> Move to New
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => {
                                                        setSplitTransaction(tx);
                                                        setIsSplitDialogOpen(true);
                                                    }}>
                                                        <Layers className="mr-2 h-4 w-4" /> Split Transaction
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => {
                                                        const account = uniqueChartOfAccounts.find(a => a.id === tx.allocatedTo?.value);
                                                        if (account) {
                                                            window.location.href = `/admin/ai-accountant/${client?.uid}/reports/general-ledger?accountId=${account.id}`;
                                                        }
                                                    }}>
                                                        <ArrowRightLeft className="mr-2 h-4 w-4" /> View Ledger
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Delete Transaction</DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This will permanently delete this transaction from the records. This action cannot be undone.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteTransaction(tx.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )})}
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

export function BankTransactionsUI() {
    const params = useParams();
    const accountIdFromUrl = useSearchParams().get('accountId');
    const [client, setClient] = useState<User | null>(null);
    const [accountId, setAccountId] = useState<string | null>(accountIdFromUrl);
    const [unallocatedCount, setUnallocatedCount] = useState<number | null>(null);
    const [globalRules, setGlobalRules] = useState<AllocationRule[]>([]);
    const [activeTab, setActiveTab] = useState('new-transactions');
    const [customers, setCustomers] = useState<ClientCustomer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
    const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
    const [isClearAccountAlertOpen, setIsClearAccountAlertOpen] = useState(false);
    const [calculatedBalance, setCalculatedBalance] = useState<number>(0);
    const [isUpdateBankBalanceOpen, setIsUpdateBankBalanceOpen] = useState(false);
    const [isUpdatingBankBalance, setIsUpdatingBankBalance] = useState(false);
    const { toast } = useToast();

    const fetchClientData = useCallback(async () => {
        if (!params.clientId) return;
        const clientSnap = await getDoc(doc(db, 'aiAccountantClients', params.clientId as string));
        if (clientSnap.exists()) {
            const data = clientSnap.data() as User;
            if (data.chartOfAccounts) {
                // Deduplicate locally
                const uniqueAccounts = Array.from(new Map(data.chartOfAccounts.map(a => [a.accountNumber, a])).values());
                data.chartOfAccounts = uniqueAccounts;
            }
            setClient({ ...data, id: clientSnap.id, uid: clientSnap.id });
            const bankAccounts = data.chartOfAccounts?.filter(acc => acc.accountNumber.startsWith('8400-'));
            if(!accountId && bankAccounts?.[0]) setAccountId(bankAccounts[0].id);
        }
    }, [params.clientId, accountId]);

    const fetchGlobalRules = useCallback(async () => {
        const rulesSnap = await getDocs(collection(db, 'allocationRules'));
        setGlobalRules(rulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as AllocationRule)));
    }, []);

    const fetchCustomers = useCallback(async () => {
        if (!params.clientId) return;
        const custSnap = await getDocs(collection(db, `aiAccountantClients/${params.clientId}/customers`));
        setCustomers(custSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientCustomer)));
    }, [params.clientId]);

    const fetchSuppliers = useCallback(async () => {
        if (!params.clientId) return;
        const supSnap = await getDocs(collection(db, `aiAccountantClients/${params.clientId}/suppliers`));
        setSuppliers(supSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
    }, [params.clientId]);

    const fetchUnallocatedCount = useCallback(async () => {
        if (!params.clientId || !accountId) return;
        try {
            const transRef = collection(db, 'aiAccountantClients', params.clientId as string, 'transactions');
            const qUnallocated = query(transRef, where('bankAccountId', '==', accountId), where('status', 'in', ['new', 'ai_review', 'ai_processing']));
            const snap = await getCountFromServer(qUnallocated);
            setUnallocatedCount(snap.data().count);
        } catch (e) {
            console.error('Failed to fetch unallocated count:', e);
        }
    }, [params.clientId, accountId]);

    useEffect(() => { fetchClientData(); fetchGlobalRules(); fetchCustomers(); fetchSuppliers(); }, [fetchClientData, fetchGlobalRules, fetchCustomers, fetchSuppliers]);

    // Added Real-time Sync for Client Profile (ensures Isolated Mode is always fresh)
    useEffect(() => {
        if (!params.clientId) return;
        return onSnapshot(doc(db, 'aiAccountantClients', params.clientId as string), (snap) => {
            if (snap.exists()) {
                const data = snap.data() as User;
                if (data.chartOfAccounts) {
                    const uniqueAccounts = Array.from(new Map(data.chartOfAccounts.map(a => [a.accountNumber, a])).values());
                    data.chartOfAccounts = uniqueAccounts;
                }
                setClient(prev => prev ? { ...prev, ...data, id: snap.id, uid: snap.id } : { ...data, id: snap.id, uid: snap.id });
            }
        });
    }, [params.clientId]);
    
    useEffect(() => {
        fetchUnallocatedCount();
    }, [fetchUnallocatedCount]);

    // Real-time listener to compute true calculated balance for this bank account
    useEffect(() => {
        if (!params.clientId || !accountId) {
            setCalculatedBalance(0);
            return;
        }
        const transRef = collection(db, 'aiAccountantClients', params.clientId as string, 'transactions');
        const q = query(transRef, where('bankAccountId', '==', accountId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let total = 0;
            snapshot.docs.forEach(doc => {
                const amt = doc.data().amount;
                if (typeof amt === 'number' && !isNaN(amt)) {
                    total += amt;
                }
            });
            setCalculatedBalance(total);
        }, (err) => {
            console.error("Error computing calculated balance:", err);
        });
        return () => unsubscribe();
    }, [params.clientId, accountId]);

    const handleClearAccount = async () => {
        if (!params.clientId || !accountId) return;
        toast({ title: "Cleaning account...", description: "Please wait." });
        try {
            const transRef = collection(db, 'aiAccountantClients', params.clientId as string, 'transactions');
            const q = query(transRef, where('bankAccountId', '==', accountId));
            const snap = await getDocs(q);
            
            if (snap.empty) {
                toast({ title: "Account is already empty" });
                setIsClearAccountAlertOpen(false);
                return;
            }

            // Chunk deletions
            const docs = snap.docs;
            for (let i = 0; i < docs.length; i += 500) {
                const batch = writeBatch(db);
                const chunk = docs.slice(i, i + 500);
                chunk.forEach(d => batch.delete(d.ref));
                await batch.commit();
            }

            toast({ title: "Account Cleared", description: `Successfully deleted ${snap.size} transactions.` });
            setIsClearAccountAlertOpen(false);
        } catch (e: any) {
            console.error("Clear account error:", e);
            toast({ 
                title: "Clear Failed", 
                description: e.message || "An unexpected error occurred while deleting transactions.",
                variant: "destructive" 
            });
        }
    };

    const handleEditAccount = async (newName: string) => {
        if (!client || !accountId) return;
        try {
            const updatedCOA = (client.chartOfAccounts || []).map(acc => acc.id === accountId ? { ...acc, description: newName } : acc);
            const targetClientId = client.id || client.uid || (params.clientId as string);
            await updateDoc(doc(db, 'aiAccountantClients', targetClientId), { chartOfAccounts: updatedCOA });
            toast({ title: "Account Updated" });
            fetchClientData();
            setIsEditAccountOpen(false);
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const handleUpdateActualBankBalance = async (newBalance: number) => {
        if (!client || !accountId) return;
        setIsUpdatingBankBalance(true);
        try {
            const updatedCOA = (client.chartOfAccounts || []).map(acc => 
                acc.id === accountId ? { ...acc, bankBalance: newBalance } : acc
            );
            const targetClientId = client.id || client.uid || (params.clientId as string);
            await updateDoc(doc(db, 'aiAccountantClients', targetClientId), { chartOfAccounts: updatedCOA });
            toast({ title: "Bank Balance Updated", description: `Actual bank statement balance set to ${formatPrice(newBalance)}.` });
            fetchClientData();
            setIsUpdateBankBalanceOpen(false);
        } catch (e) {
            console.error("Error updating bank balance:", e);
            toast({ title: "Error", description: "Could not update bank balance.", variant: "destructive" });
        } finally {
            setIsUpdatingBankBalance(false);
        }
    };

    if (!client) return <div className="text-center mt-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    
    const bankAccounts = client.chartOfAccounts?.filter(acc => acc.accountNumber.startsWith('8400-')) || [];
    const selectedAccount = bankAccounts.find(a => a.id === accountId);
    
    return (
        <div className="space-y-4">
            <CreateGeneralAccountDialog client={client} onAccountCreated={fetchClientData} open={isCreateAccountOpen} onOpenChange={setIsCreateAccountOpen} />
            
            <Dialog open={isEditAccountOpen} onOpenChange={setIsEditAccountOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Bank Account Name</DialogTitle></DialogHeader>
                    <div className="py-4">
                        <Input id="new-account-name" defaultValue={selectedAccount?.description} placeholder="e.g. FNB Business Account" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditAccountOpen(false)}>Cancel</Button>
                        <Button onClick={() => {
                            const val = (document.getElementById('new-account-name') as HTMLInputElement).value;
                            handleEditAccount(val);
                        }}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isUpdateBankBalanceOpen} onOpenChange={setIsUpdateBankBalanceOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Actual Bank Balance</DialogTitle>
                        <DialogDescription>
                            Set the actual statement balance for {selectedAccount?.description} to reconcile. This automatically syncs to the Bank Accounts Overview.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="actual-bank-bal-input">Actual Bank Balance (from bank statement)</Label>
                        <Input 
                            id="actual-bank-bal-input" 
                            type="number" 
                            step="0.01" 
                            defaultValue={selectedAccount?.bankBalance !== undefined ? selectedAccount.bankBalance : ''} 
                            placeholder="0.00" 
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpdateBankBalanceOpen(false)}>Cancel</Button>
                        <Button 
                            disabled={isUpdatingBankBalance}
                            onClick={() => {
                                const input = document.getElementById('actual-bank-bal-input') as HTMLInputElement;
                                const val = parseFloat(input?.value);
                                if (!isNaN(val)) {
                                    handleUpdateActualBankBalance(val);
                                } else {
                                    toast({ title: "Invalid Amount", description: "Please enter a valid numeric balance.", variant: "destructive" });
                                }
                            }}
                        >
                            {isUpdatingBankBalance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isClearAccountAlertOpen} onOpenChange={setIsClearAccountAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all transactions for the selected bank account ({selectedAccount?.description}). This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, Clear Account</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="md:flex items-start justify-between">
                <div className="flex flex-col gap-2">
                     <AccountSelector
                        client={client}
                        showAccounts={true}
                        showCustomers={false}
                        showSuppliers={false}
                        value={accountId || ''}
                        onChange={(selection) => setAccountId(selection.value === "all" ? "" : selection.value)}
                        placeholder="Select a bank account"
                        className="w-[280px]"
                        filterAccounts={(acc) => acc.accountNumber.startsWith('8400-')}
                    />
                     <div className="flex flex-wrap items-center gap-4 text-sm mt-1">
                        <div>
                            <span className="text-muted-foreground">Calculated Balance: </span>
                            <span className="font-bold text-foreground font-mono">{formatPrice(calculatedBalance)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Actual Bank Balance: </span>
                            <span className="font-semibold font-mono text-muted-foreground">
                                {selectedAccount?.bankBalance !== undefined ? formatPrice(selectedAccount.bankBalance) : '-'}
                            </span>
                            {selectedAccount && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-1.5 text-xs text-primary hover:bg-primary/10 ml-0.5"
                                    onClick={() => setIsUpdateBankBalanceOpen(true)}
                                    title="Edit Actual Bank Statement Balance"
                                >
                                    <Pencil className="h-3 w-3 mr-1" /> Edit
                                </Button>
                            )}
                        </div>
                        {selectedAccount?.bankBalance !== undefined ? (
                            Math.abs(calculatedBalance - selectedAccount.bankBalance) < 0.01 ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold gap-1 py-0.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Reconciled
                                </Badge>
                            ) : (
                                <Badge className="bg-rose-50 text-rose-700 border-rose-300 font-semibold gap-1 py-0.5" title={`Difference: ${formatPrice(calculatedBalance - selectedAccount.bankBalance)}`}>
                                    <AlertTriangle className="h-3.5 w-3.5" /> Diff: {formatPrice(calculatedBalance - selectedAccount.bankBalance)}
                                </Badge>
                            )
                        ) : (
                            <Badge variant="outline" className="text-muted-foreground text-xs">
                                No Statement Balance
                            </Badge>
                        )}
                        <div>
                            <span className="text-muted-foreground">Unallocated: </span>
                            <span className="font-semibold">{unallocatedCount !== null ? unallocatedCount : '...'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <Button variant="outline" size="sm" onClick={() => { fetchClientData(); fetchUnallocatedCount(); }}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 border-none font-bold">
                                <Settings className="mr-2 h-4 w-4" /> Manage
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsCreateAccountOpen(true)}>Create New Bank Account</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsEditAccountOpen(true)}>Edit Selected Account</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsClearAccountAlertOpen(true)} className="text-destructive">Clear Bank Account</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="border rounded-lg mt-4">
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 rounded-t-lg rounded-b-none h-auto">
                        <TabsTrigger value="new-transactions">New Transactions</TabsTrigger>
                        <TabsTrigger value="ai-workflow">Smart Match Queue</TabsTrigger>
                        <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
                    </TabsList>
                    <TabsContent value="new-transactions" className="p-0">
                        <NewTransactionsTab client={client} bankAccountId={accountId || ''} currentBalance={calculatedBalance} globalRules={globalRules} onAccountCreated={() => { fetchClientData(); fetchUnallocatedCount(); }} setActiveTab={setActiveTab} customers={customers} suppliers={suppliers} />
                    </TabsContent>
                    <TabsContent value="ai-workflow" className="p-0">
                        <AIWorkflowTab client={client} bankAccountId={accountId || ''} onAccountCreated={fetchClientData} />
                    </TabsContent>
                    <TabsContent value="reviewed" className="p-0">
                        <ReviewedTab client={client} bankAccountId={accountId || ''} customers={customers} suppliers={suppliers} globalRules={globalRules} onAccountCreated={fetchClientData} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function GroupTransactionsDialog({ open, onOpenChange, group, onMoveToNew, onSplitGroup }: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void, 
    group: TransactionGroup | null,
    onMoveToNew: (txId: string) => Promise<void>,
    onSplitGroup: (txIds: string[]) => Promise<void>
}) {
    const [isMoving, setIsMoving] = useState<string | null>(null);
    const [isSplitting, setIsSplitting] = useState(false);
    if (!group) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pr-6">
                    <div>
                        <DialogTitle>Transactions for: {group.merchantKey}</DialogTitle>
                        <DialogDescription>Review individual transactions in this group.</DialogDescription>
                    </div>
                    {group.transactions.length > 1 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                            disabled={isSplitting}
                            onClick={() => {
                                setIsSplitting(true);
                                onSplitGroup(group.transactions.map(t => t.id)).finally(() => setIsSplitting(false));
                            }}
                        >
                            {isSplitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Unlink className="h-3.5 w-3.5 mr-1.5 text-amber-600" />}
                            Split Group into Individual Merchants
                        </Button>
                    )}
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {group.transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell className="text-xs">{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                                    <TableCell className="text-xs font-medium">
                                        <div className="flex flex-col">
                                            <span>{tx.cleanDescription || tx.description}</span>
                                            {tx.cleanDescription && <span className="text-[9px] text-muted-foreground italic">Raw: {tx.description}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">{formatPrice(tx.amount)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-destructive h-7 text-[10px]"
                                            onClick={() => {
                                                setIsMoving(tx.id);
                                                onMoveToNew(tx.id).finally(() => setIsMoving(null));
                                            }}
                                            disabled={isMoving === tx.id}
                                        >
                                            {isMoving === tx.id ? <Loader2 className="h-3 w-3 animate-spin mr-1"/> : <Undo2 className="h-3 w-3 mr-1"/>}
                                            Move to New
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface TransactionGroup {
    merchantKey: string;
    transactions: ImportedTransaction[];
    suggestion: SmartAllocationResult | null;
    status: 'pending' | 'ready' | 'processing' | 'server_researching';
}

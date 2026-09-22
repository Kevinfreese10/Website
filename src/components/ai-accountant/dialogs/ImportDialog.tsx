'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
    FileUp, 
    FileSpreadsheet, 
    Sparkles, 
    Download, 
    Loader2, 
    Clock, 
    AlertTriangle, 
    Info, 
    CheckCircle2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parse, addDays } from 'date-fns';
import Papa from 'papaparse';
import { 
    getFirestore, 
    doc, 
    updateDoc, 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    where, 
    writeBatch, 
    limit, 
    serverTimestamp 
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { cn, sanitizeFirestoreData } from '@/lib/utils';
import { MASTER_ALLOCATION_RULES } from '@/lib/master-allocation-rules';
import { triageTransaction, buildConsistencyMap, TriageContext } from '@/lib/initial-allocation-engine';
import { ImportedTransaction } from '@/lib/types';
import AIStatementImportDialog from '@/components/admin/AIStatementImportDialog';
import { ImportDialogProps, formatPrice } from '../types';

const db = getFirestore(firebaseApp);

export function ImportDialog({ 
    client, 
    bankAccountId, 
    currentBalance, 
    onImportComplete 
}: ImportDialogProps) {
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
                    rawDescription: description,
                    amount: row.Amount,
                    isExpense: isExpense,
                    bankAccountId: bankAccountId,
                    status: triage.status,
                    createdAt: serverTimestamp()
                };

                // On CSV import: Do not assign merchantKey or cleanDescription per practitioner preference.
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
    );
}

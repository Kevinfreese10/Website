'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect, useMemo, ReactNode } from "react";
import { User, ChartOfAccount, AllocatedTransaction, ImportedTransaction, VatType, Supplier, ClientCustomer } from "@/lib/types";
import { getFirestore, doc, getDoc, collection, query, onSnapshot, updateDoc, writeBatch, deleteDoc, where, getDocs, deleteField, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Loader2, Download, Eye, Trash2, Search, Scale, ChevronsUpDown, CheckCheck } from "lucide-react";
import { useParams, useSearchParams } from 'next/navigation';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as TableFooterComponent } from "@/components/ui/table";
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { allVatTypes } from "@/lib/vat-types";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList, CommandGroup } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { AccountSelector } from '@/components/accounting/AccountSelector';

const db = getFirestore(firebaseApp);

const reallocateSchema = z.object({
  accountId: z.string().min(1, "Please select an account."),
  vatType: z.string().min(1, "Please select a VAT type."),
});

const formatPrice = (price: number): ReactNode => {
    if (price === 0) return 'R 0.00';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(price);
};

function ReallocateDialog({ transaction, client, onSave, onOpenChange, open }: { transaction: any; client: User; onSave: (txId: string, values: z.infer<typeof reallocateSchema>) => void; onOpenChange: (open: boolean) => void; open: boolean }) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<z.infer<typeof reallocateSchema>>({
        resolver: zodResolver(reallocateSchema),
        defaultValues: {
            accountId: transaction?.allocatedTo?.value || '',
            vatType: transaction?.vatType || 'no_vat',
        },
    });

    const handleSave = async (values: z.infer<typeof reallocateSchema>) => {
        setIsSaving(true);
        await onSave(transaction.id, values);
        setIsSaving(false);
        onOpenChange(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reallocate Transaction</DialogTitle>
                    <DialogDescription>
                        Change the allocation for: "{transaction?.description}"
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="accountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Account</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {client.chartOfAccounts?.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.description}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="vatType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New VAT Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select VAT type" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {allVatTypes.map(vt => (
                                                <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Reallocation
                            </Button>
                        </DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    );
}

function GeneralLedgerReport({ client, transactions, dateRange, fromAccount, toAccount, filterMode, selectedAccountIds, suppliers, customers, onReallocate, onDelete, onClear }: { 
    client: User, 
    transactions: (ImportedTransaction | AllocatedTransaction)[], 
    dateRange?: DateRange, 
    fromAccount?: string, 
    toAccount?: string,
    filterMode?: 'range' | 'specific',
    selectedAccountIds?: string[],
    suppliers: Supplier[],
    customers: ClientCustomer[],
    onReallocate: (tx: any) => void, 
    onDelete: (journalRef: string) => void,
    onClear: (txIds: string[]) => void
}) {
    
    const [selectedSuspenseTxIds, setSelectedSuspenseTxIds] = useState<string[]>([]);
        
    const filteredTransactions = useMemo(() => {
        let filtered = transactions;
        
        if (dateRange) {
             if (dateRange.from) {
                filtered = filtered.filter(tx => new Date(tx.date) >= dateRange.from!);
            }
            if (dateRange.to) {
                filtered = filtered.filter(tx => new Date(tx.date) <= dateRange.to!);
            }
        }
        
        return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactions, dateRange]);
    
    const accountsToDisplay = useMemo(() => {
        let accounts = client.chartOfAccounts || [];

        if (filterMode === 'specific') {
            if (selectedAccountIds && selectedAccountIds.length > 0) {
                accounts = accounts.filter(acc => selectedAccountIds.includes(acc.id));
            } else {
                return [];
            }
        } else {
            if (fromAccount) {
                const from = accounts.find(a => a.id === fromAccount);
                if(from) accounts = accounts.filter(acc => acc.accountNumber >= from.accountNumber);
            }
            if (toAccount) {
                const to = accounts.find(a => a.id === toAccount);
                if(to) accounts = accounts.filter(acc => acc.accountNumber <= to.accountNumber);
            }
        }

        return accounts.sort((a,b) => a.accountNumber.localeCompare(b.accountNumber));
    }, [client.chartOfAccounts, fromAccount, toAccount, filterMode, selectedAccountIds]);

    const cleanDisplayDescription = (description: string, allocatedTo?: { value: string, type: 'account' | 'customer' | 'supplier' }): string => {
        if (!description) return '';
        let clean = description.replace(/^(Contra:\s*|VAT:\s*)/i, '').trim();

        // Helper to check if a prefix string matches a supplier/customer name
        const isMatch = (prefix: string, actorName: string): boolean => {
            const p = prefix.toUpperCase().trim();
            const a = actorName.toUpperCase().trim();
            if (!p || !a) return false;
            
            if (p === a || p.startsWith(a)) return true;
            
            if (a.startsWith(p)) {
                if (p.length >= 4) return true;
                const aWords = a.split(/\s+/);
                const pWords = p.split(/\s+/);
                if (pWords.every((w, i) => aWords[i] === w)) return true;
            }
            
            // Abbreviation / partial word prefix matching
            const pWords = p.split(/\s+/).filter(Boolean);
            const aWords = a.split(/\s+/).filter(Boolean);
            if (pWords.length > 0 && pWords.length <= aWords.length) {
                const matchesAll = pWords.every((pw, idx) => {
                    const aw = aWords[idx];
                    return aw && aw.startsWith(pw);
                });
                if (matchesAll) {
                    const totalLen = pWords.join('').length;
                    if (totalLen >= 3) return true;
                }
            }
            
            return false;
        };

        // 1. Try matching with exact supplier/customer names starting directly
        const sortedActors = [...suppliers, ...customers].sort((a, b) => b.name.length - a.name.length);
        for (const actor of sortedActors) {
            const name = actor.name.toUpperCase().trim();
            if (name && clean.toUpperCase().startsWith(name)) {
                let remaining = clean.substring(name.length).trim();
                if (remaining.startsWith('-')) {
                    remaining = remaining.substring(1).trim();
                } else if (remaining.startsWith(':')) {
                    remaining = remaining.substring(1).trim();
                }
                clean = remaining;
                break;
            }
        }

        // 2. Try matching with delimiter-separated prefixes (e.g. "UP INFORMATION TECH - ")
        const separatorRegex = /\s+(?:-|–|—)\s+|:\s+/;
        const match = clean.match(separatorRegex);
        if (match && match.index !== undefined) {
            const prefix = clean.substring(0, match.index).trim();
            const remainder = clean.substring(match.index + match[0].length).trim();
            
            const hasMatch = sortedActors.some(actor => isMatch(prefix, actor.name));
            if (hasMatch) {
                clean = remainder;
            }
        }

        return clean;
    };



    const groupedTransactions = useMemo(() => {
        const suspenseAccountId = '9500-001';
        const vatControlAccountId = client.chartOfAccounts?.find(acc => acc.accountNumber === '7000-008')?.id || '7000-008';
        const supplierControlAccountId = client.chartOfAccounts?.find(acc => acc.accountNumber === '7000-000')?.id || '7000-000';
        const customerControlAccountId = client.chartOfAccounts?.find(acc => acc.accountNumber === '8000-001')?.id || '8000-001';

        const grouped = new Map<string, { account: ChartOfAccount; transactions: any[], totalDebit: number; totalCredit: number }>();

        accountsToDisplay.forEach(acc => {
            grouped.set(acc.id, { account: acc, transactions: [], totalDebit: 0, totalCredit: 0 });
        });

        filteredTransactions.forEach(tx => {
            const txDate = new Date(tx.date);
            const isJournal = tx.bankAccountId === 'JOURNAL';

            if(isJournal) {
                 const allocatedTo = tx.allocatedTo;
                 if (allocatedTo) {
                     // Map sub-ledger actor IDs back to their Control Accounts
                     let targetGLId = allocatedTo.value;
                     if (allocatedTo.type === 'supplier') targetGLId = supplierControlAccountId;
                     else if (allocatedTo.type === 'customer') targetGLId = customerControlAccountId;

                     const entry = grouped.get(targetGLId);
                     if (entry) {
                         entry.transactions.push({
                            id: tx.id,
                            isJournal,
                            date: txDate,
                            description: cleanDisplayDescription(tx.description, tx.allocatedTo),
                            ref: tx.reference,
                            debit: tx.amount > 0 ? tx.amount : 0,
                            credit: tx.amount < 0 ? -tx.amount : 0,
                         });
                     }
                 }
            } else {
                const inclusiveAmount = tx.amount;
                const isStandardVat = client.isVatRegistered && (tx.vatType === 'standard_rated_purchases' || tx.vatType === 'standard_rated_sales' || tx.vatType === 'capital_goods_purchases');
                
                let vatAmount = 0;
                let exclusiveAmount = inclusiveAmount;
                if (isStandardVat) {
                    vatAmount = inclusiveAmount / 1.15 * 0.15;
                    exclusiveAmount = inclusiveAmount - vatAmount;
                }

                 // 1. Bank Account Entry
                const bankEntry = grouped.get(tx.bankAccountId);
                if (bankEntry) {
                    bankEntry.transactions.push({
                        id: tx.id,
                        isJournal,
                        date: txDate,
                        description: cleanDisplayDescription(tx.description, tx.allocatedTo),
                        ref: tx.reference,
                        debit: inclusiveAmount > 0 ? inclusiveAmount : 0,
                        credit: inclusiveAmount < 0 ? -inclusiveAmount : 0,
                    });
                }
                
                 // 2. Contra Account Entry (VAT Exclusive)
                let targetContraGLId = suspenseAccountId;
                let currentAllocatedTo = tx.allocatedTo;

                if ((tx.status as string) === 'allocated' || tx.status === 'reviewed') {
                    if (tx.allocatedTo?.type === 'supplier') targetContraGLId = supplierControlAccountId;
                    else if (tx.allocatedTo?.type === 'customer') targetContraGLId = customerControlAccountId;
                    else if (tx.allocatedTo?.value) targetContraGLId = tx.allocatedTo.value;
                }

                const contraEntry = grouped.get(targetContraGLId);
                if(contraEntry) {
                    contraEntry.transactions.push({
                         id: tx.id,
                         isJournal,
                         date: txDate,
                         description: cleanDisplayDescription(tx.description, currentAllocatedTo),
                         ref: tx.reference,
                         debit: inclusiveAmount < 0 ? -exclusiveAmount : 0,
                         credit: inclusiveAmount > 0 ? exclusiveAmount : 0,
                    });
                }

                // 3. VAT Entry
                if(isStandardVat && vatAmount !== 0) {
                    const vatEntry = grouped.get(vatControlAccountId);
                    if(vatEntry) {
                        vatEntry.transactions.push({
                            id: tx.id,
                            description: `VAT: ${cleanDisplayDescription(tx.description, currentAllocatedTo)}`,
                            ref: tx.reference,
                            date: txDate,
                            debit: inclusiveAmount < 0 ? -vatAmount : 0, // Debit for purchases (input)
                            credit: inclusiveAmount > 0 ? vatAmount : 0, // Credit for sales (output)
                        });
                    }
                }
            }
        });
        
        grouped.forEach(group => {
            group.transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
            let runningBalance = 0;
            group.transactions = group.transactions.map(tx => {
                runningBalance += tx.debit - tx.credit;
                return { ...tx, balance: runningBalance };
            });
            group.totalDebit = group.transactions.reduce((sum, tx) => sum + tx.debit, 0);
            group.totalCredit = group.transactions.reduce((sum, tx) => sum + tx.credit, 0);
        });

        return Array.from(grouped.values()).filter(g => g.transactions.length > 0);

    }, [filteredTransactions, accountsToDisplay, client.isVatRegistered, client.chartOfAccounts, suppliers, customers]);
    
    const handleSelectSuspenseTx = (id: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedSuspenseTxIds(prev => [...prev, id]);
        } else {
            setSelectedSuspenseTxIds(prev => prev.filter(txId => txId !== id));
        }
    };
    
    const handleSelectAllSuspense = (isSelected: boolean, transactionIds: string[]) => {
        if (isSelected) {
            setSelectedSuspenseTxIds(transactionIds);
        } else {
            setSelectedSuspenseTxIds([]);
        }
    };
    
    const handleClearClick = () => {
        onClear(selectedSuspenseTxIds);
        setSelectedSuspenseTxIds([]); // Clear selection after action
    };

    const handleDownloadExcel = () => {
        let excelData: any[] = [];
        
        groupedTransactions.forEach(group => {
            excelData.push({
                Date: `${group.account.accountNumber} - ${group.account.description}`,
            });

            excelData.push({
                Date: "Date",
                Description: "Description",
                Debit: "Debit",
                Credit: "Credit",
                Balance: "Balance",
            });

            group.transactions.forEach(tx => {
                excelData.push({
                    Date: format(tx.date, 'dd/MM/yyyy'),
                    Description: tx.description,
                    Debit: tx.debit,
                    Credit: tx.credit,
                    Balance: tx.balance,
                });
            });

            excelData.push({
                Date: "Totals",
                Description: "",
                Debit: group.totalDebit,
                Credit: group.totalCredit,
                Balance: "",
            });
            
            excelData.push({}); // Add a blank row for spacing
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData, { skipHeader: true });
        worksheet['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        
        Object.keys(worksheet).forEach(key => {
             if (/[C-E]\d+/.test(key)) {
                const cell = worksheet[key];
                if (cell.v !== null && typeof cell.v === 'number') {
                    cell.t = 'n';
                    cell.z = 'R #,##0.00';
                }
            }
        });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "General Ledger");

        const today = new Date().toISOString().split('T')[0];
        const fileName = `${client.companyName || client.name}-General-Ledger-${today}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    if (accountsToDisplay.length === 0) {
        return (
            <div className="py-12 text-center text-muted-foreground text-sm font-semibold">
                No accounts selected. Please select specific accounts or configure a range.
            </div>
        );
    }

    return (
        <>
            <div className="max-h-[70vh] overflow-y-auto space-y-6">
                {groupedTransactions.map(group => {
                    const isSuspenseAccount = group.account.accountNumber === '9500-001';
                    const groupTxIds = group.transactions.map(tx => tx.id);
                    return (
                    <div key={group.account.id}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg">{group.account.accountNumber} - {group.account.description}</h3>
                            {isSuspenseAccount && selectedSuspenseTxIds.length > 0 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive">
                                            Clear Allocation ({selectedSuspenseTxIds.length})
                                        </Button>
                                    </AlertDialogTrigger>
                                     <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will clear the allocation for {selectedSuspenseTxIds.length} transaction(s) and move them back to the 'New' tab for processing. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleClearClick}>Yes, Clear Allocations</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {isSuspenseAccount && (
                                        <TableHead className="w-12">
                                            <Checkbox 
                                                checked={selectedSuspenseTxIds.length > 0 && selectedSuspenseTxIds.length === groupTxIds.length}
                                                onCheckedChange={(checked) => handleSelectAllSuspense(!!checked, groupTxIds)}
                                            />
                                        </TableHead>
                                    )}
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Debit</TableHead>
                                    <TableHead className="text-right">Credit</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {group.transactions.map((tx, index) => (
                                    <TableRow key={index}>
                                         {isSuspenseAccount && (
                                            <TableCell>
                                                <Checkbox 
                                                    checked={selectedSuspenseTxIds.includes(tx.id)}
                                                    onCheckedChange={(checked) => handleSelectSuspenseTx(tx.id, !!checked)}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell>{format(tx.date, 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>{tx.description}</TableCell>
                                        <TableCell className="text-right font-mono">
                                            <Button variant="link" className="p-0 h-auto" onClick={() => onReallocate(tx)} disabled={tx.isJournal}>
                                                {formatPrice(tx.debit)}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            <Button variant="link" className="p-0 h-auto" onClick={() => onReallocate(tx)} disabled={tx.isJournal}>
                                                {formatPrice(tx.credit)}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{formatPrice(tx.balance)}</TableCell>
                                        <TableCell className="text-right">
                                            {tx.isJournal && tx.ref?.startsWith('TAX-') && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will delete the entire tax journal entry ({tx.ref}). This action cannot be undone.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => onDelete(tx.ref)}>Delete Journal</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooterComponent>
                                <TableRow>
                                    <TableCell colSpan={isSuspenseAccount ? 3 : 2} className="font-bold">Totals</TableCell>
                                    <TableCell className="text-right font-bold font-mono">{formatPrice(group.totalDebit)}</TableCell>
                                    <TableCell className="text-right font-bold font-mono">{formatPrice(group.totalCredit)}</TableCell>
                                    <TableCell colSpan={2}></TableCell>
                                </TableRow>
                            </TableFooterComponent>
                        </Table>
                    </div>
                )})}
            </div>
             <DialogFooter className="mt-4">
                <Button variant="outline" onClick={handleDownloadExcel}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel
                </Button>
            </DialogFooter>
        </>
    );
}

interface SavedReport {
    id: string;
    name: string;
    accountIds: string[];
    filterMode: 'range' | 'specific';
    fromAccount?: string;
    toAccount?: string;
    dateRange?: {
        from: string | null;
        to: string | null;
    };
    createdAt: any;
}

export default function GeneralLedgerPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const clientId = params.clientId as string;
    const accountIdFromQuery = searchParams.get('accountId');

    const [client, setClient] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<(ImportedTransaction | AllocatedTransaction)[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [customers, setCustomers] = useState<ClientCustomer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
    const [fromAccount, setFromAccount] = useState<string | undefined>();
    const [toAccount, setToAccount] = useState<string | undefined>();
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isReallocateOpen, setIsReallocateOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const { toast } = useToast();

    const [filterMode, setFilterMode] = useState<'range' | 'specific'>('range');
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
    const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
    const [selectedReportId, setSelectedReportId] = useState<string>('');
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [newReportName, setNewReportName] = useState('');
    const [isSavingReport, setIsSavingReport] = useState(false);

    useEffect(() => {
        if (!clientId) return;
        const q = query(
            collection(db, 'aiAccountantClients', clientId, 'savedReports'),
            orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    name: data.name,
                    filterMode: data.filterMode || 'specific',
                    accountIds: data.accountIds || [],
                    fromAccount: data.fromAccount || undefined,
                    toAccount: data.toAccount || undefined,
                    dateRange: data.dateRange || undefined,
                    createdAt: data.createdAt
                } as SavedReport;
            });
            setSavedReports(fetched);
        }, (error) => {
            console.error("Error fetching saved reports:", error);
        });
        return () => unsubscribe();
    }, [clientId]);

    useEffect(() => {
        if (accountIdFromQuery) {
            setFromAccount(accountIdFromQuery);
            setToAccount(accountIdFromQuery);
        }
    }, [accountIdFromQuery]);


    const fetchAllData = async () => {
        if (!clientId) return;
        setIsLoading(true);
        try {
            const clientRef = doc(db, 'aiAccountantClients', clientId);
            const clientSnap = await getDoc(clientRef);
            if (clientSnap.exists()) {
                const clientData = { id: clientSnap.id, ...clientSnap.data() } as User;
                setClient(clientData);
            }

            const supSnap = await getDocs(collection(db, `aiAccountantClients/${clientId}/suppliers`));
            setSuppliers(supSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));

            const custSnap = await getDocs(collection(db, `aiAccountantClients/${clientId}/customers`));
            setCustomers(custSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientCustomer)));

             const transUnsubscribe = onSnapshot(query(collection(db, 'aiAccountantClients', clientId, 'transactions')), snapshot => {
                const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as (ImportedTransaction | AllocatedTransaction)));
                setTransactions(fetched);
            });

        } catch (error) {
            console.error("Error fetching client data:", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchAllData();
    }, [clientId]);
    
    const accounts = useMemo(() => client?.chartOfAccounts?.sort((a,b) => a.accountNumber.localeCompare(b.accountNumber)) || [], [client]);
    
    const handleReallocateClick = (tx: any) => {
        const originalTx = transactions.find(t => t.id === tx.id);
        if (originalTx) {
            setSelectedTransaction(originalTx);
            setIsReallocateOpen(true);
        }
    };
    
    const handleSaveReallocation = async (txId: string, values: z.infer<typeof reallocateSchema>) => {
        if(!client) return;
        try {
            const txRef = doc(db, 'aiAccountantClients', client.id!, 'transactions', txId);
            await updateDoc(txRef, {
                'allocatedTo.value': values.accountId,
                vatType: values.vatType,
            });
            toast({ title: "Success", description: "Transaction reallocated successfully." });
        } catch (error) {
            console.error("Error reallocating transaction:", error);
            toast({ title: "Error", description: "Could not save the changes.", variant: "destructive" });
        }
    };
    
    const handleClearAllocations = async (txIds: string[]) => {
      if (!client) return;
      toast({ title: "Clearing allocations...", description: "Please wait." });
      try {
        const batch = writeBatch(db);
        txIds.forEach(id => {
          const txRef = doc(db, 'aiAccountantClients', client.id, 'transactions', id);
          batch.update(txRef, {
            status: 'new',
            allocatedTo: deleteField(),
            vatType: deleteField(),
            allocatedAt: deleteField(),
            aiAllocationResult: deleteField()
          });
        });
        await batch.commit();
        toast({ title: "Success!", description: `${txIds.length} transaction(s) have been reset and sent to the 'New' tab.` });
        // No need to call fetchAllData, onSnapshot will handle it
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Could not clear allocations.', variant: 'destructive' });
      }
    };
    
     const handleDeleteJournal = async (journalReference: string) => {
      if (!client) return;
      
      const q = query(collection(db, "aiAccountantClients", client.id, "transactions"), where("reference", "==", journalReference));
      const journalsToDeleteSnapshot = await getDocs(q);

      if (journalsToDeleteSnapshot.empty) {
        toast({ title: 'Error', description: 'Could not find journal entries to delete.', variant: 'destructive'});
        return;
      }
      
      try {
        const batch = writeBatch(db);
        journalsToDeleteSnapshot.forEach(journalDoc => {
          batch.delete(journalDoc.ref);
        });
        await batch.commit();
        toast({ title: 'Journal Deleted', description: `Journal ${journalReference} has been deleted.`, variant: 'destructive'});
        // Data will refetch automatically due to onSnapshot listener
      } catch (error) {
        console.error("Error deleting journal:", error);
        toast({ title: 'Error', description: 'Failed to delete journal.', variant: 'destructive'});
      }
    };

    const handleSaveReport = async () => {
        if (!clientId || !newReportName.trim()) return;
        setIsSavingReport(true);
        try {
            const reportRef = doc(collection(db, 'aiAccountantClients', clientId, 'savedReports'));
            await setDoc(reportRef, {
                name: newReportName.trim(),
                filterMode,
                accountIds: filterMode === 'specific' ? selectedAccountIds : [],
                fromAccount: filterMode === 'range' ? (fromAccount || null) : null,
                toAccount: filterMode === 'range' ? (toAccount || null) : null,
                dateRange: dateRange ? {
                    from: dateRange.from ? dateRange.from.toISOString() : null,
                    to: dateRange.to ? dateRange.to.toISOString() : null
                } : null,
                createdAt: serverTimestamp()
            });
            toast({ title: "Report Saved", description: `"${newReportName}" has been saved.` });
            setNewReportName('');
            setIsSaveDialogOpen(false);
        } catch (error) {
            console.error("Error saving report:", error);
            toast({ title: "Error", description: "Failed to save report configuration.", variant: "destructive" });
        } finally {
            setIsSavingReport(false);
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (!clientId) return;
        try {
            await deleteDoc(doc(db, 'aiAccountantClients', clientId, 'savedReports', reportId));
            toast({ title: "Report Deleted", description: "Custom report removed successfully." });
            if (selectedReportId === reportId) {
                setSelectedReportId('');
            }
        } catch (error) {
            console.error("Error deleting report:", error);
            toast({ title: "Error", description: "Failed to delete report.", variant: "destructive" });
        }
    };

    const handleLoadReport = (reportId: string) => {
        const report = savedReports.find(r => r.id === reportId);
        if (!report) return;

        setFilterMode(report.filterMode || 'specific');
        setSelectedAccountIds(report.accountIds || []);
        setFromAccount(report.fromAccount || '');
        setToAccount(report.toAccount || '');

        if (report.dateRange) {
            setDateRange({
                from: report.dateRange.from ? new Date(report.dateRange.from) : undefined,
                to: report.dateRange.to ? new Date(report.dateRange.to) : undefined
            });
        } else {
            setDateRange(undefined);
        }
    };

    const getReportDateString = () => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) {
            return `as at ${format(new Date(), "dd MMMM yyyy")}`;
        }
        if (dateRange.from && dateRange.to) {
            return `for the period ${format(dateRange.from, "dd MMMM yyyy")} to ${format(dateRange.to, "dd MMMM yyyy")}`;
        }
        if (dateRange.from) {
            return `from ${format(dateRange.from, "dd MMMM yyyy")}`;
        }
        if (dateRange.to) {
            return `up to ${format(dateRange.to, "dd MMMM yyyy")}`;
        }
        return `as at ${format(new Date(), "dd MMMM yyyy")}`;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel: Filters (Col-span 8) */}
                <div className="lg:col-span-8">
                    <Card className="h-full">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>General Ledger Report</CardTitle>
                                    <CardDescription>
                                        Filter and view the general ledger for a specific period.
                                    </CardDescription>
                                </div>
                                <Button asChild variant="outline">
                                    <Link href={`/admin/ai-accountant/${clientId}/reports/gl-recon`}>
                                        <Scale className="mr-2 h-4 w-4"/>
                                        Go to GL Recon Tool
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-4">
                                    <Label>Date Range</Label>
                                    <DateRangePicker value={dateRange} onDateChange={setDateRange} financialYearEnd={client?.yearEnd} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-4">
                                    <Label>Filter Mode</Label>
                                    <div className="flex items-center space-x-2">
                                        <Button 
                                            variant={filterMode === 'range' ? 'default' : 'outline'} 
                                            size="sm" 
                                            className="text-xs font-bold"
                                            onClick={() => setFilterMode('range')}
                                        >
                                            Account Range
                                        </Button>
                                        <Button 
                                            variant={filterMode === 'specific' ? 'default' : 'outline'} 
                                            size="sm" 
                                            className="text-xs font-bold"
                                            onClick={() => setFilterMode('specific')}
                                        >
                                            Select Specific Accounts
                                        </Button>
                                    </div>
                                </div>

                                {filterMode === 'range' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-4">
                                        <Label>Account Range</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <AccountSelector
                                                client={client}
                                                showAccounts={true}
                                                showCustomers={false}
                                                showSuppliers={false}
                                                value={fromAccount}
                                                onChange={(selection) => setFromAccount(selection.value)}
                                                placeholder="(From Account)"
                                                disabled={isLoading}
                                            />
                                            <AccountSelector
                                                client={client}
                                                showAccounts={true}
                                                showCustomers={false}
                                                showSuppliers={false}
                                                value={toAccount}
                                                onChange={(selection) => setToAccount(selection.value)}
                                                placeholder="(To Account)"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-4">
                                        <Label>Specific Accounts</Label>
                                        <div className="flex items-center gap-2">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full sm:w-[300px] justify-between font-bold text-xs h-10 border border-muted-foreground/20">
                                                        <span className="truncate">
                                                            {selectedAccountIds.length === 0 
                                                                ? "Select specific accounts..." 
                                                                : `${selectedAccountIds.length} account(s) selected`}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search account..." className="h-9" />
                                                        <CommandList className="max-h-[300px]">
                                                            <CommandEmpty>No account found.</CommandEmpty>
                                                            <CommandGroup>
                                                                <CommandItem
                                                                    onSelect={() => {
                                                                        if (selectedAccountIds.length === accounts.length) {
                                                                            setSelectedAccountIds([]);
                                                                        } else {
                                                                            setSelectedAccountIds(accounts.map(a => a.id));
                                                                        }
                                                                    }}
                                                                    className="font-bold text-xs cursor-pointer flex items-center justify-between"
                                                                >
                                                                    <span>Select All</span>
                                                                    <Checkbox 
                                                                        checked={selectedAccountIds.length === accounts.length}
                                                                        className="pointer-events-none"
                                                                    />
                                                                </CommandItem>
                                                                {accounts.map((acc) => {
                                                                    const isSelected = selectedAccountIds.includes(acc.id);
                                                                    return (
                                                                        <CommandItem
                                                                            key={acc.id}
                                                                            onSelect={() => {
                                                                                if (isSelected) {
                                                                                    setSelectedAccountIds(prev => prev.filter(id => id !== acc.id));
                                                                                } else {
                                                                                    setSelectedAccountIds(prev => [...prev, acc.id]);
                                                                                }
                                                                            }}
                                                                            className="text-xs cursor-pointer flex items-center justify-between"
                                                                        >
                                                                            <span className="font-semibold">{acc.accountNumber} - {acc.description}</span>
                                                                            <Checkbox 
                                                                                checked={isSelected}
                                                                                className="pointer-events-none"
                                                                            />
                                                                        </CommandItem>
                                                                    );
                                                                })}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            {selectedAccountIds.length > 0 && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => setSelectedAccountIds([])}
                                                    className="text-xs text-muted-foreground hover:text-foreground font-bold"
                                                >
                                                    Clear
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex justify-start pt-4">
                                     {isLoading ? (
                                        <Loader2 className="animate-spin" />
                                    ) : client ? (
                                        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                                            <DialogTrigger asChild>
                                                <Button disabled={filterMode === 'specific' && selectedAccountIds.length === 0}>
                                                    View Report
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-6xl">
                                                <DialogHeader className="text-center mb-4">
                                                    <DialogTitle className="text-lg">{client.companyName || client.name}</DialogTitle>
                                                    <DialogDescription>
                                                        General Ledger {getReportDateString()}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <GeneralLedgerReport 
                                                    client={client} 
                                                    transactions={transactions} 
                                                    dateRange={dateRange} 
                                                    fromAccount={fromAccount} 
                                                    toAccount={toAccount}
                                                    filterMode={filterMode}
                                                    selectedAccountIds={selectedAccountIds}
                                                    suppliers={suppliers}
                                                    customers={customers}
                                                    onReallocate={handleReallocateClick}
                                                    onDelete={handleDeleteJournal}
                                                    onClear={handleClearAllocations}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <p>Client data could not be loaded.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel: Saved Custom Reports (Col-span 4) */}
                <div className="lg:col-span-4">
                    <Card className="border border-primary/10 bg-primary/5 shadow-sm backdrop-blur-sm h-full flex flex-col justify-between">
                        <CardHeader>
                            <CardTitle className="text-md flex items-center gap-2">
                                <Scale className="h-5 w-5 text-primary" />
                                Saved Custom Reports
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Save and reload specific account and date configurations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-grow">
                            {savedReports.length === 0 ? (
                                <div className="py-12 text-center text-xs text-muted-foreground italic">
                                    No custom reports saved yet.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {savedReports.map(report => (
                                        <div 
                                            key={report.id} 
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-lg border text-xs transition-all duration-200 group hover:bg-background/85 cursor-pointer",
                                                selectedReportId === report.id ? "border-primary bg-background shadow-sm" : "border-transparent bg-background/40"
                                            )}
                                            onClick={() => {
                                                setSelectedReportId(report.id);
                                                handleLoadReport(report.id);
                                            }}
                                        >
                                            <div className="space-y-1">
                                                <p className="font-bold text-foreground">{report.name}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {report.filterMode === 'specific' 
                                                        ? `${report.accountIds?.length || 0} account(s)` 
                                                        : `Range: ${client?.chartOfAccounts?.find(a => a.id === report.fromAccount)?.accountNumber || 'Start'} to ${client?.chartOfAccounts?.find(a => a.id === report.toAccount)?.accountNumber || 'End'}`}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    type="button"
                                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteReport(report.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <div className="p-6 pt-0 border-t border-primary/10 mt-auto flex gap-2">
                            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button 
                                        className="w-full text-xs font-bold" 
                                        size="sm" 
                                        disabled={(filterMode === 'specific' && selectedAccountIds.length === 0) || (filterMode === 'range' && !fromAccount && !toAccount)}
                                    >
                                        Save Current Filters
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Save Custom Report</DialogTitle>
                                        <DialogDescription>
                                            Enter a name to save these specific account and date selections.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="reportName">Report Name</Label>
                                            <Input 
                                                id="reportName" 
                                                placeholder="e.g. Sales & VAT Audit" 
                                                value={newReportName}
                                                onChange={(e) => setNewReportName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" type="button" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
                                        <Button type="button" onClick={handleSaveReport} disabled={!newReportName.trim() || isSavingReport}>
                                            {isSavingReport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Report
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </Card>
                </div>
            </div>

            {selectedTransaction && client && (
                <ReallocateDialog
                    transaction={selectedTransaction}
                    client={client}
                    onSave={handleSaveReallocation}
                    open={isReallocateOpen}
                    onOpenChange={setIsReallocateOpen}
                />
            )}
        </div>
    );
}

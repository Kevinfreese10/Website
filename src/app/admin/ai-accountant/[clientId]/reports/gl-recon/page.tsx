'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useMemo } from "react";
import { User, ChartOfAccount, AllocatedTransaction, ImportedTransaction, VatType, Supplier, ClientCustomer } from "@/lib/types";
import { getFirestore, doc, getDoc, collection, query, onSnapshot, where, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Loader2, Download, Eye, Scale, CheckCircle, ChevronsUpDown, CheckCheck, Search } from "lucide-react";
import { useParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList, CommandGroup } from "@/components/ui/command";
import * as XLSX from 'xlsx';
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { allVatTypes } from "@/lib/vat-types";
import { Badge } from "@/components/ui/badge";
import { AccountSelector } from '@/components/accounting/AccountSelector';
import { Input } from "@/components/ui/input";

const db = getFirestore(firebaseApp);

const formatPrice = (price: number) => {
    if (price === 0) return 'R 0.00';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(price);
};

function AccountLedgerView({ transactions, account, client, suppliers, customers, onReallocate }: { 
    transactions: (ImportedTransaction | AllocatedTransaction)[], 
    account: ChartOfAccount,
    client: User,
    suppliers: Supplier[],
    customers: ClientCustomer[],
    onReallocate: (txIds: string[], values: { accountId: string, vatType: VatType }) => void,
}) {
    const getBankAccountName = (bankAccountId: string) => {
        if (!bankAccountId) return '-';
        if (bankAccountId === 'JOURNAL') return 'General Journal';
        const acc = client.chartOfAccounts?.find(a => a.id === bankAccountId);
        return acc ? acc.description : bankAccountId;
    };
    
    const [hideMatched, setHideMatched] = useState(true);
    const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
    const [reallocateTo, setReallocateTo] = useState<{accountId: string, vatType: VatType} | null>(null);
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('');

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


    const ledgerEntries = useMemo(() => {
        const processedTransactions = transactions
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(tx => ({
                ...tx,
                displayDescription: cleanDisplayDescription(tx.description, tx.allocatedTo),
                displayAmount: tx.allocatedTo?.value === account.id ? tx.amount : -tx.amount,
                matched: false, 
            }));

        const debits = processedTransactions.filter(tx => tx.displayAmount > 0);
        const credits = processedTransactions.filter(tx => tx.displayAmount < 0);
        
        const creditMatches = new Array(credits.length).fill(false);

        for (const debit of debits) {
            for (let i = 0; i < credits.length; i++) {
                if (!creditMatches[i] && Math.abs(debit.displayAmount + credits[i].displayAmount) < 0.01) {
                    debit.matched = true;
                    credits[i].matched = true;
                    creditMatches[i] = true;
                    break; 
                }
            }
        }
        
        const allLedgerEntries = [...debits, ...credits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningBalance = 0;
        return allLedgerEntries.map(entry => {
            runningBalance += entry.displayAmount;
            return {
                ...entry,
                balance: runningBalance,
            };
        });

    }, [transactions, account, suppliers, customers]);
    
    const visibleEntries = useMemo(() => {
        let entries = ledgerEntries;
        if (hideMatched) {
            entries = entries.filter(e => !e.matched);
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            entries = entries.filter(e => 
                e.displayDescription.toLowerCase().includes(query) ||
                e.description.toLowerCase().includes(query)
            );
        }
        return entries;
    }, [ledgerEntries, hideMatched, searchQuery]);
    
    useEffect(() => {
        setSelectedTransactions([]);
    }, [visibleEntries]);

    const handleSelectionChange = (id: string, checked: boolean) => {
        setSelectedTransactions(prev => {
            if (checked) {
                return [...prev, id];
            } else {
                return prev.filter(txId => txId !== id);
            }
        });
    };

    const handleDownloadExcel = () => {
        const dataToExport = visibleEntries.map(tx => ({
            'Date': format(new Date(tx.date), 'dd/MM/yyyy'),
            'Bank Account': getBankAccountName(tx.bankAccountId),
            'Type': tx.amount < 0 ? 'Payment' : 'Income',
            'Description': tx.displayDescription,
            'Debit': tx.displayAmount > 0 ? tx.displayAmount : '',
            'Credit': tx.displayAmount < 0 ? -tx.displayAmount : '',
            'Balance': tx.balance,
        }));
        
        const totalDebit = visibleEntries.reduce((sum, tx) => sum + (tx.displayAmount > 0 ? tx.displayAmount : 0), 0);
        const totalCredit = visibleEntries.reduce((sum, tx) => sum + (tx.displayAmount < 0 ? -tx.displayAmount : 0), 0);

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.sheet_add_aoa(worksheet, [['', '', '', 'Totals', totalDebit, totalCredit, '']], { origin: -1 });
        worksheet['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 10 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, account.description);
        XLSX.writeFile(workbook, `Ledger-${account.accountNumber}.xlsx`);
    };

    if (ledgerEntries.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground border-2 border-dashed rounded-lg p-4">
                <Scale className="h-10 w-10 mb-4" />
                <p className="font-semibold">No Transactions Found</p>
                <p className="text-sm mt-2">There are no transactions for this account in the selected period.</p>
              </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Ledger for: {account.description}</CardTitle>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="relative w-[240px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search description..."
                                className="pl-8 h-9 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="hide-matched" checked={hideMatched} onCheckedChange={(checked) => setHideMatched(checked as boolean)} />
                            <Label htmlFor="hide-matched" className="text-sm font-medium">Hide Matched Transactions</Label>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 {selectedTransactions.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-lg">
                        <p className="text-sm font-semibold">{selectedTransactions.length} selected</p>
                         <AccountSelector
                             client={client}
                             showAccounts={true}
                             showCustomers={false}
                             showSuppliers={false}
                             value={reallocateTo ? { value: reallocateTo.accountId, type: 'account' } : null}
                             onChange={(selection, vatType) => {
                                 setReallocateTo({ accountId: selection.value, vatType: vatType || 'no_vat' });
                             }}
                             requireVatSelection={client.isVatRegistered}
                             isVatRegistered={client.isVatRegistered}
                             size="sm"
                             className="w-[200px]"
                             placeholder="Reallocate to..."
                         />
                         <Select
                            value={reallocateTo?.vatType || 'no_vat'}
                            onValueChange={(value) => reallocateTo && setReallocateTo({...reallocateTo, vatType: value as VatType})}
                            disabled={!reallocateTo}
                        >
                            <SelectTrigger className="w-[180px] h-8 text-[11px] font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {allVatTypes.map(vt => <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button 
                            size="sm"
                            className="h-8 font-bold"
                            onClick={() => {
                                if (reallocateTo) {
                                    onReallocate(selectedTransactions, reallocateTo);
                                    setSelectedTransactions([]);
                                }
                            }}
                            disabled={!reallocateTo}
                        >
                            Apply
                        </Button>
                    </div>
                )}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12"><Checkbox 
                                checked={selectedTransactions.length > 0 && selectedTransactions.length === visibleEntries.length}
                                onCheckedChange={(checked) => setSelectedTransactions(checked ? visibleEntries.map(e => e.id) : [])}
                            /></TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Bank Account</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visibleEntries.map((tx) => (
                            <TableRow key={tx.id} data-state={selectedTransactions.includes(tx.id) && 'selected'} className={cn(tx.matched && 'text-muted-foreground line-through')}>
                                <TableCell><Checkbox checked={selectedTransactions.includes(tx.id)} onCheckedChange={(checked) => handleSelectionChange(tx.id, !!checked)} /></TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {tx.matched && <CheckCircle className="h-4 w-4 text-green-500" />}
                                        {format(new Date(tx.date), 'dd/MM/yyyy')}
                                    </div>
                                </TableCell>
                                <TableCell>{getBankAccountName(tx.bankAccountId)}</TableCell>
                                <TableCell>
                                    {tx.amount < 0 ? (
                                        <Badge variant="outline" className="border-red-500/30 text-red-600 bg-red-500/5 dark:bg-red-500/10">Payment</Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-green-500/30 text-green-600 bg-green-500/5 dark:bg-green-500/10">Income</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{tx.displayDescription}</TableCell>
                                <TableCell className="text-right font-mono">{tx.displayAmount > 0 ? formatPrice(tx.displayAmount) : ''}</TableCell>
                                <TableCell className="text-right font-mono">{tx.displayAmount < 0 ? formatPrice(-tx.displayAmount) : ''}</TableCell>
                                <TableCell className="text-right font-mono">{formatPrice(tx.balance)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={7} className="font-bold">Closing Balance</TableCell>
                            <TableCell className="text-right font-bold font-mono">{formatPrice(ledgerEntries[ledgerEntries.length-1]?.balance || 0)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
             <CardFooter>
                 <Button onClick={handleDownloadExcel} size="sm" variant="outline" className="font-bold">
                    <Download className="mr-2 h-4 w-4" />
                    Download as Excel
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function GeneralLedgerReconPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const [client, setClient] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<(ImportedTransaction | AllocatedTransaction)[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [customers, setCustomers] = useState<ClientCustomer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingTransactions, setIsFetchingTransactions] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();
    const [isReportVisible, setIsReportVisible] = useState(false);
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    
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
    const selectedAccount = useMemo(() => accounts.find(acc => acc.id === selectedAccountId), [accounts, selectedAccountId]);
    
    const handleViewReport = () => {
        if(!selectedAccountId) return;
        
        setIsFetchingTransactions(true);
        setIsReportVisible(false); // Hide old report while fetching

        const bankTxQuery = query(collection(db, 'aiAccountantClients', clientId, 'transactions'), where('bankAccountId', '==', selectedAccountId));
        const allocatedTxQuery = query(collection(db, 'aiAccountantClients', clientId, 'transactions'), where('allocatedTo.value', '==', selectedAccountId));
        
        Promise.all([getDocs(bankTxQuery), getDocs(allocatedTxQuery)])
            .then(([bankSnap, allocatedSnap]) => {
                const combined = new Map<string, ImportedTransaction | AllocatedTransaction>();
                bankSnap.forEach(doc => combined.set(doc.id, { id: doc.id, ...doc.data() } as ImportedTransaction));
                allocatedSnap.forEach(doc => combined.set(doc.id, { id: doc.id, ...doc.data() } as AllocatedTransaction));
                
                setTransactions(Array.from(combined.values()));
                setIsReportVisible(true);
            })
            .catch(error => {
                console.error("Error fetching transactions for reconciliation:", error);
            })
            .finally(() => {
                setIsFetchingTransactions(false);
            });
    }

    const handleReallocate = async (txIds: string[], values: { accountId: string, vatType: VatType }) => {
        if (!client) return;
        
        const batch = writeBatch(db);
        txIds.forEach(id => {
            const txData = transactions.find(t => t.id === id);
            if(txData && txData.bankAccountId !== 'JOURNAL') { // Don't reallocate journal entries
                const docRef = doc(db, 'aiAccountantClients', client.id, 'transactions', id);
                batch.update(docRef, {
                    'allocatedTo.value': values.accountId,
                    'allocatedTo.type': 'account',
                    'vatType': values.vatType,
                    'status': 'allocated'
                });
            }
        });

        try {
            await batch.commit();
            toast({ title: 'Reallocation Successful', description: `${txIds.length} transactions have been updated.`});
            // Re-fetch transactions for the current view
            handleViewReport();
        } catch (error) {
            toast({ title: 'Error', description: 'Could not reallocate transactions.', variant: 'destructive'});
        }
    };
    
    return (
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>General Ledger Reconciliation</CardTitle>
                    <CardDescription>Select an account to view its transaction ledger and running balance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex flex-col sm:flex-row items-end gap-4">
                         <div className="grid gap-1.5 flex-grow">
                             <Label>Account to Reconcile</Label>
                             <AccountSelector
                                 client={client}
                                 showAccounts={true}
                                 showCustomers={false}
                                 showSuppliers={false}
                                 value={selectedAccountId ? { value: selectedAccountId, type: 'account' } : null}
                                 onChange={(selection) => {
                                     setSelectedAccountId(selection.value);
                                 }}
                                 placeholder="Select an account..."
                             />
                        </div>
                        <Button onClick={handleViewReport} disabled={isFetchingTransactions || !selectedAccountId} className="font-bold gap-2">
                            {isFetchingTransactions ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Eye className="mr-2 h-4 w-4"/>}
                            View Ledger
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isReportVisible && selectedAccount && client && (
                <AccountLedgerView 
                    transactions={transactions} 
                    account={selectedAccount} 
                    client={client}
                    suppliers={suppliers}
                    customers={customers}
                    onReallocate={handleReallocate}
                />
            )}
        </div>
    );
}

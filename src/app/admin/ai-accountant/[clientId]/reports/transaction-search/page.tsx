
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useMemo } from "react";
import { User, ChartOfAccount, AllocatedTransaction, ImportedTransaction, VatType } from "@/lib/types";
import { getFirestore, doc, getDoc, collection, query, where, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Loader2, Download, Eye, Edit, Trash2, Search, Link as LinkIcon, Scale, ChevronsUpDown } from "lucide-react";
import { useParams, useSearchParams } from 'next/navigation';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { allVatTypes } from "@/lib/vat-types";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList, CommandGroup } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";


const db = getFirestore(firebaseApp);

const formatPrice = (price: number) => {
    if (price === 0) return 'R 0.00';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(price);
};

function SearchResultsView({ 
    results, 
    client, 
    onReallocate, 
    selectedTransactions,
    onSelectionChange,
    onBulkSelectionChange
}: { 
    results: (ImportedTransaction | AllocatedTransaction)[], 
    client: User, 
    onReallocate: (txIds: string[], values: { accountId: string, vatType: VatType }) => void,
    selectedTransactions: string[],
    onSelectionChange: (id: string, checked: boolean) => void,
    onBulkSelectionChange: (ids: string[], checked: boolean) => void
}) {
    const [reallocateTo, setReallocateTo] = useState<{accountId: string, vatType: VatType} | null>(null);
    const [open, setOpen] = useState(false)

    const getAllocationDescription = (tx: ImportedTransaction | AllocatedTransaction) => {
        if (!tx.allocatedTo?.value) return <Badge variant="outline">Unallocated</Badge>;
        return client.chartOfAccounts?.find(acc => acc.id === tx.allocatedTo?.value)?.description || 'Unknown';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Search Results ({results.length})</h3>
                <div className="flex items-center gap-2">
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between shadow-sm bg-white" disabled={selectedTransactions.length === 0}>
                                {reallocateTo ? client.chartOfAccounts?.find(acc => acc.id === reallocateTo.accountId)?.description : "Reallocate selected to..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput placeholder="Search account..." />
                                <CommandList>
                                <CommandEmpty>No account found.</CommandEmpty>
                                <CommandGroup>
                                    {client.chartOfAccounts?.map((account) => (
                                    <CommandItem
                                        key={account.id}
                                        value={account.description}
                                        onSelect={() => {
                                            setReallocateTo({ accountId: account.id, vatType: client.isVatRegistered ? 'standard_rated_purchases' : 'no_vat' })
                                            setOpen(false)
                                        }}
                                    >
                                        {account.description}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    
                    {client.isVatRegistered && (
                        <Select 
                            value={reallocateTo?.vatType || ''}
                            onValueChange={(value) => reallocateTo && setReallocateTo(prev => prev ? {...prev, vatType: value as VatType} : null)}
                            disabled={!reallocateTo}
                        >
                            <SelectTrigger className="w-[180px] shadow-sm bg-white"><SelectValue placeholder="Select VAT type" /></SelectTrigger>
                            <SelectContent>
                                {allVatTypes.map(vt => <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}

                    <Button 
                        onClick={() => {
                            if (reallocateTo) {
                                onReallocate(selectedTransactions, {
                                    accountId: reallocateTo.accountId, 
                                    vatType: client.isVatRegistered ? (reallocateTo.vatType || 'no_vat') : 'no_vat'
                                })
                            }
                        }}
                        disabled={selectedTransactions.length === 0 || !reallocateTo}
                        className="font-semibold shadow-sm"
                    >
                        Apply
                    </Button>
                </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto border rounded-lg shadow-inner bg-slate-50/50">
                <Table>
                    <TableHeader className="bg-slate-100/80 sticky top-0 z-10 backdrop-blur-sm">
                        <TableRow>
                            <TableHead className="w-12"><Checkbox 
                                checked={results.length > 0 && selectedTransactions.length === results.length}
                                onCheckedChange={(checked) => {
                                    onBulkSelectionChange(results.map(tx => tx.id), !!checked)
                                }}
                            /></TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Allocated To</TableHead>
                            <TableHead>Bank Account</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                        {results.map(tx => (
                            <TableRow key={tx.id} className="hover:bg-slate-50/80">
                                <TableCell><Checkbox checked={selectedTransactions.includes(tx.id)} onCheckedChange={(checked) => onSelectionChange(tx.id, !!checked)} /></TableCell>
                                <TableCell className="whitespace-nowrap">{new Date(tx.date).toLocaleDateString('en-ZA')}</TableCell>
                                <TableCell className="font-medium text-slate-900">{tx.description}</TableCell>
                                <TableCell>{getAllocationDescription(tx)}</TableCell>
                                <TableCell>{client.chartOfAccounts?.find(acc => acc.id === tx.bankAccountId)?.description}</TableCell>
                                <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                                <TableCell><Badge variant={(tx.status as string) === 'allocated' ? 'success' : (tx.status as string) === 'new' ? 'secondary' : 'default'}>{tx.status}</Badge></TableCell>
                                <TableCell className={cn("text-right font-mono font-semibold", tx.amount < 0 ? "text-rose-600" : "text-emerald-600")}>{formatPrice(tx.amount)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default function TransactionSearchPage() {
    const params = useParams();
    const clientId = params.clientId as string;

    const [client, setClient] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<(ImportedTransaction | AllocatedTransaction)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchInputValue, setSearchInputValue] = useState('');
    const [dateRangeValue, setDateRangeValue] = useState<DateRange | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [searchResults, setSearchResults] = useState<(ImportedTransaction | AllocatedTransaction)[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
    const { toast } = useToast();

    const handleApplyFilters = () => {
        setSearchTerm(searchInputValue);
        setDateRange(dateRangeValue);
    };

    const handleClearFilters = () => {
        setSearchInputValue('');
        setDateRangeValue(undefined);
        setSearchTerm('');
        setDateRange(undefined);
        setSelectedTransactions([]);
    };

    const term = searchTerm.trim();
    const cleanTerm = term.replace(/R\s*/i, '').replace(/,/g, '').replace(/\s/g, '');
    const isNumeric = cleanTerm !== '' && /^-?\d+(?:\.\d+)?$/.test(cleanTerm);

    const fetchClientAndTransactions = async () => {
        if (!clientId) return;
        setIsLoading(true);
        try {
            const clientRef = doc(db, 'aiAccountantClients', clientId);
            const clientSnap = await getDoc(clientRef);
            if (clientSnap.exists()) {
                setClient({ id: clientSnap.id, ...clientSnap.data() } as User);
            }

            const transQuery = query(collection(db, 'aiAccountantClients', clientId, 'transactions'));
            const transSnap = await getDocs(transQuery);
            setTransactions(transSnap.docs.map(d => ({ id: d.id, ...d.data() } as (ImportedTransaction | AllocatedTransaction))));

        } catch (e) {
            toast({ title: 'Error', description: 'Failed to fetch client data.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClientAndTransactions();
    }, [clientId]);
    
    useEffect(() => {
        const cleanTerm = searchTerm.trim().replace(/R\s*/i, '').replace(/,/g, '').replace(/\s/g, '');
        const isNumeric = cleanTerm !== '' && /^-?\d+(?:\.\d+)?$/.test(cleanTerm);
        const parsedAmount = isNumeric ? parseFloat(cleanTerm) : NaN;

        const hasSearchTerm = searchTerm.length > 2 || (isNumeric && searchTerm.length > 0);
        const hasDateRange = !!(dateRange?.from || dateRange?.to);

        if (hasSearchTerm || hasDateRange) {
            setIsSearching(true);

            const handler = setTimeout(() => {
                const results = transactions.filter(tx => {
                    // 1. Date Range filtering
                    if (dateRange?.from || dateRange?.to) {
                        const txDate = new Date(tx.date);
                        if (dateRange.from) {
                            const fromLimit = new Date(dateRange.from);
                            fromLimit.setHours(0, 0, 0, 0);
                            if (txDate < fromLimit) return false;
                        }
                        if (dateRange.to) {
                            const toLimit = new Date(dateRange.to);
                            toLimit.setHours(23, 59, 59, 999);
                            if (txDate > toLimit) return false;
                        }
                    }

                    // 2. Search Term filtering (optional if dateRange is selected)
                    if (hasSearchTerm) {
                        const matchesDescription = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesAmount = isNumeric && !isNaN(parsedAmount) && Math.abs(Math.abs(tx.amount) - Math.abs(parsedAmount)) < 0.01;
                        return matchesDescription || matchesAmount;
                    }

                    return true;
                });
                
                // Always sort by date descending (newest first)
                results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                setSearchResults(results);
                setIsSearching(false);
            }, 300);

            return () => clearTimeout(handler);
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    }, [searchTerm, transactions, dateRange]);

    const handleSelectionChange = (id: string, checked: boolean) => {
        setSelectedTransactions(prev => {
            if (checked) {
                return [...prev, id];
            } else {
                return prev.filter(txId => txId !== id);
            }
        });
    };

    const handleBulkSelectionChange = (ids: string[], checked: boolean) => {
        setSelectedTransactions(prev => {
            if (checked) {
                const newIds = ids.filter(id => !prev.includes(id));
                return [...prev, ...newIds];
            } else {
                return prev.filter(id => !ids.includes(id));
            }
        });
    };

    const handleReallocate = async (txIds: string[], values: { accountId: string, vatType: VatType }) => {
        if (!client) return;
        
        const batch = writeBatch(db);
        txIds.forEach(id => {
            const docRef = doc(db, 'aiAccountantClients', client.id, 'transactions', id);
            batch.update(docRef, {
                'allocatedTo.value': values.accountId,
                'allocatedTo.type': 'account',
                'vatType': values.vatType,
                'status': 'allocated'
            });
        });

        try {
            await batch.commit();
            toast({ title: 'Reallocation Successful', description: `${txIds.length} transactions have been updated.`});
            // Refetch or update state locally
            fetchClientAndTransactions();
            setSelectedTransactions([]);
        } catch (error) {
            toast({ title: 'Error', description: 'Could not reallocate transactions.', variant: 'destructive'});
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!client) {
        return <p>Client not found.</p>;
    }

    return (
        <Card className="border shadow-md">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
                <CardTitle className="text-xl font-bold text-slate-800">Transaction Search & Bulk Reallocation</CardTitle>
                <CardDescription>Filter transactions by date and/or search term to perform bulk reallocations.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50/40 p-4 border rounded-xl shadow-sm">
                    <div className="grid w-full md:max-w-md gap-1.5">
                        <Label htmlFor="search-input" className="text-xs font-semibold text-slate-600">Search Term</Label>
                        <Input 
                            id="search-input"
                            type="text" 
                            placeholder="Search by description or amount (e.g., 'Telkom' or '5000')" 
                            value={searchInputValue}
                            onChange={(e) => setSearchInputValue(e.target.value)}
                            className="bg-white shadow-sm h-10"
                        />
                    </div>
                    <div className="grid w-full md:max-w-xs gap-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Date Range</Label>
                        <DateRangePicker 
                            value={dateRangeValue}
                            onDateChange={setDateRangeValue}
                            financialYearEnd={client?.yearEnd}
                            className="w-full shadow-sm bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={handleApplyFilters}
                            className="h-10 font-bold gap-2 shadow-sm"
                        >
                            <Search className="h-4 w-4" /> Run Report
                        </Button>
                        {(searchInputValue || dateRangeValue || searchTerm || dateRange) && (
                            <Button 
                                variant="ghost" 
                                onClick={handleClearFilters}
                                className="h-10 text-slate-500 hover:text-slate-900 font-semibold"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
                
                <div className="mt-6">
                    {isSearching ? (
                         <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : searchResults.length > 0 ? (
                        <SearchResultsView 
                            results={searchResults} 
                            client={client} 
                            onReallocate={handleReallocate} 
                            selectedTransactions={selectedTransactions}
                            onSelectionChange={handleSelectionChange}
                            onBulkSelectionChange={handleBulkSelectionChange}
                        />
                    ) : (searchTerm.length > 2 || (isNumeric && searchTerm.length > 0) || dateRange?.from || dateRange?.to) ? (
                        <p className="text-center text-muted-foreground py-12 border border-dashed rounded-lg bg-slate-50/30">No transactions found matching your search criteria.</p>
                    ) : (
                         <div className="text-center text-muted-foreground py-16 border border-dashed rounded-lg bg-slate-50/20 space-y-3">
                             <Search className="h-10 w-10 mx-auto text-slate-300" />
                             <p className="font-semibold text-slate-700">Retrieve Transactions</p>
                             <p className="text-xs max-w-sm mx-auto text-slate-500">Enter a search term (at least 3 characters or an amount) or select a date range to filter and bulk reallocate transactions.</p>
                         </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

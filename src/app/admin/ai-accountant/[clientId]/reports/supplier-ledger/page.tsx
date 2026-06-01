
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useMemo, useCallback } from "react";
import { User, AllocatedTransaction, ImportedTransaction, Supplier, ChartOfAccount } from "@/lib/types";
import { getFirestore, doc, getDoc, collection, query, onSnapshot, orderBy, getDocs, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Loader2, Download, Eye, Calendar as CalendarIcon, Edit, Save, Trash2, Plus } from "lucide-react";
import { useParams } from 'next/navigation';
import { DateRange } from "react-day-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as TableFooterComponent } from "@/components/ui/table";
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { allVatTypes } from '@/lib/vat-types';
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const db = getFirestore(firebaseApp);

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
};

const safeFormatDate = (date: any): string => {
    if (!date) return 'N/A';
    try {
        const d = date?.toDate ? date.toDate() : new Date(date);
        return format(d, 'dd/MM/yyyy');
    } catch (e) {
        return 'Invalid Date';
    }
};

const editJournalLineSchema = z.object({
    id: z.string(),
    accountId: z.string().min(1),
    description: z.string().min(1),
    amount: z.number(),
    vatType: z.string(),
});

const editJournalFormSchema = z.object({
    reference: z.string(),
    date: z.date(),
    lines: z.array(editJournalLineSchema),
});

function EditJournalDialog({ isOpen, onOpenChange, journalEntries, client, onSave }: { 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void, 
    journalEntries: AllocatedTransaction[] | null, 
    client: User | null, 
    onSave: (data: z.infer<typeof editJournalFormSchema>) => Promise<void> 
}) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof editJournalFormSchema>>({
        resolver: zodResolver(editJournalFormSchema),
        defaultValues: {
            reference: '',
            date: new Date(),
            lines: [],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "lines"
    });

    useEffect(() => {
        if (journalEntries && journalEntries.length > 0) {
            form.reset({
                reference: journalEntries[0].reference || '',
                date: journalEntries[0].date?.toDate ? journalEntries[0].date.toDate() : new Date(journalEntries[0].date),
                lines: journalEntries.map(entry => ({
                    id: entry.id,
                    accountId: entry.allocatedTo.value,
                    description: entry.description,
                    amount: entry.amount,
                    vatType: entry.vatType || 'no_vat',
                })),
            });
        }
    }, [journalEntries, form]);

    const watchedLines = form.watch("lines");
    const totals = useMemo(() => {
        let debits = 0;
        let credits = 0;
        watchedLines?.forEach(line => {
            if (line.amount > 0) debits += line.amount;
            else credits += Math.abs(line.amount);
        });
        return { debits, credits, balance: debits - credits };
    }, [watchedLines]);

    const isBalanced = Math.abs(totals.balance) < 0.01;

    const handleFormSubmit = async (data: z.infer<typeof editJournalFormSchema>) => {
        if (!isBalanced) {
            toast({ title: "Journal Unbalanced", description: "Total debits must equal total credits.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            await onSave(data);
            onOpenChange(false);
        } finally {
            setIsSaving(false);
        }
    };

    if (!journalEntries) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-primary/5 border-b shrink-0">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Edit className="h-5 w-5 text-primary" />
                        Edit Journal Group: {form.getValues("reference")}
                    </DialogTitle>
                    <DialogDescription>Modify individual transactions within this balanced group.</DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="date" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Journal Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="reference" render={({ field }) => (
                                    <FormItem><FormLabel>Reference</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                )} />
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="text-[10px] uppercase font-black">Account</TableHead>
                                            <TableHead className="text-[10px] uppercase font-black">Description</TableHead>
                                            <TableHead className="text-[10px] uppercase font-black">VAT Type</TableHead>
                                            <TableHead className="text-right text-[10px] uppercase font-black">Debit</TableHead>
                                            <TableHead className="text-right text-[10px] uppercase font-black">Credit</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.map((field, index) => (
                                            <TableRow key={field.id}>
                                                <TableCell className="p-2">
                                                    <FormField control={form.control} name={`lines.${index}.accountId`} render={({ field }) => (
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                {client?.chartOfAccounts?.map(a => <SelectItem key={a.id} value={a.id}>{a.description}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    )} />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <FormField control={form.control} name={`lines.${index}.description`} render={({ field }) => <Input className="h-8 text-[11px]" {...field} />} />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <FormField control={form.control} name={`lines.${index}.vatType`} render={({ field }) => (
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                {allVatTypes.map(v => <SelectItem key={v.name} value={v.name}>{v.label}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    )} />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input 
                                                        type="number" 
                                                        step="0.01" 
                                                        className="h-8 text-right font-mono text-[11px]" 
                                                        placeholder="0.00"
                                                        value={watchedLines[index]?.amount > 0 ? watchedLines[index].amount : ''}
                                                        onChange={(e) => form.setValue(`lines.${index}.amount`, parseFloat(e.target.value) || 0)}
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input 
                                                        type="number" 
                                                        step="0.01" 
                                                        className="h-8 text-right font-mono text-[11px]" 
                                                        placeholder="0.00"
                                                        value={watchedLines[index]?.amount < 0 ? Math.abs(watchedLines[index].amount) : ''}
                                                        onChange={(e) => form.setValue(`lines.${index}.amount`, -(parseFloat(e.target.value) || 0))}
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ id: `new_${Date.now()}`, accountId: '', description: '', amount: 0, vatType: 'no_vat' })} className="font-bold gap-2">
                                <Plus className="h-4 w-4" /> Add Line
                            </Button>

                            <div className="bg-muted/30 p-4 rounded-xl border flex justify-between items-center">
                                <div className="flex gap-8 text-xs">
                                    <div><span className="text-muted-foreground uppercase font-black text-[9px] block">Total Debits</span><span className="font-bold font-mono">R {formatPrice(totals.debits)}</span></div>
                                    <div><span className="text-muted-foreground uppercase font-black text-[9px] block">Total Credits</span><span className="font-bold font-mono">R {formatPrice(totals.credits)}</span></div>
                                </div>
                                <div className="text-right">
                                    <span className="text-muted-foreground uppercase font-black text-[9px] block">Out of Balance</span>
                                    <span className={cn("font-black font-mono text-lg", isBalanced ? "text-green-600" : "text-destructive")}>
                                        R {formatPrice(totals.balance)}
                                    </span>
                                </div>
                            </div>

                            <DialogFooter className="border-t pt-4">
                                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                                <Button type="submit" disabled={!isBalanced || isSaving} className="font-black px-8">
                                    {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 h-4 w-4" />}
                                    Update Journal
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function SupplierLedgerReport({ 
    client, 
    supplier, 
    transactions, 
    dateRange 
}: { 
    client: User;
    supplier: Supplier | undefined;
    transactions: (AllocatedTransaction | ImportedTransaction)[];
    dateRange?: DateRange;
}) {
    const { toast } = useToast();
    const [editingJournal, setEditingJournal] = useState<AllocatedTransaction[] | null>(null);
    const [isFetchingJournal, setIsFetchingJournal] = useState(false);
    
    const supplierTransactions = useMemo(() => {
        if (!supplier) return [];
        
        const supplierControlAccountId = client.chartOfAccounts?.find(acc => acc.accountNumber === '7000-000')?.id;
        
        let filtered = transactions.filter(tx => {
            // Include payments allocated to this supplier
            if (tx.allocatedTo?.type === 'supplier' && tx.allocatedTo.value === supplier.id) {
                return true;
            }
            // Include journal entries that affect the supplier control account and mention the supplier
            if (tx.bankAccountId === 'JOURNAL' && tx.allocatedTo?.value === supplierControlAccountId && tx.description.toUpperCase().includes(supplier.name.toUpperCase())) {
                return true;
            }
            return false;
        });

        if (dateRange?.from) {
            filtered = filtered.filter(tx => new Date(tx.date) >= dateRange.from!);
        }
        if (dateRange?.to) {
            filtered = filtered.filter(tx => new Date(tx.date) <= dateRange.to!);
        }
        
        return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactions, supplier, dateRange, client.chartOfAccounts]);

    const reportData = useMemo(() => {
        let runningBalance = 0;
        return supplierTransactions.map(tx => {
            const isJournal = tx.bankAccountId === 'JOURNAL';
            let debit = 0;
            let credit = 0;

            if (isJournal) {
                // Journal: Debit increases (negative amount in our system logic?), Credit reduces
                // Wait, in general-journal.tsx: Debit is positive, Credit is negative.
                // For a Supplier (Liability):
                // Credit increases liability (negative amount)
                // Debit decreases liability (positive amount)
                if (tx.amount < 0) credit = Math.abs(tx.amount);
                else debit = tx.amount;
            } else {
                // Bank: Expense is negative amount.
                // A payment to a supplier (expense) is a DEBIT to the supplier (decreases liability).
                if (tx.amount < 0) debit = Math.abs(tx.amount);
                else credit = tx.amount; // Refund
            }
            
            runningBalance += credit - debit;

            return {
                id: tx.id,
                date: tx.date,
                description: tx.description,
                reference: tx.reference,
                debit,
                credit,
                balance: runningBalance,
                bankAccountId: tx.bankAccountId
            };
        });
    }, [supplierTransactions]);

    const totals = useMemo(() => {
        const totalDebits = reportData.reduce((sum, tx) => sum + tx.debit, 0);
        const totalCredits = reportData.reduce((sum, tx) => sum + tx.credit, 0);
        return { totalDebits, totalCredits };
    }, [reportData]);

    const handleJournalClick = async (reference: string) => {
        if (!client || !client.id) return;
        setIsFetchingJournal(true);
        try {
            const q = query(
                collection(db, 'aiAccountantClients', client.id, 'transactions'),
                where('reference', '==', reference),
                where('bankAccountId', '==', 'JOURNAL')
            );
            const snap = await getDocs(q);
            const entries = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as AllocatedTransaction));
            if (entries.length === 0) {
                toast({ title: "Journal not found", description: "Could not retrieve the journal lines from the database.", variant: "destructive" });
                return;
            }
            setEditingJournal(entries);
        } catch (e) {
            console.error("Error fetching journal lines:", e);
            toast({ title: "Fetch Failed", description: "An error occurred while reading journal lines.", variant: "destructive" });
        } finally {
            setIsFetchingJournal(false);
        }
    };

    const handleUpdateJournal = async (data: z.infer<typeof editJournalFormSchema>) => {
        if (!client || !client.id) return;
        try {
            const batch = writeBatch(db);
            const ref = data.reference;
            const txCollection = collection(db, 'aiAccountantClients', client.id, 'transactions');
            
            // 1. Identify IDs to delete (original lines that were removed in editor)
            const originalIds = editingJournal?.map(j => j.id) || [];
            const updatedIds = data.lines.map(l => l.id).filter(id => !id.startsWith('new_'));
            const toDelete = originalIds.filter(id => !updatedIds.includes(id));

            toDelete.forEach(id => batch.delete(doc(txCollection, id)));

            // 2. Update existing or set new lines
            data.lines.forEach(line => {
                const docRef = line.id.startsWith('new_') ? doc(txCollection) : doc(txCollection, line.id);
                const payload: any = {
                    clientId: client.id,
                    date: data.date.toISOString(),
                    reference: ref,
                    description: line.description,
                    amount: line.amount,
                    isExpense: line.amount < 0,
                    bankAccountId: 'JOURNAL',
                    allocatedTo: { value: line.accountId, type: 'account' },
                    vatType: line.vatType,
                    status: 'allocated',
                    updatedAt: serverTimestamp(),
                };
                if (line.id.startsWith('new_')) payload.allocatedAt = serverTimestamp();
                batch.set(docRef, payload, { merge: true });
            });

            await batch.commit();
            toast({ title: "Journal Updated", description: "Successfully updated all journal lines." });
            setEditingJournal(null);
        } catch (e) {
            console.error("Journal update failed:", e);
            toast({ title: "Update Failed", description: "Could not save the updated journal lines.", variant: "destructive" });
        }
    };

    const handleDownloadExcel = () => {
        if (!supplier) return;
        const dataToExport: any[] = reportData.map(tx => ({
            'Date': safeFormatDate(tx.date),
            'Reference': tx.reference,
            'Description': tx.description,
            'Debit (Decrease)': tx.debit,
            'Credit (Increase)': tx.credit,
            'Balance': tx.balance,
        }));

        dataToExport.push({
            Date: 'Totals',
            Reference: '',
            Description: '',
            'Debit (Decrease)': totals.totalDebits,
            'Credit (Increase)': totals.totalCredits,
            'Balance': '',
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        worksheet['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Supplier Ledger");
        XLSX.writeFile(workbook, `${supplier.name}_Ledger_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    };

    return (
        <>
        {isFetchingJournal && (
            <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-card p-4 rounded-xl border shadow-lg flex items-center gap-3 font-semibold text-sm">
                    <Loader2 className="animate-spin text-primary h-5 w-5" />
                    <span>Retrieving journal details...</span>
                </div>
            </div>
        )}

        <EditJournalDialog 
            isOpen={!!editingJournal} 
            onOpenChange={(o) => !o && setEditingJournal(null)} 
            journalEntries={editingJournal} 
            client={client} 
            onSave={handleUpdateJournal} 
        />

        <div className="max-h-[70vh] overflow-y-auto space-y-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reportData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                No transactions found for this supplier in the selected period.
                            </TableCell>
                        </TableRow>
                    ) : (
                        reportData.map((tx, index) => {
                            const isJournal = tx.bankAccountId === 'JOURNAL';
                            return (
                                <TableRow 
                                    key={index}
                                    className={cn(isJournal && "cursor-pointer hover:bg-muted/50 transition-colors")}
                                    onClick={() => {
                                        if (isJournal && tx.reference) {
                                            handleJournalClick(tx.reference);
                                        }
                                    }}
                                >
                                    <TableCell>{safeFormatDate(tx.date)}</TableCell>
                                    <TableCell>
                                        {isJournal ? (
                                            <span className="text-primary font-bold hover:underline flex items-center gap-1">
                                                {tx.reference}
                                                <Eye className="h-3 w-3 inline opacity-70" />
                                            </span>
                                        ) : (
                                            tx.reference
                                        )}
                                    </TableCell>
                                    <TableCell>{tx.description}</TableCell>
                                    <TableCell className="text-right font-mono text-destructive">{tx.debit > 0 ? formatPrice(tx.debit) : ''}</TableCell>
                                    <TableCell className="text-right font-mono text-green-600">{tx.credit > 0 ? formatPrice(tx.credit) : ''}</TableCell>
                                    <TableCell className="text-right font-mono font-bold">{formatPrice(tx.balance)}</TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
                 <TableFooterComponent>
                    <TableRow>
                        <TableCell colSpan={3} className="font-bold">Totals</TableCell>
                        <TableCell className="text-right font-bold font-mono text-destructive">{formatPrice(totals.totalDebits)}</TableCell>
                        <TableCell className="text-right font-bold font-mono text-green-600">{formatPrice(totals.totalCredits)}</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableFooterComponent>
            </Table>
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


export default function SupplierLedgerPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const [client, setClient] = useState<User | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [transactions, setTransactions] = useState<(AllocatedTransaction | ImportedTransaction)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | undefined>();

    const fetchInitialData = useCallback(async () => {
        if (!clientId) return;
        setIsLoading(true);
        try {
            const clientRef = doc(db, 'aiAccountantClients', clientId);
            const clientSnap = await getDoc(clientRef);
            if (clientSnap.exists()) setClient({ id: clientSnap.id, ...clientSnap.data() } as User);

            const suppliersQuery = query(collection(db, `aiAccountantClients/${clientId}/suppliers`), orderBy("name"));
            const suppliersSnapshot = await getDocs(suppliersQuery);
            setSuppliers(suppliersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
        } catch (error) {
            console.error("Error fetching initial data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        fetchInitialData();
        
        const transUnsubscribe = onSnapshot(query(collection(db, 'aiAccountantClients', clientId, 'transactions')), snapshot => {
            const fetched = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as any));
            setTransactions(fetched);
        });
        
        return () => transUnsubscribe();
    }, [clientId, fetchInitialData]);

    const selectedSupplier = useMemo(() => suppliers.find(s => s.id === selectedSupplierId), [suppliers, selectedSupplierId]);
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Supplier Ledger Report</CardTitle>
                    <CardDescription>View a detailed transaction history and running balance for a specific supplier.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-6 max-w-4xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label>Date Range</Label>
                                <DateRangePicker onDateChange={setDateRange} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Supplier</Label>
                                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                                    <SelectTrigger><SelectValue placeholder="Select a supplier" /></SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-start pt-4">
                            {isLoading ? (
                                <Loader2 className="animate-spin" />
                            ) : client && selectedSupplier ? (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button disabled={!selectedSupplierId}><Eye className="mr-2 h-4 w-4"/>View Report</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-5xl">
                                        <DialogHeader className="text-center mb-4">
                                            <DialogTitle className="text-lg">{client.companyName || client.name}</DialogTitle>
                                            <DialogDescription>Supplier Ledger for {selectedSupplier.name}</DialogDescription>
                                        </DialogHeader>
                                        <SupplierLedgerReport 
                                            client={client} 
                                            supplier={selectedSupplier}
                                            transactions={transactions} 
                                            dateRange={dateRange}
                                        />
                                    </DialogContent>
                                </Dialog>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Please select a supplier to generate the ledger.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


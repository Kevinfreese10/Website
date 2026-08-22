'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2, CalendarIcon, PlusCircle, MoreHorizontal, Eye, Copy, FileText, CheckCircle, ArrowRight, Ban, HelpCircle, Check, ChevronsUpDown, Pencil, X } from 'lucide-react';
import { getFirestore, doc, addDoc, getDoc, collection, query, orderBy, getDocs, updateDoc, writeBatch, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { User, Quote, ClientCustomer, ChartOfAccount } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { allVatTypes } from '@/lib/vat-types';
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import QuotePreview from '@/components/admin/QuotePreview';
import QuoteDownloadButton from '@/components/pdf/QuoteDownloadButton';
import { AccountSelector } from '@/components/accounting/AccountSelector';
import { Badge } from "@/components/ui/badge";

const db = getFirestore(firebaseApp);

const lineItemSchema = z.object({
    accountId: z.string().min(1, "Please select an account."),
    description: z.string().min(1, "Description is required."),
    quantity: z.preprocess((val) => Number(val), z.number().min(1)),
    rate: z.preprocess((val) => Number(val), z.number().min(0)),
    vatType: z.string().default('standard_rated_sales'),
});

const quoteFormSchema = z.object({
    customerId: z.string().min(1, "Please select a customer."),
    reference: z.string().optional(),
    quoteDate: z.date({ required_error: "Quote date is required." }),
    expiryDate: z.date({ required_error: "Expiry date is required." }),
    description: z.string().min(1, "Quote description is required."),
    lineItems: z.array(lineItemSchema).min(1, "At least one line item is required."),
    notes: z.string().optional(),
    currency: z.string().default('ZAR'),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

const formatPrice = (price: number, currency: string = 'ZAR') => {
  return new Intl.NumberFormat('en-ZA', { 
    style: 'currency', 
    currency: currency,
    minimumFractionDigits: 2 
  }).format(price);
};

function QuoteTotals({ control, isVatRegistered }: { control: any, isVatRegistered: boolean | undefined }) {
  const watchedLines = useWatch({
    control,
    name: "lineItems",
  });

  const totals = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    const linesToWatch = watchedLines || [];
    linesToWatch.forEach((line: any) => {
      const lineSubtotal = (line?.quantity || 0) * (line?.rate || 0);
      subtotal += lineSubtotal;
      if (isVatRegistered && line?.vatType === 'standard_rated_sales') {
        vat += lineSubtotal * 0.15;
      }
    });
    const total = subtotal + vat;
    return { subtotal, vat, total };
  }, [watchedLines, isVatRegistered]);

  const currency = useWatch({
    control,
    name: "currency",
  }) || 'ZAR';

  return (
    <CardFooter className="p-4 bg-muted rounded-lg mt-4 flex flex-col items-end gap-2 max-w-sm ml-auto">
        <div className="flex justify-between w-full text-sm"><span className="text-muted-foreground">Subtotal:</span><span>{formatPrice(totals.subtotal, currency)}</span></div>
        {isVatRegistered && <div className="flex justify-between w-full text-sm"><span className="text-muted-foreground">VAT (15%):</span><span>{formatPrice(totals.vat, currency)}</span></div>}
        <div className="flex justify-between w-full font-bold text-lg"><span >Total:</span><span>{formatPrice(totals.total, currency)}</span></div>
    </CardFooter>
  );
}

export default function QuotesPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.clientId as string;
    const [client, setClient] = useState<User | null>(null);
    const [customers, setCustomers] = useState<ClientCustomer[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
    const [isConverting, setIsConverting] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const submitMode = useRef<'draft' | 'sent'>('sent');

    const filteredQuotes = useMemo(() => {
        return quotes.filter(quote => {
            const customer = customers.find(c => c.id === quote.customerId);
            const matchesSearch = !searchQuery || 
                customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                quote.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (quote.reference && quote.reference.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesStatus = statusFilter === "all" || quote.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [quotes, customers, searchQuery, statusFilter]);

    const form = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteFormSchema),
        defaultValues: {
            reference: '',
            quoteDate: new Date(),
            expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            description: '',
            lineItems: [{ accountId: '', description: '', quantity: 1, rate: 0, vatType: 'standard_rated_sales' }],
            notes: '',
            currency: 'ZAR',
        },
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "lineItems",
    });

    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

    const handleEditQuote = (quote: Quote) => {
        setEditingQuote(quote);
        const qDate = quote.quoteDate instanceof Date ? quote.quoteDate : (quote.quoteDate?.toDate ? quote.quoteDate.toDate() : new Date(quote.quoteDate));
        const expDate = quote.expiryDate instanceof Date ? quote.expiryDate : (quote.expiryDate?.toDate ? quote.expiryDate.toDate() : new Date(quote.expiryDate));

        form.reset({
            customerId: quote.customerId,
            reference: quote.reference || '',
            quoteDate: qDate,
            expiryDate: expDate,
            description: quote.description || '',
            lineItems: quote.lineItems && quote.lineItems.length > 0 ? quote.lineItems : [{ accountId: '', description: '', quantity: 1, rate: 0, vatType: client?.isVatRegistered ? 'standard_rated_sales' : 'no_vat' }],
            notes: quote.notes || '',
            currency: quote.currency || 'ZAR',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast({ title: `Editing Quote QT-${quote.id}`, description: 'Form populated with quote details.' });
    };

    const handleCancelEdit = () => {
        setEditingQuote(null);
        form.reset({
            reference: '',
            quoteDate: new Date(),
            expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            description: '',
            lineItems: [{ accountId: '', description: '', quantity: 1, rate: 0, vatType: client?.isVatRegistered ? 'standard_rated_sales' : 'no_vat' }],
            notes: '',
            currency: 'ZAR',
        });
    };

    const handleDuplicateQuote = (quote: Quote) => {
        setEditingQuote(null);
        form.reset({
            customerId: quote.customerId,
            reference: quote.reference || '',
            quoteDate: new Date(),
            expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            description: quote.description || '',
            lineItems: quote.lineItems,
            notes: quote.notes,
            currency: quote.currency || 'ZAR',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast({ title: 'Quote Duplicated', description: 'The form has been pre-filled with the duplicate details.' });
    };

    const handleUpdateStatus = async (quoteId: string, newStatus: Quote['status']) => {
        try {
            const quoteRef = doc(db, `aiAccountantClients/${clientId}/quotes`, quoteId);
            await updateDoc(quoteRef, { status: newStatus });
            toast({ title: 'Status Updated', description: `Quote status changed to ${newStatus}.` });
            fetchData();
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
        }
    };

    const handleConvertToInvoice = async (quote: Quote) => {
        if (!client || isConverting) return;
        setIsConverting(true);
        toast({ title: "Converting to Invoice...", description: "Posting to general ledger." });

        try {
            const batch = writeBatch(db);

            // Fetch next invoice number
            const nextInvoiceNumber = client.nextInvoiceNumber || 9000;
            const invoiceId = String(nextInvoiceNumber);

            // 1. Create Invoice doc
            const invoiceRef = doc(db, `aiAccountantClients/${clientId}/invoices`, invoiceId);
            
            const invoiceData = {
                customerId: quote.customerId,
                reference: quote.reference || '',
                invoiceDate: new Date(), // Current date
                dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                lineItems: quote.lineItems,
                notes: quote.description ? `Subject: ${quote.description}\n\n${quote.notes || ''}` : (quote.notes || ''),
                currency: quote.currency || 'ZAR',
                status: 'final',
                subtotal: quote.subtotal,
                vat: quote.vat,
                total: quote.total,
                amountPaid: 0,
                balanceDue: quote.total,
                createdAt: serverTimestamp(),
                convertedFromQuoteId: quote.id
            };

            batch.set(invoiceRef, invoiceData);

            // 2. Write Ledger Entries
            const customerControlAccount = client.chartOfAccounts?.find(acc => acc.accountNumber === '8000-001')?.id;
            const vatControlAccount = client.chartOfAccounts?.find(acc => acc.accountNumber === '7000-008')?.id;

            if (!customerControlAccount || (client.isVatRegistered && !vatControlAccount)) {
                throw new Error("Control accounts not found in Chart of Accounts.");
            }
            
            // Debit Accounts Receivable
            const debitTxRef = doc(collection(db, 'aiAccountantClients', client.id, 'transactions'));
            batch.set(debitTxRef, {
                clientId: client.id,
                date: new Date().toISOString(),
                reference: `INV-${invoiceId}`,
                description: `Invoice to ${customers.find(c => c.id === quote.customerId)?.name} (Converted from QT-${quote.id})`,
                amount: quote.total,
                isExpense: quote.total < 0,
                bankAccountId: 'JOURNAL',
                allocatedTo: { value: customerControlAccount, type: 'account' },
                vatType: 'no_vat',
                vatAmount: 0,
                status: 'allocated',
                allocatedAt: serverTimestamp(),
            });

            // Credit Sales Accounts
            quote.lineItems.forEach(line => {
                const lineTotal = line.quantity * line.rate;
                const salesCreditRef = doc(collection(db, 'aiAccountantClients', client.id, 'transactions'));
                batch.set(salesCreditRef, {
                    clientId: client.id,
                    date: new Date().toISOString(),
                    reference: `INV-${invoiceId}`,
                    description: line.description,
                    amount: -lineTotal,
                    isExpense: -lineTotal < 0,
                    bankAccountId: 'JOURNAL',
                    allocatedTo: { value: line.accountId, type: 'account' },
                    vatType: line.vatType as any,
                    vatAmount: 0,
                    status: 'allocated',
                    allocatedAt: serverTimestamp(),
                });
            });
            
            // Credit VAT Control
            if (quote.vat > 0 && vatControlAccount) {
                 const vatCreditRef = doc(collection(db, 'aiAccountantClients', client.id, 'transactions'));
                 batch.set(vatCreditRef, {
                     clientId: client.id,
                     date: new Date().toISOString(),
                     reference: `INV-${invoiceId}`,
                     description: `VAT on Invoice (QT-${quote.id})`,
                     amount: -quote.vat,
                     isExpense: -quote.vat < 0,
                     bankAccountId: 'JOURNAL',
                     allocatedTo: { value: vatControlAccount, type: 'account' },
                     vatType: 'no_vat',
                     vatAmount: 0,
                     status: 'allocated',
                     allocatedAt: serverTimestamp(),
                 });
            }

            // 3. Mark Quote as Invoiced
            const quoteRef = doc(db, `aiAccountantClients/${clientId}/quotes`, quote.id);
            batch.update(quoteRef, { status: 'invoiced' });

            // 4. Update Client Invoice Number
            const clientRef = doc(db, 'aiAccountantClients', clientId);
            batch.update(clientRef, { nextInvoiceNumber: nextInvoiceNumber + 1 });

            await batch.commit();

            toast({ title: 'Quote Converted', description: `Invoice #${invoiceId} has been created and posted to the General Ledger.` });
            fetchData();

        } catch (e: any) {
            console.error(e);
            toast({ title: 'Error', description: e.message || 'Failed to convert quote.', variant: 'destructive' });
        } finally {
            setIsConverting(false);
        }
    };

    const handleAccountChange = (value: string, index: number) => {
        const selectedAccount = accounts.find(acc => acc.id === value);
        if (selectedAccount) {
            const currentLine = form.getValues(`lineItems.${index}`);
            const newVatType = selectedAccount.accountNumber === '1000-001' ? 'zero_rated_sales' : 'standard_rated_sales';
            update(index, {
                ...currentLine,
                accountId: value,
                description: currentLine.description || selectedAccount.description,
                vatType: client?.isVatRegistered ? newVatType : 'no_vat'
            });
        }
    };

    const fetchData = async () => {
        if (!clientId) return;
        setIsLoading(true);
        try {
            const clientRef = doc(db, 'aiAccountantClients', clientId);
            const clientSnap = await getDoc(clientRef);
            if (clientSnap.exists()) {
                const clientData = clientSnap.data() as User;
                setClient(clientData);
                setAccounts(clientData.chartOfAccounts?.filter(acc => acc.accountNumber.startsWith('1000-')).sort((a,b) => a.accountNumber.localeCompare(b.accountNumber)) || []);
                // If client is not VAT registered, default all lines to 'no_vat'
                if (!clientData.isVatRegistered) {
                    const items = form.getValues('lineItems') || [];
                    items.forEach((_, index) => {
                        form.setValue(`lineItems.${index}.vatType`, 'no_vat');
                    });
                }
            }
            
            const customersQuery = query(collection(db, `aiAccountantClients/${clientId}/customers`), orderBy("name"));
            const customersSnapshot = await getDocs(customersQuery);
            setCustomers(customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientCustomer)));
            
            const quotesQuery = query(collection(db, `aiAccountantClients/${clientId}/quotes`), orderBy("createdAt", "desc"));
            const quotesSnapshot = await getDocs(quotesQuery);
            setQuotes(quotesSnapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return { 
                    id: docSnap.id, 
                    ...data,
                    quoteDate: data.quoteDate.toDate(),
                    expiryDate: data.expiryDate.toDate(),
                } as Quote
            }));

        } catch (e) {
            toast({ title: 'Error', description: 'Failed to fetch data.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [clientId]);

    const onSubmit = async (data: QuoteFormValues) => {
        if (!client || !client.id) return;
        
        const isVatPayer = client?.isVatRegistered;
        let subtotal = 0;
        let vat = 0;
        data.lineItems.forEach(line => {
            const lineSubtotal = (line.quantity || 0) * (line.rate || 0);
            subtotal += lineSubtotal;
            if (isVatPayer && line.vatType === 'standard_rated_sales') {
                vat += lineSubtotal * 0.15;
            }
        });
        const total = subtotal + vat;

        const isEditing = Boolean(editingQuote);
        const quoteId = isEditing ? editingQuote!.id : String(client.nextQuoteNumber || 1000);
        
        try {
            const batch = writeBatch(db);
            const quoteRef = doc(db, `aiAccountantClients/${clientId}/quotes`, quoteId);

            const isDraft = submitMode.current === 'draft';

            batch.set(quoteRef, {
                ...data,
                status: isDraft ? 'draft' : (isEditing ? editingQuote!.status : 'sent'),
                subtotal: subtotal,
                vat: vat,
                total: total,
                ...(isEditing ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() })
            }, { merge: true });

            if (!isEditing) {
                // Increment quote number on client profile
                const clientRef = doc(db, 'aiAccountantClients', clientId);
                batch.update(clientRef, { nextQuoteNumber: (client.nextQuoteNumber || 1000) + 1 });
            }

            await batch.commit();

            toast({ title: isEditing ? `Quote QT-${quoteId} Updated` : (isDraft ? 'Draft Saved' : 'Quote Created'), description: isEditing ? 'Quote details updated.' : `Quote QT-${quoteId} has been successfully saved.` });
            setEditingQuote(null);
            form.reset({
                 reference: '',
                 quoteDate: new Date(),
                 expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                 description: '',
                 lineItems: [{ accountId: '', description: '', quantity: 1, rate: 0, vatType: client?.isVatRegistered ? 'standard_rated_sales' : 'no_vat' }],
                 notes: '',
            });
            fetchData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save quote.', variant: 'destructive' });
            console.error(error);
        }
    };
    
    const vatTypes = allVatTypes.filter(vt => vt.category === 'Output Tax');

    return (
        <>
            <div className="space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>{editingQuote ? `Edit Quote QT-${editingQuote.id}` : 'Create New Quote'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                     <FormField control={form.control} name="currency" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel className="mb-1">Currency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-10"><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="ZAR">ZAR (R)</SelectItem><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="GBP">GBP (£)</SelectItem><SelectItem value="AUD">AUD ($)</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                                     <FormField
                                        control={form.control}
                                        name="customerId"
                                        render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="mb-1">Customer</FormLabel>
                                            <AccountSelector
                                                client={client}
                                                customers={customers}
                                                showAccounts={false}
                                                showCustomers={true}
                                                value={field.value ? { value: field.value, type: 'customer' } : null}
                                                onChange={(selection) => {
                                                    form.setValue("customerId", selection.value);
                                                }}
                                                placeholder="Select customer..."
                                            />
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="reference"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="mb-1">Reference / PO #</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. PO-12345 or Ref" {...field} className="h-10" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField control={form.control} name="quoteDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel className="mb-1">Quote Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-10",!field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "dd MMMM yyyy") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                                    <FormField control={form.control} name="expiryDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel className="mb-1">Expiry Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-10",!field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "dd MMMM yyyy") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quote Description / Subject</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Consulting services for Q3, Website development proposal..." {...field} className="h-10"/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Separator />
                                <div>
                                    <h3 className="text-lg font-medium mb-4">Line Items</h3>
                                    <div className="space-y-4">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border p-3 rounded-lg bg-card">
                                                <div className="md:col-span-3">
                                                    <FormLabel className="text-xs mb-1 block">Account</FormLabel>
                                                    <AccountSelector
                                                        client={client}
                                                        value={form.watch(`lineItems.${index}.accountId`) ? { value: form.watch(`lineItems.${index}.accountId`), type: 'account' } : null}
                                                        onChange={(sel) => handleAccountChange(sel.value, index)}
                                                        placeholder="Select account..."
                                                        showAccounts={true}
                                                        showCustomers={false}
                                                        showSuppliers={false}
                                                    />
                                                </div>
                                                <div className="md:col-span-3">
                                                    <FormLabel className="text-xs mb-1 block">Description</FormLabel>
                                                    <Input {...form.register(`lineItems.${index}.description` as const)} placeholder="Item description" className="h-10 text-xs"/>
                                                </div>
                                                <div className="md:col-span-1">
                                                    <FormLabel className="text-xs mb-1 block">Quantity</FormLabel>
                                                    <Input type="number" {...form.register(`lineItems.${index}.quantity` as const)} className="h-10 text-xs text-center"/>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <FormLabel className="text-xs mb-1 block">Rate</FormLabel>
                                                    <Input type="number" step="0.01" {...form.register(`lineItems.${index}.rate` as const)} className="h-10 text-xs text-right"/>
                                                </div>
                                                {client?.isVatRegistered ? (
                                                    <div className="md:col-span-2">
                                                        <FormLabel className="text-xs mb-1 block">VAT</FormLabel>
                                                        <Select onValueChange={(v) => form.setValue(`lineItems.${index}.vatType`, v)} value={form.watch(`lineItems.${index}.vatType`)}>
                                                             <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
                                                             <SelectContent>
                                                                 {vatTypes.map(vt => <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>)}
                                                             </SelectContent>
                                                        </Select>
                                                    </div>
                                                ) : null}
                                                <div className="md:col-span-1 flex justify-center">
                                                    <Button aria-label="Delete" type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1} className="h-10 w-10 text-destructive hover:text-destructive/80">
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => append({ accountId: '', description: '', quantity: 1, rate: 0, vatType: client?.isVatRegistered ? 'standard_rated_sales' : 'no_vat' })}>
                                        <Plus className="mr-2 h-4 w-4"/> Add Line
                                    </Button>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Notes / Terms</FormLabel>
                                                <FormControl><Textarea placeholder="Quote terms and notes..." className="min-h-[120px]" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <QuoteTotals control={form.control} isVatRegistered={client?.isVatRegistered} />
                                </div>
                                <div className="flex gap-3 justify-end">
                                    {editingQuote && (
                                        <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                            <X className="mr-2 h-4 w-4" /> Cancel Editing
                                        </Button>
                                    )}
                                    <Button type="submit" variant="secondary" onClick={() => { submitMode.current = 'draft'; }}>
                                        {editingQuote ? 'Save Draft Updates' : 'Save Draft'}
                                    </Button>
                                    <Button type="submit" onClick={() => { submitMode.current = 'sent'; }}>
                                        {editingQuote ? 'Update Quote' : 'Create & Send Quote'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                 </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Quotes Register</CardTitle>
                        <CardDescription>Track and manage generated quotes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between gap-4 items-center mb-6 flex-wrap">
                            <Input placeholder="Search quotes..." className="max-w-xs h-9 text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                            <div className="flex gap-2 items-center">
                                <span className="text-xs text-muted-foreground">Status:</span>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="sent">Sent</SelectItem>
                                        <SelectItem value="accepted">Accepted</SelectItem>
                                        <SelectItem value="declined">Declined</SelectItem>
                                        <SelectItem value="invoiced">Invoiced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="border rounded-lg overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Quote #</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Expiry Date</TableHead>
                                        <TableHead className="text-right">Amount (Incl)</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={9} className="text-center h-32"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary"/></TableCell></TableRow>
                                    ) : filteredQuotes.length === 0 ? (
                                        <TableRow><TableCell colSpan={9} className="text-center h-32 text-muted-foreground">No quotes found.</TableCell></TableRow>
                                    ) : (
                                        filteredQuotes.map((quote) => {
                                            const customer = customers.find(c => c.id === quote.customerId);
                                            const currency = quote.currency || 'ZAR';
                                            return (
                                                <TableRow key={quote.id}>
                                                    <TableCell className="font-semibold">QT-{quote.id}</TableCell>
                                                    <TableCell className="max-w-[150px] truncate">{customer?.name || 'N/A'}</TableCell>
                                                    <TableCell className="text-muted-foreground font-mono text-xs max-w-[140px] truncate" title={quote.reference || ''}>{quote.reference || '-'}</TableCell>
                                                    <TableCell className="max-w-[200px] truncate">{quote.description || 'N/A'}</TableCell>
                                                    <TableCell>{format(quote.quoteDate, 'dd MMM yyyy')}</TableCell>
                                                    <TableCell>{format(quote.expiryDate, 'dd MMM yyyy')}</TableCell>
                                                    <TableCell className="text-right font-mono font-semibold">{formatPrice(quote.total, currency)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant={
                                                            quote.status === 'accepted' ? 'success' :
                                                            quote.status === 'declined' ? 'destructive' :
                                                            quote.status === 'sent' ? 'info' :
                                                            quote.status === 'invoiced' ? 'default' :
                                                            'secondary'
                                                        }>
                                                            {quote.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                         <DropdownMenu>
                                                             <DropdownMenuTrigger asChild>
                                                                 <Button aria-label="More actions" variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button>
                                                             </DropdownMenuTrigger>
                                                             <DropdownMenuContent align="end">
                                                                 <DropdownMenuItem onClick={() => setViewingQuote(quote)}>
                                                                     <Eye className="mr-2 h-3.5 w-3.5" /> View / Download
                                                                 </DropdownMenuItem>
                                                                 <DropdownMenuItem onClick={() => handleEditQuote(quote)}>
                                                                     <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Quote
                                                                 </DropdownMenuItem>
                                                                 <DropdownMenuItem onClick={() => handleDuplicateQuote(quote)}>
                                                                     <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                                                                 </DropdownMenuItem>
                                                                 {quote.status !== 'invoiced' && (
                                                                     <>
                                                                         <DropdownMenuItem onClick={() => handleUpdateStatus(quote.id, 'accepted')}>
                                                                             <CheckCircle className="mr-2 h-3.5 w-3.5 text-green-600" /> Mark Accepted
                                                                         </DropdownMenuItem>
                                                                         <DropdownMenuItem onClick={() => handleUpdateStatus(quote.id, 'declined')}>
                                                                             <Ban className="mr-2 h-3.5 w-3.5 text-red-600" /> Mark Declined
                                                                         </DropdownMenuItem>
                                                                     </>
                                                                 )}
                                                                 {quote.status === 'accepted' && (
                                                                     <DropdownMenuItem onClick={() => handleConvertToInvoice(quote)} disabled={isConverting}>
                                                                         <ArrowRight className="mr-2 h-3.5 w-3.5 text-blue-600" /> Convert to Invoice
                                                                     </DropdownMenuItem>
                                                                 )}
                                                             </DropdownMenuContent>
                                                         </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                 </Card>
            </div>

            <Dialog open={!!viewingQuote} onOpenChange={(open) => !open && setViewingQuote(null)}>
                <DialogContent className="max-w-4xl p-6">
                    <DialogHeader>
                        <DialogTitle>Quote Details</DialogTitle>
                        <DialogDescription>Preview and download quote QT-{viewingQuote?.id}.</DialogDescription>
                    </DialogHeader>
                    {viewingQuote && (
                        <div className="mt-4">
                            <QuotePreview 
                                quote={viewingQuote} 
                                client={client} 
                                customer={customers.find(c => c.id === viewingQuote.customerId)} 
                            />
                            <DialogFooter className="mt-6 flex justify-end gap-2">
                                <QuoteDownloadButton 
                                    quote={viewingQuote} 
                                    client={client} 
                                    customer={customers.find(c => c.id === viewingQuote.customerId)} 
                                />
                                <Button variant="secondary" onClick={() => setViewingQuote(null)}>Close</Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

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
import { Loader2, Plus, Trash2, CalendarIcon, PlusCircle, MoreHorizontal, Eye, Copy, FileText, Mail, Download, CheckCircle, ChevronsUpDown, CheckCheck } from 'lucide-react';
import { getFirestore, doc, addDoc, getDoc, collection, query, orderBy, getDocs, updateDoc, writeBatch, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { User, Invoice, ClientCustomer, ChartOfAccount } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList, CommandGroup } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { allVatTypes } from '@/lib/vat-types';
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import InvoicePreview from '@/components/admin/InvoicePreview';
import InvoiceDownloadButton from '@/components/pdf/InvoiceDownloadButton';
import { AccountSelector } from '@/components/accounting/AccountSelector';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

const db = getFirestore(firebaseApp);

const lineItemSchema = z.object({
    accountId: z.string().min(1, "Please select an account."),
    description: z.string().min(1, "Description is required."),
    quantity: z.preprocess((val) => Number(val), z.number().min(1)),
    rate: z.preprocess((val) => Number(val), z.number().min(0)),
    vatType: z.string().default('standard_rated_sales'),
});

const invoiceFormSchema = z.object({
    customerId: z.string().min(1, "Please select a customer."),
    invoiceDate: z.date({ required_error: "Invoice date is required." }),
    dueDate: z.date({ required_error: "Due date is required." }),
    lineItems: z.array(lineItemSchema).min(1, "At least one line item is required."),
    notes: z.string().optional(),
    currency: z.string().default('ZAR'),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

const formatPrice = (price: number, currency: string = 'ZAR') => {
  return new Intl.NumberFormat('en-ZA', { 
    style: 'currency', 
    currency: currency,
    minimumFractionDigits: 2 
  }).format(price);
};

// A new component to calculate and display totals
function InvoiceTotals({ control, isVatRegistered }: { control: any, isVatRegistered: boolean | undefined }) {
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

export default function InvoicesPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.clientId as string;
    const [client, setClient] = useState<User | null>(null);
    const [customers, setCustomers] = useState<ClientCustomer[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
    const [emailInvoice, setEmailInvoice] = useState<Invoice | null>(null);
    const [emailAddress, setEmailAddress] = useState("kev@thinkestry.co.za");
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const submitMode = useRef<'draft' | 'final'>('final');

    const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentDate, setPaymentDate] = useState<Date>(new Date());
    const [paymentAccountId, setPaymentAccountId] = useState<string>('');
    const [paymentReference, setPaymentReference] = useState<string>('');
    const [isSavingPayment, setIsSavingPayment] = useState(false);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            const customer = customers.find(c => c.id === invoice.customerId);
            const matchesSearch = !searchQuery || 
                customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                invoice.id.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

            let matchesDate = true;
            if (dateRange?.from) {
                if (invoice.invoiceDate.getTime() < dateRange.from.getTime()) matchesDate = false;
            }
            if (dateRange?.to) {
                if (invoice.invoiceDate.getTime() > dateRange.to.getTime()) matchesDate = false;
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [invoices, customers, searchQuery, statusFilter, dateRange]);

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceFormSchema),
        defaultValues: {
            invoiceDate: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            lineItems: [{ accountId: '', description: '', quantity: 1, rate: 0, vatType: 'standard_rated_sales' }],
            notes: '',
            currency: 'ZAR',
        },
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "lineItems",
    });

    const handleDuplicateInvoice = (invoice: Invoice) => {
        form.reset({
            customerId: invoice.customerId,
            invoiceDate: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            lineItems: invoice.lineItems,
            notes: invoice.notes,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast({ title: 'Invoice Duplicated', description: 'The form has been pre-filled with the duplicate details.' });
    };

    const handleSavePayment = async () => {
        if (!paymentInvoice || !client || !paymentAccountId || paymentAmount <= 0) {
            toast({ title: "Error", description: "Please enter a valid amount and select an account.", variant: "destructive" });
            return;
        }
        setIsSavingPayment(true);
        try {
            const batch = writeBatch(db);
            const customerControlAccount = client.chartOfAccounts?.find(acc => acc.accountNumber === '8000-001')?.id;

            if (!customerControlAccount) {
                throw new Error("Customer Control Account not found.");
            }

            // Debit Selected Bank Account
            const debitRef = doc(collection(db, 'aiAccountantClients', client.id, 'transactions'));
            batch.set(debitRef, {
                clientId: client.id,
                date: paymentDate.toISOString(),
                reference: paymentReference,
                description: `Payment for Invoice ${paymentInvoice.id}`,
                amount: paymentAmount,
                isExpense: false,
                bankAccountId: 'JOURNAL',
                allocatedTo: { value: paymentAccountId, type: 'account' },
                vatType: 'no_vat',
                vatAmount: 0,
                status: 'allocated',
                allocatedAt: serverTimestamp()
            });

            // Credit Accounts Receivable
            const creditRef = doc(collection(db, 'aiAccountantClients', client.id, 'transactions'));
            batch.set(creditRef, {
                clientId: client.id,
                date: paymentDate.toISOString(),
                reference: paymentReference,
                description: `Payment applied to Invoice ${paymentInvoice.id}`,
                amount: -paymentAmount,
                isExpense: false,
                bankAccountId: 'JOURNAL',
                allocatedTo: { value: customerControlAccount, type: 'account' },
                vatType: 'no_vat',
                vatAmount: 0,
                status: 'allocated',
                allocatedAt: serverTimestamp()
            });

            // Update Invoice
            const currentPaid = paymentInvoice.amountPaid || 0;
            const newPaid = currentPaid + paymentAmount;
            const currentBalance = paymentInvoice.balanceDue !== undefined ? paymentInvoice.balanceDue : paymentInvoice.total;
            const newBalance = currentBalance - paymentAmount;
            
            let newStatus = paymentInvoice.status;
            if (newBalance <= 0) newStatus = 'paid';
            else if (newPaid > 0) newStatus = 'partial';

            const invRef = doc(db, `aiAccountantClients/${client.id}/invoices`, paymentInvoice.id);
            batch.update(invRef, {
                amountPaid: newPaid,
                balanceDue: newBalance,
                status: newStatus
            });

            await batch.commit();
            toast({ title: 'Payment Recorded', description: 'The payment has been successfully recorded.' });
            setPaymentInvoice(null);
            fetchData();
        } catch(e: any) {
            console.error(e);
            toast({ title: 'Error', description: e.message || 'Failed to record payment.', variant: 'destructive' });
        } finally {
            setIsSavingPayment(false);
        }
    };

    const handleSendEmail = async () => {
        if (!emailInvoice || !emailAddress || !client) return;
        setIsSendingEmail(true);
        try {
            const { sendInvoiceEmailAction } = await import('@/app/actions');
            const customer = customers.find(c => c.id === emailInvoice.customerId);
            if (!customer) throw new Error("Customer not found.");
            const res = await sendInvoiceEmailAction({ invoice: emailInvoice, client, customer, recipientEmail: emailAddress });
            if (res.success) {
                toast({ title: 'Email Sent', description: `Invoice emailed to ${emailAddress}.` });
                setEmailInvoice(null);
            } else {
                toast({ title: 'Error', description: res.error, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: 'Failed to send email.', variant: 'destructive' });
        } finally {
            setIsSendingEmail(false);
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
                if (clientData.defaultInvoiceMessage) {
                    form.setValue('notes', clientData.defaultInvoiceMessage);
                }
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
            
            const invoicesQuery = query(collection(db, `aiAccountantClients/${clientId}/invoices`), orderBy("invoiceDate", "desc"));
            const invoicesSnapshot = await getDocs(invoicesQuery);
            setInvoices(invoicesSnapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return { 
                    id: docSnap.id, 
                    ...data,
                    invoiceDate: data.invoiceDate.toDate(),
                    dueDate: data.dueDate.toDate(),
                } as Invoice
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

    const onSubmit = async (data: InvoiceFormValues) => {
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

        const nextInvoiceNumber = client.nextInvoiceNumber || 9000;
        const invoiceId = String(nextInvoiceNumber);
        
        try {
            const batch = writeBatch(db);
            const invoiceRef = doc(db, `aiAccountantClients/${clientId}/invoices`, invoiceId);

            const isDraft = submitMode.current === 'draft';

            batch.set(invoiceRef, {
                ...data,
                status: isDraft ? 'draft' : 'final',
                subtotal: subtotal,
                vat: vat,
                total: total,
                amountPaid: 0,
                balanceDue: total,
                createdAt: serverTimestamp(),
            });

            // Increment invoice number on client profile
            const clientRef = doc(db, 'aiAccountantClients', clientId);
            batch.update(clientRef, { nextInvoiceNumber: nextInvoiceNumber + 1 });

            if (!isDraft) {
                const customerControlAccount = client.chartOfAccounts?.find(acc => acc.accountNumber === '8000-001')?.id;
                const vatControlAccount = client.chartOfAccounts?.find(acc => acc.accountNumber === '7000-008')?.id;

                if (!customerControlAccount || (client.isVatRegistered && !vatControlAccount)) {
                    throw new Error("Control accounts not found in Chart of Accounts.");
                }
                
                // 1. Debit Customer Control
            const debitTxRef = doc(collection(db, 'aiAccountantClients', client.id, 'transactions'));
            batch.set(debitTxRef, {
                clientId: client.id,
                date: data.invoiceDate.toISOString(),
                reference: `INV-${invoiceId}`,
                description: `Invoice to ${customers.find(c => c.id === data.customerId)?.name}`,
                amount: total,
                isExpense: total < 0,
                bankAccountId: 'JOURNAL',
                allocatedTo: { value: customerControlAccount, type: 'account' },
                vatType: 'no_vat',
                vatAmount: 0,
                status: 'allocated',
                allocatedAt: serverTimestamp(),
            });

            // 2. Credit Sales Accounts
            data.lineItems.forEach(line => {
                const lineTotal = line.quantity * line.rate;
                const salesCreditRef = doc(collection(db, 'aiAccountantClients', client.id, 'transactions'));
                batch.set(salesCreditRef, {
                    clientId: client.id,
                    date: data.invoiceDate.toISOString(),
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
            
            // 3. Credit VAT Control
            if (vat > 0 && vatControlAccount) {
                 const vatCreditRef = doc(collection(db, 'aiAccountantClients', client.id, 'transactions'));
                batch.set(vatCreditRef, {
                    clientId: client.id,
                    date: data.invoiceDate.toISOString(),
                    reference: `INV-${invoiceId}`,
                    description: `VAT on Invoice`,
                    amount: -vat,
                    isExpense: -vat < 0,
                    bankAccountId: 'JOURNAL',
                    allocatedTo: { value: vatControlAccount, type: 'account' },
                    vatType: 'no_vat',
                    vatAmount: 0,
                    status: 'allocated',
                    allocatedAt: serverTimestamp(),
                });
            }
            }

            await batch.commit();

            toast({ title: isDraft ? 'Draft Saved' : 'Invoice Finalized', description: isDraft ? 'The invoice has been saved as a draft.' : 'The invoice has been created and posted to the general ledger.' });
            form.reset({
                 invoiceDate: new Date(),
                 dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                 lineItems: [{ accountId: '', description: '', quantity: 1, rate: 0, vatType: client?.isVatRegistered ? 'standard_rated_sales' : 'no_vat' }],
                 notes: client?.defaultInvoiceMessage || '',
            });
            fetchData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to create invoice.', variant: 'destructive' });
            console.error(error);
        }
    };
    
    const vatTypes = allVatTypes.filter(vt => vt.category === 'Output Tax');

    return (
        <>
            <div className="space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Create New Invoice</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                    <FormField control={form.control} name="invoiceDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel className="mb-1">Invoice Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-10",!field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "dd MMMM yyyy") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                                    <FormField control={form.control} name="dueDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel className="mb-1">Due Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-10",!field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "dd MMMM yyyy") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                                </div>
                                <Separator />
                                <div>
                                    <h3 className="text-lg font-medium mb-4">Line Items</h3>
                                    <div className="space-y-4">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="grid grid-cols-12 gap-x-3 gap-y-2 p-3 border rounded-md relative items-start">
                                                <div className={cn("col-span-12", client?.isVatRegistered ? "md:col-span-3" : "md:col-span-4")}>
                                                    <FormField
                                                        control={form.control}
                                                        name={`lineItems.${index}.accountId`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Account</FormLabel>
                                                                <AccountSelector
                                                                    client={client}
                                                                    showAccounts={true}
                                                                    showCustomers={false}
                                                                    showSuppliers={false}
                                                                    value={field.value ? { value: field.value, type: 'account' } : null}
                                                                    onChange={(selection) => {
                                                                        handleAccountChange(selection.value, index);
                                                                    }}
                                                                    filterAccounts={(acc) => acc.accountNumber?.startsWith('1000-')}
                                                                    placeholder="Select account"
                                                                />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className={cn("col-span-12", client?.isVatRegistered ? "md:col-span-3" : "md:col-span-4")}>
                                                    <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} className="h-10"/></FormControl><FormMessage /></FormItem> )}/>
                                                </div>
                                                <div className="col-span-4 md:col-span-1"><FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => ( <FormItem><FormLabel>Qty</FormLabel><FormControl><Input type="number" {...field} className="h-10"/></FormControl><FormMessage /></FormItem> )}/></div>
                                                <div className="col-span-4 md:col-span-2"><FormField control={form.control} name={`lineItems.${index}.rate`} render={({ field }) => ( <FormItem><FormLabel>Rate</FormLabel><FormControl><Input type="number" {...field} className="h-10"/></FormControl><FormMessage /></FormItem> )}/></div>
                                                {client?.isVatRegistered && (
                                                     <div className="col-span-4 md:col-span-2">
                                                         <FormField control={form.control} name={`lineItems.${index}.vatType`} render={({ field }) => ( <FormItem><FormLabel>VAT Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-10 text-xs"><SelectValue/></SelectTrigger></FormControl><SelectContent>{vatTypes.map(vt => <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                                                     </div>
                                                )}
                                                <div className="col-span-12 md:col-span-1 flex items-end h-[68px]">
                                                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="w-full h-10 mb-[2px]"><Trash2 className="h-4 w-4"/></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={() => append({ accountId: '', description: '', quantity: 1, rate: 0, vatType: client?.isVatRegistered ? 'standard_rated_sales' : 'no_vat' })} className="mt-4"><PlusCircle className="mr-2 h-4 w-4"/>Add Line</Button>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Invoice Notes / Payment Instructions</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="e.g. Thank you for your business. Payment is due within 14 days." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <InvoiceTotals control={form.control} isVatRegistered={client?.isVatRegistered} />
                                <div className="flex justify-end gap-2 pt-4">
                                  <Button type="submit" variant="secondary" onClick={() => submitMode.current = 'draft'} disabled={isLoading}>
                                    {isLoading && submitMode.current === 'draft' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving...</> : "Save as Draft"}
                                  </Button>
                                  <Button type="submit" onClick={() => submitMode.current = 'final'} disabled={isLoading}>
                                    {isLoading && submitMode.current === 'final' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Finalizing...</> : "Finalize & Post Invoice"}
                                  </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Separator />
                <Card>
                    <CardHeader>
                        <CardTitle>Posted Invoices</CardTitle>
                        <CardDescription>A list of invoices created for {client?.name}.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="space-y-2 flex-1">
                                <Label className="mb-2 block font-medium text-sm">Search</Label>
                                <Input 
                                    placeholder="Search by customer or invoice #" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 w-full md:w-48">
                                <Label className="mb-2 block font-medium text-sm">Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="final">Final (Unpaid)</SelectItem>
                                        <SelectItem value="partial">Partial Payment</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 w-full md:w-[350px]">
                                <Label className="mb-2 block font-medium text-sm">Date Range</Label>
                                <DateRangePicker onDateChange={setDateRange} value={dateRange} financialYearEnd={client?.yearEnd} />
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Paid</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInvoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                No invoices created yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredInvoices.map((invoice) => (
                                            <TableRow key={invoice.id}>
                                                <TableCell className="font-mono">{invoice.id}</TableCell>
                                                <TableCell>{customers.find(c => c.id === invoice.customerId)?.name}</TableCell>
                                                <TableCell>{format(invoice.invoiceDate, "dd/MM/yyyy")}</TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-full text-xs font-medium",
                                                        invoice.status === 'draft' ? "bg-slate-100 text-slate-700" :
                                                        invoice.status === 'paid' ? "bg-green-100 text-green-700" :
                                                        invoice.status === 'partial' ? "bg-amber-100 text-amber-700" :
                                                        invoice.status === 'overdue' ? "bg-red-100 text-red-700" :
                                                        "bg-blue-100 text-blue-700"
                                                    )}>
                                                        {invoice.status.toUpperCase()}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">{formatPrice(invoice.total, invoice.currency)}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">{formatPrice(invoice.amountPaid || 0, invoice.currency)}</TableCell>
                                                <TableCell className="text-right font-medium">{formatPrice(invoice.balanceDue !== undefined ? invoice.balanceDue : invoice.total, invoice.currency)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <InvoiceDownloadButton
                                                            invoice={invoice}
                                                            client={client}
                                                            customer={customers.find(c => c.id === invoice.customerId)}
                                                        />
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DialogTrigger asChild>
                                                                    <DropdownMenuItem onSelect={() => setViewingInvoice(invoice)}>
                                                                        <Eye className="mr-2 h-4 w-4" />View Preview
                                                                    </DropdownMenuItem>
                                                                </DialogTrigger>
                                                                <DropdownMenuItem onSelect={() => {
                                                                    setPaymentInvoice(invoice);
                                                                    setPaymentAmount(invoice.balanceDue !== undefined ? invoice.balanceDue : invoice.total);
                                                                    setPaymentDate(new Date());
                                                                    setPaymentAccountId('');
                                                                    setPaymentReference(`Payment INV-${invoice.id}`);
                                                                }}>
                                                                    <CheckCircle className="mr-2 h-4 w-4" />Record Payment
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => handleDuplicateInvoice(invoice)}><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => router.push(`/admin/ai-accountant/${clientId}/credit-notes?invoiceId=${invoice.id}`)}>
                                                                    <FileText className="mr-2 h-4 w-4" />Issue Credit Note
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => {
                                                                    setEmailInvoice(invoice);
                                                                    setEmailAddress("kev@thinkestry.co.za");
                                                                }}><Mail className="mr-2 h-4 w-4" />Email to Client</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

            </div>
            
            <Dialog open={!!viewingInvoice} onOpenChange={(isOpen) => !isOpen && setViewingInvoice(null)}>
             <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Tax Invoice Preview</DialogTitle>
                </DialogHeader>
                {viewingInvoice && (
                    <>
                    <InvoicePreview
                        invoice={viewingInvoice}
                        client={client}
                        customer={customers.find(c => c.id === viewingInvoice.customerId)}
                    />
                    <DialogFooter>
                        <InvoiceDownloadButton
                            invoice={viewingInvoice}
                            client={client}
                            customer={customers.find(c => c.id === viewingInvoice.customerId)}
                        />
                    </DialogFooter>
                    </>
                )}
             </DialogContent>
            </Dialog>

            <Dialog open={!!emailInvoice} onOpenChange={(isOpen) => !isOpen && setEmailInvoice(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Email Invoice</DialogTitle>
                        <DialogDescription>Send invoice #{emailInvoice?.id} to the client.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="mb-2 block font-medium text-sm">Send To Email</Label>
                            <Input 
                                value={emailAddress} 
                                onChange={(e) => setEmailAddress(e.target.value)} 
                                placeholder="Email address"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEmailInvoice(null)}>Cancel</Button>
                        <Button onClick={handleSendEmail} disabled={isSendingEmail}>
                            {isSendingEmail ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Sending...</> : "Send Email"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!paymentInvoice} onOpenChange={(isOpen) => !isOpen && setPaymentInvoice(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>Record a payment for Invoice #{paymentInvoice?.id}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="mb-2 block font-medium text-sm">Amount Received</Label>
                            <Input 
                                type="number" 
                                step="0.01" 
                                value={paymentAmount || ''} 
                                onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)} 
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label className="mb-2 block font-medium text-sm">Payment Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-10", !paymentDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {paymentDate ? format(paymentDate, "dd MMMM yyyy") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={paymentDate} onSelect={(d) => d && setPaymentDate(d)} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label className="mb-2 block font-medium text-sm">Deposited To (Bank Account)</Label>
                            <AccountSelector 
                                client={client} 
                                customers={customers} 
                                showAccounts={true} 
                                showCustomers={false} 
                                value={paymentAccountId ? { value: paymentAccountId, type: 'account' } : null} 
                                onChange={s => setPaymentAccountId(s.value)} 
                                placeholder="Select bank account..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="mb-2 block font-medium text-sm">Reference</Label>
                            <Input value={paymentReference} onChange={e => setPaymentReference(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentInvoice(null)}>Cancel</Button>
                        <Button onClick={handleSavePayment} disabled={isSavingPayment || !paymentAmount || !paymentAccountId}>
                            {isSavingPayment ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving...</> : "Save Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

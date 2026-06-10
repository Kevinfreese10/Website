'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2, CalendarIcon, PlusCircle, MoreHorizontal, Eye, FileText, Download, CheckCircle, ChevronsUpDown } from 'lucide-react';
import { getFirestore, doc, getDoc, collection, query, orderBy, getDocs, updateDoc, writeBatch, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { User, Invoice, ClientCustomer, ChartOfAccount, CreditNote } from '@/lib/types';
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
import { AccountSelector } from '@/components/accounting/AccountSelector';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const db = getFirestore(firebaseApp);

const lineItemSchema = z.object({
    accountId: z.string().min(1, "Please select an account."),
    description: z.string().min(1, "Description is required."),
    quantity: z.preprocess((val) => Number(val), z.number().min(1)),
    rate: z.preprocess((val) => Number(val), z.number().min(0)),
    vatType: z.string().default('standard_rated_sales'),
});

const creditNoteFormSchema = z.object({
    customerId: z.string().min(1, "Please select a customer."),
    invoiceId: z.string().optional(),
    creditNoteDate: z.date({ required_error: "Credit Note date is required." }),
    lineItems: z.array(lineItemSchema).min(1, "At least one line item is required."),
    notes: z.string().optional(),
});

type CreditNoteFormValues = z.infer<typeof creditNoteFormSchema>;

const formatPrice = (price: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);

function CreditNoteTotals({ control, isVatRegistered }: { control: any, isVatRegistered: boolean | undefined }) {
  const watchedLines = useWatch({
    control,
    name: "lineItems",
  });

  const totals = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    watchedLines?.forEach((line: any) => {
      const lineSubtotal = (line.quantity || 0) * (line.rate || 0);
      subtotal += lineSubtotal;
      if (isVatRegistered && line.vatType === 'standard_rated_sales') {
        vat += lineSubtotal * 0.15;
      }
    });
    const total = subtotal + vat;
    return { subtotal, vat, total };
  }, [watchedLines, isVatRegistered]);

  return (
    <CardFooter className="p-4 bg-muted rounded-lg mt-4 flex flex-col items-end gap-2 max-w-sm ml-auto">
        <div className="flex justify-between w-full text-sm"><span className="text-muted-foreground">Subtotal:</span><span>{formatPrice(totals.subtotal)}</span></div>
        {isVatRegistered && <div className="flex justify-between w-full text-sm"><span className="text-muted-foreground">VAT (15%):</span><span>{formatPrice(totals.vat)}</span></div>}
        <div className="flex justify-between w-full font-bold text-lg"><span>Total Credit:</span><span>{formatPrice(totals.total)}</span></div>
    </CardFooter>
  );
}

function CreditNotesPageContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const clientId = params.clientId as string;
    const invoiceIdParam = searchParams.get('invoiceId');

    const [client, setClient] = useState<User | null>(null);
    const [customers, setCustomers] = useState<ClientCustomer[]>([]);
    const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [viewingCreditNote, setViewingCreditNote] = useState<CreditNote | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const form = useForm<CreditNoteFormValues>({
        resolver: zodResolver(creditNoteFormSchema),
        defaultValues: {
            creditNoteDate: new Date(),
            lineItems: [{ accountId: '', description: '', quantity: 1, rate: 0, vatType: 'standard_rated_sales' }],
            notes: '',
            invoiceId: '',
        },
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "lineItems",
    });

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
                    form.getValues('lineItems').forEach((_, index) => {
                        form.setValue(`lineItems.${index}.vatType`, 'no_vat');
                    });
                }
            }
            
            const customersQuery = query(collection(db, `aiAccountantClients/${clientId}/customers`), orderBy("name"));
            const customersSnapshot = await getDocs(customersQuery);
            setCustomers(customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientCustomer)));
            
            const creditNotesQuery = query(collection(db, `aiAccountantClients/${clientId}/creditNotes`), orderBy("creditNoteDate", "desc"));
            const creditNotesSnapshot = await getDocs(creditNotesQuery);
            setCreditNotes(creditNotesSnapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return { 
                    id: docSnap.id, 
                    ...data,
                    creditNoteDate: data.creditNoteDate.toDate(),
                } as CreditNote;
            }));

        } catch (e) {
            toast({ title: 'Error', description: 'Failed to fetch credit notes data.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [clientId]);

    // Handle auto-prefilling from invoice link parameter
    useEffect(() => {
        const fetchInvoiceForCrediting = async () => {
            if (invoiceIdParam && clientId) {
                try {
                    const invoiceRef = doc(db, `aiAccountantClients/${clientId}/invoices`, invoiceIdParam);
                    const invoiceSnap = await getDoc(invoiceRef);
                    if (invoiceSnap.exists()) {
                        const invData = invoiceSnap.data() as Invoice;
                        form.setValue('customerId', invData.customerId);
                        form.setValue('invoiceId', invoiceIdParam);
                        form.setValue('notes', `Credit Note for Invoice #${invoiceIdParam}.`);
                        
                        const lines = invData.lineItems.map((line) => ({
                            accountId: line.accountId,
                            description: line.description,
                            quantity: line.quantity,
                            rate: line.rate,
                            vatType: line.vatType || 'standard_rated_sales'
                        }));
                        form.setValue('lineItems', lines);
                        setIsCreateDialogOpen(true);

                        // Clear the query parameter so it doesn't open again on page refresh
                        router.replace(`/admin/ai-accountant/${clientId}/credit-notes`);
                    } else {
                        toast({ title: 'Invoice Not Found', description: `Could not locate invoice #${invoiceIdParam} to credit.`, variant: 'destructive' });
                    }
                } catch (err) {
                    console.error("Error pre-filling credit note from invoice:", err);
                    toast({ title: 'Error', description: 'Failed to retrieve invoice details.', variant: 'destructive' });
                }
            }
        };

        if (clientId && invoiceIdParam && accounts.length > 0) {
            fetchInvoiceForCrediting();
        }
    }, [clientId, invoiceIdParam, accounts]);

    const onSubmit = async (data: CreditNoteFormValues) => {
        if (!client || !client.id) return;
        
        const isVatPayer = client.isVatRegistered;
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

        const nextCreditNoteNumber = client.nextCreditNoteNumber || 5000;
        const creditNoteId = String(nextCreditNoteNumber);
        
        try {
            const batch = writeBatch(db);
            const cnRef = doc(db, `aiAccountantClients/${clientId}/creditNotes`, creditNoteId);

            batch.set(cnRef, {
                ...data,
                status: 'final',
                subtotal: subtotal,
                vat: vat,
                total: total,
                createdAt: serverTimestamp(),
            });

            // Increment credit note number on client profile
            const clientRef = doc(db, 'aiAccountantClients', clientId);
            batch.update(clientRef, { nextCreditNoteNumber: nextCreditNoteNumber + 1 });

            const customerControlAccount = client.chartOfAccounts?.find(acc => acc.accountNumber === '8000-001')?.id;
            const vatControlAccount = client.chartOfAccounts?.find(acc => acc.accountNumber === '7000-008')?.id;

            if (!customerControlAccount || (client.isVatRegistered && !vatControlAccount)) {
                throw new Error("Control accounts not found in Chart of Accounts.");
            }
            
            // 1. Credit Customer Control (AR asset decrease)
            const creditTxRef = doc(collection(db, 'aiAccountantClients', client.id, 'transactions'));
            batch.set(creditTxRef, {
                clientId: client.id,
                date: data.creditNoteDate.toISOString(),
                reference: `CN-${creditNoteId}`,
                description: `Credit Note for ${customers.find(c => c.id === data.customerId)?.name}${data.invoiceId ? ' (Invoice #' + data.invoiceId + ')' : ''}`,
                amount: -total,
                isExpense: -total < 0,
                bankAccountId: 'JOURNAL',
                allocatedTo: { value: customerControlAccount, type: 'account' },
                vatType: 'no_vat',
                vatAmount: 0,
                status: 'allocated',
                allocatedAt: serverTimestamp(),
            });

            // 2. Debit Sales Accounts (revenue reduction)
            data.lineItems.forEach(line => {
                const lineTotal = line.quantity * line.rate;
                const salesDebitRef = doc(collection(db, 'aiAccountantClients', client.id, 'transactions'));
                batch.set(salesDebitRef, {
                    clientId: client.id,
                    date: data.creditNoteDate.toISOString(),
                    reference: `CN-${creditNoteId}`,
                    description: line.description,
                    amount: lineTotal,
                    isExpense: lineTotal < 0,
                    bankAccountId: 'JOURNAL',
                    allocatedTo: { value: line.accountId, type: 'account' },
                    vatType: line.vatType as any,
                    vatAmount: 0,
                    status: 'allocated',
                    allocatedAt: serverTimestamp(),
                });
            });
            
            // 3. Debit VAT Control (VAT liability reduction)
            if (vat > 0 && vatControlAccount) {
                const vatDebitRef = doc(collection(db, 'aiAccountantClients', client.id, 'transactions'));
                batch.set(vatDebitRef, {
                    clientId: client.id,
                    date: data.creditNoteDate.toISOString(),
                    reference: `CN-${creditNoteId}`,
                    description: `VAT on Credit Note`,
                    amount: vat,
                    isExpense: vat < 0,
                    bankAccountId: 'JOURNAL',
                    allocatedTo: { value: vatControlAccount, type: 'account' },
                    vatType: 'no_vat',
                    vatAmount: 0,
                    status: 'allocated',
                    allocatedAt: serverTimestamp(),
                });
            }

            await batch.commit();

            toast({ title: 'Credit Note Posted', description: `Credit Note #${creditNoteId} has been successfully issued.` });
            setIsCreateDialogOpen(false);
            form.reset({
                 creditNoteDate: new Date(),
                 lineItems: [{ accountId: '', description: '', quantity: 1, rate: 0, vatType: client?.isVatRegistered ? 'standard_rated_sales' : 'no_vat' }],
                 notes: '',
                 invoiceId: '',
            });
            fetchData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to create credit note.', variant: 'destructive' });
            console.error(error);
        }
    };

    const handleDownloadPdf = (cn: CreditNote) => {
        if (!client) return;
        const customer = customers.find(c => c.id === cn.customerId);
        if (!customer) return;

        try {
            const doc = new jsPDF();
            const primaryColor: [number, number, number] = [185, 28, 28]; // Crimson Red for Credit Notes

            const formatCurrency = (val: number) => {
                return `R ${val.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            };

            // Branding / Title
            doc.setTextColor(185, 28, 28);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(client.companyName || client.name || 'Company', 20, 25);

            // Company Details
            doc.setTextColor(100);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            
            let leftY = 32;
            if (client.registrationNumber) {
                doc.text(`Reg No: ${client.registrationNumber}`, 20, leftY);
                leftY += 5;
            }

            const renderAddress = (address: any, startY: number, x: number = 20) => {
                let currY = startY;
                if (typeof address === 'string') {
                    const lines = address.split(',').map(part => part.trim()).filter(Boolean);
                    lines.forEach((line: string) => {
                        doc.text(line, x, currY);
                        currY += 5;
                    });
                } else if (typeof address === 'object' && address !== null) {
                    const unitComplex = (address.unit && address.complex) 
                        ? `${address.unit}, ${address.complex}` 
                        : (address.unit ? `Unit ${address.unit}` : address.complex);
                    const lines = [unitComplex, address.street, address.suburb, address.city, address.province, address.zip]
                        .filter(Boolean);
                    lines.forEach(line => {
                        doc.text(String(line), x, currY);
                        currY += 5;
                    });
                }
                return currY;
            };

            leftY = renderAddress(client.address, leftY, 20);
            if (client.isVatRegistered && client.vatNumber) {
                doc.text(`VAT Reg: ${client.vatNumber}`, 20, leftY);
                leftY += 5;
            }

            // Header Details (Right)
            doc.setTextColor(200, 100, 100);
            doc.setFontSize(26);
            doc.setFont('helvetica', 'bold');
            doc.text('CREDIT NOTE', 190, 25, { align: 'right' });

            doc.setTextColor(100);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`Credit Note #:`, 130, 35);
            doc.text(`Date:`, 130, 40);
            if (cn.invoiceId) {
                doc.text(`Linked Invoice:`, 130, 45);
            }

            doc.setFont('helvetica', 'normal');
            doc.text(cn.id, 190, 35, { align: 'right' });
            doc.text(format(new Date(cn.creditNoteDate), 'dd/MM/yyyy'), 190, 40, { align: 'right' });
            if (cn.invoiceId) {
                doc.text(cn.invoiceId, 190, 45, { align: 'right' });
            }

            // Bill To
            let rightY = cn.invoiceId ? 55 : 50;
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100);
            doc.text('CREDIT TO:', 130, rightY);
            rightY += 5;
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.text(customer.name, 130, rightY);
            rightY += 6;
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            rightY = renderAddress(customer.address, rightY, 130);
            if (customer.vatNumber) {
                doc.text(`VAT Reg: ${customer.vatNumber}`, 130, rightY);
                rightY += 5;
            }

            const currentY = Math.max(leftY, rightY) + 5;

            // Line Items Table
            const tableRows = cn.lineItems.map(item => {
                const subtotal = item.rate * item.quantity;
                const vat = item.vatType === 'standard_rated_sales' ? subtotal * 0.15 : 0;
                const total = subtotal + vat;
                return [
                    item.description,
                    item.quantity.toString(),
                    formatCurrency(item.rate),
                    formatCurrency(vat),
                    formatCurrency(total),
                ];
            });

            autoTable(doc, {
                startY: currentY + 10,
                head: [['Description', 'Qty', 'Rate (Excl)', 'VAT', 'Total (Incl)']],
                body: tableRows,
                theme: 'striped',
                headStyles: { 
                    fillColor: primaryColor, 
                    textColor: 255, 
                    fontSize: 8, 
                    fontStyle: 'bold',
                },
                bodyStyles: { fontSize: 9 },
                columnStyles: {
                    0: { cellWidth: 'auto', halign: 'left' },
                    1: { cellWidth: 15, halign: 'center' },
                    2: { cellWidth: 35, halign: 'right' },
                    3: { cellWidth: 35, halign: 'right' },
                    4: { cellWidth: 35, halign: 'right' },
                },
                didParseCell: (data) => {
                    if (data.section === 'head') {
                        if (data.column.index === 1) data.cell.styles.halign = 'center';
                        if (data.column.index >= 2) data.cell.styles.halign = 'right';
                    }
                }
            });

            // Totals
            let finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            
            const labelX = 130;
            const amountX = 190;

            doc.text('Subtotal Credited (Excl):', labelX, finalY);
            doc.text(formatCurrency(cn.subtotal), amountX, finalY, { align: 'right' });
            
            finalY += 7;
            doc.text('VAT Credited (15%):', labelX, finalY);
            doc.text(formatCurrency(cn.vat), amountX, finalY, { align: 'right' });
            
            finalY += 12;
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text('Total Credit Approved:', labelX, finalY);
            doc.text(formatCurrency(cn.total), amountX, finalY, { align: 'right' });

            // Notes
            if (cn.notes) {
                finalY += 20;
                if (finalY > 260) { doc.addPage(); finalY = 20; }
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.setFont('helvetica', 'bold');
                doc.text('REASON / CREDIT NOTES', 20, finalY);
                finalY += 5;
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(100);
                const splitNotes = doc.splitTextToSize(cn.notes, 170);
                doc.text(splitNotes, 20, finalY);
            }

            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text('Generated by My Accountant AI Engine. Thank you for your business!', 105, 285, { align: 'center' });
                doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
            }

            doc.save(`CreditNote-${cn.id}.pdf`);
            toast({ title: 'PDF Downloaded', description: `Credit Note #${cn.id} PDF saved successfully.` });
        } catch (err) {
            console.error("PDF generation failure:", err);
            toast({ title: 'Download Failed', description: 'Failed to generate Credit Note PDF document.', variant: 'destructive' });
        }
    };

    const vatTypes = allVatTypes.filter(vt => vt.category === 'Output Tax');

    return (
        <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => {
            setIsCreateDialogOpen(isOpen);
            if (!isOpen) {
                form.reset({
                     creditNoteDate: new Date(),
                     lineItems: [{ accountId: '', description: '', quantity: 1, rate: 0, vatType: client?.isVatRegistered ? 'standard_rated_sales' : 'no_vat' }],
                     notes: '',
                     invoiceId: '',
                });
            }
        }}>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Credit Notes</h1>
                        <p className="text-muted-foreground">Issue credit notes and manage customer refunds.</p>
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        New Credit Note
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Posted Credit Notes</CardTitle>
                        <CardDescription>A list of credit notes created for {client?.name}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Credit Note #</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Linked Invoice</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {creditNotes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                No credit notes issued yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        creditNotes.map((cn) => (
                                            <TableRow key={cn.id}>
                                                <TableCell className="font-mono">{cn.id}</TableCell>
                                                <TableCell>{customers.find(c => c.id === cn.customerId)?.name || 'N/A'}</TableCell>
                                                <TableCell className="font-mono">{cn.invoiceId || 'N/A'}</TableCell>
                                                <TableCell>{format(cn.creditNoteDate, "dd/MM/yyyy")}</TableCell>
                                                <TableCell className="text-right text-red-600 font-semibold">-{formatPrice(cn.total)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(cn)}>
                                                            <Download className="mr-2 h-4 w-4" /> Download PDF
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onSelect={() => setViewingCreditNote(cn)}>
                                                                    <Eye className="mr-2 h-4 w-4" /> View Preview
                                                                </DropdownMenuItem>
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

            {/* Create Dialog */}
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Issue New Credit Note</DialogTitle>
                    <DialogDescription>
                        Create a credit note to reduce a customer's outstanding balance or issue refunds.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <FormField control={form.control} name="creditNoteDate" render={({ field }) => ( 
                                <FormItem className="flex flex-col">
                                    <FormLabel className="mb-1">Credit Note Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-10", !field.value && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, "dd MMMM yyyy") : <span>Pick a date</span>}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="invoiceId" render={({ field }) => ( 
                                <FormItem className="flex flex-col">
                                    <FormLabel className="mb-1">Linked Invoice # (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. 9005" {...field} className="h-10"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>

                        <Separator />
                        
                        <div>
                            <h3 className="text-lg font-medium mb-4">Credited Line Items</h3>
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-x-3 gap-y-2 p-3 border rounded-md relative items-start bg-slate-50/50">
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
                                    <FormLabel>Reason for Credit Note / Internal Memo</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="e.g. Return of damaged goods / Correction of pricing error on invoice." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <CreditNoteTotals control={form.control} isVatRegistered={client?.isVatRegistered} />

                        <DialogFooter className="pt-4 gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Issue Credit Note</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>

            {/* Preview Dialog */}
            <Dialog open={!!viewingCreditNote} onOpenChange={(isOpen) => !isOpen && setViewingCreditNote(null)}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Credit Note Preview</DialogTitle>
                    </DialogHeader>
                    {viewingCreditNote && client && (
                        <div className="space-y-6">
                            <div className="p-8 bg-white text-gray-800 rounded-lg border max-h-[60vh] overflow-y-auto text-left">
                                <header className="flex justify-between items-start mb-10">
                                    <div className="w-1/2 space-y-2">
                                        <h1 className="text-2xl font-bold text-gray-900">{client.companyName || client.name}</h1>
                                        {client.registrationNumber && <p className="text-xs text-gray-500">Reg No: {client.registrationNumber}</p>}
                                        {client.isVatRegistered && client.vatNumber && <p className="text-xs text-gray-500">VAT Reg: {client.vatNumber}</p>}
                                    </div>
                                    <div className="w-1/2 text-right space-y-4">
                                        <h2 className="text-3xl font-extrabold uppercase text-red-500">Credit Note</h2>
                                        <div className="grid grid-cols-[auto_1fr] gap-x-4 text-xs justify-end">
                                            <span className="font-semibold text-gray-500 text-right">Credit Note #:</span>
                                            <span className="text-left ml-2">{viewingCreditNote.id}</span>
                                            <span className="font-semibold text-gray-500 text-right">Date:</span>
                                            <span className="text-left ml-2">{format(viewingCreditNote.creditNoteDate, 'dd/MM/yyyy')}</span>
                                            {viewingCreditNote.invoiceId && (
                                                <>
                                                    <span className="font-semibold text-gray-500 text-right">Linked Invoice:</span>
                                                    <span className="text-left ml-2">{viewingCreditNote.invoiceId}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </header>
                                <div className="mb-6">
                                    <p className="text-xs font-semibold text-gray-500">CREDIT TO:</p>
                                    <p className="text-base font-bold text-gray-800">{customers.find(c => c.id === viewingCreditNote.customerId)?.name || 'Customer'}</p>
                                    {customers.find(c => c.id === viewingCreditNote.customerId)?.vatNumber && (
                                        <p className="text-xs text-gray-500">VAT Reg: {customers.find(c => c.id === viewingCreditNote.customerId)?.vatNumber}</p>
                                    )}
                                </div>
                                <table className="w-full text-left border-collapse mb-8 text-xs">
                                    <thead>
                                        <tr className="bg-gray-100 text-gray-600 uppercase text-[10px]">
                                            <th className="p-3 border">Description</th>
                                            <th className="p-3 text-center border">Qty</th>
                                            <th className="p-3 text-right border">Rate (Excl)</th>
                                            <th className="p-3 text-right border">VAT</th>
                                            <th className="p-3 text-right border">Total (Incl)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingCreditNote.lineItems.map((item, index) => {
                                            const subtotal = item.rate * item.quantity;
                                            const vatAmount = item.vatType === 'standard_rated_sales' ? subtotal * 0.15 : 0;
                                            const totalAmount = subtotal + vatAmount;
                                            return (
                                                <tr key={index} className="border-b border-gray-200">
                                                    <td className="p-3 border">{item.description}</td>
                                                    <td className="p-3 text-center border">{item.quantity}</td>
                                                    <td className="p-3 text-right border font-mono">{formatPrice(item.rate)}</td>
                                                    <td className="p-3 text-right border font-mono">{formatPrice(vatAmount)}</td>
                                                    <td className="p-3 text-right border font-semibold font-mono">{formatPrice(totalAmount)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <div className="flex justify-end mb-6">
                                    <div className="w-full max-w-xs space-y-2 text-xs">
                                        <div className="flex justify-between text-gray-500">
                                            <span>Subtotal Credited</span>
                                            <span className="font-mono">{formatPrice(viewingCreditNote.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500">
                                            <span>VAT Credited (15%)</span>
                                            <span className="font-mono">{formatPrice(viewingCreditNote.vat)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2 mt-2">
                                            <span>Grand Total Credited</span>
                                            <span className="font-mono text-red-600">-{formatPrice(viewingCreditNote.total)}</span>
                                        </div>
                                    </div>
                                </div>
                                {viewingCreditNote.notes && (
                                    <div className="p-4 bg-gray-50 rounded border border-dashed text-xs text-gray-600">
                                        <h4 className="font-bold text-gray-500 mb-1">REASON / NOTES:</h4>
                                        <p className="italic">{viewingCreditNote.notes}</p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button onClick={() => handleDownloadPdf(viewingCreditNote)}>
                                    <Download className="mr-2 h-4 w-4" /> Download PDF
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}

export default function CreditNotesPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-60">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <CreditNotesPageContent />
        </Suspense>
    );
}

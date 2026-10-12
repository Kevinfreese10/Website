'use client';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, AllocationRule } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, CheckCircle2, Building, Landmark, CreditCard, Image as ImageIcon, ShieldAlert, Settings, Eraser, Info, CalendarIcon, ReceiptText } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { allVatTypes } from '@/lib/vat-types';
import { chartOfAccounts as masterChartOfAccounts } from '@/lib/chart-of-accounts';
import { alignRuleAccountId, alignRulesToChartOfAccounts } from '@/lib/chart-of-accounts-mapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const db = getFirestore(firebaseApp);

const clientStatuses = ['Active', 'Inactive', 'Archived', 'Pending Setup Payment'] as const;
const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
const vatCategories: { value: 'A' | 'B' | 'C'; label: string }[] = [
    { value: 'A', label: 'Category A (Odd Months)' },
    { value: 'B', label: 'Category B (Even Months)' },
    { value: 'C', label: 'Category C (Monthly)' },
];

const ruleSchema = z.object({
    id: z.string(),
    description: z.string(),
    keywords: z.string(),
    accountId: z.string(),
    vatType: z.string(),
});

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Client/Company name is required.'),
  registrationNumber: z.string().optional(),
  payeReference: z.string().optional(),
  firstProcessingMonth: z.string().optional(),
  firstRunStartDate: z.date().optional().nullable(),
  payrollFrequency: z.enum(['Monthly', 'Fortnightly']).default('Monthly'),
  excludeSdl: z.boolean().default(false),
  hideRatePerHour: z.boolean().default(false),
  hidePayDate: z.boolean().default(false),
  yearEnd: z.string().optional(),
  isVatRegistered: z.boolean().default(false),
  vatCategory: z.enum(['A', 'B', 'C']).optional().nullable(),
  vatNumber: z.string().optional(),
  status: z.enum(clientStatuses).optional(),
  address: z.object({
      unit: z.string().optional(),
      complex: z.string().optional(),
      street: z.string().optional(),
      suburb: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      zip: z.string().optional(),
  }).optional(),
  defaultInvoiceMessage: z.string().optional(),
  bankingDetails: z.object({
    bankName: z.string().optional(),
    accountHolder: z.string().optional(),
    accountNumber: z.string().optional(),
    branchCode: z.string().optional(),
    swiftCode: z.string().optional(),
  }).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  useGlobalRules: z.boolean().default(false),
  initialRules: z.array(ruleSchema).optional(),
  disableGlobalRules: z.boolean().default(false),
  isBlankProfile: z.boolean().default(false),
});

export default function ClientForm({ 
    client, 
    onSubmit, 
    onCancel, 
    isAIClient = false,
    isPayrollClient = false,
    inDialog = true,
}: { 
    client: Partial<User> | null, 
    onSubmit: (data: any) => void, 
    onCancel: () => void, 
    isAIClient?: boolean,
    isPayrollClient?: boolean,
    inDialog?: boolean,
}) {
    const { toast } = useToast();
    const [isLoadingRules, setIsLoadingRules] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: client?.id || '',
            name: client?.name || client?.companyName || '',
            registrationNumber: client?.registrationNumber || '',
            payeReference: client?.payeReference || '',
            firstProcessingMonth: client?.firstProcessingMonth || '',
            firstRunStartDate: client?.firstRunStartDate ? (client.firstRunStartDate.toDate ? client.firstRunStartDate.toDate() : new Date(client.firstRunStartDate)) : null,
            payrollFrequency: (client?.payrollFrequency as any) || 'Monthly',
            excludeSdl: client?.excludeSdl || false,
            hideRatePerHour: (client as any)?.hideRatePerHour || false,
            hidePayDate: (client as any)?.hidePayDate || false,
            yearEnd: client?.yearEnd || 'February',
            isVatRegistered: client?.isVatRegistered || false,
            vatCategory: client?.vatCategory || null,
            vatNumber: client?.vatNumber || '',
            status: (client?.status as any) || 'Active',
            address: {
                unit: client?.address?.unit || '',
                complex: client?.address?.complex || '',
                street: client?.address?.street || '',
                suburb: client?.address?.suburb || '',
                city: client?.address?.city || '',
                province: client?.address?.province || '',
                zip: client?.address?.zip || '',
            },
            defaultInvoiceMessage: client?.defaultInvoiceMessage || '',
            bankingDetails: {
                bankName: client?.bankingDetails?.bankName || '',
                accountHolder: client?.bankingDetails?.accountHolder || '',
                accountNumber: client?.bankingDetails?.accountNumber || '', 
                branchCode: client?.bankingDetails?.branchCode || '',
                swiftCode: (client?.bankingDetails as any)?.swiftCode || '',
            },
            logoUrl: client?.logoUrl || '',
            useGlobalRules: false,
            initialRules: [],
            disableGlobalRules: client?.disableGlobalRules || false,
            isBlankProfile: (client as any)?.isBlankProfile || false,
        },
    });

    const { fields, replace, remove } = useFieldArray({
        control: form.control,
        name: "initialRules"
    });

    const isVatRegistered = form.watch('isVatRegistered');
    const useGlobalRules = form.watch('useGlobalRules');
    const isIsolatedMode = form.watch('disableGlobalRules');
    const isBlankProfile = form.watch('isBlankProfile');
    const payrollFrequency = form.watch('payrollFrequency');

    const processingPeriods = useMemo(() => {
        const periods: string[] = [];
        const currentYear = new Date().getFullYear();
        
        for (let year = 2022; year <= currentYear + 1; year++) {
            months.forEach((month, idx) => {
                // Support from March 2022 onwards
                if (year === 2022 && idx < 2) return;
                periods.push(`${month} ${year}`);
            });
        }
        return periods;
    }, []);

    useEffect(() => {
        if (!client?.id && isAIClient && !isPayrollClient) {
            const fetchGlobalRules = async () => {
                setIsLoadingRules(true);
                try {
                    const rulesRef = collection(db, 'allocationRules');
                    const q = query(rulesRef, orderBy('description'));
                    const snapshot = await getDocs(q);
                    const rules = snapshot.docs.map(doc => {
                        const data = doc.data() as AllocationRule;
                        const alignedAccountId = alignRuleAccountId(data.accountId, masterChartOfAccounts, {
                            description: data.description,
                            category: (data as any).category
                        });
                        return {
                            id: doc.id,
                            description: data.description || '',
                            keywords: data.keywords.join(', '),
                            accountId: alignedAccountId,
                            vatType: data.vatType,
                        };
                    });
                    replace(rules);
                } catch (e) {
                    console.error("Error fetching global rules:", e);
                    toast({ title: 'Error', description: 'Could not load global rules.', variant: 'destructive'});
                } finally {
                    setIsLoadingRules(false);
                }
            };
            fetchGlobalRules();
        }
    }, [client?.id, isAIClient, isPayrollClient, replace, toast]);

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSaving(true);
        try {
            const { initialRules, useGlobalRules, disableGlobalRules, isBlankProfile, ...rest } = values;
            
            // Explicitly handle undefined to null conversion for Firestore compatibility
            const submitData = {
                ...rest,
                firstRunStartDate: values.firstRunStartDate ?? null,
                vatCategory: values.vatCategory ?? null,
                registrationNumber: values.registrationNumber ?? null,
                payeReference: values.payeReference ?? null,
                firstProcessingMonth: values.firstProcessingMonth ?? null,
            };

            // Logic: If Blank Profile is ON, no standard COA or rules should ever be created.
            // If Isolated Mode is ON, no rules imported.
            const isBlank = Boolean(isBlankProfile);
            const shouldImport = !isBlank && useGlobalRules && !disableGlobalRules && !isPayrollClient;

            let rulesToProcess = initialRules || [];
            if (shouldImport && rulesToProcess.length === 0) {
                try {
                    const rulesRef = collection(db, 'allocationRules');
                    const q = query(rulesRef, orderBy('description'));
                    const snapshot = await getDocs(q);
                    rulesToProcess = snapshot.docs.map(doc => {
                        const data = doc.data() as AllocationRule;
                        return {
                            id: doc.id,
                            description: data.description || '',
                            keywords: (data.keywords || []).join(', '),
                            accountId: alignRuleAccountId(data.accountId, masterChartOfAccounts, {
                                description: data.description,
                                category: (data as any).category
                            }),
                            vatType: data.vatType,
                        };
                    });
                } catch (e) {
                    console.error("Failed to fetch global rules for initial import:", e);
                }
            }

            const processedRules = shouldImport ? rulesToProcess.map(r => ({
                ...r,
                keywords: typeof r.keywords === 'string' ? r.keywords.split(',').map(k => k.trim().toUpperCase()).filter(Boolean) : (r.keywords || []),
                accountId: alignRuleAccountId(r.accountId, masterChartOfAccounts, { description: r.description }),
                type: 'hard' as const,
                scope: 'client' as const,
                priority: 99
            })) : [];

            await onSubmit({
                ...submitData,
                disableGlobalRules: isBlank ? true : disableGlobalRules,
                isBlankProfile: isBlank,
                chartOfAccounts: isBlank ? [] : undefined,
                allocationRules: isBlank ? [] : processedRules
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Form {...form}>
            <form 
                onSubmit={form.handleSubmit(handleSubmit)} 
                className={inDialog ? "flex flex-col flex-1 min-h-0 overflow-hidden" : "space-y-6"}
            >
                <div className={inDialog ? "flex-1 overflow-y-auto px-6 py-5 space-y-6" : "space-y-6"}>
                    <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                        <Building className="h-4 w-4" /> Company Information
                    </div>
                    <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    
                    {isPayrollClient && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                            <FormField control={form.control} name="registrationNumber" render={({ field }) => ( <FormItem><FormLabel>Company Registration Number</FormLabel><FormControl><Input {...field} placeholder="e.g. 2024/123456/07" /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="payeReference" render={({ field }) => ( <FormItem><FormLabel>PAYE Reference Number</FormLabel><FormControl><Input {...field} placeholder="e.g. 7123456789" /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{clientStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                    )}

                    {!isPayrollClient && (
                        <>
                        <FormField control={form.control} name="registrationNumber" render={({ field }) => ( <FormItem><FormLabel>Company Registration Number</FormLabel><FormControl><Input {...field} placeholder="e.g. 2024/123456/07" /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{clientStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="yearEnd" render={({ field }) => ( <FormItem><FormLabel>Financial Year End</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a month" /></SelectTrigger></FormControl><SelectContent>{months.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                        </>
                    )}

                    {isPayrollClient && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="payrollFrequency" render={({ field }) => {
                                    const isLocked = !!client?.id && !!client?.payrollFrequency;
                                    return (
                                    <FormItem>
                                        <FormLabel>Payroll Cycle Frequency</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isLocked}>
                                            <FormControl><SelectTrigger className={isLocked ? 'bg-muted cursor-not-allowed opacity-70' : ''}><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Monthly">Monthly</SelectItem>
                                                <SelectItem value="Fortnightly">Bi-Weekly (Fortnightly)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {isLocked && <FormDescription className="text-[10px]">Payroll frequency cannot be changed once set.</FormDescription>}
                                        <FormMessage />
                                    </FormItem>
                                )}} />

                                {payrollFrequency === 'Monthly' ? (
                                    <FormField control={form.control} name="firstProcessingMonth" render={({ field }) => {
                                        const isLocked = !!client?.id && !!client?.firstProcessingMonth;
                                        return ( 
                                        <FormItem>
                                            <FormLabel>1st Processing Month (Start Period)</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={isLocked}>
                                                <FormControl><SelectTrigger className={isLocked ? 'bg-muted cursor-not-allowed opacity-70' : ''}><SelectValue placeholder="Select start period..." /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {processingPeriods.map(period => <SelectItem key={period} value={period}>{period}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            {isLocked && <FormDescription className="text-[10px]">Start period cannot be changed once set.</FormDescription>}
                                            <FormMessage />
                                        </FormItem>
                                    )}} />
                                ) : (
                                    <FormField control={form.control} name="firstRunStartDate" render={({ field }) => {
                                        const isLocked = !!client?.id && !!client?.firstRunStartDate;
                                        return ( 
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="mb-1">1st Period Start Date</FormLabel>
                                            {isLocked ? (
                                                <Button variant={"outline"} disabled className="w-full pl-3 text-left font-normal bg-muted cursor-not-allowed opacity-70">
                                                    {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            ) : (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                                {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                            <FormDescription className="text-[10px]">{isLocked ? 'Start date cannot be changed once set.' : 'The first bi-weekly payment date.'}</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}} />
                                )}
                            </div>

                            <FormField control={form.control} name="excludeSdl" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-sm font-bold">Exclude SDL Calculation?</FormLabel>
                                        <p className="text-[10px] text-muted-foreground">Tick this if the company is exempt from Skills Development Levy.</p>
                                    </div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )} />

                            {/* Payslip Template Display Options */}
                            <div className="pt-2 space-y-3">
                                <div className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                                    <ReceiptText className="h-3.5 w-3.5 text-primary" /> Payslip Template Display Options
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <FormField control={form.control} name="hideRatePerHour" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/10">
                                            <div className="space-y-0.5 pr-2">
                                                <FormLabel className="text-xs font-bold">Hide Rate Per Hour</FormLabel>
                                                <p className="text-[10px] text-muted-foreground">Omit the calculated hourly rate (Gross / 160) from employee payslips.</p>
                                            </div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="hidePayDate" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/10">
                                            <div className="space-y-0.5 pr-2">
                                                <FormLabel className="text-xs font-bold">Hide Pay Date</FormLabel>
                                                <p className="text-[10px] text-muted-foreground">Omit the specific Pay Date header from employee payslips (only Pay Period is displayed).</p>
                                            </div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                            </div>
                        </div>
                    )}

                    {!isPayrollClient && (
                        <FormField control={form.control} name="logoUrl" render={({ field }) => ( <FormItem><FormLabel>Company Logo URL</FormLabel><FormControl><Input placeholder="https://example.com/logo.png" {...field} /></FormControl><FormDescription className="text-[10px]">Used on all generated invoices.</FormDescription><FormMessage /></FormItem>)} />
                    )}
                </section>

                <Separator />

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                        <ImageIcon className="h-4 w-4" /> Physical Address
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="address.unit" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Unit Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="address.complex" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Complex Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="address.street" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel className="text-xs">Street Address</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="address.suburb" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Suburb</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="address.city" render={({ field }) => ( <FormItem><FormLabel className="text-xs">City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="address.province" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Province</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="address.zip" render={({ field }) => ( <FormItem><FormLabel className="text-xs">ZIP / Postal Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                </section>

                {!isPayrollClient && (
                    <>
                    <Separator />
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                            <Landmark className="h-4 w-4" /> Tax & VAT
                        </div>
                        <FormField control={form.control} name="isVatRegistered" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5"><FormLabel>VAT Registered?</FormLabel></div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />
                        {isVatRegistered && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <FormField control={form.control} name="vatNumber" render={({ field }) => ( <FormItem><FormLabel>VAT Number</FormLabel><FormControl><Input placeholder="e.g. 4123456789" /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="vatCategory" render={({ field }) => ( <FormItem><FormLabel>VAT Category</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl><SelectContent>{vatCategories.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                            </div>
                        )}
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                            <CreditCard className="h-4 w-4" /> Banking Details (For Invoicing)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                             <FormField control={form.control} name="bankingDetails.bankName" render={({ field }) => ( <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g. Standard Bank" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="bankingDetails.accountNumber" render={({ field }) => ( <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="e.g. 123456789" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="bankingDetails.accountHolder" render={({ field }) => ( <FormItem><FormLabel>Account Holder</FormLabel><FormControl><Input placeholder="e.g. Company Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="bankingDetails.branchCode" render={({ field }) => ( <FormItem><FormLabel>Branch Code</FormLabel><FormControl><Input placeholder="e.g. 051001" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="bankingDetails.swiftCode" render={({ field }) => ( 
                                <FormItem className="md:col-span-2">
                                    <FormLabel>SWIFT / BIC Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. SBZAJJ (Optional for international clients)" {...field} />
                                    </FormControl>
                                    <FormDescription className="text-[10px]">
                                        Used on invoices so international clients can make cross-border EFT / wire payments.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                             )} />
                        </div>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                            <Settings className="h-4 w-4" /> Invoice Settings
                        </div>
                        <FormField control={form.control} name="defaultInvoiceMessage" render={({ field }) => ( 
                            <FormItem>
                                <FormLabel>Default Invoice Message</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g. Thank you for your business. Payment is due within 14 days." {...field} />
                                </FormControl>
                                <FormDescription className="text-[10px]">This message will be shown on all generated invoices by default.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </section>
                    </>
                )}

                {isAIClient && !isPayrollClient && (
                    <section className="space-y-4 border-t pt-6">
                        <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                            <Settings className="h-4 w-4" /> AI Automation Settings
                        </div>

                        <FormField control={form.control} name="isBlankProfile" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/10">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Eraser className="h-4 w-4 text-primary" />
                                        <FormLabel className="text-sm font-bold">Blank Profile</FormLabel>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                        Create a profile with no Chart of Accounts or default rules. Forces Isolated Practice Mode.
                                    </p>
                                </div>
                                <FormControl>
                                    <Switch 
                                        checked={field.value} 
                                        onCheckedChange={(checked) => {
                                            field.onChange(checked);
                                            if (checked) {
                                                form.setValue('disableGlobalRules', true);
                                                form.setValue('useGlobalRules', false);
                                            }
                                        }} 
                                    />
                                </FormControl>
                            </FormItem>
                        )} />

                        {isBlankProfile && (
                            <Alert className="bg-primary/5 border-primary/20">
                                <Info className="h-4 w-4 text-primary" />
                                <AlertTitle className="text-xs font-bold uppercase">Manual Setup Required</AlertTitle>
                                <AlertDescription className="text-[10px]">
                                    You will need to manually add General Ledger accounts before allocating transactions.
                                </AlertDescription>
                            </Alert>
                        )}

                        {!isBlankProfile && (
                            <FormField control={form.control} name="disableGlobalRules" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-destructive/5 border-destructive/10">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="h-4 w-4 text-destructive" />
                                            <FormLabel className="text-sm font-bold">Isolated Practice Mode</FormLabel>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                            If enabled, this client will ONLY use practice-specific rules. No global rules will be used during analysis.
                                        </p>
                                    </div>
                                    <FormControl>
                                        <Switch 
                                            checked={field.value} 
                                            onCheckedChange={(checked) => {
                                                field.onChange(checked);
                                                if (checked) {
                                                    form.setValue('useGlobalRules', false);
                                                }
                                            }} 
                                        />
                                    </FormControl>
                                </FormItem>
                            )} />
                        )}

                        {!client?.id && !isIsolatedMode && !isBlankProfile && (
                            <div className="flex items-center justify-between mt-4">
                                <div>
                                    <h4 className="text-sm font-bold">Initial Data Import</h4>
                                    <p className="text-xs text-muted-foreground">Pre-populate this client's profile with default global rules.</p>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="useGlobalRules"
                                    render={({ field }) => (
                                        <FormControl>
                                            <Switch 
                                                checked={field.value} 
                                                onCheckedChange={field.onChange} 
                                            />
                                        </FormControl>
                                    )}
                                />
                            </div>
                        )}

                        {useGlobalRules && !client?.id && !isIsolatedMode && !isBlankProfile && (
                            <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span>Default practice allocation rules will automatically be imported into this client's profile upon creation.</span>
                            </div>
                        )}
                    </section>
                )}
                
                </div>
                
                <div className={inDialog ? "flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/40 shrink-0" : "flex items-center justify-end gap-3 pt-4 border-t"}>
                    <Button type="button" variant="outline" onClick={onCancel} className="px-5">Cancel</Button>
                    <Button type="submit" disabled={isSaving} className="px-6 font-semibold shadow-sm">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Form>
    );
}

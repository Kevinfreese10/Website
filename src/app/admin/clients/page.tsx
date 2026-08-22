'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Loader2, RotateCw, Search, Users, DollarSign, TrendingUp, HeartPulse, CheckCircle2, AlertOctagon, SlidersHorizontal, Eye, X, Edit, Calendar, Building2, Landmark, CircleUser } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Task } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc, writeBatch, Timestamp, query, orderBy, where, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format, addMonths, setDate, setHours, setMinutes, setSeconds, startOfMonth, startOfToday, isSameDay, addYears, isPast } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const db = getFirestore(firebaseApp);

const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
const vatCategories = [
    { value: 'A', label: 'Category A (Odd Months)' },
    { value: 'B', label: 'Category B (Even Months)' },
    { value: 'C', label: 'Category C (Monthly)' },
];

const getTaskDate = (task: Task): Date => {
  if (task.dueDate instanceof Date) return task.dueDate;
  if (task.dueDate && typeof (task.dueDate as any).toDate === 'function') return (task.dueDate as any).toDate();
  return new Date(task.dueDate);
};

const entityTypes = [
    { value: 'Company' as const, label: 'Company', icon: Building2, desc: 'PTY Ltd, CC, Inc' },
    { value: 'Trust' as const, label: 'Trust', icon: Landmark, desc: 'Family, Business, Special' },
    { value: 'Individual' as const, label: 'Individual', icon: CircleUser, desc: 'Sole Proprietor, Person' },
];

const clientFormSchema = z.object({
  id: z.string().optional(),
  entityType: z.enum(['Company', 'Trust', 'Individual'], { required_error: 'Please select a client type.' }),
  name: z.string().min(2, 'Client name is required.'),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
  contactNumber: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Archived']).default('Active'),
  yearEnd: z.string().min(1, 'Financial year end is required.'),
  monthlyRetainerFee: z.preprocess(val => Number(val) || 0, z.number().min(0).optional()),
  isVatRegistered: z.boolean().default(false),
  vatCategory: z.enum(['A', 'B', 'C']).optional().nullable(),
  submitsEmp201: z.boolean().default(false),
  preparesPayroll: z.boolean().default(false),
  payrollDay: z.preprocess(val => Number(val), z.number().min(1).max(31)).optional(),
  submitsProvisionalTax: z.boolean().default(false),
  preparesFinancials: z.boolean().default(false),
  preparesManagementAccounts: z.boolean().default(false),
  managementAccountsDay: z.preprocess(val => Number(val), z.number().min(1).max(31)).optional(),
  submitsIncomeTax: z.boolean().default(false),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

function ClientForm({ client, onSubmit, onCancel }: { client: User | null, onSubmit: (data: ClientFormValues) => void, onCancel: () => void }) {
    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientFormSchema),
        defaultValues: {
            id: client?.id || '',
            entityType: (client?.entityType as any) || undefined,
            name: client?.name || '',
            contactPerson: client?.contactPerson || '',
            contactEmail: client?.contactEmail || '',
            contactNumber: client?.contactNumber || '',
            status: (client?.status as any) || 'Active',
            yearEnd: client?.yearEnd || 'February',
            monthlyRetainerFee: client?.monthlyRetainerFee || 0,
            isVatRegistered: client?.isVatRegistered || false,
            vatCategory: client?.vatCategory || null,
            submitsEmp201: client?.submitsEmp201 || false,
            preparesPayroll: client?.preparesPayroll || false,
            payrollDay: client?.payrollDay || 25,
            submitsProvisionalTax: client?.submitsProvisionalTax || false,
            preparesFinancials: client?.preparesFinancials || false,
            preparesManagementAccounts: client?.preparesManagementAccounts || false,
            managementAccountsDay: client?.managementAccountsDay || 10,
            submitsIncomeTax: client?.submitsIncomeTax || false,
        },
    });

    const entityType = form.watch('entityType');
    const isVatRegistered = form.watch('isVatRegistered');
    const preparesPayroll = form.watch('preparesPayroll');
    const preparesManagementAccounts = form.watch('preparesManagementAccounts');

    const isIndividual = entityType === 'Individual';
    const isTrustOrIndividual = entityType === 'Trust' || entityType === 'Individual';

    // Lock year-end and clear inapplicable toggles when entity type changes
    useEffect(() => {
        if (isTrustOrIndividual) {
            form.setValue('yearEnd', 'February');
        }
        if (isIndividual) {
            form.setValue('submitsEmp201', false);
            form.setValue('preparesPayroll', false);
            form.setValue('preparesManagementAccounts', false);
            form.setValue('preparesFinancials', false);
        }
    }, [entityType]);

    const nameLabel = entityType === 'Trust' ? 'Trust Name' : entityType === 'Individual' ? 'Full Name' : 'Company Name';
    const namePlaceholder = entityType === 'Trust' ? 'e.g. Smith Family Trust' : entityType === 'Individual' ? 'e.g. John Smith' : 'e.g. Acme Corp (Pty) Ltd';
    const itrLabel = entityType === 'Trust' ? 'Trust Tax Return (ITR12T)' : entityType === 'Individual' ? 'Income Tax Return (ITR12)' : 'Income Tax Return (ITR14)';
    const itrDesc = entityType === 'Company' ? 'Due 12 months after Financial Year End.' : 'Due 31 October (filing season).';

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[75vh] overflow-y-auto p-1 pr-4">
                {/* Entity Type Selector */}
                <div className="space-y-2">
                    <FormField control={form.control} name="entityType" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-bold">Client Type</FormLabel>
                            <FormControl>
                                <div className="grid grid-cols-3 gap-3">
                                    {entityTypes.map(type => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => field.onChange(type.value)}
                                            className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                                field.value === type.value 
                                                    ? 'border-primary bg-primary/5 shadow-sm' 
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <type.icon className={`h-6 w-6 ${field.value === type.value ? 'text-primary' : 'text-slate-400'}`} />
                                            <span className={`text-sm font-bold ${field.value === type.value ? 'text-primary' : 'text-slate-600'}`}>{type.label}</span>
                                            <span className="text-[10px] text-slate-400">{type.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                {entityType && (
                    <>
                        {/* Client Details */}
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{nameLabel}</FormLabel><FormControl><Input placeholder={namePlaceholder} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{['Active', 'Inactive', 'Archived'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                                <FormField control={form.control} name="yearEnd" render={({ field }) => ( <FormItem><FormLabel>Financial Year End</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isTrustOrIndividual}><FormControl><SelectTrigger><SelectValue placeholder="Select a month" /></SelectTrigger></FormControl><SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>{isTrustOrIndividual && <p className="text-[10px] text-muted-foreground mt-1">Fixed to February for {entityType} tax year.</p>}</FormItem>)} />
                            </div>
                            <FormField control={form.control} name="monthlyRetainerFee" render={({ field }) => ( <FormItem><FormLabel>Monthly Retainer Fee (R)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>

                        {/* Contact Details */}
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Contact Details</h3>
                            {!isIndividual && (
                                <FormField control={form.control} name="contactPerson" render={({ field }) => ( <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input placeholder="e.g. John Smith" {...field} /></FormControl></FormItem>)} />
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="contactEmail" render={({ field }) => ( <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="email@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="contactNumber" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="012 345 6789" {...field} /></FormControl></FormItem>)} />
                            </div>
                        </div>
                        
                        {/* Compliance Toggles */}
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Compliance Roadmap Automation</h3>
                            <p className="text-xs text-muted-foreground">The system will automatically generate the next upcoming task for each enabled service.</p>
                            
                            <div className="space-y-3">
                                <FormField
                                    control={form.control}
                                    name="isVatRegistered"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5"><FormLabel className="text-sm">VAT Submissions (VAT201)</FormLabel></div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                {isVatRegistered && (
                                    <div className="pl-4 animate-in fade-in slide-in-from-top-2">
                                        <FormField control={form.control} name="vatCategory" render={({ field }) => ( 
                                            <FormItem>
                                                <FormLabel className="text-xs">VAT Category</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {vatCategories.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                    </div>
                                )}

                                {!isIndividual && (
                                    <>
                                        <FormField control={form.control} name="submitsEmp201" render={({ field }) => ( 
                                            <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5"><FormLabel className="text-sm">Monthly PAYE (EMP201)</FormLabel></div>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="preparesPayroll" render={({ field }) => ( 
                                            <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5"><FormLabel className="text-sm">Monthly Payroll Preparation</FormLabel></div>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )} />
                                        {preparesPayroll && (
                                            <div className="pl-4 animate-in fade-in slide-in-from-top-2">
                                                <FormField control={form.control} name="payrollDay" render={({ field }) => ( 
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Payroll Day of Month</FormLabel>
                                                        <FormControl><Input type="number" min="1" max="31" {...field} className="h-8 text-xs w-24" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                        )}

                                        <FormField control={form.control} name="preparesManagementAccounts" render={({ field }) => ( 
                                            <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5"><FormLabel className="text-sm">Monthly Management Accounts</FormLabel></div>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )} />
                                        {preparesManagementAccounts && (
                                            <div className="pl-4 animate-in fade-in slide-in-from-top-2">
                                                <FormField control={form.control} name="managementAccountsDay" render={({ field }) => ( 
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Reporting Day of Month</FormLabel>
                                                        <FormControl><Input type="number" min="1" max="31" {...field} className="h-8 text-xs w-24" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                        )}
                                    </>
                                )}

                                <FormField control={form.control} name="submitsProvisionalTax" render={({ field }) => ( 
                                    <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5"><FormLabel className="text-sm">Provisional Tax (IRP6)</FormLabel></div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="submitsIncomeTax" render={({ field }) => ( 
                                    <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-sm">{itrLabel}</FormLabel>
                                            <p className="text-[10px] text-muted-foreground">{itrDesc}</p>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )} />

                                {!isIndividual && (
                                    <FormField control={form.control} name="preparesFinancials" render={({ field }) => ( 
                                        <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5"><FormLabel className="text-sm">Annual Financial Statements</FormLabel></div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )} />
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                            <Button type="submit">Save & Update Roadmap</Button>
                        </div>
                    </>
                )}
            </form>
        </Form>
    );
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog (Add Client) & Sheet (Client Workspace Detail)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');

  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const fetchClients = async () => {
    setIsLoading(true);
    try {
        const q = query(collection(db, "adminClients"), orderBy("name"));
        const snapshot = await getDocs(q);
        setClients(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User)));
    } catch (error) {
        toast({ title: 'Error', description: 'Could not fetch clients.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();

    // Listen to tasks for real-time CRM health indicators
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task)));
    });

    return () => unsubscribeTasks();
  }, []);

  const formatYearEnd = (yearEnd: any): string => {
    if (!yearEnd) return 'N/A';
    if (typeof yearEnd === 'string') return yearEnd;
    
    if (yearEnd && typeof yearEnd.toDate === 'function') {
      try {
        return format(yearEnd.toDate(), 'MMMM');
      } catch (e) {
        return 'Invalid Date';
      }
    }
    
    if (yearEnd && typeof yearEnd.seconds === 'number') {
      try {
        return format(new Date(yearEnd.seconds * 1000), 'MMMM');
      } catch (e) {
        return 'Invalid Date';
      }
    }

    try {
        const d = new Date(yearEnd);
        if (!isNaN(d.getTime())) {
             return format(d, 'MMMM');
        }
    } catch (e) {}
    
    return 'N/A';
  };

  const handleEdit = (client: User) => {
    setSelectedClient(client);
    setIsDetailOpen(true);
  };

  const handleFormSubmit = async (values: ClientFormValues) => {
    if (!currentUser) return;
    setIsLoading(true);
    
    try {
        const batch = writeBatch(db);
        let clientId = values.id;

        const clientData = {
            ...values,
            companyName: values.name,
            entityType: values.entityType,
            contactPerson: values.contactPerson || '',
            contactEmail: values.contactEmail || '',
            contactNumber: values.contactNumber || '',
            clientSource: 'admin' as const,
            updatedAt: serverTimestamp(),
        };

        if (!clientId) {
            const newDocRef = doc(collection(db, "adminClients"));
            clientId = newDocRef.id;
            batch.set(newDocRef, { ...clientData, id: clientId, createdAt: serverTimestamp(), createdBy: currentUser.uid });
        } else {
            batch.update(doc(db, "adminClients", clientId), clientData);
        }

        // Fetch existing tasks to perform SMART upsert
        const oldTasksQuery = query(collection(db, 'tasks'), where('clientId', '==', clientId), where('createdBy', '==', 'system'));
        const oldTasksSnap = await getDocs(oldTasksQuery);
        const existingTasks = oldTasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

        const tasksToCreate: any[] = [];
        const today = startOfToday();
        const et = values.entityType;
        const isIndividual = et === 'Individual';
        const isTrustOrIndividual = et === 'Trust' || et === 'Individual';
        const effectiveYearEnd = isTrustOrIndividual ? 'February' : values.yearEnd;

        const getDueDate = (date: Date, day: number) => {
            return Timestamp.fromDate(setSeconds(setMinutes(setHours(setDate(date, day), 9), 0), 0));
        };

        const activeTasksByType = (type: string) => existingTasks.filter(t => t.type === type && t.status !== 'Done');
        const deleteActiveByType = (type: string) => activeTasksByType(type).forEach(t => batch.delete(doc(db, 'tasks', t.id)));

        // --- Cleanup stale ITR task types when entity type changes ---
        const allItrTypes = ['ITR', 'ITR12T', 'ITR12'];
        const currentItrType = et === 'Company' ? 'ITR' : et === 'Trust' ? 'ITR12T' : 'ITR12';
        allItrTypes.filter(t => t !== currentItrType).forEach(deleteActiveByType);

        // --- 1. EMP201 (Company & Trust only, due 7th of following month) ---
        if (!isIndividual && values.submitsEmp201) {
            if (activeTasksByType('EMP201').length === 0) {
                let found = false;
                for (let i = -1; i < 12 && !found; i++) {
                    const periodDate = addMonths(today, i);
                    const dueDate = getDueDate(addMonths(periodDate, 1), 7);
                    if (dueDate.toDate() >= today) {
                        tasksToCreate.push({
                            title: `EMP201 Submission - ${format(periodDate, 'MMMM yyyy')} for ${values.name}`,
                            description: `Submit monthly EMP201 return to SARS for ${values.name}. Due on the 7th of the following month.`,
                            dueDate, type: 'EMP201', recurrence: 'Monthly'
                        });
                        found = true;
                    }
                }
            }
        } else {
            deleteActiveByType('EMP201');
        }

        // --- 2. PAYROLL (Company & Trust only) ---
        if (!isIndividual && values.preparesPayroll && values.payrollDay) {
            if (activeTasksByType('PAYROLL').length === 0) {
                let found = false;
                for (let i = -1; i < 12 && !found; i++) {
                    const periodDate = addMonths(today, i);
                    const dueDate = getDueDate(periodDate, values.payrollDay);
                    if (dueDate.toDate() >= today) {
                        tasksToCreate.push({
                            title: `Payroll Preparation - ${format(periodDate, 'MMMM yyyy')} for ${values.name}`,
                            description: `Prepare and issue payslips for ${values.name} for the period of ${format(periodDate, 'MMMM yyyy')}.`,
                            dueDate, type: 'PAYROLL', recurrence: 'Monthly'
                        });
                        found = true;
                    }
                }
            }
        } else {
            deleteActiveByType('PAYROLL');
        }

        // --- 3. MGMT (Company & Trust only) ---
        if (!isIndividual && values.preparesManagementAccounts && values.managementAccountsDay) {
            if (activeTasksByType('MGMT').length === 0) {
                let found = false;
                for (let i = -1; i < 12 && !found; i++) {
                    const periodDate = addMonths(today, i);
                    const dueDate = getDueDate(addMonths(periodDate, 1), values.managementAccountsDay);
                    if (dueDate.toDate() >= today) {
                        tasksToCreate.push({
                            title: `Management Accounts - ${format(periodDate, 'MMMM yyyy')} for ${values.name}`,
                            description: `Prepare and issue monthly management reports for ${values.name} for the ${format(periodDate, 'MMMM yyyy')} period.`,
                            dueDate, type: 'MGMT', recurrence: 'Monthly'
                        });
                        found = true;
                    }
                }
            }
        } else {
            deleteActiveByType('MGMT');
        }

        // --- 4. VAT201 (all entity types, due 25th of following month) ---
        if (values.isVatRegistered && values.vatCategory) {
            if (activeTasksByType('VAT201').length === 0) {
                let found = false;
                for (let i = -1; i < 12 && !found; i++) {
                    const periodDate = addMonths(today, i);
                    const monthNum = periodDate.getMonth() + 1;
                    
                    let isDue = false;
                    if (values.vatCategory === 'C') isDue = true;
                    else if (values.vatCategory === 'A' && monthNum % 2 !== 0) isDue = true;
                    else if (values.vatCategory === 'B' && monthNum % 2 === 0) isDue = true;

                    if (isDue) {
                        const dueDate = getDueDate(addMonths(periodDate, 1), 25);
                        if (dueDate.toDate() >= today) {
                            tasksToCreate.push({
                                title: `VAT201 Submission - ${format(periodDate, 'MMMM yyyy')} for ${values.name}`,
                                description: `Submit VAT201 return to SARS for ${values.name}. Due on the 25th of the following month.`,
                                dueDate, type: 'VAT201',
                                recurrence: values.vatCategory === 'C' ? 'Monthly' : 'Bi-Monthly'
                            });
                            found = true;
                        }
                    }
                }
            }
        } else {
            deleteActiveByType('VAT201');
        }

        // --- 5. AFS (Company & Trust only) ---
        if (!isIndividual && values.preparesFinancials) {
            if (activeTasksByType('AFS').length === 0) {
                const yeMonthIndex = months.indexOf(effectiveYearEnd);
                let yeDate = new Date(today.getFullYear(), yeMonthIndex, 28);
                let dueDate = getDueDate(addMonths(yeDate, 3), 25);
                
                if (dueDate.toDate() < today) {
                    yeDate = addMonths(yeDate, 12);
                    dueDate = getDueDate(addMonths(yeDate, 3), 25);
                }

                tasksToCreate.push({
                    title: `Annual Financial Statements for ${values.name} (${effectiveYearEnd} YE)`,
                    description: `Prepare and finalize annual financial statements for the ${effectiveYearEnd} year end.`,
                    dueDate, type: 'AFS', recurrence: 'Annually'
                });
            }
        } else {
            deleteActiveByType('AFS');
        }

        // --- 6. INCOME TAX (entity-type-aware) ---
        if (values.submitsIncomeTax) {
            if (activeTasksByType(currentItrType).length === 0) {
                if (et === 'Company') {
                    // ITR14: Due 12 months after variable financial year end
                    const yeMonthIndex = months.indexOf(effectiveYearEnd);
                    let yeDate = new Date(today.getFullYear(), yeMonthIndex, 28);
                    let dueDate = getDueDate(addYears(yeDate, 1), 28);
                    if (dueDate.toDate() < today) {
                        yeDate = addMonths(yeDate, 12);
                        dueDate = getDueDate(addYears(yeDate, 1), 28);
                    }
                    tasksToCreate.push({
                        title: `Income Tax Return (ITR14) for ${values.name} (${effectiveYearEnd} YE)`,
                        description: `Submit annual company income tax return for ${values.name}. Due 12 months after the financial year end.`,
                        dueDate, type: 'ITR', recurrence: 'Annually'
                    });
                } else if (et === 'Trust') {
                    // ITR12T: Due 31 October (filing season)
                    let filingDate = new Date(today.getFullYear(), 9, 31); // October = 9
                    if (filingDate < today) filingDate = new Date(today.getFullYear() + 1, 9, 31);
                    tasksToCreate.push({
                        title: `Trust Tax Return (ITR12T) for ${values.name} (February YE)`,
                        description: `Submit trust income tax return (ITR12T) for ${values.name}. Due 31 October (SARS filing season).`,
                        dueDate: getDueDate(filingDate, 31), type: 'ITR12T', recurrence: 'Annually'
                    });
                } else {
                    // ITR12 Individual: Due 31 October (non-provisional) or 31 January (provisional)
                    const isProvisional = values.submitsProvisionalTax;
                    const filingMonth = isProvisional ? 0 : 9; // January = 0, October = 9
                    const filingDay = isProvisional ? 31 : 31;
                    let filingDate = new Date(today.getFullYear(), filingMonth, filingDay);
                    // For provisional (January), the return is for the previous tax year
                    if (isProvisional && filingDate < today) filingDate = new Date(today.getFullYear() + 1, filingMonth, filingDay);
                    if (!isProvisional && filingDate < today) filingDate = new Date(today.getFullYear() + 1, filingMonth, filingDay);
                    tasksToCreate.push({
                        title: `Income Tax Return (ITR12) for ${values.name} (February YE)`,
                        description: `Submit individual income tax return (ITR12) for ${values.name}. Due ${isProvisional ? '31 January (provisional taxpayer)' : '31 October (filing season)'}.`,
                        dueDate: getDueDate(filingDate, filingDay), type: 'ITR12', recurrence: 'Annually'
                    });
                }
            }
        } else {
            deleteActiveByType(currentItrType);
        }

        // --- 7. IRP6 (entity-type-aware) ---
        if (values.submitsProvisionalTax) {
            if (activeTasksByType('IRP6').length === 0) {
                if (isTrustOrIndividual) {
                    // Fixed dates: P1 = 31 August, P2 = 28 February
                    const p1Dates = [new Date(today.getFullYear(), 7, 31), new Date(today.getFullYear() + 1, 7, 31)]; // Aug = 7
                    const p2Dates = [new Date(today.getFullYear(), 1, 28), new Date(today.getFullYear() + 1, 1, 28)]; // Feb = 1
                    const allDates = [...p1Dates.map(d => ({ date: d, period: 1 })), ...p2Dates.map(d => ({ date: d, period: 2 }))];
                    const next = allDates.filter(d => d.date >= today).sort((a, b) => a.date.getTime() - b.date.getTime())[0];
                    if (next) {
                        tasksToCreate.push({
                            title: `Provisional Tax (IRP6) - Period ${next.period} for ${values.name}`,
                            description: `Submit period ${next.period} provisional tax return for ${values.name}. Due ${next.period === 1 ? '31 August' : '28 February'}.`,
                            dueDate: getDueDate(next.date, next.period === 1 ? 31 : 28), type: 'IRP6', recurrence: 'Semi-Annually'
                        });
                    }
                } else {
                    // Company: relative to year end
                    const yeMonthIndex = months.indexOf(effectiveYearEnd);
                    let firstPeriod = new Date(today.getFullYear(), yeMonthIndex - 6, 25);
                    let secondPeriod = new Date(today.getFullYear(), yeMonthIndex, 25);
                    const dates = [firstPeriod, secondPeriod, addMonths(firstPeriod, 12), addMonths(secondPeriod, 12)];
                    const nextDate = dates.map(d => getDueDate(d, 25)).filter(d => d.toDate() >= today).sort((a, b) => a.toDate().getTime() - b.toDate().getTime())[0];
                    if (nextDate) {
                        const isFirst = isSameDay(nextDate.toDate(), getDueDate(firstPeriod, 25).toDate()) || isSameDay(nextDate.toDate(), getDueDate(addMonths(firstPeriod, 12), 25).toDate());
                        tasksToCreate.push({
                            title: `Provisional Tax (IRP6) - Period ${isFirst ? 1 : 2} for ${values.name}`,
                            description: `Submit period ${isFirst ? 1 : 2} provisional tax return for ${values.name}.`,
                            dueDate: nextDate, type: 'IRP6', recurrence: 'Semi-Annually'
                        });
                    }
                }
            }
        } else {
            deleteActiveByType('IRP6');
        }

        tasksToCreate.forEach(t => {
            const taskRef = doc(collection(db, 'tasks'));
            batch.set(taskRef, {
                ...t,
                clientId,
                clientSource: 'admin',
                entityType: et,
                status: 'To-Do',
                priority: 'Medium',
                assignedTo: [], 
                createdBy: 'system',
                createdAt: serverTimestamp(),
                comments: []
            });
        });

        await batch.commit();
        toast({ title: 'Client Saved', description: `Roadmap updated with upcoming automated tasks.` });
        fetchClients();
        setIsAddOpen(false);
        setIsDetailOpen(false);
    } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: 'Failed to update automation roadmap.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    try {
        const batch = writeBatch(db);
        batch.delete(doc(db, "adminClients", clientId));
        const tasksSnap = await getDocs(query(collection(db, 'tasks'), where('clientId', '==', clientId)));
        tasksSnap.forEach(d => batch.delete(d.ref));
        await batch.commit();
        fetchClients();
        setIsDetailOpen(false);
        toast({ title: 'Client Removed', variant: 'destructive' });
    } catch (error) {
        toast({ title: 'Delete Failed', variant: 'destructive' });
    }
  };

  // Calculations for Metrics CRM cards
  const activeClients = useMemo(() => clients.filter(c => c.status === 'Active'), [clients]);
  const inactiveClientsCount = useMemo(() => clients.filter(c => c.status === 'Inactive').length, [clients]);
  const archivedClientsCount = useMemo(() => clients.filter(c => c.status === 'Archived').length, [clients]);
  const totalMRR = useMemo(() => activeClients.reduce((sum, c) => sum + (c.monthlyRetainerFee || 0), 0), [activeClients]);
  
  const clientOverdueTasks = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(t => {
        if (t.clientId && t.status !== 'Done') {
            const date = getTaskDate(t);
            if (isPast(date) && !isSameDay(date, new Date())) {
                if (!map[t.clientId]) map[t.clientId] = [];
                map[t.clientId].push(t);
            }
        }
    });
    return map;
  }, [tasks]);

  const roadmapHealth = useMemo(() => {
    if (activeClients.length === 0) return 100;
    const healthyCount = activeClients.filter(c => !clientOverdueTasks[c.id] || clientOverdueTasks[c.id].length === 0).length;
    return Math.round((healthyCount / activeClients.length) * 100);
  }, [activeClients, clientOverdueTasks]);

  // Filters calculation
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const nameMatch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' ? true : client.status === statusFilter;
      const entityMatch = entityTypeFilter === 'all' ? true : client.entityType === entityTypeFilter;
      
      let serviceMatch = true;
      if (serviceFilter !== 'all') {
        if (serviceFilter === 'VAT') serviceMatch = !!client.isVatRegistered;
        else if (serviceFilter === 'PAYE') serviceMatch = !!client.submitsEmp201;
        else if (serviceFilter === 'Payroll') serviceMatch = !!client.preparesPayroll;
        else if (serviceFilter === 'Mgmt') serviceMatch = !!client.preparesManagementAccounts;
        else if (serviceFilter === 'Prov') serviceMatch = !!client.submitsProvisionalTax;
        else if (serviceFilter === 'ITR') serviceMatch = !!client.submitsIncomeTax;
        else if (serviceFilter === 'AFS') serviceMatch = !!client.preparesFinancials;
      }

      return nameMatch && statusMatch && serviceMatch && entityMatch;
    });
  }, [clients, searchTerm, statusFilter, serviceFilter, entityTypeFilter]);

  const selectedClientTasks = useMemo(() => {
    if (!selectedClient) return [];
    return tasks.filter(t => t.clientId === selectedClient.id).sort((a, b) => getTaskDate(a).getTime() - getTaskDate(b).getTime());
  }, [selectedClient, tasks]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Client Relationship Management</h1>
            <p className="text-sm text-slate-500 font-medium">Manage practice portfolios, review compliance roadmaps, and monitor active retainers.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
           <DialogTrigger asChild>
                <Button className="shadow-md font-bold px-4 py-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Client Profile
                </Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Create Client Profile</DialogTitle>
                    <DialogDescription>Setup toggles to automate compliance returns for this new client.</DialogDescription>
                </DialogHeader>
                <ClientForm 
                    client={null} 
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsAddOpen(false)}
                />
           </DialogContent>
        </Dialog>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Clients</span>
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary"><Users className="h-5 w-5" /></div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-800">{clients.length}</span>
              <div className="flex gap-2 items-center mt-2 text-xs font-bold text-slate-500">
                <span className="text-emerald-500">{activeClients.length} Active</span>
                <span>•</span>
                <span>{inactiveClientsCount} Inactive</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Retainers (MRR)</span>
              <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600"><DollarSign className="h-5 w-5" /></div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-800">R {totalMRR.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
              <div className="mt-2 text-xs font-semibold text-slate-400">Monthly Recurring Revenue</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Practice Health</span>
              <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600"><HeartPulse className="h-5 w-5" /></div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-800">{roadmapHealth}%</span>
              <div className="mt-2 text-xs font-semibold text-slate-400">Active clients with no overdue tasks</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Archived Clients</span>
              <div className="bg-slate-100 p-2.5 rounded-xl text-slate-600"><AlertOctagon className="h-5 w-5" /></div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-800">{archivedClientsCount}</span>
              <div className="mt-2 text-xs font-semibold text-slate-400">Archived client records</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main CRM Workspace Container */}
      <Card className="border shadow-md rounded-2xl bg-white overflow-hidden">
        {/* Table Filters & Control Header */}
        <div className="p-6 border-b bg-slate-50/50 flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <Input 
              placeholder="Search clients by name..." 
              className="pl-10 h-10 w-full bg-white border-slate-200 focus:ring-2 focus:ring-primary/25 rounded-lg text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filters:</span>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs font-semibold bg-white border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active Only</SelectItem>
                <SelectItem value="Inactive">Inactive Only</SelectItem>
                <SelectItem value="Archived">Archived Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={serviceFilter => setServiceFilter(serviceFilter)}>
              <SelectTrigger className="w-[180px] h-9 text-xs font-semibold bg-white border-slate-200">
                <SelectValue placeholder="Filter by Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="VAT">VAT Registered</SelectItem>
                <SelectItem value="PAYE">Monthly PAYE (EMP201)</SelectItem>
                <SelectItem value="Payroll">Payroll Prep</SelectItem>
                <SelectItem value="Mgmt">Management Accounts</SelectItem>
                <SelectItem value="Prov">Provisional Tax (IRP6)</SelectItem>
                <SelectItem value="ITR">Income Tax (ITR14)</SelectItem>
                <SelectItem value="AFS">Financial Statements</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-[150px] h-9 text-xs font-semibold bg-white border-slate-200">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Company">Company</SelectItem>
                <SelectItem value="Trust">Trust</SelectItem>
                <SelectItem value="Individual">Individual</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || statusFilter !== 'all' || serviceFilter !== 'all' || entityTypeFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 text-xs font-bold text-slate-500"
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setServiceFilter('all'); setEntityTypeFilter('all'); }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Client List Table */}
        <div className="overflow-x-auto">
          {isLoading && clients.length === 0 ? (
            <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center items-center h-72"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
          ) : (
          <Table>
            <TableHeader className="bg-slate-50/20">
              <TableRow className="border-b">
                <TableHead className="font-bold text-slate-500 py-4 pl-6">Client Name</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Type</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Year End</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Retainer</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Services Automation Roadmap</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Status</TableHead>
                <TableHead className="text-right font-bold text-slate-500 py-4 pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map(client => {
                const overdueTasks = clientOverdueTasks[client.id] || [];
                const EntityIcon = client.entityType === 'Company' ? Building2 : client.entityType === 'Trust' ? Landmark : CircleUser;
                const entityColor = client.entityType === 'Company' ? 'bg-blue-50/80 text-blue-700 border-blue-200/50' : client.entityType === 'Trust' ? 'bg-amber-50/80 text-amber-700 border-amber-200/50' : 'bg-violet-50/80 text-violet-700 border-violet-200/50';
                return (
                  <TableRow key={client.id} className="hover:bg-slate-50/40 transition-colors border-b">
                    <TableCell className="font-semibold text-slate-900 pl-6 py-4">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors" onClick={() => handleEdit(client)}>
                          {client.name}
                          {overdueTasks.length > 0 && (
                            <Badge variant="destructive" className="h-4.5 px-1.5 text-[9px] font-extrabold uppercase animate-pulse">
                              {overdueTasks.length} LATE
                            </Badge>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tight ${entityColor}`}>
                        <EntityIcon className="h-3 w-3 mr-1" />
                        {client.entityType || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 font-medium py-4">{formatYearEnd(client.yearEnd)}</TableCell>
                    <TableCell className="text-sm text-slate-700 font-black py-4">
                      R {(client.monthlyRetainerFee || 0).toLocaleString('en-ZA')}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xl">
                          {client.isVatRegistered && (
                              <Badge variant="outline" className="text-[9px] font-black bg-blue-50/80 text-blue-700 border-blue-200/50 uppercase tracking-tight">
                                  VAT ({client.vatCategory})
                              </Badge>
                          )}
                          {client.submitsEmp201 && (
                              <Badge variant="outline" className="text-[9px] font-black bg-green-50/80 text-green-700 border-green-200/50 uppercase tracking-tight">
                                  PAYE
                              </Badge>
                          )}
                          {client.preparesPayroll && (
                              <Badge variant="outline" className="text-[9px] font-black bg-emerald-50/80 text-emerald-700 border-emerald-200/50 uppercase tracking-tight">
                                  Payroll
                              </Badge>
                          )}
                          {client.preparesManagementAccounts && (
                              <Badge variant="outline" className="text-[9px] font-black bg-amber-50/80 text-amber-700 border-amber-200/50 uppercase tracking-tight">
                                  Mgmt
                              </Badge>
                          )}
                          {client.submitsProvisionalTax && (
                              <Badge variant="outline" className="text-[9px] font-black bg-purple-50/80 text-purple-700 border-purple-200/50 uppercase tracking-tight">
                                  Prov
                              </Badge>
                          )}
                          {client.submitsIncomeTax && (
                              <Badge variant="outline" className="text-[9px] font-black bg-rose-50/80 text-rose-700 border-rose-200/50 uppercase tracking-tight">
                                  ITR
                              </Badge>
                          )}
                          {client.preparesFinancials && (
                              <Badge variant="outline" className="text-[9px] font-black bg-slate-50/80 text-slate-700 border-slate-200/50 uppercase tracking-tight">
                                  AFS
                              </Badge>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge 
                        variant={client.status === 'Active' ? 'default' : 'secondary'} 
                        className={client.status === 'Active' ? "font-bold text-[10px] px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600" : "font-bold text-[10px] px-2 py-0.5"}
                      >
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <Button variant="ghost" size="sm" className="h-8 gap-1 font-bold text-xs" onClick={() => handleEdit(client)}>
                        <Eye className="h-4 w-4" /> View Client
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-slate-400 font-medium">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                    No clients matched the filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </div>
      </Card>

      {/* Client Workspace slide-over Drawer */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-xl w-full flex flex-col h-full bg-white p-0 overflow-hidden">
          {selectedClient && (
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="p-6 border-b bg-gradient-to-r from-slate-900 to-slate-800 text-white relative">
                <SheetHeader className="text-left">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-primary hover:bg-primary text-[10px] uppercase font-black tracking-wide">Client Profile</Badge>
                    <Badge variant={selectedClient.status === 'Active' ? 'default' : 'secondary'} className={selectedClient.status === 'Active' ? 'bg-emerald-500 hover:bg-emerald-600 text-xs font-bold' : 'text-xs font-bold'}>{selectedClient.status}</Badge>
                  </div>
                  <SheetTitle className="text-2xl font-black text-white mt-2 leading-tight">{selectedClient.name}</SheetTitle>
                  <SheetDescription className="text-slate-300 text-xs font-medium mt-1">
                    Financial Year End: <span className="text-white font-bold">{formatYearEnd(selectedClient.yearEnd)}</span> | Monthly Retainer: <span className="text-white font-bold">R {selectedClient.monthlyRetainerFee || 0}</span>
                  </SheetDescription>
                </SheetHeader>
              </div>

              {/* Drawer Tabs */}
              <Tabs defaultValue="roadmap" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 border-b bg-slate-50/50">
                  <TabsList className="grid grid-cols-2 w-full my-3">
                    <TabsTrigger value="roadmap" className="font-bold text-xs">Compliance Roadmap</TabsTrigger>
                    <TabsTrigger value="profile" className="font-bold text-xs">Profile & Settings</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {/* TAB 1: Tasks Compliance Roadmap */}
                  <TabsContent value="roadmap" className="mt-0 space-y-4 focus-visible:outline-none">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Automated Returns</h3>
                      <Badge variant="outline" className="text-[10px] font-black">{selectedClientTasks.length} System Tasks</Badge>
                    </div>

                    <div className="space-y-3">
                      {selectedClientTasks.map(task => {
                        const date = getTaskDate(task);
                        const isLate = task.status !== 'Done' && isPast(date) && !isSameDay(date, new Date());
                        return (
                          <div 
                            key={task.id} 
                            className={`p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm bg-white hover:border-slate-200 transition-all ${
                              isLate ? 'border-destructive/20 bg-destructive/5' : ''
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-slate-800 line-clamp-1">{task.title}</p>
                                {isLate && <Badge variant="destructive" className="h-4 px-1.5 text-[8px] font-black uppercase">LATE</Badge>}
                              </div>
                              <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{task.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Due: {format(date, 'dd MMM yyyy')}</span>
                                {task.recurrence && <Badge variant="secondary" className="text-[8px] h-4.5 font-bold uppercase">{task.recurrence}</Badge>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 self-end md:self-auto">
                              <Badge 
                                variant="outline" 
                                className={`text-[9px] font-black uppercase tracking-tight ${
                                  task.status === 'Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  task.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {task.status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                      {selectedClientTasks.length === 0 && (
                        <div className="text-center py-12 text-slate-400 font-medium">
                          No system tasks scheduled.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* TAB 2: Settings & Profile Edit Form */}
                  <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Edit Client details</h3>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive font-bold text-xs uppercase">
                            Delete Client
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg font-bold">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-slate-500">
                              This will permanently delete the client <span className="font-bold text-slate-900">{selectedClient.name}</span> and all associated system-generated tasks. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="font-semibold">Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-white font-bold" onClick={() => handleDelete(selectedClient.id)}>Confirm Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <ClientForm 
                      client={selectedClient} 
                      onSubmit={handleFormSubmit}
                      onCancel={() => setIsDetailOpen(false)}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

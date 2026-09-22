'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter 
} from "@/components/ui/dialog";
import { 
    Form, 
    FormControl, 
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage, 
    FormDescription 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    serverTimestamp 
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { AllocationRule } from '@/lib/types';
import { matchesRuleKeyword } from '@/lib/bank-cleaner';
import { resolveAccountForCategory } from '@/lib/chart-of-accounts-mapper';
import { 
    CreateManualTransactionDialogProps, 
    manualTransactionSchema, 
    ManualTransactionFormValues 
} from '../types';

const db = getFirestore(firebaseApp);

export function CreateManualTransactionDialog({ 
    client, 
    bankAccountId, 
    open, 
    onOpenChange 
}: CreateManualTransactionDialogProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const form = useForm<ManualTransactionFormValues>({
        resolver: zodResolver(manualTransactionSchema),
        defaultValues: {
            date: new Date(),
            description: '',
            amount: 0,
            reference: '',
        },
    });

    const handleSave = async (values: ManualTransactionFormValues) => {
        if (!client?.uid || !bankAccountId) return;
        setIsSaving(true);
        try {
            const isExpense = values.amount < 0;
            const description = values.description.toUpperCase();
            
            let allRules = [...(client.allocationRules || [])];
            if (!client.disableGlobalRules) {
                const rulesRef = collection(db, "allocationRules");
                const rulesSnap = await getDocs(rulesRef);
                const globalRules = rulesSnap.docs.map(d => ({ ...d.data(), id: d.id } as AllocationRule));
                allRules = [...allRules, ...globalRules];
            }
            allRules.sort((a, b) => (a.priority || 99) - (b.priority || 99));
            
            const match = isExpense ? allRules.find(r => r.keywords.some(kw => matchesRuleKeyword(description, kw))) : null;

            const txData: any = {
                clientId: client.uid,
                date: values.date.toISOString(),
                reference: values.reference || `MANUAL-${Date.now()}`,
                description: description,
                rawDescription: description,
                cleanDescription: description,
                amount: values.amount,
                isExpense: isExpense,
                bankAccountId: bankAccountId,
                status: (isExpense && match) ? 'reviewed' : 'new',
                createdAt: serverTimestamp(),
            };

            if (isExpense && match) {
                const keyword = match.keywords.find(kw => matchesRuleKeyword(description, kw));
                let targetAccountId = match.accountId;
                let targetAccountType = match.accountType || 'account';
                if (client.chartOfAccounts && client.chartOfAccounts.length > 0) {
                    const resolved = resolveAccountForCategory(client.chartOfAccounts, match);
                    if (resolved) {
                        targetAccountId = resolved.accountNumber;
                        targetAccountType = resolved.accountType;
                    }
                }
                txData.allocatedTo = { value: targetAccountId, type: targetAccountType };
                txData.vatType = client.isVatRegistered ? match.vatType : 'no_vat';
                txData.allocatedAt = serverTimestamp();
                txData.allocationSource = 'rule';
                txData.matchedRuleId = match.id;
                txData.matchedRuleDescription = match.description;
                txData.matchedKeyword = keyword;
            }

            await addDoc(collection(db, 'aiAccountantClients', client.uid, 'transactions'), txData);
            
            toast({ title: 'Transaction Created', description: 'The transaction has been added to the queue.' });
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to create transaction.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Manual Transaction</DialogTitle>
                    <DialogDescription>Enter the details for a single bank entry.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                        <FormField control={form.control} name="date" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g. OFFICE RENT" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="amount" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount (Negative for Expense)</FormLabel>
                                <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                                <FormDescription>Use a negative sign (-) for payments/expenses.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="reference" render={({ field }) => (
                            <FormItem><FormLabel>Reference (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Transaction
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

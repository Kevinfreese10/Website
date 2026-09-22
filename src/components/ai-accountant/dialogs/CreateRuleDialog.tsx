'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { 
    Form, 
    FormControl, 
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from '@/components/ui/button';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { AccountSelector } from '@/components/accounting/AccountSelector';
import { allVatTypes } from '@/lib/vat-types';
import { useToast } from '@/hooks/use-toast';
import { 
    getFirestore, 
    doc, 
    updateDoc, 
    arrayUnion, 
    getDocs, 
    collection, 
    setDoc, 
    serverTimestamp 
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { 
    CreateRuleDialogProps, 
    ruleFormSchema, 
    RuleFormValues 
} from '../types';

const db = getFirestore(firebaseApp);

export function CreateRuleDialog({ 
    client, 
    onRuleCreated, 
    open, 
    onOpenChange, 
    defaultValues, 
    existingRules, 
    customers, 
    suppliers 
}: CreateRuleDialogProps) {
    const { toast } = useToast();
    const form = useForm<RuleFormValues>({
        resolver: zodResolver(ruleFormSchema),
        defaultValues: { mode: 'new', scope: 'client', ...defaultValues },
    });

    const watchAccountType = form.watch('accountType');

    useEffect(() => {
        if (open) {
            form.reset({ mode: 'new', scope: 'client', ...defaultValues });
        }
    }, [open, defaultValues, form]);
    
    const handleSave = async (values: RuleFormValues) => {
        if (!client?.uid) return;
        const keywordsArray = values.keywords.split(',').map(k => k.trim().toUpperCase()).filter(Boolean);

        try {
            if (values.mode === 'append' && values.existingRuleId) {
                const rule = existingRules.find(r => r.id === values.existingRuleId);
                if (rule) {
                    const clientRef = doc(db, 'aiAccountantClients', client.uid);
                    const updatedRules = (client.allocationRules || []).map(r => r.id === rule.id ? { ...r, keywords: Array.from(new Set([...r.keywords, ...keywordsArray])) } : r);
                    await updateDoc(clientRef, { allocationRules: updatedRules });
                }
            } else {
                const newRule = {
                    id: `rule_${Date.now()}`,
                    description: values.description || '',
                    keywords: keywordsArray,
                    accountId: values.accountId || '',
                    accountType: values.accountType,
                    vatType: values.vatType || 'no_vat',
                    type: 'hard' as const,
                    scope: 'client' as const,
                    priority: 99,
                };
                await updateDoc(doc(db, 'aiAccountantClients', client.uid), { allocationRules: arrayUnion(newRule) });
            }

            // Sync keywords to global practice rules collection ('allocationRules')
            if (values.accountId) {
                const globalSnap = await getDocs(collection(db, 'allocationRules'));
                const globalMatch = globalSnap.docs.find(d => d.data().accountId === values.accountId);
                if (globalMatch) {
                    const existingGlobalKws = globalMatch.data().keywords || [];
                    const mergedKws = Array.from(new Set([...existingGlobalKws, ...keywordsArray]));
                    await updateDoc(doc(db, 'allocationRules', globalMatch.id), { keywords: mergedKws });
                } else {
                    const newGlobalDocRef = doc(collection(db, 'allocationRules'));
                    await setDoc(newGlobalDocRef, {
                        description: values.description || `Rule for ${keywordsArray[0] || 'Account'}`,
                        keywords: keywordsArray,
                        accountId: values.accountId,
                        vatType: values.vatType || 'no_vat',
                        type: 'hard',
                        scope: 'global',
                        priority: 99,
                        createdAt: serverTimestamp()
                    });
                }
            }

            toast({ title: 'Practice Rule Saved & Global Rules Updated' });
            onRuleCreated();
            onOpenChange(false);
        } catch(e) {
            console.error("Error saving practice rule:", e);
            toast({ title: 'Error', variant: 'destructive'});
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Create Allocation Rule</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="keywords" render={({ field }) => ( <FormItem><FormLabel>Keywords (comma-separated)</FormLabel><FormControl><Textarea {...field} className="resize-none h-20" /></FormControl><FormMessage /></FormItem> )} />
                        
                        <FormField control={form.control} name="accountType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Allocation Target</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="account">General Ledger Account</SelectItem>
                                        <SelectItem value="customer">Customer Account</SelectItem>
                                        <SelectItem value="supplier">Supplier Account</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="accountId" render={({ field }) => (
                            <FormItem><FormLabel>Select {watchAccountType === 'account' ? 'Account' : watchAccountType === 'customer' ? 'Customer' : 'Supplier'}</FormLabel>
                                <AccountSelector
                                    client={client}
                                    customers={customers}
                                    suppliers={suppliers}
                                    showAccounts={watchAccountType === 'account'}
                                    showCustomers={watchAccountType === 'customer'}
                                    showSuppliers={watchAccountType === 'supplier'}
                                    value={field.value ? { value: field.value, type: watchAccountType as "account" | "customer" | "supplier" } : null}
                                    onChange={(selection) => {
                                        field.onChange(selection.value);
                                    }}
                                    placeholder="Select target..."
                                />
                                <FormMessage />
                            </FormItem>
                        )} />
                        {client?.isVatRegistered && (
                            <FormField control={form.control} name="vatType" render={({ field }) => (
                                <FormItem><FormLabel>VAT Treatment</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select VAT type" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {allVatTypes.map(vt => (
                                                <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}
                        <DialogFooter><Button type="submit" className="w-full">Save Rule</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

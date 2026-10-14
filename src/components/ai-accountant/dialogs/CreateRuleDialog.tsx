import React, { useEffect, useMemo, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Layers, Plus, CheckCircle2, ArrowRight } from 'lucide-react';
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
import { sanitizeKeyword } from '@/lib/keyword-sanitizer';

const db = getFirestore(firebaseApp);

export function CreateRuleDialog({ 
    client, 
    onRuleCreated, 
    open, 
    onOpenChange, 
    defaultValues, 
    existingRules, 
    customers = [], 
    suppliers = [] 
}: CreateRuleDialogProps) {
    const { toast } = useToast();
    const form = useForm<RuleFormValues>({
        resolver: zodResolver(ruleFormSchema),
        defaultValues: { mode: 'new', scope: 'client', ...defaultValues },
    });

    const watchAccountType = form.watch('accountType');
    const watchAccountId = form.watch('accountId');
    const watchMode = form.watch('mode');
    const watchExistingRuleId = form.watch('existingRuleId');

    const [prevAccountId, setPrevAccountId] = useState<string | undefined>(undefined);

    // Compute existing rules matching the selected account
    const matchingRules = useMemo(() => {
        if (!watchAccountId) return [];
        const allRules = [
            ...(client?.allocationRules || []),
            ...(existingRules || [])
        ];
        const seen = new Set<string>();
        return allRules.filter(r => {
            if (!r || !r.id || seen.has(r.id)) return false;
            seen.add(r.id);
            return r.accountId === watchAccountId;
        });
    }, [watchAccountId, client?.allocationRules, existingRules]);

    useEffect(() => {
        if (open) {
            form.reset({ mode: 'new', scope: 'client', ...defaultValues });
            setPrevAccountId(defaultValues?.accountId);
        }
    }, [open, defaultValues, form]);

    // When an account is selected and matching rules exist, auto-suggest 'append' mode
    useEffect(() => {
        if (watchAccountId && watchAccountId !== prevAccountId) {
            setPrevAccountId(watchAccountId);
            if (matchingRules.length > 0) {
                form.setValue('mode', 'append');
                form.setValue('existingRuleId', matchingRules[0].id);
            } else {
                form.setValue('mode', 'new');
                form.setValue('existingRuleId', undefined);
            }
        }
    }, [watchAccountId, prevAccountId, matchingRules, form]);
    
    const getTargetName = (accId?: string, accType?: string) => {
        if (!accId) return 'Target Account';
        if (accType === 'customer') {
            const c = customers.find(x => x.id === accId);
            return c ? `${c.name} (Customer)` : accId;
        }
        if (accType === 'supplier') {
            const s = suppliers.find(x => x.id === accId);
            return s ? `${s.name} (Supplier)` : accId;
        }
        const acc = client?.chartOfAccounts?.find(a => a.id === accId);
        return acc ? `${acc.description || acc.name} (${acc.code || accId})` : accId;
    };

    const handleSave = async (values: RuleFormValues) => {
        if (!client?.uid) return;
        const keywordsArray = values.keywords.split(',').map(k => sanitizeKeyword(k).toUpperCase()).filter(Boolean);

        try {
            if (values.mode === 'append' && values.existingRuleId) {
                const rule = matchingRules.find(r => r.id === values.existingRuleId) || existingRules.find(r => r.id === values.existingRuleId);
                if (rule) {
                    // Update client rule if it exists
                    const clientHasRule = (client.allocationRules || []).some(r => r.id === rule.id);
                    if (clientHasRule) {
                        const clientRef = doc(db, 'aiAccountantClients', client.uid);
                        const updatedRules = (client.allocationRules || []).map(r => 
                            r.id === rule.id 
                                ? { ...r, keywords: Array.from(new Set([...(r.keywords || []), ...keywordsArray])) } 
                                : r
                        );
                        await updateDoc(clientRef, { allocationRules: updatedRules });
                    }

                    // Update global practice rule only if client is not isolated and scope is global
                    const isClientIsolated = Boolean(client?.disableGlobalRules || (client as any)?.isBlankProfile);
                    if (!isClientIsolated && values.scope === 'global') {
                        try {
                            const globalRef = doc(db, 'allocationRules', rule.id);
                            const existingGlobalKws = rule.keywords || [];
                            const mergedKws = Array.from(new Set([...existingGlobalKws, ...keywordsArray]));
                            await updateDoc(globalRef, { keywords: mergedKws });
                        } catch (_) {}
                    }
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

            // Sync keywords to global practice rules collection ('allocationRules') ONLY if:
            // 1. Client does not have isolated practice mode (disableGlobalRules)
            // 2. Client is not a blank profile
            // 3. Form scope is explicitly 'global'
            const isClientIsolated = Boolean(client?.disableGlobalRules || (client as any)?.isBlankProfile);
            if (values.accountId && !isClientIsolated && values.scope === 'global') {
                const globalSnap = await getDocs(collection(db, 'allocationRules'));
                const globalMatch = globalSnap.docs.find(d => d.data().accountId === values.accountId);
                if (globalMatch) {
                    const existingGlobalKws = globalMatch.data().keywords || [];
                    const mergedKws = Array.from(new Set([...existingGlobalKws, ...keywordsArray]));
                    await updateDoc(doc(db, 'allocationRules', globalMatch.id), { keywords: mergedKws });
                } else if (values.mode === 'new') {
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

            toast({ 
                title: values.mode === 'append' 
                    ? 'Keyword Added to Existing Rule' 
                    : (isClientIsolated || values.scope === 'client' ? 'Client Allocation Rule Saved' : 'Practice Rule Saved & Global Rules Updated')
            });
            onRuleCreated();
            onOpenChange(false);
        } catch(e) {
            console.error("Error saving practice rule:", e);
            toast({ title: 'Error', variant: 'destructive'});
        }
    };

    const selectedRule = matchingRules.find(r => r.id === (watchExistingRuleId || matchingRules[0]?.id));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {watchMode === 'append' ? 'Add Keyword to Existing Rule' : 'Create Allocation Rule'}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                        <FormField control={form.control} name="keywords" render={({ field }) => ( 
                            <FormItem>
                                <FormLabel>Keywords (comma-separated)</FormLabel>
                                <FormControl><Textarea {...field} className="resize-none h-16 font-mono text-xs uppercase" /></FormControl>
                                <FormMessage />
                            </FormItem> 
                        )} />
                        
                        <FormField control={form.control} name="accountType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Allocation Target</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="account">General Ledger Account</SelectItem>
                                        <SelectItem value="customer">Customer Account</SelectItem>
                                        <SelectItem value="supplier">Supplier Account</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="accountId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Select {watchAccountType === 'account' ? 'Account' : watchAccountType === 'customer' ? 'Customer' : 'Supplier'}</FormLabel>
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
                                    className="h-8 text-xs"
                                />
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Matching Existing Rules Mode Toggle */}
                        {matchingRules.length > 0 && (
                            <div className="space-y-3 p-3 bg-muted/40 rounded-lg border border-primary/20">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <Layers className="h-3.5 w-3.5 text-primary" />
                                        Rule Option:
                                    </Label>
                                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary font-bold">
                                        {matchingRules.length} existing rule{matchingRules.length > 1 ? 's' : ''} found
                                    </Badge>
                                </div>
                                <RadioGroup
                                    value={watchMode}
                                    onValueChange={(val) => {
                                        form.setValue('mode', val as 'new' | 'append');
                                        if (val === 'append' && !watchExistingRuleId && matchingRules[0]) {
                                            form.setValue('existingRuleId', matchingRules[0].id);
                                        }
                                    }}
                                    className="grid grid-cols-2 gap-2"
                                >
                                    <div className={`flex items-center space-x-2 border rounded-md p-2.5 cursor-pointer transition-colors ${watchMode === 'append' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50 bg-background'}`}>
                                        <RadioGroupItem value="append" id="mode-append" />
                                        <Label htmlFor="mode-append" className="text-xs font-semibold cursor-pointer">
                                            Add to Existing Rule
                                        </Label>
                                    </div>
                                    <div className={`flex items-center space-x-2 border rounded-md p-2.5 cursor-pointer transition-colors ${watchMode === 'new' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50 bg-background'}`}>
                                        <RadioGroupItem value="new" id="mode-new" />
                                        <Label htmlFor="mode-new" className="text-xs font-semibold cursor-pointer">
                                            Create New Rule
                                        </Label>
                                    </div>
                                </RadioGroup>

                                {watchMode === 'append' && (
                                    <div className="space-y-2 pt-1">
                                        <Label className="text-[11px] font-semibold text-muted-foreground">Select Matching Rule to Update:</Label>
                                        <Select
                                            value={watchExistingRuleId || matchingRules[0]?.id}
                                            onValueChange={(id) => form.setValue('existingRuleId', id)}
                                        >
                                            <SelectTrigger className="h-9 text-xs bg-background">
                                                <SelectValue placeholder="Choose existing rule..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {matchingRules.map((r, idx) => (
                                                    <SelectItem key={r.id} value={r.id} className="text-xs">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-semibold">
                                                                {getTargetName(r.accountId, r.accountType)}
                                                                {matchingRules.length > 1 ? ` • Rule #${idx + 1}` : ''}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                Current keywords ({r.keywords?.length || 0}): {r.keywords?.slice(0, 3).join(', ')}{(r.keywords?.length || 0) > 3 ? '...' : ''}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {selectedRule && (
                                            <div className="p-2.5 bg-background rounded-md border text-xs space-y-1.5">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="font-semibold text-foreground">
                                                        Account: {getTargetName(selectedRule.accountId, selectedRule.accountType)}
                                                        {matchingRules.length > 1 ? ` (Rule #${matchingRules.findIndex(r => r.id === selectedRule.id) + 1})` : ''}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] font-mono">{selectedRule.vatType || 'no_vat'}</Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-1 items-center">
                                                    <span className="text-[10px] text-muted-foreground mr-1">Existing:</span>
                                                    {(selectedRule.keywords || []).slice(0, 6).map((kw, i) => (
                                                        <Badge key={i} variant="outline" className="text-[10px] font-mono py-0 px-1 bg-muted/30">
                                                            {kw}
                                                        </Badge>
                                                    ))}
                                                    {(selectedRule.keywords?.length || 0) > 6 && (
                                                        <span className="text-[10px] text-muted-foreground">+{(selectedRule.keywords?.length || 0) - 6} more</span>
                                                    )}
                                                </div>
                                                <div className="pt-1 border-t text-[11px] text-primary flex items-center gap-1 font-medium">
                                                    <ArrowRight className="h-3 w-3" />
                                                    <span>Will append new keyword(s) above into this rule.</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {watchMode === 'new' && (
                            <FormField control={form.control} name="description" render={({ field }) => ( 
                                <FormItem>
                                    <FormLabel>Rule Description</FormLabel>
                                    <FormControl><Input {...field} placeholder="e.g. Fuel expenses for Shell, Engen, BP..." className="h-8 text-xs" /></FormControl>
                                    <FormMessage />
                                </FormItem> 
                            )} />
                        )}

                        {client?.isVatRegistered && watchMode === 'new' && (
                            <FormField control={form.control} name="vatType" render={({ field }) => (
                                <FormItem><FormLabel>VAT Treatment</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select VAT type" /></SelectTrigger></FormControl>
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

                        <DialogFooter>
                            <Button type="submit" className="w-full h-9 text-xs font-bold gap-1.5">
                                {watchMode === 'append' ? (
                                    <>
                                        <Layers className="h-3.5 w-3.5" /> Add Keyword to Existing Rule
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-3.5 w-3.5" /> Create Allocation Rule
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

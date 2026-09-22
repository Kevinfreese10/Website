'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from "@/components/ui/dialog";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { AccountSelector } from '@/components/accounting/AccountSelector';
import { 
    Layers, 
    PlusCircle, 
    Trash2, 
    CheckCircle2, 
    Loader2 
} from 'lucide-react';
import { cn, sanitizeFirestoreData } from '@/lib/utils';
import { allVatTypes } from '@/lib/vat-types';
import { useToast } from '@/hooks/use-toast';
import { 
    getFirestore, 
    doc, 
    collection, 
    writeBatch, 
    serverTimestamp 
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { SplitTransactionDialogProps, formatPrice } from '../types';

const db = getFirestore(firebaseApp);

interface SplitRow {
    amount: string;
    allocatedTo: { value: string, type: 'account' | 'supplier' | 'customer' } | null;
    vatType: string;
}

export function SplitTransactionDialog({ 
    client, 
    transaction, 
    open, 
    onOpenChange, 
    onSplitComplete,
    customers,
    suppliers
}: SplitTransactionDialogProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const [rows, setRows] = useState<SplitRow[]>([
        { amount: '', allocatedTo: null, vatType: 'no_vat' },
        { amount: '', allocatedTo: null, vatType: 'no_vat' }
    ]);

    useEffect(() => {
        if (open && transaction) {
            setRows([
                { amount: '', allocatedTo: null, vatType: transaction.isExpense ? 'standard_rated_purchases' : 'standard_rated_sales' },
                { amount: '', allocatedTo: null, vatType: transaction.isExpense ? 'standard_rated_purchases' : 'standard_rated_sales' }
            ]);
        }
    }, [open, transaction]);

    const uniqueChartOfAccounts = useMemo(() => {
        const coa = [...(client?.chartOfAccounts || [])];
        const unique = Array.from(new Map(coa.map(a => [a.accountNumber, a])).values());
        return unique.sort((a, b) => a.description.toLowerCase().localeCompare(b.description.toLowerCase()));
    }, [client]);

    const getAllocationName = useCallback((allocation: { value: string, type: 'account' | 'supplier' | 'customer' }) => {
        if (allocation.type === 'customer') {
            return customers.find(c => c.id === allocation.value)?.name || 'Selected Customer';
        }
        if (allocation.type === 'supplier') {
            return suppliers.find(s => s.id === allocation.value)?.name || 'Selected Supplier';
        }
        return uniqueChartOfAccounts.find(a => a.id === allocation.value)?.description || 'Selected Account';
    }, [uniqueChartOfAccounts, customers, suppliers]);

    if (!transaction) return null;

    const originalAbs = Math.abs(transaction.amount);
    const currentSum = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const diff = Math.round(originalAbs * 100) - Math.round(currentSum * 100);
    const remaining = diff / 100;
    const isBalanced = diff === 0;

    const handleAddRow = () => {
        setRows([...rows, { amount: '', allocatedTo: null, vatType: transaction.isExpense ? 'standard_rated_purchases' : 'standard_rated_sales' }]);
    };

    const handleRemoveRow = (index: number) => {
        if (rows.length <= 2) return;
        const newRows = [...rows];
        newRows.splice(index, 1);
        setRows(newRows);
    };

    const handleRowChange = (index: number, field: keyof SplitRow, value: any) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const isValid = isBalanced && rows.every(r => {
        const amt = parseFloat(r.amount);
        return !isNaN(amt) && amt > 0 && r.allocatedTo && r.allocatedTo.value;
    });

    const handleSaveSplits = async () => {
        if (!client?.uid || !transaction) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            const txCollection = collection(db, 'aiAccountantClients', client.uid, 'transactions');
            
            // Delete original
            batch.delete(doc(txCollection, transaction.id));
            
            // Create splits
            const sign = transaction.isExpense ? -1 : 1;
            rows.forEach((row, index) => {
                const amtVal = parseFloat(row.amount);
                const subAmount = amtVal * sign;
                const subRef = transaction.reference ? `${transaction.reference}-S${index + 1}` : `CSV-${Date.now()}-S${index + 1}`;
                const subDescription = `${transaction.description} (Split ${index + 1}/${rows.length})`;
                
                const subTxData = {
                    clientId: client.uid,
                    bankAccountId: transaction.bankAccountId,
                    date: transaction.date,
                    description: subDescription,
                    amount: subAmount,
                    status: 'reviewed',
                    isExpense: transaction.isExpense,
                    allocatedTo: {
                        value: row.allocatedTo!.value,
                        type: row.allocatedTo!.type
                    },
                    vatType: client.isVatRegistered ? row.vatType : 'no_vat',
                    reference: subRef,
                    allocatedAt: serverTimestamp(),
                    allocationSource: 'manual',
                    splitFrom: transaction.id,
                    isSplitChild: true,
                    parentTxData: {
                        id: transaction.id,
                        amount: transaction.amount,
                        description: transaction.description,
                        date: transaction.date,
                        reference: transaction.reference || '',
                        bankAccountId: transaction.bankAccountId,
                        isExpense: transaction.isExpense,
                        status: transaction.status,
                        ...(transaction.cleanDescription ? { cleanDescription: transaction.cleanDescription } : {}),
                        ...(transaction.rawDescription ? { rawDescription: transaction.rawDescription } : {}),
                        ...(transaction.merchantKey ? { merchantKey: transaction.merchantKey } : {})
                    }
                };
                
                const newDocRef = doc(txCollection);
                batch.set(newDocRef, sanitizeFirestoreData(subTxData));
            });
            
            await batch.commit();
            toast({ title: 'Transaction Split Successfully', description: `${rows.length} sub-transactions created.` });
            onSplitComplete();
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving splits:", error);
            toast({ title: 'Error Saving Splits', description: 'Failed to split the transaction.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
                <DialogHeader className="pb-4">
                    <DialogTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        Split Transaction Allocation
                    </DialogTitle>
                    <DialogDescription>
                        Split the transaction amount of <strong>{formatPrice(originalAbs)}</strong> into multiple allocations.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted/30 p-3 rounded-lg border text-sm space-y-1 mb-4 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Original Transaction</p>
                        <p className="font-semibold text-foreground mt-0.5">{transaction.description}</p>
                        {transaction.reference && <p className="text-[10px] text-muted-foreground font-mono">Ref: {transaction.reference}</p>}
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Original Amount</p>
                        <p className="text-lg font-mono font-bold text-foreground mt-0.5">{formatPrice(originalAbs)}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[300px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-40">Amount</TableHead>
                                <TableHead>Allocation Target</TableHead>
                                {client?.isVatRegistered && <TableHead className="w-56">VAT Type</TableHead>}
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row, index) => (
                                <TableRow key={index} className="align-middle">
                                    <TableCell className="align-middle">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={row.amount}
                                            onChange={(e) => handleRowChange(index, 'amount', e.target.value)}
                                            className="font-mono text-sm h-9"
                                        />
                                    </TableCell>
                                    <TableCell className="align-middle">
                                        <AccountSelector
                                            client={client}
                                            customers={customers}
                                            suppliers={suppliers}
                                            showAccounts={true}
                                            showCustomers={true}
                                            showSuppliers={true}
                                            value={row.allocatedTo}
                                            size="sm"
                                            placeholder="Select account, supplier, customer..."
                                            onChange={(sel) => handleRowChange(index, 'allocatedTo', sel)}
                                        />
                                    </TableCell>
                                    {client?.isVatRegistered && (
                                        <TableCell className="align-middle">
                                            <Select
                                                value={row.vatType}
                                                onValueChange={(v) => handleRowChange(index, 'vatType', v)}
                                            >
                                                <SelectTrigger className="h-9 text-[10px] w-full"><SelectValue placeholder="Select VAT..." /></SelectTrigger>
                                                <SelectContent>
                                                    {allVatTypes.map(vt => <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    )}
                                    <TableCell className="align-middle text-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveRow(index)}
                                            disabled={rows.length <= 2}
                                            className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Button variant="outline" size="sm" onClick={handleAddRow} className="mt-2 font-semibold">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Split Allocation
                    </Button>
                </div>

                <div className="mt-6 pt-4 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-wrap gap-4 text-sm font-medium">
                        <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Split Total:</span>
                            <span className="font-mono font-bold text-foreground">{formatPrice(currentSum)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Remaining:</span>
                            <span className={cn("font-mono font-bold", isBalanced ? "text-green-600" : "text-destructive")}>
                                {isBalanced ? (
                                    <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4"/> Balanced</span>
                                ) : (
                                    <span>{formatPrice(remaining)}</span>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="w-full md:w-auto">
                            Cancel
                        </Button>
                        <Button onClick={handleSaveSplits} disabled={!isValid || isSaving} className="w-full md:w-auto font-bold">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Split Allocations
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

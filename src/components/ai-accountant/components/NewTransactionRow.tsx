'use client';

import React, { memo } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Sparkles, MoreHorizontal } from 'lucide-react';
import { AccountSelector } from '@/components/accounting/AccountSelector';
import { allVatTypes } from '@/lib/vat-types';
import { formatPrice } from '../types';
import { ImportedTransaction, User, ClientCustomer, Supplier } from '@/lib/types';

export interface NewTransactionRowProps {
    tx: ImportedTransaction;
    isSelected: boolean;
    allocation?: { value: string; type: 'account' | 'customer' | 'supplier'; vatType?: string };
    isAiResearching: boolean;
    client: User | null;
    customers: ClientCustomer[];
    suppliers: Supplier[];
    onToggleSelect: (id: string, checked: boolean) => void;
    onAllocationChange: (id: string, allocation: { value: string; type: 'account' | 'customer' | 'supplier'; vatType?: string }) => void;
    onAiResearch: (tx: ImportedTransaction) => void;
    onEdit: (tx: ImportedTransaction) => void;
    onSplit: (tx: ImportedTransaction) => void;
    onCreateRule: (tx: ImportedTransaction) => void;
    onDelete: (id: string) => void;
}

/**
 * Custom equality comparator for NewTransactionRow
 * Returns true if props are functionally equal (skipping re-render)
 */
export function areNewTransactionRowPropsEqual(prev: any, next: any): boolean {
    if (prev.tx?.id !== next.tx?.id) return false;
    if (prev.tx?.date !== next.tx?.date) return false;
    if (prev.tx?.amount !== next.tx?.amount) return false;
    if (prev.tx?.description !== next.tx?.description) return false;
    if (prev.tx?.cleanDescription !== next.tx?.cleanDescription) return false;
    if (prev.isSelected !== next.isSelected) return false;
    if (prev.isAiResearching !== next.isAiResearching) return false;
    if (prev.allocation?.value !== next.allocation?.value) return false;
    if (prev.allocation?.type !== next.allocation?.type) return false;
    if (prev.allocation?.vatType !== next.allocation?.vatType) return false;
    if (prev.client?.chartOfAccounts !== next.client?.chartOfAccounts) return false;
    if (prev.customers !== next.customers) return false;
    if (prev.suppliers !== next.suppliers) return false;
    return true;
}

export const NewTransactionRow = memo(function NewTransactionRow({
    tx,
    isSelected,
    allocation,
    isAiResearching,
    client,
    customers,
    suppliers,
    onToggleSelect,
    onAllocationChange,
    onAiResearch,
    onEdit,
    onSplit,
    onCreateRule,
    onDelete,
}: NewTransactionRowProps) {
    return (
        <TableRow key={tx.id}>
            <TableCell>
                <Checkbox 
                    checked={isSelected} 
                    onCheckedChange={(checked) => onToggleSelect(tx.id, !!checked)} 
                />
            </TableCell>
            <TableCell>{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-medium">{tx.cleanDescription || tx.description}</span>
                    {tx.cleanDescription && <span className="text-[9px] text-muted-foreground italic">Raw: {tx.description}</span>}
                    {tx.merchantKey && <Badge variant="secondary" className="w-fit mt-1 text-[9px] font-bold">{tx.merchantKey}</Badge>}
                </div>
            </TableCell>
            <TableCell className="font-mono text-xs opacity-70">{tx.reference}</TableCell>
            <TableCell>
                <AccountSelector
                    client={client}
                    customers={customers}
                    suppliers={suppliers}
                    showAccounts={true}
                    showCustomers={true}
                    showSuppliers={true}
                    value={allocation}
                    size="sm"
                    placeholder="Select account..."
                    onChange={(sel) => onAllocationChange(tx.id, {
                        value: sel.value,
                        type: sel.type,
                        vatType: sel.type === 'account' ? (allocation?.vatType || tx.vatType || 'no_vat') : 'no_vat'
                    })}
                />
            </TableCell>
            {client?.isVatRegistered && (
                <TableCell>
                    <Select 
                        value={allocation?.vatType || tx.vatType || ""} 
                        onValueChange={(v) => onAllocationChange(tx.id, {
                            ...(allocation || { value: '', type: 'account' }),
                            vatType: v
                        })}
                    >
                        <SelectTrigger className="h-8 text-[10px] w-full min-w-[120px]">
                            <SelectValue placeholder="Select VAT..." />
                        </SelectTrigger>
                        <SelectContent>
                            {allVatTypes.map(vt => <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </TableCell>
            )}
            <TableCell className="text-right font-mono">{formatPrice(tx.amount)}</TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary" 
                        onClick={() => onAiResearch(tx)} 
                        disabled={isAiResearching}
                    >
                        {isAiResearching ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-label="More actions" variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(tx)}>Edit Transaction</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onSplit(tx)}>Split Transaction</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onCreateRule(tx)}>Create Rule</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Delete Transaction</DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete this transaction from the records. This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(tx.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </TableCell>
        </TableRow>
    );
}, areNewTransactionRowPropsEqual);

'use client';

import React, { memo } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
    BookOpen, 
    Sparkles, 
    History, 
    RotateCcw, 
    PlusCircle, 
    X, 
    MoreHorizontal, 
    Undo2, 
    Layers, 
    ArrowRightLeft 
} from 'lucide-react';
import { AccountSelector } from '@/components/accounting/AccountSelector';
import { allVatTypes } from '@/lib/vat-types';
import { cn } from '@/lib/utils';
import { formatPrice } from '../types';
import { ImportedTransaction, User, ClientCustomer, Supplier, AllocationRule } from '@/lib/types';

export interface ReviewedTransactionRowProps {
    tx: ImportedTransaction;
    isSelected: boolean;
    editedAllocation?: { 
        value?: string; 
        allocatedTo?: { value: string; type: 'account' | 'customer' | 'supplier' }; 
        vatType?: string; 
    };
    client: User | null;
    customers: ClientCustomer[];
    suppliers: Supplier[];
    allAvailableRules: AllocationRule[];
    onToggleSelect: (id: string, checked: boolean) => void;
    onAllocationChange: (id: string, allocation: { 
        value: string; 
        allocatedTo: { value: string; type: 'account' | 'customer' | 'supplier' }; 
        vatType: string; 
    }) => void;
    onCancelEdit: (id: string) => void;
    onViewRule: (rule: AllocationRule, keyword?: string) => void;
    onCreateRulePrompt: (tx: ImportedTransaction, allocation: any) => void;
    onMoveToNew: (tx: ImportedTransaction) => void;
    onSplit: (tx: ImportedTransaction) => void;
    onViewLedger: (accountId: string) => void;
    onDelete: (id: string) => void;
}

/**
 * Custom equality comparator for ReviewedTransactionRow
 * Returns true if props are functionally equal (skipping re-render)
 */
export function areReviewedTransactionRowPropsEqual(prev: any, next: any): boolean {
    if (prev.tx?.id !== next.tx?.id) return false;
    if (prev.tx?.date !== next.tx?.date) return false;
    if (prev.tx?.amount !== next.tx?.amount) return false;
    if (prev.tx?.description !== next.tx?.description) return false;
    if (prev.tx?.cleanDescription !== next.tx?.cleanDescription) return false;
    if (prev.tx?.allocatedTo?.value !== next.tx?.allocatedTo?.value) return false;
    if (prev.tx?.allocatedTo?.type !== next.tx?.allocatedTo?.type) return false;
    if (prev.isSelected !== next.isSelected) return false;
    if (prev.editedAllocation?.value !== next.editedAllocation?.value) return false;
    if (prev.editedAllocation?.vatType !== next.editedAllocation?.vatType) return false;
    if (prev.client?.chartOfAccounts !== next.client?.chartOfAccounts) return false;
    if (prev.customers !== next.customers) return false;
    if (prev.suppliers !== next.suppliers) return false;
    return true;
}

export const ReviewedTransactionRow = memo(function ReviewedTransactionRow({
    tx,
    isSelected,
    editedAllocation,
    client,
    customers,
    suppliers,
    allAvailableRules,
    onToggleSelect,
    onAllocationChange,
    onCancelEdit,
    onViewRule,
    onCreateRulePrompt,
    onMoveToNew,
    onSplit,
    onViewLedger,
    onDelete,
}: ReviewedTransactionRowProps) {
    const edited = editedAllocation;
    const currentAlloc = edited?.allocatedTo || tx.allocatedTo;
    const currentVat = edited?.vatType || tx.vatType || "no_vat";

    return (
        <TableRow key={tx.id} className={cn(edited && "bg-primary/5")}>
            <TableCell>
                <Checkbox 
                    checked={isSelected} 
                    onCheckedChange={(checked) => onToggleSelect(tx.id, !!checked)} 
                />
            </TableCell>
            <TableCell>{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span>{tx.cleanDescription || tx.description}</span>
                    {tx.cleanDescription && <span className="text-[9px] text-muted-foreground italic">Raw: {tx.description}</span>}
                </div>
            </TableCell>
            <TableCell>
                <AccountSelector
                    client={client}
                    customers={customers}
                    suppliers={suppliers}
                    showAccounts={true}
                    showCustomers={true}
                    showSuppliers={true}
                    value={currentAlloc}
                    size="sm"
                    placeholder="Select account..."
                    className={cn(edited?.allocatedTo && "border-primary")}
                    onChange={(sel) => onAllocationChange(tx.id, {
                        value: sel.value,
                        allocatedTo: { value: sel.value, type: sel.type },
                        vatType: sel.type === 'account' ? (edited?.vatType || tx.vatType || 'no_vat') : 'no_vat'
                    })}
                />
            </TableCell>
            <TableCell>
                {tx.allocationSource === 'rule' ? (
                    <Badge 
                        variant="outline" 
                        className="text-[10px] gap-1 cursor-pointer hover:bg-muted"
                        onClick={() => {
                            const rule = allAvailableRules.find(r => r.id === tx.matchedRuleId);
                            if (rule) onViewRule(rule, tx.matchedKeyword);
                        }}
                    >
                        <BookOpen className="h-3 w-3"/> Rule
                    </Badge>
                ) : tx.allocationSource === 'ai' ? (
                    <Badge variant="secondary" className="text-[10px] gap-1"><Sparkles className="h-3 w-3"/> AI</Badge>
                ) : tx.allocationSource === 'history' ? (
                    <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary"><History className="h-3 w-3"/> History</Badge>
                ) : tx.allocationSource === 'global_db' ? (
                    <Badge variant="outline" className="text-[10px] gap-1 border-green-500/30 text-green-600"><RotateCcw className="h-3 w-3"/> Smart DB</Badge>
                ) : (
                    <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-[10px] opacity-70">Manual</Badge>
                        {currentAlloc?.value && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-5 w-5 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                            onClick={() => onCreateRulePrompt(tx, currentAlloc)}
                                        >
                                            <PlusCircle className="h-3 w-3 text-primary" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Create allocation rule for future transactions</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                )}
            </TableCell>
            {client?.isVatRegistered && (
                <TableCell>
                    <Select 
                        value={currentVat} 
                        onValueChange={(v) => onAllocationChange(tx.id, {
                            value: currentAlloc?.value || '',
                            allocatedTo: currentAlloc || { value: '', type: 'account' },
                            vatType: v
                        })}
                    >
                        <SelectTrigger className={cn("h-8 text-[10px] w-full min-w-[120px]", edited?.vatType && "border-primary")}>
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
                    {edited && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground" 
                            onClick={() => onCancelEdit(tx.id)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-label="More actions" variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {currentAlloc?.value && (
                                <DropdownMenuItem onClick={() => onCreateRulePrompt(tx, currentAlloc)}>
                                    <Sparkles className="h-4 w-4 mr-2 text-primary" />
                                    Create Allocation Rule
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onMoveToNew(tx)} className="text-destructive">
                                <Undo2 className="mr-2 h-4 w-4" /> Move to New
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onSplit(tx)}>
                                <Layers className="mr-2 h-4 w-4" /> Split Transaction
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {currentAlloc?.value && (
                                <DropdownMenuItem onClick={() => onViewLedger(currentAlloc.value)}>
                                    <ArrowRightLeft className="mr-2 h-4 w-4" /> View Ledger
                                </DropdownMenuItem>
                            )}
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
}, areReviewedTransactionRowPropsEqual);

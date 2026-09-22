'use client';

import React, { useState } from 'react';
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
import { Loader2, Unlink, Undo2 } from 'lucide-react';
import { GroupTransactionsDialogProps, formatPrice } from '../types';

export function GroupTransactionsDialog({ 
    open, 
    onOpenChange, 
    group, 
    onMoveToNew, 
    onSplitGroup 
}: GroupTransactionsDialogProps) {
    const [isMoving, setIsMoving] = useState<string | null>(null);
    const [isSplitting, setIsSplitting] = useState(false);
    if (!group) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pr-6">
                    <div>
                        <DialogTitle>Transactions for: {group.merchantKey}</DialogTitle>
                        <DialogDescription>Review individual transactions in this group.</DialogDescription>
                    </div>
                    {group.transactions.length > 1 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                            disabled={isSplitting}
                            onClick={() => {
                                setIsSplitting(true);
                                onSplitGroup(group.transactions.map(t => t.id)).finally(() => setIsSplitting(false));
                            }}
                        >
                            {isSplitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Unlink className="h-3.5 w-3.5 mr-1.5 text-amber-600" />}
                            Split Group into Individual Merchants
                        </Button>
                    )}
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {group.transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell className="text-xs">{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                                    <TableCell className="text-xs font-medium">
                                        <div className="flex flex-col">
                                            <span>{tx.cleanDescription || tx.description}</span>
                                            {tx.cleanDescription && <span className="text-[9px] text-muted-foreground italic">Raw: {tx.description}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">{formatPrice(tx.amount)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-destructive h-7 text-[10px]"
                                            onClick={() => {
                                                setIsMoving(tx.id);
                                                onMoveToNew(tx.id).finally(() => setIsMoving(null));
                                            }}
                                            disabled={isMoving === tx.id}
                                        >
                                            {isMoving === tx.id ? <Loader2 className="h-3 w-3 animate-spin mr-1"/> : <Undo2 className="h-3 w-3 mr-1"/>}
                                            Move to New
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}

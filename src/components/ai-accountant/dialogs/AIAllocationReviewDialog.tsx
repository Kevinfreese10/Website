'use client';

import React from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { AiConfidenceBadge } from '@/components/ai/AiConfidenceBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AIAllocationReviewDialogProps } from '../types';

export function AIAllocationReviewDialog({ 
    open, 
    onOpenChange, 
    suggestion, 
    transaction, 
    onAction, 
    isVatRegistered 
}: AIAllocationReviewDialogProps) {
    if (!suggestion || !transaction) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Research Result
                    </DialogTitle>
                    <DialogDescription>
                        Analysis for: <strong>{transaction.description}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                        <div className="flex justify-between items-center">
                            <AiConfidenceBadge confidence={suggestion.confidence} />
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">AI Intelligence Layer</span>
                        </div>
                        <p className="text-sm italic text-muted-foreground leading-relaxed">
                            "{suggestion.summary}"
                        </p>
                    </div>

                    {suggestion.confidence >= 20 ? (
                        <div className={cn("grid gap-4", isVatRegistered ? "grid-cols-2" : "grid-cols-1")}>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Suggested Account</p>
                                <p className="text-sm font-semibold">{suggestion.accountId}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold">{suggestion.accountType || 'account'}</p>
                            </div>
                            {isVatRegistered && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Suggested VAT</p>
                                    <p className="text-sm font-semibold capitalize">{suggestion.vatType.replace(/_/g, ' ')}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-destructive/5 p-4 rounded-xl border border-destructive/10">
                            <p className="text-xs font-semibold text-destructive leading-relaxed">
                                Gemini could not identify a reliable category for this transaction. You will need to allocate it manually.
                            </p>
                        </div>
                    )}

                    {suggestion.suggestedKeyword && suggestion.confidence >= 20 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Suggested Rule Keyword</p>
                            <Badge variant="outline" className="text-sm font-bold border-primary/30 text-primary uppercase">
                                {suggestion.suggestedKeyword}
                            </Badge>
                        </div>
                    )}
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button variant="outline" onClick={() => onAction('new')} className="w-full">
                            Create Rule
                        </Button>
                        <Button variant="outline" onClick={() => onAction('append')} className="w-full">
                            Add to Existing
                        </Button>
                    </div>
                    <Button 
                        onClick={() => onAction('allocate')} 
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        disabled={suggestion.confidence < 20}
                    >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Apply Allocation Only
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

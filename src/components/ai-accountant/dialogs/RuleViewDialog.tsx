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
import { BookOpen, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { RuleViewDialogProps } from '../types';

export function RuleViewDialog({ 
    open, 
    onOpenChange, 
    rule, 
    matchedKeyword, 
    isVatRegistered 
}: RuleViewDialogProps) {
    if (!rule) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Allocation Rule Details
                    </DialogTitle>
                    <DialogDescription>Details for rule: <strong>{rule.description}</strong></DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {matchedKeyword && (
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Triggering Keyword</p>
                            <Badge variant="outline" className="text-sm font-bold border-primary/30 text-primary uppercase">
                                {matchedKeyword}
                            </Badge>
                        </div>
                    )}
                    <div className={cn("grid gap-4", isVatRegistered ? "grid-cols-2" : "grid-cols-1")}>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Allocate To</p>
                            <p className="text-sm font-semibold">{rule.accountId}</p>
                        </div>
                        {isVatRegistered && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">VAT Treatment</p>
                                <p className="text-sm font-semibold capitalize">{rule.vatType.replace(/_/g, ' ')}</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">All Rule Keywords</p>
                        <div className="flex flex-wrap gap-1">
                            {rule.keywords.map(kw => (
                                <Badge key={kw} variant="secondary" className={cn("text-[10px]", kw.toUpperCase() === matchedKeyword?.toUpperCase() && "bg-primary text-primary-foreground")}>
                                    {kw}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/admin/ai-accountant/allocation-rules">
                            Manage All Rules <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

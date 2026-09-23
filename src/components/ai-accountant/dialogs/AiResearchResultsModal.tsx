'use client';

import React, { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { 
    Sparkles, 
    CheckCircle2, 
    Layers, 
    Plus, 
    Clock, 
    Loader2, 
    AlertCircle, 
    Check, 
    Tag,
    XCircle
} from 'lucide-react';
import { User, AllocationRule } from '@/lib/types';
import { TransactionGroup } from '../types';
import { sanitizeKeyword } from '@/lib/keyword-sanitizer';

export interface AiResearchItemResult {
    merchantKey: string;
    sanitizedKeyword?: string;
    group: TransactionGroup;
    suggestedAccountId: string;
    suggestedAccountType: 'account' | 'customer' | 'supplier';
    suggestedVatType: string;
    confidence: number;
    summary?: string;
    matchingRules: AllocationRule[];
    action: 'append' | 'new' | 'none';
    selectedRuleId?: string;
    approved: boolean;
}

export interface AiResearchResultsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    results: AiResearchItemResult[];
    totalResearchedCount: number;
    lowConfidenceCount: number;
    client: User | null;
    isVatRegistered?: boolean;
    onApproveAll: (approvedItems: AiResearchItemResult[]) => Promise<void>;
}

export function AiResearchResultsModal({
    open,
    onOpenChange,
    results: initialResults,
    totalResearchedCount,
    lowConfidenceCount,
    client,
    isVatRegistered,
    onApproveAll,
}: AiResearchResultsModalProps) {
    const [items, setItems] = useState<AiResearchItemResult[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sync initialResults when opened and initialize sanitizedKeyword
    useEffect(() => {
        setItems(initialResults.map(res => ({
            ...res,
            sanitizedKeyword: res.sanitizedKeyword || sanitizeKeyword(res.merchantKey),
            action: res.action || (res.matchingRules.length > 0 ? 'append' : 'new')
        })));
    }, [initialResults]);

    const allApproved = items.length > 0 && items.every(i => i.approved);
    const approvedCount = items.filter(i => i.approved).length;

    const handleToggleAll = (checked: boolean) => {
        setItems(prev => prev.map(item => ({ ...item, approved: checked })));
    };

    const handleToggleItem = (merchantKey: string, checked: boolean) => {
        setItems(prev => prev.map(item => 
            item.merchantKey === merchantKey ? { ...item, approved: checked } : item
        ));
    };

    const handleKeywordChange = (merchantKey: string, val: string) => {
        setItems(prev => prev.map(item => 
            item.merchantKey === merchantKey ? { ...item, sanitizedKeyword: val } : item
        ));
    };

    const handleActionChange = (merchantKey: string, action: 'append' | 'new' | 'none') => {
        setItems(prev => prev.map(item => {
            if (item.merchantKey !== merchantKey) return item;
            return {
                ...item,
                action,
                selectedRuleId: action === 'append' ? (item.selectedRuleId || item.matchingRules[0]?.id) : undefined
            };
        }));
    };

    const handleRuleSelect = (merchantKey: string, ruleId: string) => {
        setItems(prev => prev.map(item => 
            item.merchantKey === merchantKey ? { ...item, selectedRuleId: ruleId } : item
        ));
    };

    const handleSetAllToExisting = () => {
        setItems(prev => prev.map(item => ({
            ...item,
            action: item.matchingRules.length > 0 ? 'append' : 'new',
            selectedRuleId: item.matchingRules.length > 0 ? (item.selectedRuleId || item.matchingRules[0]?.id) : undefined
        })));
    };

    const handleSetAllToNew = () => {
        setItems(prev => prev.map(item => ({
            ...item,
            action: 'new',
            selectedRuleId: undefined
        })));
    };

    const handleApprove = async () => {
        const approvedItems = items.filter(i => i.approved);
        if (approvedItems.length === 0) return;
        setIsSubmitting(true);
        try {
            await onApproveAll(approvedItems);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to approve research results:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getAccountName = (accountId: string) => {
        if (!client?.chartOfAccounts) return accountId;
        const acc = client.chartOfAccounts.find(a => a.id === accountId);
        return acc ? `${acc.description || acc.name} (${acc.code || accountId})` : accountId;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[88vh] flex flex-col p-0">
                {/* Header */}
                <DialogHeader className="p-5 pb-3 border-b space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-600 fill-purple-100" />
                            AI Research Results (High Confidence)
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold gap-1 px-2.5 py-0.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                {items.length} High-Confidence (≥80%)
                            </Badge>
                            {lowConfidenceCount > 0 && (
                                <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50/80 text-xs font-semibold gap-1 px-2.5 py-0.5">
                                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                                    {lowConfidenceCount} Low-Confidence (&lt;80%) left for manual review
                                </Badge>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Review suggestions, fine-tune sanitized rule keywords, and choose whether to add to an existing rule or create a new rule.
                    </p>

                    {/* Master Actions Bar */}
                    {items.length > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t mt-2 flex-wrap gap-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="modal-select-all" 
                                    checked={allApproved}
                                    onCheckedChange={(c) => handleToggleAll(!!c)}
                                />
                                <Label htmlFor="modal-select-all" className="text-xs font-bold cursor-pointer select-none">
                                    {allApproved ? 'Deselect All' : `Select All (${items.length})`}
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    • {approvedCount} selected for approval
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-muted-foreground">Bulk Rule Mode:</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSetAllToExisting}
                                    className="h-7 text-xs px-2.5 font-medium border-muted-foreground/30 hover:bg-muted"
                                    title="Add to Existing Rule (Where Available)"
                                >
                                    <Layers className="h-3 w-3 mr-1 text-primary" />
                                    Add to Account (Where Available)
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSetAllToNew}
                                    className="h-7 text-xs px-2.5 font-medium border-muted-foreground/30 hover:bg-muted"
                                >
                                    <Plus className="h-3 w-3 mr-1 text-primary" />
                                    Create New Rule for All
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogHeader>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {items.length === 0 ? (
                        <div className="text-center py-12 space-y-2">
                            <AlertCircle className="h-8 w-8 mx-auto text-amber-500" />
                            <h4 className="text-sm font-bold">No High-Confidence Results</h4>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                All researched merchant groups had less than 80% confidence and have been preserved in the Smart Match Queue for manual review.
                            </p>
                        </div>
                    ) : (
                        items.map((item) => {
                            const totalAmount = item.group.transactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
                            const selectedRule = item.matchingRules.find(r => r.id === (item.selectedRuleId || item.matchingRules[0]?.id));

                            return (
                                <div 
                                    key={item.merchantKey}
                                    className={`p-3.5 rounded-lg border transition-all ${
                                        item.approved 
                                            ? 'border-primary/40 bg-card shadow-xs ring-1 ring-primary/10' 
                                            : 'border-border/60 bg-muted/20 opacity-60'
                                    }`}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                        {/* Col 1: Select Checkbox & Merchant + Sanitized Keyword (4 cols) */}
                                        <div className="md:col-span-4 flex items-start gap-2.5">
                                            <Checkbox 
                                                id={`item-${item.merchantKey}`}
                                                checked={item.approved}
                                                onCheckedChange={(c) => handleToggleItem(item.merchantKey, !!c)}
                                                className="mt-1 shrink-0"
                                            />
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <label 
                                                        htmlFor={`item-${item.merchantKey}`}
                                                        className="text-xs font-bold text-foreground cursor-pointer truncate max-w-[180px]"
                                                        title={item.merchantKey}
                                                    >
                                                        {item.merchantKey}
                                                    </label>
                                                    <Badge variant="secondary" className="text-[10px] font-mono py-0 px-1 font-normal shrink-0">
                                                        {item.group.transactions.length} tx{item.group.transactions.length > 1 ? 's' : ''} (R{totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })})
                                                    </Badge>
                                                </div>

                                                {/* Sanitized Editable Keyword Input */}
                                                <div className="flex items-center gap-1.5">
                                                    <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                                                    <Input
                                                        value={item.sanitizedKeyword || ''}
                                                        onChange={(e) => handleKeywordChange(item.merchantKey, e.target.value.replace(/\s+/g, ' ').toUpperCase())}
                                                        placeholder="Keyword..."
                                                        className="h-6 text-[11px] font-mono uppercase px-1.5 py-0 bg-background border-muted-foreground/30 focus-visible:ring-1"
                                                        title="Sanitized keyword for rule matching. Click to edit."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Col 2: Suggested Account & Confidence (4 cols) */}
                                        <div className="md:col-span-4 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-foreground truncate" title={getAccountName(item.suggestedAccountId)}>
                                                    {getAccountName(item.suggestedAccountId)}
                                                </span>
                                                <Badge className="bg-emerald-600 text-white font-bold text-[10px] py-0 px-1.5 shrink-0">
                                                    {item.confidence}%
                                                </Badge>
                                            </div>
                                            {item.summary && (
                                                <p className="text-[11px] text-muted-foreground italic truncate" title={item.summary}>
                                                    "{item.summary}"
                                                </p>
                                            )}
                                        </div>

                                        {/* Col 3: Rule Action & Target Rule (4 cols) */}
                                        <div className="md:col-span-4 space-y-1.5">
                                            <div className="flex items-center gap-1">
                                                {item.matchingRules.length > 0 && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant={item.action === 'append' ? 'default' : 'outline'}
                                                        onClick={() => handleActionChange(item.merchantKey, 'append')}
                                                        className={`h-6 text-[10px] px-2 font-medium ${item.action === 'append' ? 'bg-primary text-white' : ''}`}
                                                        title="Add to Existing Rule"
                                                    >
                                                        <Layers className="h-3 w-3 mr-1" />
                                                        Add to Account ({item.matchingRules.length})
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={item.action === 'new' ? 'default' : 'outline'}
                                                    onClick={() => handleActionChange(item.merchantKey, 'new')}
                                                    className={`h-6 text-[10px] px-2 font-medium ${item.action === 'new' ? 'bg-primary text-white' : ''}`}
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Create New Rule
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={item.action === 'none' ? 'secondary' : 'ghost'}
                                                    onClick={() => handleActionChange(item.merchantKey, 'none')}
                                                    className="h-6 text-[10px] px-1.5 text-muted-foreground"
                                                    title="Do not create or update any rule (allocate transactions only)"
                                                >
                                                    No Rule
                                                </Button>
                                            </div>

                                            {/* Dropdown if Append is selected */}
                                            {item.action === 'append' && item.matchingRules.length > 0 && (
                                                <div className="space-y-1">
                                                    <Select
                                                        value={item.selectedRuleId || item.matchingRules[0]?.id}
                                                        onValueChange={(val) => handleRuleSelect(item.merchantKey, val)}
                                                    >
                                                        <SelectTrigger className="h-6 text-[11px] bg-background">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {item.matchingRules.map((r, idx) => (
                                                                <SelectItem key={r.id} value={r.id} className="text-xs">
                                                                    {getAccountName(r.accountId)} {item.matchingRules.length > 1 ? `• Rule #${idx + 1}` : ''} ({r.keywords?.length || 0} kws)
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {selectedRule && (
                                                        <p className="text-[10px] text-muted-foreground truncate">
                                                            Appends "{item.sanitizedKeyword || item.merchantKey}" to {selectedRule.keywords?.length || 0} existing keywords
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="p-4 border-t bg-muted/10 flex items-center justify-between sm:justify-between gap-3">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleApprove}
                        disabled={approvedCount === 0 || isSubmitting}
                        className="bg-primary font-bold text-xs gap-1.5 shadow-xs px-5 h-8"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Applying Allocations & Rules...
                            </>
                        ) : (
                            <>
                                <Check className="h-3.5 w-3.5" />
                                Approve & Apply All ({approvedCount})
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

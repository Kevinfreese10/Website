'use client';

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Sparkles, CheckCircle2, MessageSquare, Layers, Plus, Tag } from 'lucide-react';
import { AccountSelector } from '@/components/accounting/AccountSelector';
import { allVatTypes } from '@/lib/vat-types';
import { cn } from '@/lib/utils';
import { User, AllocationRule } from '@/lib/types';
import { TransactionGroup } from '../types';
import { sanitizeKeyword } from '@/lib/keyword-sanitizer';

export interface MerchantGroupCardProps {
    group: TransactionGroup;
    isSelected: boolean;
    approvalSetting: { 
        accountId: string; 
        vatType: string; 
        createRule: boolean;
        ruleMode?: 'none' | 'append' | 'new';
        targetRuleId?: string;
        customKeyword?: string;
    } | undefined;
    initialComment?: string;
    isAnalyzingComment: boolean;
    isResearching: boolean;
    client: User | null;
    existingRules?: AllocationRule[];
    onToggleSelect: (merchantKey: string, checked: boolean) => void;
    onViewTransactions: (group: TransactionGroup) => void;
    onUpdateAccount: (merchantKey: string, accountId: string) => void;
    onUpdateVat: (merchantKey: string, vatType: string) => void;
    onToggleCreateRule: (merchantKey: string, createRule: boolean, ruleMode?: 'none' | 'append' | 'new', targetRuleId?: string, customKeyword?: string) => void;
    onCommentChange: (merchantKey: string, comment: string) => void;
    onAnalyzeComment: (group: TransactionGroup, comment: string) => void;
    onResearchWithAi: (group: TransactionGroup) => void;
    onApproveGroup: (group: TransactionGroup) => void;
}

/**
 * Custom equality comparator for MerchantGroupCard
 * Returns true if props are functionally equal (skipping re-render)
 */
export function areMerchantGroupCardPropsEqual(prev: any, next: any): boolean {
    if (prev.group?.merchantKey !== next.group?.merchantKey) return false;
    if (prev.group?.status !== next.group?.status) return false;
    if (prev.group?.transactions?.length !== next.group?.transactions?.length) return false;
    if (prev.group?.suggestion?.confidence !== next.group?.suggestion?.confidence) return false;
    if (prev.group?.suggestion?.accountId !== next.group?.suggestion?.accountId) return false;
    if (prev.group?.suggestion?.vatType !== next.group?.suggestion?.vatType) return false;
    if (prev.isSelected !== next.isSelected) return false;
    if (prev.isResearching !== next.isResearching) return false;
    if (prev.isAnalyzingComment !== next.isAnalyzingComment) return false;
    if (prev.approvalSetting?.accountId !== next.approvalSetting?.accountId) return false;
    if (prev.approvalSetting?.vatType !== next.approvalSetting?.vatType) return false;
    if (prev.approvalSetting?.createRule !== next.approvalSetting?.createRule) return false;
    if (prev.approvalSetting?.ruleMode !== next.approvalSetting?.ruleMode) return false;
    if (prev.approvalSetting?.targetRuleId !== next.approvalSetting?.targetRuleId) return false;
    if (prev.approvalSetting?.customKeyword !== next.approvalSetting?.customKeyword) return false;
    if (prev.existingRules?.length !== next.existingRules?.length) return false;
    if (prev.client?.chartOfAccounts !== next.client?.chartOfAccounts) return false;
    if (prev.client?.isVatRegistered !== next.client?.isVatRegistered) return false;
    return true;
}

export const MerchantGroupCard = memo(function MerchantGroupCard({
    group,
    isSelected,
    approvalSetting,
    initialComment = '',
    isAnalyzingComment,
    isResearching,
    client,
    existingRules,
    onToggleSelect,
    onViewTransactions,
    onUpdateAccount,
    onUpdateVat,
    onToggleCreateRule,
    onCommentChange,
    onAnalyzeComment,
    onResearchWithAi,
    onApproveGroup,
}: MerchantGroupCardProps) {
    // Local comment state to ensure 60fps typing without re-rendering parent or sibling cards
    const [localComment, setLocalComment] = useState(initialComment || '');

    useEffect(() => {
        setLocalComment(initialComment || '');
    }, [initialComment]);

    const handleCommentBlur = useCallback(() => {
        if (localComment !== (initialComment || '')) {
            onCommentChange(group.merchantKey, localComment);
        }
    }, [localComment, initialComment, onCommentChange, group.merchantKey]);

    const firstTx = group.transactions[0];
    const isRuleMatch = firstTx?.allocationSource === 'rule' || !!group.suggestion?.ruleId;
    const sourceLabel = firstTx?.allocationSource === 'history' ? 'HISTORY MATCH' : 
                        isRuleMatch ? 'RULE MATCH' :
                        firstTx?.allocationSource === 'global_db' ? 'SMART DB MATCH' : null;

    const currentAccountId = approvalSetting?.accountId || group.suggestion?.accountId || '';
    const currentVatType = approvalSetting?.vatType || group.suggestion?.vatType || 'no_vat';
    const matchingRules = useMemo(() => {
        if (!currentAccountId) return [];
        const all = [
            ...(client?.allocationRules || []),
            ...(existingRules || [])
        ];
        const seen = new Set<string>();
        return all.filter(r => {
            if (!r || !r.id || seen.has(r.id)) return false;
            seen.add(r.id);
            return r.accountId === currentAccountId;
        });
    }, [currentAccountId, client?.allocationRules, existingRules]);

    const totalAmount = useMemo(() => {
        return group.transactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    }, [group.transactions]);

    const defaultKeyword = useMemo(() => sanitizeKeyword(group.merchantKey), [group.merchantKey]);
    const currentKeyword = useMemo(() => {
        const raw = approvalSetting?.customKeyword !== undefined ? approvalSetting.customKeyword : defaultKeyword;
        return raw.replace(/\s+/g, ' ').trim();
    }, [approvalSetting?.customKeyword, defaultKeyword]);

    const defaultRuleMode: 'none' | 'append' | 'new' = isRuleMatch 
        ? 'none'
        : (approvalSetting?.createRule ? (matchingRules.length > 0 ? 'append' : 'new') : 'none');

    const ruleMode: 'none' | 'append' | 'new' = approvalSetting?.ruleMode || defaultRuleMode;

    const currentAccount = client?.chartOfAccounts?.find(a => a.id === currentAccountId);
    const accountLabel = currentAccount 
        ? `${currentAccount.description || currentAccount.name} (${currentAccount.code || currentAccountId})`
        : (currentAccountId || 'Selected Account');

    return (
        <Card 
            className={cn(
                "overflow-hidden border shadow-xs transition-all hover:border-primary/30", 
                isSelected && "ring-2 ring-primary/40 bg-primary/[0.015] border-primary/40",
                group.status === 'server_researching' && "opacity-75 border-dashed"
            )}
        >
            <div className="grid grid-cols-1 md:grid-cols-12">
                {/* Column 1: Merchant details */}
                <div className="md:col-span-3 p-4 border-r border-b md:border-b-0 bg-muted/10 flex items-start gap-3 relative">
                    <div className="absolute top-2 left-2">
                        <Checkbox 
                            checked={isSelected}
                            onCheckedChange={(checked) => onToggleSelect(group.merchantKey, !!checked)}
                        />
                    </div>
                    <div className="space-y-3 flex-grow overflow-hidden ml-6">
                        <div>
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">MERCHANT</Badge>
                                <Badge variant="secondary" className="text-[10px] font-semibold py-0 px-1.5">
                                    {group.transactions.length} {group.transactions.length === 1 ? 'Transaction' : 'Transactions'}
                                </Badge>
                            </div>
                            <h4 className="text-lg font-extrabold truncate uppercase leading-tight" title={group.merchantKey}>
                                {group.merchantKey}
                            </h4>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-xs font-bold text-foreground">
                                    R {totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <Button 
                                    variant="link" 
                                    className="p-0 h-auto text-xs text-primary font-medium hover:no-underline"
                                    onClick={() => onViewTransactions(group)}
                                >
                                    View Transactions →
                                </Button>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-border/40 space-y-0.5">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Example Reference</p>
                            <p className="text-[11px] italic text-muted-foreground font-mono truncate leading-snug" title={firstTx?.description}>
                                "{firstTx?.description}"
                            </p>
                        </div>

                        {group.status === 'server_researching' && (
                            <div className="flex items-center gap-2 text-xs text-primary font-bold animate-pulse">
                                <Loader2 className="h-3 w-3 animate-spin" /> 
                                Identifying...
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2: Allocation & AI Match */}
                <div className="md:col-span-4 p-4 border-r flex flex-col justify-between space-y-3">
                    <div className="space-y-3">
                        <div className={cn("grid gap-3", client?.isVatRegistered ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">ALLOCATE TO</Label>
                                <AccountSelector 
                                    client={client}
                                    showAccounts={true}
                                    showCustomers={false}
                                    showSuppliers={false}
                                    value={currentAccountId}
                                    onChange={(sel) => onUpdateAccount(group.merchantKey, sel.value)}
                                    placeholder="Select account..."
                                    className="w-full h-9 text-xs"
                                />
                            </div>
                            {client?.isVatRegistered && (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">VAT</Label>
                                    <Select 
                                        value={currentVatType} 
                                        onValueChange={(v) => onUpdateVat(group.merchantKey, v)}
                                    >
                                        <SelectTrigger className="h-9 text-xs font-medium"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {allVatTypes.map(vt => <SelectItem key={vt.name} value={vt.name} className="text-xs">{vt.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* Quick Allocation Status / Feedback */}
                        <div className="text-[11px] text-muted-foreground bg-muted/30 rounded-md px-2.5 py-1.5 border border-border/40 flex items-center justify-between">
                            <span className="font-medium truncate">
                                {currentAccountId ? (
                                    <span className="text-foreground font-semibold flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 inline shrink-0" />
                                        Ready for approval
                                    </span>
                                ) : (
                                    <span className="text-amber-600 font-medium">⚠️ Account selection required</span>
                                )}
                            </span>
                            {client?.isVatRegistered && (
                                <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                                    VAT: {allVatTypes.find(v => v.name === currentVatType)?.label || 'No VAT'}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* AI Suggestion Banner (positioned in Col 2 to balance vertical space) */}
                    <div className="p-3 rounded-lg border border-primary/10 bg-primary/5 flex flex-col justify-center space-y-1.5 mt-auto">
                        <div className="flex justify-between items-center gap-2">
                            {group.suggestion ? (
                                <Badge className={cn(
                                    "text-[10px] font-bold py-0.5 px-2.5 rounded-full shrink-0",
                                    group.suggestion.confidence >= 80 
                                    ? "bg-emerald-600 hover:bg-emerald-600 text-white" 
                                    : group.suggestion.confidence < 20
                                    ? "bg-destructive hover:bg-destructive text-white"
                                    : "bg-amber-500 hover:bg-amber-500 text-white"
                                )}>
                                    {sourceLabel || (group.suggestion.confidence < 20 ? "No Match Found" : `${group.suggestion.confidence}% Match Confidence`)}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-[10px] font-bold py-0.5 px-2.5 rounded-md shrink-0">
                                    No Match Found
                                </Badge>
                            )}
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs text-primary font-bold hover:bg-primary/10 px-2" 
                                onClick={() => onResearchWithAi(group)} 
                                disabled={isResearching}
                            >
                                {isResearching ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : <Sparkles className="mr-1 h-3 w-3"/>}
                                Research with AI
                            </Button>
                        </div>
                        <p className="text-xs italic text-muted-foreground leading-relaxed line-clamp-2" title={group.suggestion ? group.suggestion.summary : undefined}>
                            {group.suggestion ? group.suggestion.summary : "Could not find any information for this merchant description. Click 'Research with AI' to search online knowledge bases."}
                        </p>
                    </div>
                </div>

                {/* Column 3: Rule Management & Approval Action */}
                <div className="md:col-span-5 p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">ALLOCATION RULE</Label>
                            {matchingRules.length > 0 && (
                                <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                                    {matchingRules[0].keywords?.length || 0} existing keywords
                                </Badge>
                            )}
                        </div>

                        {/* Segmented Control Pill Group */}
                        <div className="inline-flex items-center p-0.5 bg-muted/60 rounded-lg border border-border/50 text-[11px] w-full">
                            <button
                                type="button"
                                onClick={() => onToggleCreateRule(group.merchantKey, false, 'none')}
                                className={cn(
                                    "flex-1 py-1.5 rounded-md transition-all text-xs font-medium text-center",
                                    ruleMode === 'none' 
                                        ? "bg-background text-foreground shadow-xs font-bold" 
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="Do not create or update any rule"
                            >
                                No Rule
                            </button>
                            {matchingRules.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => onToggleCreateRule(group.merchantKey, true, 'append', matchingRules[0]?.id, currentKeyword)}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-md transition-all text-xs font-medium text-center flex items-center justify-center gap-1",
                                        ruleMode === 'append' 
                                            ? "bg-primary text-white shadow-xs font-bold" 
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title="Add to Existing Rule for this Account"
                                >
                                    <Layers className="h-3 w-3" />
                                    Save to Account
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => onToggleCreateRule(group.merchantKey, true, 'new', undefined, currentKeyword)}
                                className={cn(
                                    "flex-1 py-1.5 rounded-md transition-all text-xs font-medium text-center flex items-center justify-center gap-1",
                                    ruleMode === 'new' 
                                        ? "bg-primary text-white shadow-xs font-bold" 
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="Create New Rule for this Account"
                            >
                                <Plus className="h-3 w-3" />
                                New Rule
                            </button>
                        </div>

                        {ruleMode !== 'none' && (
                            <div className="space-y-2 bg-muted/40 p-2.5 rounded-lg border border-border/60 text-xs">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Keyword:</span>
                                    <Input
                                        value={currentKeyword}
                                        onChange={(e) => {
                                            const cleaned = e.target.value.replace(/\s+/g, ' ').toUpperCase();
                                            onToggleCreateRule(group.merchantKey, true, ruleMode, approvalSetting?.targetRuleId, cleaned);
                                        }}
                                        className="h-7 text-xs font-mono uppercase px-2 py-0 bg-background border-muted-foreground/30 focus-visible:ring-1 flex-1"
                                        title="Sanitized keyword for rule matching"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Account:</span>
                                    <span className="text-xs font-semibold text-foreground truncate bg-background px-2 py-1 rounded border border-border/50 block flex-1" title={accountLabel}>
                                        {accountLabel}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4 rounded-lg shadow-sm text-sm disabled:opacity-40 transition-all mt-auto" 
                        onClick={() => onApproveGroup(group)} 
                        disabled={!approvalSetting?.accountId}
                    >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Group
                    </Button>
                </div>
            </div>
        </Card>
    );
}, areMerchantGroupCardPropsEqual);

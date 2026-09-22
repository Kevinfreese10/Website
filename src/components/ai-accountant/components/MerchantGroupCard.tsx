'use client';

import React, { memo, useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';
import { AccountSelector } from '@/components/accounting/AccountSelector';
import { allVatTypes } from '@/lib/vat-types';
import { cn } from '@/lib/utils';
import { User } from '@/lib/types';
import { TransactionGroup } from '../types';

export interface MerchantGroupCardProps {
    group: TransactionGroup;
    isSelected: boolean;
    approvalSetting: { accountId: string; vatType: string; createRule: boolean } | undefined;
    initialComment?: string;
    isAnalyzingComment: boolean;
    isResearching: boolean;
    client: User | null;
    onToggleSelect: (merchantKey: string, checked: boolean) => void;
    onViewTransactions: (group: TransactionGroup) => void;
    onUpdateAccount: (merchantKey: string, accountId: string) => void;
    onUpdateVat: (merchantKey: string, vatType: string) => void;
    onToggleCreateRule: (merchantKey: string, createRule: boolean) => void;
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
    const sourceLabel = firstTx?.allocationSource === 'history' ? 'HISTORY MATCH' : 
                        firstTx?.allocationSource === 'rule' ? 'RULE MATCH' :
                        firstTx?.allocationSource === 'global_db' ? 'SMART DB MATCH' : null;

    return (
        <Card 
            className={cn(
                "overflow-hidden border shadow-sm transition-all", 
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
                    <div className="space-y-4 flex-grow overflow-hidden ml-6">
                        <div>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider mb-1">MERCHANT</Badge>
                            <h4 className="text-xl font-extrabold truncate uppercase leading-tight">{group.merchantKey}</h4>
                            <Button 
                                variant="link" 
                                className="p-0 h-auto text-sm text-primary font-medium hover:no-underline"
                                onClick={() => onViewTransactions(group)}
                            >
                                {group.transactions.length} {group.transactions.length === 1 ? 'transaction' : 'transactions'}
                            </Button>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">EXAMPLE REFERENCE</p>
                            <p className="text-[11px] italic text-muted-foreground leading-snug break-words font-medium">
                                "{firstTx?.description}"
                            </p>
                        </div>
                        {group.status === 'server_researching' && (
                            <div className="flex items-center gap-2 text-xs text-primary font-bold">
                                <Loader2 className="h-3 w-3 animate-spin" /> 
                                Identifying...
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2: Allocation, VAT, Comment */}
                <div className="md:col-span-4 p-4 border-r space-y-4">
                    <div className={cn("grid gap-4", client?.isVatRegistered ? "grid-cols-2" : "grid-cols-1")}>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">ALLOCATE TO</Label>
                            <AccountSelector 
                                client={client}
                                showAccounts={true}
                                showCustomers={false}
                                showSuppliers={false}
                                value={approvalSetting?.accountId || ''}
                                onChange={(sel) => onUpdateAccount(group.merchantKey, sel.value)}
                                placeholder="Select account..."
                                className="w-full h-10"
                            />
                        </div>
                        {client?.isVatRegistered && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">VAT</Label>
                                <Select 
                                    value={approvalSetting?.vatType || 'no_vat'} 
                                    onValueChange={(v) => onUpdateVat(group.merchantKey, v)}
                                >
                                    <SelectTrigger className="h-10 text-[11px] font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {allVatTypes.map(vt => <SelectItem key={vt.name} value={vt.name}>{vt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> Client Comment
                        </Label>
                        <div className="relative">
                            <Textarea 
                                className="min-h-[100px] text-xs font-bold bg-white border-muted-foreground/20 resize-none pr-10" 
                                placeholder="Explain what this payment was for (e.g. 'Petrol for the trucks'). Khai will use this to suggest an account." 
                                value={localComment}
                                onChange={(e) => setLocalComment(e.target.value)}
                                onBlur={handleCommentBlur}
                            />
                            <div className="absolute bottom-2 right-2 flex flex-col gap-1">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                size="icon" 
                                                variant="secondary" 
                                                className="h-8 w-8 rounded-full shadow-sm border" 
                                                onClick={() => onAnalyzeComment(group, localComment)}
                                                disabled={isAnalyzingComment || !localComment}
                                            >
                                                {isAnalyzingComment ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4 text-primary"/>}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Analyze Comment with AI</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 3: AI Confidence, Actions */}
                <div className="md:col-span-5 p-4 flex flex-col justify-between">
                    <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 flex-grow mb-4">
                        <div className="mb-3 flex justify-between items-center">
                            {group.suggestion ? (
                                <Badge className={cn(
                                    "text-[10px] font-bold py-1 px-3 rounded-full",
                                    group.suggestion.confidence > 80 
                                    ? "bg-green-600 hover:bg-green-600 text-white" 
                                    : group.suggestion.confidence < 20
                                    ? "bg-destructive hover:bg-destructive text-white animate-pulse"
                                    : "bg-yellow-500 hover:bg-yellow-500 text-white"
                                )}>
                                    {sourceLabel || (group.suggestion.confidence < 20 ? "No Match Found" : `${group.suggestion.confidence}% Match Confidence`)}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-[10px] font-bold py-1 px-3 rounded-md">
                                    No Match Found
                                </Badge>
                            )}
                            {(!group.suggestion || group.suggestion.confidence < 20) && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-xs text-primary font-bold" 
                                    onClick={() => onResearchWithAi(group)} 
                                    disabled={isResearching}
                                >
                                    {isResearching ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : <Sparkles className="mr-1 h-3 w-3"/>}
                                    Research with AI
                                </Button>
                            )}
                        </div>
                        <p className="text-xs italic text-muted-foreground leading-relaxed">
                            {group.suggestion ? group.suggestion.summary : "No historical matches or active rules found for this merchant. Use the 'Research with AI' button or enter a 'Client Comment' to perform a deep analysis across our knowledge bases."}
                        </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id={`rule-${group.merchantKey}`} 
                                className="rounded border-muted-foreground/30 data-[state=checked]:bg-primary"
                                checked={approvalSetting?.createRule} 
                                onCheckedChange={(v) => onToggleCreateRule(group.merchantKey, !!v)} 
                                disabled={!!sourceLabel}
                            />
                            <Label htmlFor={`rule-${group.merchantKey}`} className="text-xs font-bold text-muted-foreground cursor-pointer">Create Client Rule</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                className="bg-primary hover:bg-primary/90 text-white font-bold h-10 px-6 rounded-lg shadow-md" 
                                onClick={() => onApproveGroup(group)} 
                                disabled={!approvalSetting?.accountId}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Group
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}, areMerchantGroupCardPropsEqual);

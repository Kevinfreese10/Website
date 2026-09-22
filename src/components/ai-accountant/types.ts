import { z } from 'zod';
import { 
    ImportedTransaction, 
    User, 
    VatType, 
    AllocationRule, 
    ClientCustomer, 
    SmartAllocationResult, 
    Supplier 
} from '@/lib/types';
import { ClueBadge } from '@/lib/detective-engine';

export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-GB', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price);
};

export const ruleFormSchema = z.object({
    mode: z.enum(['new', 'append']).default('new'),
    existingRuleId: z.string().optional(),
    description: z.string().optional(),
    keywords: z.string().min(2),
    accountType: z.enum(['account', 'customer', 'supplier']).default('account'),
    accountId: z.string().optional(),
    vatType: z.string().optional(),
    scope: z.enum(['global', 'client']).default('client'),
});

export type RuleFormValues = z.infer<typeof ruleFormSchema>;

export const manualTransactionSchema = z.object({
    date: z.date(),
    description: z.string().min(3, "Description is required"),
    amount: z.preprocess(val => Number(val), z.number().refine(val => val !== 0, "Amount cannot be zero")),
    reference: z.string().optional(),
});

export type ManualTransactionFormValues = z.infer<typeof manualTransactionSchema>;

export interface TransactionGroup {
    merchantKey: string;
    transactions: ImportedTransaction[];
    suggestion: SmartAllocationResult | null;
    status: 'pending' | 'ready' | 'processing' | 'server_researching';
}

export interface SmartMatchResult {
    groupId: string;
    groupKey: string;
    description: string;
    transactionCount: number;
    totalAmount: number;
    transactionIds: string[];
    merchantName: string;
    merchantCategory: string;
    suggestedAccountId: string;
    suggestedAccountLabel: string;
    vatType: VatType;
    confidence: number;
    suggestedKeyword: string;
    existingRule?: AllocationRule;
    badges: ClueBadge[];
    ruleScoping: 'client' | 'global_practice';
    isAutoAllocatable: boolean;
    status: 'reviewed' | 'ai_review';
}

export interface RuleViewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rule: AllocationRule | null;
    matchedKeyword?: string | null;
    isVatRegistered?: boolean;
}

export interface AIAllocationReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    suggestion: SmartAllocationResult | null;
    transaction: ImportedTransaction | null;
    onAction: (mode: 'new' | 'append' | 'allocate') => void;
    isVatRegistered?: boolean;
}

export interface ImportDialogProps {
    client: User | null;
    bankAccountId: string;
    currentBalance: number;
    onImportComplete: () => void;
}

export interface CreateRuleDialogProps {
    client: User | null;
    onRuleCreated: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues: Partial<RuleFormValues>;
    transactionDescription?: string | null;
    existingRules: AllocationRule[];
    customers?: ClientCustomer[];
    suppliers?: Supplier[];
}

export interface CreateManualTransactionDialogProps {
    client: User | null;
    bankAccountId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export interface EditTransactionDialogProps {
    client: User | null;
    transaction: ImportedTransaction | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export interface CreateGeneralAccountDialogProps {
    client: User | null;
    onAccountCreated: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export interface SplitTransactionDialogProps {
    client: User | null;
    transaction: ImportedTransaction | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSplitComplete: () => void;
    customers: ClientCustomer[];
    suppliers: Supplier[];
}

export interface SmartMatchQueueModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedTransactions: ImportedTransaction[];
    client: User;
    globalRules?: AllocationRule[];
    onRulesSaved: () => void;
}

export interface GroupTransactionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    group: TransactionGroup | null;
    onMoveToNew: (txId: string) => Promise<void>;
    onSplitGroup: (txIds: string[]) => Promise<void>;
}

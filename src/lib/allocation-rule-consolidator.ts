/**
 * @fileOverview Allocation Rule Consolidator
 * Consolidates multiple fragmented allocation rules for the same account into
 * strictly 1 canonical rule per account throughout the database, merging,
 * sanitizing, deduplicating, and sorting all keywords.
 */

import { AllocationRule, ChartOfAccount } from '@/lib/types';
import { sanitizeKeyword } from '@/lib/keyword-sanitizer';

export interface ConsolidateRulesOptions {
    chartOfAccounts?: ChartOfAccount[];
    isVatRegistered?: boolean;
}

/**
 * Consolidates an array of allocation rules so that each account has strictly 1 rule.
 * 
 * @param rules Raw array of allocation rules (may contain duplicates per account)
 * @param options Client context (Chart of Accounts, VAT registration)
 * @returns Deduplicated array where each accountId appears at most once
 */
export function consolidateAllocationRules(
    rules: AllocationRule[],
    options?: ConsolidateRulesOptions
): AllocationRule[] {
    if (!Array.isArray(rules) || rules.length === 0) return [];

    const coaMap = new Map<string, ChartOfAccount>();
    if (options?.chartOfAccounts) {
        for (const acc of options.chartOfAccounts) {
            if (acc.id) coaMap.set(acc.id, acc);
        }
    }

    // Group rules by account key: accountType:accountId (or just accountId)
    const grouped = new Map<string, AllocationRule[]>();

    for (const rule of rules) {
        if (!rule || !rule.accountId) continue;
        const key = `${rule.accountType || 'account'}:${rule.accountId}`;
        const existing = grouped.get(key) || [];
        existing.push(rule);
        grouped.set(key, existing);
    }

    const consolidated: AllocationRule[] = [];

    for (const [key, groupRules] of grouped.entries()) {
        const firstRule = groupRules[0];
        const accountId = firstRule.accountId;
        const accountType = firstRule.accountType || 'account';
        const coaAccount = coaMap.get(accountId);

        // 1. Merge and sanitize all keywords across all duplicate rules
        const keywordSet = new Set<string>();
        for (const r of groupRules) {
            if (Array.isArray(r.keywords)) {
                for (const kw of r.keywords) {
                    const cleaned = sanitizeKeyword(kw).replace(/\s+/g, ' ').trim().toUpperCase();
                    if (cleaned) {
                        keywordSet.add(cleaned);
                    }
                }
            }
        }

        const sortedKeywords = Array.from(keywordSet).sort((a, b) => a.localeCompare(b));

        // 2. Resolve standardized VAT type:
        // Priority: Chart of Accounts default VAT -> most specific existing rule VAT -> standard_rate / no_vat
        let standardVat: string = 'no_vat';
        if (coaAccount && (coaAccount as any).defaultVatType) {
            standardVat = (coaAccount as any).defaultVatType;
        } else {
            const hasStandard = groupRules.some(r => r.vatType && r.vatType !== 'no_vat');
            if (hasStandard) {
                const specific = groupRules.find(r => r.vatType && r.vatType !== 'no_vat');
                standardVat = specific?.vatType || (options?.isVatRegistered ? 'standard_rate' : 'no_vat');
            } else {
                standardVat = options?.isVatRegistered ? 'standard_rate' : 'no_vat';
            }
        }

        // 3. Resolve description
        const accountName = coaAccount?.description || coaAccount?.name;
        const description = accountName 
            ? `${accountName} (${coaAccount?.code || accountId})`
            : (firstRule.description || `Allocation rule for ${accountId}`);

        // 4. Stable rule ID: pick the earliest ID or canonical ID
        const bestId = groupRules.find(r => r.id && !r.id.startsWith('rule_'))?.id || firstRule.id || `rule_${accountId}`;

        consolidated.push({
            id: bestId,
            description,
            accountId,
            accountType: accountType as any,
            vatType: standardVat,
            keywords: sortedKeywords,
            type: firstRule.type || 'hard',
            scope: firstRule.scope || 'client',
            priority: Math.min(...groupRules.map(r => r.priority ?? 99)),
        });
    }

    return consolidated;
}

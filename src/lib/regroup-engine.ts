/**
 * @fileOverview Hierarchical Regrouping and Merge Engine for AI Accountant.
 * Implements Union-Find disjoint-set clustering with canonical priority,
 * branch/store code masking, compacted alphanumeric typo-matching,
 * strict [DEBIT ORDER] segregation, and safe proposal thresholding.
 */

import { BankCleaner, NATIONAL_ROOT_BRANDS } from './bank-cleaner';

export interface RegroupProposal {
    targetKey: string;
    sources: string[];
    totalCount: number;
    similarity: number;
    isSafe: boolean;
    reason: string;

    // Backwards-compatibility properties for UI & legacy callers
    fromKey?: string;
    toKey?: string;
    fromImpact?: number;
    toImpact?: number;
    score?: number;
    confidence?: 'High' | 'Medium' | 'Low';
    fromTxIds?: string[];
    fromExamples?: string[];
    toExamples?: string[];
}

export interface PairSimilarityResult {
    similarity: number;
    isSafe: boolean;
    reason?: string;
}

/**
 * Union-Find (Disjoint-Set Forest) data structure with path compression
 * and canonical root priority (higher weight, national root brand, or cleaner name).
 */
export class UnionFind {
    parent: Record<string, string> = {};

    constructor(keys?: string[]) {
        if (keys) {
            for (const k of keys) {
                this.parent[k] = k;
            }
        }
    }

    /**
     * Finds the canonical representative with path compression.
     */
    find(i: string): string {
        if (this.parent[i] === undefined) {
            this.parent[i] = i;
            return i;
        }
        if (this.parent[i] === i) {
            return i;
        }
        this.parent[i] = this.find(this.parent[i]);
        return this.parent[i];
    }

    /**
     * Unites two elements into the same set.
     * Selects the canonical root based on:
     * 1. Higher transaction weight / count (dominates)
     * 2. Recognized National Root Brand
     * 3. Cleanliness (spaces, no digits, no branch codes/hashes, shorter length)
     */
    union(i: string, j: string, weights?: Record<string, number>): string {
        const rootI = this.find(i);
        const rootJ = this.find(j);
        if (rootI === rootJ) return rootI;

        const scoreI = this.getCanonicalScore(rootI, weights);
        const scoreJ = this.getCanonicalScore(rootJ, weights);

        if (scoreI >= scoreJ) {
            this.parent[rootJ] = rootI;
            return rootI;
        } else {
            this.parent[rootI] = rootJ;
            return rootJ;
        }
    }

    private getCanonicalScore(key: string, weights?: Record<string, number>): number {
        const weight = weights?.[key] ?? 0;
        let score = weight * 1000;

        const upper = key.toUpperCase();
        // Brand registry priority (+5000)
        if (NATIONAL_ROOT_BRANDS[upper] || Object.values(NATIONAL_ROOT_BRANDS).includes(upper)) {
            score += 5000;
        }

        // Cleanliness priority
        if (key.includes(' ')) score += 50; // Clean spaced title over compacted
        if (!/\d/.test(key)) score += 30;   // No numbers
        if (!key.includes('#')) score += 50; // No branch hash

        // Penalize branch/store keywords
        if (/\b(?:STORE|SHOP|BRANCH|BR|CNR|MALL)\b/i.test(key)) {
            score -= 100;
        }

        // Heavily penalize date fragments (e.g. '6 SEPT', '10 TH', '26 JUL', '26 J')
        if (/\b\d{1,2}(?:ST|ND|RD|TH)?\s*(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)?\b/i.test(key)) {
            score -= 2000;
        }
        if (/\b(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)\b/i.test(key)) {
            score -= 1500;
        }
        // Penalize isolated trailing single letters or digits (e.g. '26 J')
        if (/\s+[A-Z0-9]\b/i.test(key)) {
            score -= 1000;
        }

        // Slight penalty for excessive string length
        score -= Math.min(key.length, 50);

        return score;
    }
}

/**
 * Masks/strips branch codes, store identifiers, street locators, and terminal hashes.
 * Preserves contractual channel tags like [DEBIT ORDER].
 */
export function maskBranchAndStoreCodes(key: string): string {
    if (!key) return '';

    return key
        // Strip branch hash indicators e.g. #1024, #B12
        .replace(/#\s*[A-Z0-9]+/gi, ' ')
        // Strip store/shop/branch codes e.g. STORE 4421, SHOP 12, BRANCH 001, BR 223, STE 10, KIOSK 5
        .replace(/\b(?:STORE|SHOP|BRANCH|BR|STE|STN|KIOSK|KIO)(?:\s+#?|\s*#)\s*[A-Z0-9]+\b/gi, ' ')
        // Strip corner / street locators up to channel tag or end of string
        .replace(/(?<=\s)\bCNR\b.*?(?=\[DEBIT ORDER\]|$)/gi, ' ')
        // Strip mall locators up to channel tag or end of string
        .replace(/(?<=\s)\bMALL\b.*?(?=\[DEBIT ORDER\]|$)/gi, ' ')
        // Strip standalone 3-6 digit numeric branch/terminal numbers
        .replace(/\b\d{3,6}\b/g, ' ')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Evaluates pairwise merchant similarity with strict accounting guardrails:
 * 1. Strict [DEBIT ORDER] channel segregation
 * 2. Masked branch code equality (similarity: 0.95, isSafe: true)
 * 3. Compacted alphanumeric string typo-matching with length guard
 * 4. Standard BankCleaner similarity scoring
 */
export function evaluateMerchantPairSimilarity(keyA: string, keyB: string): PairSimilarityResult {
    if (!keyA || !keyB) {
        return { similarity: 0, isSafe: false, reason: 'empty_key' };
    }

    const cleanA = keyA.trim();
    const cleanB = keyB.trim();

    if (cleanA === cleanB) {
        return { similarity: 1.0, isSafe: true, reason: 'identical' };
    }

    // 1. Strict [DEBIT ORDER] segregation
    const isDebitA = cleanA.includes('[DEBIT ORDER]');
    const isDebitB = cleanB.includes('[DEBIT ORDER]');
    if (isDebitA !== isDebitB) {
        return { similarity: 0, isSafe: false, reason: 'debit_order_segregation' };
    }

    // 2. Masked branch & date fragment equality
    const maskedA = maskBranchAndStoreCodes(cleanA);
    const maskedB = maskBranchAndStoreCodes(cleanB);
    const STOPWORDS = new Set(['THE', 'AND', 'FOR', 'OF', 'TO', 'IN', 'ON', 'AT']);
    if (maskedA === maskedB && maskedA.length >= 3 && !STOPWORDS.has(maskedA)) {
        return { similarity: 0.95, isSafe: true, reason: 'branch_code_masked_match' };
    }

    const strippedA = stripDateAndNoiseFragments(maskedA);
    const strippedB = stripDateAndNoiseFragments(maskedB);
    if (strippedA === strippedB && strippedA.length >= 3 && !STOPWORDS.has(strippedA)) {
        return { similarity: 0.95, isSafe: true, reason: 'branch_code_masked_match' };
    }

    // 3. Compacted string typo-matching
    // Normalizations: spoken symbol '@' -> 'AT', '&' -> 'N'
    const compA_withN = cleanA.toUpperCase().replace(/@/g, 'AT').replace(/&/g, 'N').replace(/[^A-Z0-9]/g, '');
    const compB_withN = cleanB.toUpperCase().replace(/@/g, 'AT').replace(/&/g, 'N').replace(/[^A-Z0-9]/g, '');

    const compA_plain = cleanA.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const compB_plain = cleanB.toUpperCase().replace(/[^A-Z0-9]/g, '');

    const levN = BankCleaner.calculateLevenshtein(compA_withN, compB_withN);
    const levPlain = BankCleaner.calculateLevenshtein(compA_plain, compB_plain);
    const compSim = Math.max(levN, levPlain);

    const minLen = Math.min(compA_plain.length, compB_plain.length);

    // Length guard: if compacted length < 7, enforce identical first 2 characters to prevent false positives (e.g. SPAR vs STAR)
    if (minLen < 7) {
        const first2A = compA_plain.slice(0, 2);
        const first2B = compB_plain.slice(0, 2);
        if (first2A === first2B && compSim >= 0.85) {
            return { similarity: compSim, isSafe: true, reason: 'compacted_typo_match' };
        }
    } else {
        // For long strings (minLen >= 7), edit distance of >= 0.80 reliably catches typos (e.g. WOOLWORTHS vs WOOLWTHS)
        if (compSim >= 0.80) {
            return { similarity: Math.max(compSim, 0.85), isSafe: true, reason: 'compacted_typo_match' };
        }
    }

    // 4. Standard BankCleaner similarity scoring
    const standardSim = BankCleaner.getSimilarity(cleanA, cleanB);
    if (standardSim.score >= 0.88) {
        return { similarity: standardSim.score, isSafe: true, reason: 'high_similarity' };
    }
    if (standardSim.score >= 0.75) {
        return { similarity: standardSim.score, isSafe: false, reason: 'moderate_similarity_review_needed' };
    }

    return { similarity: standardSim.score, isSafe: false };
}

/**
 * Pure merchant regrouping proposal generator.
 * Evaluates all candidate pairs, clusters connected components using UnionFind,
 * and returns structured regroup proposals.
 */
export function proposeRegroupsPure(
    groups: { key: string; count: number; transactions?: any[] }[]
): RegroupProposal[] {
    if (!groups || groups.length === 0) return [];

    const keys = groups.map(g => g.key);
    const weights: Record<string, number> = {};
    const groupMap = new Map<string, { key: string; count: number; transactions?: any[] }>();

    for (const g of groups) {
        weights[g.key] = g.count;
        groupMap.set(g.key, g);
    }

    const dsu = new UnionFind(keys);
    const pairEvals = new Map<string, PairSimilarityResult>();

    // Evaluate all pairs
    for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
            const k1 = keys[i];
            const k2 = keys[j];
            const evalResult = evaluateMerchantPairSimilarity(k1, k2);
            pairEvals.set(`${k1}::${k2}`, evalResult);
            pairEvals.set(`${k2}::${k1}`, evalResult);

            if (evalResult.isSafe && evalResult.similarity >= 0.85) {
                dsu.union(k1, k2, weights);
            }
        }
    }

    // Cluster components
    const clusterMap = new Map<string, string[]>();
    for (const k of keys) {
        const root = dsu.find(k);
        if (!clusterMap.has(root)) {
            clusterMap.set(root, []);
        }
        clusterMap.get(root)!.push(k);
    }

    const proposals: RegroupProposal[] = [];

    for (const [targetKey, members] of clusterMap.entries()) {
        const sources = members.filter(m => m !== targetKey);
        if (sources.length === 0) continue;

        let minSim = 1.0;
        let isSafeCluster = true;
        const reasons = new Set<string>();
        const fromTxIds: string[] = [];
        const fromExamples: string[] = [];

        for (const src of sources) {
            const pairEval = pairEvals.get(`${src}::${targetKey}`) ||
                pairEvals.get(`${targetKey}::${src}`) ||
                evaluateMerchantPairSimilarity(src, targetKey);
            minSim = Math.min(minSim, pairEval.similarity);
            if (!pairEval.isSafe) isSafeCluster = false;
            if (pairEval.reason) reasons.add(pairEval.reason);

            const srcGroup = groupMap.get(src);
            if (srcGroup?.transactions) {
                for (const t of srcGroup.transactions) {
                    if (t?.id) fromTxIds.push(t.id);
                    else if (typeof t === 'string') fromTxIds.push(t);
                }
                if (srcGroup.transactions[0]?.description) {
                    fromExamples.push(srcGroup.transactions[0].description);
                }
            }
        }

        const targetGroup = groupMap.get(targetKey);
        const toExamples: string[] = [];
        if (targetGroup?.transactions?.[0]?.description) {
            toExamples.push(targetGroup.transactions[0].description);
        }

        const totalCount = sources.reduce((sum, s) => sum + (groupMap.get(s)?.count || 0), 0);
        const reason = Array.from(reasons).join(', ') || 'merchant_cluster_match';

        proposals.push({
            targetKey,
            sources,
            totalCount,
            similarity: minSim,
            isSafe: isSafeCluster,
            reason,
            fromKey: sources[0],
            toKey: targetKey,
            fromImpact: totalCount,
            toImpact: targetGroup?.count || 0,
            score: Math.round(minSim * 100),
            confidence: isSafeCluster ? 'High' : 'Medium',
            fromTxIds,
            fromExamples,
            toExamples
        });
    }

    return proposals;
}

/**
 * Clusters merchant keys into connected components using UnionFind.
 * Returns a Map of canonical root key -> array of all member keys in that cluster.
 */
export function clusterMerchantKeys(
    keys: string[],
    weights?: Record<string, number>
): Map<string, string[]> {
    const dsu = new UnionFind(keys);

    for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
            const evalResult = evaluateMerchantPairSimilarity(keys[i], keys[j]);
            if (evalResult.isSafe && evalResult.similarity >= 0.85) {
                dsu.union(keys[i], keys[j], weights);
            }
        }
    }

    const clusters = new Map<string, string[]>();
    for (const k of keys) {
        const root = dsu.find(k);
        if (!clusters.has(root)) {
            clusters.set(root, []);
        }
        clusters.get(root)!.push(k);
    }

    return clusters;
}

/**
 * Strips date fragments, calendar tokens, and trailing noise letters/numbers
 * to establish the cleanest canonical root brand for a cluster.
 */
export function stripDateAndNoiseFragments(key: string): string {
    if (!key) return '';
    let res = key.trim();
    // 1. Composite date expressions e.g. " 6 SEPT", " 10TH MAY", " 26 JUL", " 15TH SEPT"
    res = res.replace(/\s+\d{1,2}(?:ST|ND|RD|TH)?(?:\s*(?:JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:TEMBER)?|SEPT|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?))\b/gi, ' ');
    // 2. Standalone months
    res = res.replace(/\s+(?:JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:TEMBER)?|SEPT|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\b/gi, ' ');
    // 3. Ordinals e.g. " 10TH", " 6TH", " 1ST", " 2ND", " 3RD", " 10 TH"
    res = res.replace(/\s+\d{1,2}\s*(?:ST|ND|RD|TH)\b/gi, ' ');
    // 4. Trailing numbers or number+letter e.g. " 26 J", " 26J", " 6"
    res = res.replace(/\s+\d{1,2}\s*[A-Z]?$/i, ' ');
    // 5. Trailing standalone single character e.g. " J"
    res = res.replace(/\s+[A-Z]\b$/i, ' ');
    // 6. Normalize spaces
    res = res.replace(/\s{2,}/g, ' ').trim();
    return res || key;
}

export interface IterativeConsolidationResult {
    consolidatedGroups: { key: string; count: number; transactions: any[] }[];
    totalMergesApplied: number;
    passesExecuted: number;
    merges: { fromKey: string; toKey: string; fromTxIds: string[] }[];
}

/**
 * Iteratively consolidates merchant groups until convergence (fixpoint clustering).
 * Evaluates candidate pairs, executes safe unions, applies Cleanest Root Priority,
 * and iterates until no further groups can be merged or maxPasses is reached.
 */
export function consolidateMerchantGroupsIterative(
    initialGroups: { key: string; count: number; transactions?: any[] }[],
    maxPasses = 5
): IterativeConsolidationResult {
    if (!initialGroups || initialGroups.length === 0) {
        return { consolidatedGroups: [], totalMergesApplied: 0, passesExecuted: 0, merges: [] };
    }

    let currentGroups = initialGroups.map(g => ({
        key: g.key,
        count: g.count,
        transactions: g.transactions ? [...g.transactions] : []
    }));

    let totalMergesApplied = 0;
    let passesExecuted = 0;
    const allMerges: { fromKey: string; toKey: string; fromTxIds: string[] }[] = [];

    for (let pass = 1; pass <= maxPasses; pass++) {
        passesExecuted = pass;
        const proposals = proposeRegroupsPure(currentGroups);
        const safeProposals = proposals.filter(p => p.isSafe && p.similarity >= 0.85);

        if (safeProposals.length === 0) {
            break;
        }

        // Build a mapping of source keys -> target key
        const mergeMap = new Map<string, string>();
        for (const prop of safeProposals) {
            // Determine the cleanest canonical target key (stripping date fragments if applicable)
            let canonicalTarget = prop.targetKey;
            const stripped = stripDateAndNoiseFragments(canonicalTarget);
            if (stripped && stripped.length >= 2) {
                canonicalTarget = stripped;
            }

            for (const src of prop.sources) {
                if (src !== canonicalTarget) {
                    mergeMap.set(src, canonicalTarget);
                }
            }
            if (prop.targetKey !== canonicalTarget) {
                mergeMap.set(prop.targetKey, canonicalTarget);
            }

            allMerges.push({
                fromKey: prop.fromKey || prop.sources[0],
                toKey: canonicalTarget,
                fromTxIds: prop.fromTxIds || []
            });
            totalMergesApplied += prop.sources.length;
        }

        // Merge groups based on mergeMap
        const newGroupMap = new Map<string, { key: string; count: number; transactions: any[] }>();

        for (const grp of currentGroups) {
            const destKey = mergeMap.get(grp.key) || grp.key;
            if (!newGroupMap.has(destKey)) {
                newGroupMap.set(destKey, {
                    key: destKey,
                    count: 0,
                    transactions: []
                });
            }
            const existing = newGroupMap.get(destKey)!;
            existing.count += grp.count;
            // Update the merchantKey on each transaction in memory
            const updatedTxs = grp.transactions.map(t => ({
                ...t,
                merchantKey: destKey
            }));
            existing.transactions.push(...updatedTxs);
        }

        currentGroups = Array.from(newGroupMap.values());
    }

    return {
        consolidatedGroups: currentGroups,
        totalMergesApplied,
        passesExecuted,
        merges: allMerges
    };
}

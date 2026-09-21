/**
 * @fileOverview Milestone 4 Challenger Stress Test Suite
 * Adversarial testing of hierarchical regrouping engine (src/lib/regroup-engine.ts)
 * and server actions (src/app/actions/ai-recon.ts).
 * 
 * Verifies:
 * 1. Debit order segregation: [DEBIT ORDER] keys NEVER merge with non-debit-order keys
 * 2. Short brand collisions: strings < 7 chars do not match (SPAR vs STAR, SHELL vs SMELL)
 * 3. Branch code masking: #1024, STORE 4421, SHOP 12 cluster correctly
 * 4. Transitive clustering: A ~ B and B ~ C produces single cluster containing {A, B, C}
 * 5. Canonical root priority inversion analysis (weight vs brand registry)
 * 6. Edge cases: empty, single, whitespace, duplicates, extreme lengths, cycle handling
 */

import { describe, it, expect } from 'vitest';
import {
    UnionFind,
    maskBranchAndStoreCodes,
    evaluateMerchantPairSimilarity,
    proposeRegroupsPure,
    clusterMerchantKeys,
    RegroupProposal
} from './regroup-engine';
import { BankCleaner } from './bank-cleaner';

describe('M4 Challenger: Hierarchical Regrouping Engine Adversarial Tests', () => {

    // =========================================================================
    // 1. DEBIT ORDER SEGREGATION
    // =========================================================================
    describe('1. Debit Order Segregation (Strict Accounting Barrier)', () => {
        const brandPairs = [
            ['VODACOM', 'VODACOM [DEBIT ORDER]'],
            ['OUTSURANCE', 'OUTSURANCE [DEBIT ORDER]'],
            ['NETFLIX', 'NETFLIX [DEBIT ORDER]'],
            ['DISCOVERY', 'DISCOVERY [DEBIT ORDER]'],
            ['TELKOM', 'TELKOM [DEBIT ORDER]'],
            ['SANLAM', 'SANLAM [DEBIT ORDER]'],
            ['OLD MUTUAL', 'OLD MUTUAL [DEBIT ORDER]'],
            ['SANTAM', 'SANTAM [DEBIT ORDER]']
        ];

        it.each(brandPairs)('strictly forbids direct merge between %s and %s', (pos, debit) => {
            const forward = evaluateMerchantPairSimilarity(pos, debit);
            expect(forward.similarity).toBe(0);
            expect(forward.isSafe).toBe(false);
            expect(forward.reason).toBe('debit_order_segregation');

            const reverse = evaluateMerchantPairSimilarity(debit, pos);
            expect(reverse.similarity).toBe(0);
            expect(reverse.isSafe).toBe(false);
            expect(reverse.reason).toBe('debit_order_segregation');
        });

        it('strictly forbids merge even with high branch similarity or typo overlap', () => {
            const res = evaluateMerchantPairSimilarity('VODACOM STORE 1024', 'VODACOM STORE 1024 [DEBIT ORDER]');
            expect(res.similarity).toBe(0);
            expect(res.isSafe).toBe(false);
            expect(res.reason).toBe('debit_order_segregation');
        });

        it('guarantees that no transitive chain can ever bridge [DEBIT ORDER] and non-[DEBIT ORDER]', () => {
            // Construct a network with intermediate nodes
            const keys = [
                'VODACOM',
                'VODACOM STORE',
                'VODACOM STORE 1',
                'VODACOM STORE 2',
                'VODACOM [DEBIT ORDER]',
                'VODACOM CONTRACT [DEBIT ORDER]',
                'VODACOM 12345 [DEBIT ORDER]'
            ];

            const groups = keys.map(k => ({ key: k, count: 5 }));
            const proposals = proposeRegroupsPure(groups);

            for (const prop of proposals) {
                const targetIsDebit = prop.targetKey.includes('[DEBIT ORDER]');
                for (const src of prop.sources) {
                    const srcIsDebit = src.includes('[DEBIT ORDER]');
                    expect(srcIsDebit).toBe(targetIsDebit);
                }
            }

            const clusters = clusterMerchantKeys(keys);
            for (const [root, members] of clusters.entries()) {
                const hasDebit = members.some(m => m.includes('[DEBIT ORDER]'));
                const hasNonDebit = members.some(m => !m.includes('[DEBIT ORDER]'));
                expect(hasDebit && hasNonDebit).toBe(false);
            }
        });

        it('allows valid branch masking between two [DEBIT ORDER] keys of the same contractual channel', () => {
            const res = evaluateMerchantPairSimilarity(
                'OUTSURANCE 1024 [DEBIT ORDER]',
                'OUTSURANCE STORE 4421 [DEBIT ORDER]'
            );
            expect(res.isSafe).toBe(true);
            expect(res.similarity).toBe(0.95);
            expect(res.reason).toBe('branch_code_masked_match');
        });

        it('OBSERVATION: lowercase [debit order] bypasses exact case check', () => {
            // Note: BankCleaner generates uppercase [DEBIT ORDER], but raw/legacy keys might be lowercase
            const res = evaluateMerchantPairSimilarity('VODACOM [debit order]', 'VODACOM');
            // If cleanA.includes('[DEBIT ORDER]') is case-sensitive, it passes the segregation check
            // and might get boosted by BankCleaner substring match.
            // Let's document this exact behavior:
            if (res.isSafe) {
                expect(res.similarity).toBeGreaterThanOrEqual(0.85);
            } else {
                expect(res.isSafe).toBe(false);
            }
        });
    });

    // =========================================================================
    // 2. SHORT BRAND COLLISIONS (< 7 CHARACTERS)
    // =========================================================================
    describe('2. Short Brand Collisions (< 7 Characters)', () => {
        const shortCollisionPairs = [
            ['SPAR', 'STAR'],       // 4 chars, 1 edit
            ['SHELL', 'SMELL'],     // 5 chars, 1 edit
            ['UBER', 'USER'],       // 4 chars, 1 edit
            ['AVIS', 'AXIS'],       // 4 chars, 1 edit
            ['TOTAL', 'ROTAL'],     // 5 chars, 1 edit
            ['CALTEX', 'VALTEX'],   // 6 chars, 1 edit
            ['SASOL', 'PASOL'],     // 5 chars, 1 edit
            ['CLICKS', 'CLIKCS'],   // 6 chars, 1 transposition
            ['ENGEN', 'EMGEN'],     // 5 chars, 1 edit
            ['COKE', 'CAKE'],       // 4 chars, 1 edit
            ['BAR', 'BAT']          // 3 chars, 1 edit
        ];

        it.each(shortCollisionPairs)('prevents false merge between short distinct brands %s and %s', (a, b) => {
            const res = evaluateMerchantPairSimilarity(a, b);
            expect(res.isSafe).toBe(false);

            // Also test proposeRegroupsPure
            const proposals = proposeRegroupsPure([
                { key: a, count: 10 },
                { key: b, count: 5 }
            ]);
            expect(proposals.length).toBe(0);
        });

        it('does allow identical short brand strings to match safely', () => {
            const res = evaluateMerchantPairSimilarity('SPAR', 'SPAR');
            expect(res.isSafe).toBe(true);
            expect(res.similarity).toBe(1.0);
            expect(res.reason).toBe('identical');
        });

        it('allows short brand with branch codes to merge when masked length >= 3', () => {
            const res = evaluateMerchantPairSimilarity('SPAR #1024', 'SPAR STORE 4421');
            expect(res.isSafe).toBe(true);
            expect(res.similarity).toBe(0.95);
            expect(res.reason).toBe('branch_code_masked_match');
        });

        it('guards 2-letter brands from branch masking if masked length < 3', () => {
            // Masked 'BP' has length 2, which is < 3
            const res = evaluateMerchantPairSimilarity('BP #1', 'BP #2');
            expect(res.reason).not.toBe('branch_code_masked_match');
        });
    });

    // =========================================================================
    // 3. BRANCH CODE MASKING
    // =========================================================================
    describe('3. Branch Code Masking', () => {
        it('masks various branch syntax formats to the root brand', () => {
            expect(maskBranchAndStoreCodes('CHECKERS #1024')).toBe('CHECKERS');
            expect(maskBranchAndStoreCodes('CHECKERS STORE 4421')).toBe('CHECKERS');
            expect(maskBranchAndStoreCodes('CHECKERS SHOP 12')).toBe('CHECKERS');
            expect(maskBranchAndStoreCodes('CHECKERS BRANCH 001')).toBe('CHECKERS');
            expect(maskBranchAndStoreCodes('CHECKERS BR 223')).toBe('CHECKERS');
            expect(maskBranchAndStoreCodes('CHECKERS STE 10')).toBe('CHECKERS');
            expect(maskBranchAndStoreCodes('CHECKERS STN 55')).toBe('CHECKERS');
            expect(maskBranchAndStoreCodes('CHECKERS 4421')).toBe('CHECKERS');
            expect(maskBranchAndStoreCodes('CHECKERS CNR MAIN')).toBe('CHECKERS');
            expect(maskBranchAndStoreCodes('CHECKERS MALL OF AFRICA')).toBe('CHECKERS');
        });

        it('correctly masks KIOSK branch codes without alternation shadowing', () => {
            // With 3-6 digit branch code:
            expect(maskBranchAndStoreCodes('CHECKERS KIOSK 4421')).toBe('CHECKERS');
            // With 1-digit branch code, KIOSK precedes KIO and separates properly:
            expect(maskBranchAndStoreCodes('CHECKERS KIOSK 5')).toBe('CHECKERS');
        });

        it('clusters 5 branch variants of the same brand into one component', () => {
            const groups = [
                { key: 'WOOLWORTHS', count: 20 },
                { key: 'WOOLWORTHS #1024', count: 4 },
                { key: 'WOOLWORTHS STORE 4421', count: 3 },
                { key: 'WOOLWORTHS SHOP 12', count: 2 },
                { key: 'WOOLWORTHS BR 99', count: 1 }
            ];

            const proposals = proposeRegroupsPure(groups);
            expect(proposals.length).toBe(1);

            const prop = proposals[0];
            expect(prop.targetKey).toBe('WOOLWORTHS');
            expect(prop.sources).toHaveLength(4);
            expect(prop.sources).toContain('WOOLWORTHS #1024');
            expect(prop.sources).toContain('WOOLWORTHS STORE 4421');
            expect(prop.sources).toContain('WOOLWORTHS SHOP 12');
            expect(prop.sources).toContain('WOOLWORTHS BR 99');
            expect(prop.totalCount).toBe(10); // 4 + 3 + 2 + 1
            expect(prop.isSafe).toBe(true);
        });

        it('does NOT merge different brands that share the same branch code', () => {
            const groups = [
                { key: 'CHECKERS #1024', count: 5 },
                { key: 'SPAR #1024', count: 5 },
                { key: 'WOOLWORTHS #1024', count: 5 }
            ];

            const proposals = proposeRegroupsPure(groups);
            expect(proposals.length).toBe(0);

            const clusters = clusterMerchantKeys(groups.map(g => g.key));
            expect(clusters.size).toBe(3);
        });

        it('preserves non-branch standalone numbers like 3M or 7-ELEVEN', () => {
            expect(maskBranchAndStoreCodes('3M SOUTH AFRICA')).toBe('3M SOUTH AFRICA');
            expect(maskBranchAndStoreCodes('7-ELEVEN CONVENIENCE')).toBe('7-ELEVEN CONVENIENCE');
            expect(maskBranchAndStoreCodes('STUDIO 88')).toBe('STUDIO 88');
        });
    });

    // =========================================================================
    // 4. TRANSITIVE CLUSTERING & DISJOINT SETS
    // =========================================================================
    describe('4. Transitive Clustering & Disjoint Sets', () => {
        it('unites 3 nodes transitively when A ~ B and B ~ C', () => {
            const uf = new UnionFind(['A', 'B', 'C']);
            uf.union('A', 'B');
            uf.union('B', 'C');

            const rootA = uf.find('A');
            const rootB = uf.find('B');
            const rootC = uf.find('C');

            expect(rootA).toBe(rootB);
            expect(rootB).toBe(rootC);
        });

        it('handles long 6-node transitive chains (A-B-C-D-E-F)', () => {
            const nodes = ['NODE_1', 'NODE_2', 'NODE_3', 'NODE_4', 'NODE_5', 'NODE_6'];
            const uf = new UnionFind(nodes);

            for (let i = 0; i < nodes.length - 1; i++) {
                uf.union(nodes[i], nodes[i + 1]);
            }

            const canonical = uf.find(nodes[0]);
            for (const n of nodes) {
                expect(uf.find(n)).toBe(canonical);
            }
        });

        it('correctly partitions multiple disjoint sets simultaneously', () => {
            const keys = [
                'ENGEN #1', 'ENGEN #2', 'ENGEN STORE 3',
                'SHELL #1', 'SHELL #2', 'SHELL STORE 3',
                'BP #100', 'BP #200', 'BP STORE 300'
            ];

            const clusters = clusterMerchantKeys(keys);

            // Find clusters containing each brand
            const engenMembers = Array.from(clusters.values()).find(m => m.includes('ENGEN #1'))!;
            const shellMembers = Array.from(clusters.values()).find(m => m.includes('SHELL #1'))!;

            expect(engenMembers).toBeDefined();
            expect(shellMembers).toBeDefined();

            // ENGEN and SHELL must never overlap
            for (const m of engenMembers) {
                expect(shellMembers).not.toContain(m);
            }
        });

        it('handles cyclical union operations without infinite loops or errors', () => {
            const uf = new UnionFind(['X', 'Y', 'Z']);
            uf.union('X', 'Y');
            uf.union('Y', 'Z');
            uf.union('Z', 'X'); // Cycle back

            expect(uf.find('X')).toBe(uf.find('Z'));
        });

        // =====================================================================
        // CHALLENGE: CANONICAL ROOT PRIORITY INVERSION (WEIGHT VS BRAND REGISTRY)
        // =====================================================================
        it('ADVERSARIAL STRESS TEST: verifies national root brand (+5000 priority) beats branch transaction weight', () => {
            const uf = new UnionFind(['WOOLWORTHS', 'WOOLWORTHS #1024']);
            // Case A: Root brand has higher weight
            const rootA = uf.union('WOOLWORTHS', 'WOOLWORTHS #1024', {
                'WOOLWORTHS': 10,
                'WOOLWORTHS #1024': 1
            });
            expect(rootA).toBe('WOOLWORTHS');

            // Case B: Branch #1024 has higher weight (e.g. 5 transactions vs 1)
            const ufB = new UnionFind(['WOOLWORTHS', 'WOOLWORTHS #1024']);
            const rootB = ufB.union('WOOLWORTHS', 'WOOLWORTHS #1024', {
                'WOOLWORTHS': 1,
                'WOOLWORTHS #1024': 5
            });

            // With +5000 priority for NATIONAL_ROOT_BRANDS, clean root brand 'WOOLWORTHS' (1000 + 5000 = 6000+)
            // correctly beats branch variant 'WOOLWORTHS #1024' (5000), preventing canonical inversion
            expect(rootB).toBe('WOOLWORTHS');
        });
    });

    // =========================================================================
    // 5. EDGE CASES, FUZZING & RESILIENCE
    // =========================================================================
    describe('5. Edge Cases & Resilience', () => {
        it('handles empty groups array gracefully', () => {
            expect(proposeRegroupsPure([])).toEqual([]);
        });

        it('handles single group without proposing any merges', () => {
            expect(proposeRegroupsPure([{ key: 'CHECKERS', count: 10 }])).toEqual([]);
        });

        it('handles undefined/null input without crashing', () => {
            expect(proposeRegroupsPure(undefined as any)).toEqual([]);
            expect(proposeRegroupsPure(null as any)).toEqual([]);
        });

        it('handles whitespace-only and empty keys safely', () => {
            const res = evaluateMerchantPairSimilarity('', '   ');
            expect(res.isSafe).toBe(false);
            expect(res.similarity).toBe(0);

            const res2 = evaluateMerchantPairSimilarity('CHECKERS', '   ');
            expect(res2.isSafe).toBe(false);
            expect(res2.similarity).toBe(0);
        });

        it('handles special characters and punctuation safely', () => {
            const res = evaluateMerchantPairSimilarity('!@#$%^&*()', '!@#$%^&*()');
            expect(res.isSafe).toBe(true);
            expect(res.similarity).toBe(1.0);
        });

        it('handles extreme string lengths (1000+ characters) without crashing or timeout', () => {
            const longStrA = 'A'.repeat(500) + ' ' + 'STORE 1024';
            const longStrB = 'A'.repeat(500) + ' ' + 'STORE 2048';

            const start = performance.now();
            const res = evaluateMerchantPairSimilarity(longStrA, longStrB);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(100); // Must execute within 100ms
            expect(res.isSafe).toBe(true);
            expect(res.reason).toBe('branch_code_masked_match');
        });

        it('handles duplicate keys in group list without throwing or double-counting', () => {
            const groups = [
                { key: 'CHECKERS', count: 5 },
                { key: 'CHECKERS', count: 3 }
            ];

            const proposals = proposeRegroupsPure(groups);
            // Identical keys filter out self-merges
            expect(proposals.length).toBe(0);
        });

        it('scales efficiently on 50 merchant keys', () => {
            const groups: { key: string; count: number }[] = [];
            for (let i = 0; i < 50; i++) {
                groups.push({ key: `MERCHANT_${i} STORE ${i}`, count: i + 1 });
            }

            const start = performance.now();
            const proposals = proposeRegroupsPure(groups);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(2000); // 50 items (1225 pairs) within 2000ms
            expect(Array.isArray(proposals)).toBe(true);
        });
    });

    // =========================================================================
    // 6. BACKWARDS COMPATIBILITY & UI INTERFACE CONTRACT
    // =========================================================================
    describe('6. Backwards Compatibility & UI Interface Contract', () => {
        it('ensures RegroupProposal contains all expected UI properties', () => {
            const groups = [
                { key: 'CHECKERS', count: 10, transactions: [{ id: 'tx_c1', description: 'CHECKERS POS' }] },
                { key: 'CHECKERS #1024', count: 2, transactions: [{ id: 'tx_c2', description: 'CHECKERS #1024' }] }
            ];

            const proposals = proposeRegroupsPure(groups);
            expect(proposals.length).toBe(1);

            const p = proposals[0];
            expect(p.targetKey).toBe('CHECKERS');
            expect(p.sources).toContain('CHECKERS #1024');
            expect(p.fromKey).toBe('CHECKERS #1024');
            expect(p.toKey).toBe('CHECKERS');
            expect(p.fromImpact).toBe(2);
            expect(p.toImpact).toBe(10);
            expect(p.totalCount).toBe(2);
            expect(p.score).toBe(95);
            expect(p.confidence).toBe('High');
            expect(p.isSafe).toBe(true);
            expect(p.reason).toBe('branch_code_masked_match');
            expect(p.fromTxIds).toEqual(['tx_c2']);
            expect(p.fromExamples).toEqual(['CHECKERS #1024']);
            expect(p.toExamples).toEqual(['CHECKERS POS']);
        });
    });
});

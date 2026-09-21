import { describe, it, expect } from 'vitest';
import {
    UnionFind,
    maskBranchAndStoreCodes,
    evaluateMerchantPairSimilarity,
    proposeRegroupsPure,
    clusterMerchantKeys,
    stripDateAndNoiseFragments,
    consolidateMerchantGroupsIterative
} from './regroup-engine';

describe('Milestone 4: Regroup Engine Unit Tests', () => {

    describe('1. Branch & Store Code Masking', () => {
        it('masks hash branch numbers (#1024, #B12)', () => {
            expect(maskBranchAndStoreCodes('CHECKERS #1024')).toBe('CHECKERS');
            expect(maskBranchAndStoreCodes('WOOLWORTHS #B12')).toBe('WOOLWORTHS');
        });

        it('masks STORE, SHOP, and BRANCH designations with codes', () => {
            expect(maskBranchAndStoreCodes('CHECKERS STORE 4421')).toBe('CHECKERS');
            expect(maskBranchAndStoreCodes('SUPERSPAR SHOP 12')).toBe('SUPERSPAR');
            expect(maskBranchAndStoreCodes('CLICKS BRANCH 001')).toBe('CLICKS');
            expect(maskBranchAndStoreCodes('DIS-CHEM BR 223')).toBe('DIS-CHEM');
        });

        it('masks street and mall locators (CNR, MALL)', () => {
            expect(maskBranchAndStoreCodes('ENGEN CNR MAIN')).toBe('ENGEN');
            expect(maskBranchAndStoreCodes('WOOLWORTHS MALL OF AFRICA')).toBe('WOOLWORTHS');
        });

        it('preserves [DEBIT ORDER] channel tag while masking branch details', () => {
            expect(maskBranchAndStoreCodes('OUTSURANCE 1024 [DEBIT ORDER]')).toBe('OUTSURANCE [DEBIT ORDER]');
            expect(maskBranchAndStoreCodes('VODACOM CNR MAIN [DEBIT ORDER]')).toBe('VODACOM [DEBIT ORDER]');
        });

        it('never strips words starting with SHOP, STE, BR etc. (Finding 1 regression)', () => {
            expect(maskBranchAndStoreCodes('SHOPRITE')).toBe('SHOPRITE');
            expect(maskBranchAndStoreCodes('STEERS')).toBe('STEERS');
            expect(maskBranchAndStoreCodes('BRIGHTS HARDWARE')).toBe('BRIGHTS HARDWARE');
            expect(maskBranchAndStoreCodes('BRAVO')).toBe('BRAVO');
            expect(maskBranchAndStoreCodes('BRANCHES')).toBe('BRANCHES');
            expect(maskBranchAndStoreCodes('STOREROOM')).toBe('STOREROOM');
        });

        it('correctly masks KIOSK branch codes without shadowing by KIO', () => {
            expect(maskBranchAndStoreCodes('CHECKERS KIOSK 5')).toBe('CHECKERS');
            expect(maskBranchAndStoreCodes('CHECKERS KIOSK 4421')).toBe('CHECKERS');
            expect(maskBranchAndStoreCodes('SPAR KIO 12')).toBe('SPAR');
        });

        it('returns empty string for empty input', () => {
            expect(maskBranchAndStoreCodes('')).toBe('');
        });
    });

    describe('2. Pairwise Merchant Similarity Evaluation', () => {
        it('merges branch variants via masked equality with high score and isSafe: true', () => {
            const res = evaluateMerchantPairSimilarity('CHECKERS #1024', 'CHECKERS STORE 4421');
            expect(res.isSafe).toBe(true);
            expect(res.similarity).toBeGreaterThanOrEqual(0.90);
            expect(res.reason).toBe('branch_code_masked_match');
        });

        it('merges compacted alphanumeric typos (MUGG & BEAN vs MUGGNBEAN)', () => {
            const res = evaluateMerchantPairSimilarity('MUGG & BEAN', 'MUGGNBEAN');
            expect(res.isSafe).toBe(true);
            expect(res.similarity).toBeGreaterThanOrEqual(0.85);
            expect(res.reason).toBe('compacted_typo_match');
        });

        it('merges missing vowel typo in long brand names (WOOLWORTHS vs WOOLWTHS)', () => {
            const res = evaluateMerchantPairSimilarity('WOOLWORTHS', 'WOOLWTHS');
            expect(res.isSafe).toBe(true);
            expect(res.similarity).toBeGreaterThanOrEqual(0.80);
            expect(res.reason).toBe('compacted_typo_match');
        });

        it('enforces strict [DEBIT ORDER] segregation between contractual and discretionary spend', () => {
            const res = evaluateMerchantPairSimilarity('VODACOM', 'VODACOM [DEBIT ORDER]');
            expect(res.isSafe).toBe(false);
            expect(res.similarity).toBe(0);
            expect(res.reason).toBe('debit_order_segregation');

            const resOutsurance = evaluateMerchantPairSimilarity('OUTSURANCE [DEBIT ORDER]', 'OUTSURANCE');
            expect(resOutsurance.isSafe).toBe(false);
            expect(resOutsurance.similarity).toBe(0);
            expect(resOutsurance.reason).toBe('debit_order_segregation');
        });

        it('allows branch masking between two [DEBIT ORDER] keys of the same channel', () => {
            const res = evaluateMerchantPairSimilarity('OUTSURANCE 1024 [DEBIT ORDER]', 'OUTSURANCE [DEBIT ORDER]');
            expect(res.isSafe).toBe(true);
            expect(res.similarity).toBe(0.95);
            expect(res.reason).toBe('branch_code_masked_match');
        });

        it('prevents short string false positives (SPAR vs STAR must NOT merge)', () => {
            const res = evaluateMerchantPairSimilarity('SPAR', 'STAR');
            expect(res.isSafe).toBe(false);
        });

        it('prevents false merges on short distinct words (SHELL vs SMELL)', () => {
            const res = evaluateMerchantPairSimilarity('SHELL', 'SMELL');
            expect(res.isSafe).toBe(false);
        });

        it('prevents stopword collapse false merges (THE MALL HARDWARE vs THE MALL BAKERY)', () => {
            const res = evaluateMerchantPairSimilarity('THE MALL HARDWARE', 'THE MALL BAKERY');
            expect(res.isSafe).toBe(false);
        });

        it('returns identical for exact string matches', () => {
            const res = evaluateMerchantPairSimilarity('CHECKERS', 'CHECKERS');
            expect(res.isSafe).toBe(true);
            expect(res.similarity).toBe(1.0);
            expect(res.reason).toBe('identical');
        });

        it('handles empty keys safely', () => {
            const res = evaluateMerchantPairSimilarity('', 'CHECKERS');
            expect(res.isSafe).toBe(false);
            expect(res.similarity).toBe(0);
        });
    });

    describe('3. UnionFind Disjoint-Set Data Structure', () => {
        it('implements path compression correctly', () => {
            const uf = new UnionFind(['A', 'B', 'C', 'D']);
            uf.union('A', 'B');
            uf.union('B', 'C');
            uf.union('C', 'D');

            const rootD = uf.find('D');
            expect(rootD).toBe(uf.find('A'));
            // After find, path compression flattens direct parent pointer
            expect(uf.parent['D']).toBe(rootD);
        });

        it('selects root with higher weight/transaction count', () => {
            const uf = new UnionFind(['BRAND_RARE', 'BRAND_COMMON']);
            const weights = {
                'BRAND_RARE': 2,
                'BRAND_COMMON': 50
            };
            const root = uf.union('BRAND_RARE', 'BRAND_COMMON', weights);
            expect(root).toBe('BRAND_COMMON');
            expect(uf.find('BRAND_RARE')).toBe('BRAND_COMMON');
        });

        it('selects registered national root brand when weights are tied', () => {
            const uf = new UnionFind(['WOOLWORTHS', 'WOOLWTHS']);
            const weights = {
                'WOOLWORTHS': 1,
                'WOOLWTHS': 1
            };
            const root = uf.union('WOOLWORTHS', 'WOOLWTHS', weights);
            expect(root).toBe('WOOLWORTHS');
        });

        it('prioritizes registered national root brand over branch variation even with higher transaction weight', () => {
            const uf = new UnionFind(['WOOLWORTHS', 'WOOLWORTHS #1024']);
            const weights = {
                'WOOLWORTHS': 1,
                'WOOLWORTHS #1024': 5
            };
            const root = uf.union('WOOLWORTHS', 'WOOLWORTHS #1024', weights);
            expect(root).toBe('WOOLWORTHS');
        });

        it('prefers clean spaced brand names over compacted or noisy strings', () => {
            const uf = new UnionFind(['MUGG & BEAN', 'MUGGNBEAN']);
            const weights = {
                'MUGG & BEAN': 5,
                'MUGGNBEAN': 5
            };
            const root = uf.union('MUGG & BEAN', 'MUGGNBEAN', weights);
            expect(root).toBe('MUGG & BEAN');
        });
    });

    describe('4. Multi-Node Transitive Clustering', () => {
        it('clusters multi-node branch variants into canonical root', () => {
            const keys = ['CHECKERS #1024', 'CHECKERS STORE 4421', 'CHECKERS'];
            const weights = {
                'CHECKERS': 10,
                'CHECKERS #1024': 3,
                'CHECKERS STORE 4421': 2
            };

            const clusters = clusterMerchantKeys(keys, weights);
            expect(clusters.has('CHECKERS')).toBe(true);

            const checkersMembers = clusters.get('CHECKERS');
            expect(checkersMembers).toBeDefined();
            expect(checkersMembers).toContain('CHECKERS');
            expect(checkersMembers).toContain('CHECKERS #1024');
            expect(checkersMembers).toContain('CHECKERS STORE 4421');
        });

        it('maintains segregation across distinct merchants and debit orders', () => {
            const keys = [
                'VODACOM',
                'VODACOM [DEBIT ORDER]',
                'VODACOM 12345 [DEBIT ORDER]',
                'SPAR',
                'STAR'
            ];

            const clusters = clusterMerchantKeys(keys);
            // VODACOM and VODACOM [DEBIT ORDER] must NOT share a cluster
            const vodacomRoot = Array.from(clusters.entries()).find(([_, members]) => members.includes('VODACOM'))?.[0];
            const vodacomDebitRoot = Array.from(clusters.entries()).find(([_, members]) => members.includes('VODACOM [DEBIT ORDER]'))?.[0];
            expect(vodacomRoot).not.toBe(vodacomDebitRoot);

            // SPAR and STAR must NOT share a cluster
            const sparRoot = Array.from(clusters.entries()).find(([_, members]) => members.includes('SPAR'))?.[0];
            const starRoot = Array.from(clusters.entries()).find(([_, members]) => members.includes('STAR'))?.[0];
            expect(sparRoot).not.toBe(starRoot);
        });
    });

    describe('5. Pure Regroup Proposals (proposeRegroupsPure)', () => {
        it('proposes safe merge for branch codes into canonical brand', () => {
            const groups = [
                { key: 'CHECKERS', count: 12, transactions: [{ id: 'tx_1', description: 'CHECKERS POS' }] },
                { key: 'CHECKERS #1024', count: 3, transactions: [{ id: 'tx_2', description: 'CHECKERS #1024' }] },
                { key: 'CHECKERS STORE 4421', count: 2, transactions: [{ id: 'tx_3', description: 'CHECKERS STORE 4421' }] }
            ];

            const proposals = proposeRegroupsPure(groups);
            expect(proposals.length).toBe(1);

            const prop = proposals[0];
            expect(prop.targetKey).toBe('CHECKERS');
            expect(prop.sources).toContain('CHECKERS #1024');
            expect(prop.sources).toContain('CHECKERS STORE 4421');
            expect(prop.totalCount).toBe(5); // 3 + 2
            expect(prop.isSafe).toBe(true);
            expect(prop.fromTxIds).toContain('tx_2');
            expect(prop.fromTxIds).toContain('tx_3');
        });

        it('proposes safe merge for compacted typo (MUGGNBEAN -> MUGG & BEAN)', () => {
            const groups = [
                { key: 'MUGG & BEAN', count: 15, transactions: [{ id: 'tx_mb1', description: 'MUGG & BEAN WATERFRONT' }] },
                { key: 'MUGGNBEAN', count: 1, transactions: [{ id: 'tx_mb2', description: 'MUGGNBEAN GATEWAY' }] }
            ];

            const proposals = proposeRegroupsPure(groups);
            expect(proposals.length).toBe(1);
            expect(proposals[0].targetKey).toBe('MUGG & BEAN');
            expect(proposals[0].sources).toEqual(['MUGGNBEAN']);
            expect(proposals[0].isSafe).toBe(true);
            expect(proposals[0].totalCount).toBe(1);
        });

        it('returns zero proposals for completely distinct merchants', () => {
            const groups = [
                { key: 'SPAR', count: 5 },
                { key: 'STAR', count: 3 },
                { key: 'SHELL', count: 8 },
                { key: 'SMELL', count: 1 }
            ];

            const proposals = proposeRegroupsPure(groups);
            expect(proposals.length).toBe(0);
        });

        it('accurately tags isSafe flag and supports filtering safe proposals', () => {
            const groups = [
                { key: 'WOOLWORTHS', count: 20 },
                { key: 'WOOLWORTHS #1024', count: 4 },
                { key: 'VODACOM', count: 10 },
                { key: 'VODACOM [DEBIT ORDER]', count: 5 }
            ];

            const proposals = proposeRegroupsPure(groups);
            const safeProposals = proposals.filter(p => p.isSafe);

            expect(safeProposals.length).toBe(1);
            expect(safeProposals[0].targetKey).toBe('WOOLWORTHS');
            expect(safeProposals[0].sources).toContain('WOOLWORTHS #1024');
        });
    });

    describe('5. Cleanest Root Priority & Date Fragment Stripping', () => {
        it('strips date fragments and ordinals', () => {
            expect(stripDateAndNoiseFragments('COC 6 SEPT')).toBe('COC');
            expect(stripDateAndNoiseFragments('COC 10 TH')).toBe('COC');
            expect(stripDateAndNoiseFragments('COC 26 J')).toBe('COC');
            expect(stripDateAndNoiseFragments('FIVE STAR SUPER')).toBe('FIVE STAR SUPER');
            expect(stripDateAndNoiseFragments('TRANSPORT TO BEREA')).toBe('TRANSPORT TO BEREA');
        });
    });

    describe('6. Iterative Consolidation to Convergence', () => {
        it('consolidates user merchant groups to convergence in a single automated call', () => {
            const initialGroups = [
                { key: 'COC 6 SEPT', count: 1, transactions: [{ id: 'tx1', description: 'COC 6SEPT J4P COC ENTRIES' }] },
                { key: 'COC 10 TH', count: 1, transactions: [{ id: 'tx2', description: 'COC 10TH MAY J4P COC ENTRIES' }] },
                { key: 'COC 26 J', count: 1, transactions: [{ id: 'tx3', description: 'COC 26JUL J4P COC ENTRIES' }] },
                { key: 'FIVE STAR SUPER', count: 1, transactions: [{ id: 'tx4', description: 'FIVE STAR SUPER' }] },
                { key: 'FIVE STAR', count: 2, transactions: [{ id: 'tx5', description: 'FIVE STAR' }, { id: 'tx6', description: 'FIVE STAR' }] },
                { key: 'TRANSPORT X BEREA', count: 6, transactions: [{ id: 'tx7', description: 'TRANSPORT X BEREA' }] },
                { key: 'TRANSPORT TO BEREA', count: 10, transactions: [{ id: 'tx8', description: 'TRANSPORT TO BEREA' }] }
            ];

            const result = consolidateMerchantGroupsIterative(initialGroups);

            // Verified outcomes
            expect(result.totalMergesApplied).toBeGreaterThanOrEqual(4);
            expect(result.passesExecuted).toBeGreaterThanOrEqual(1);

            const keys = result.consolidatedGroups.map(g => g.key);
            expect(keys).toContain('COC');
            expect(keys).toContain('FIVE STAR');
            expect(keys).toContain('TRANSPORT TO BEREA');

            // Total count should equal original sum (22 transactions)
            const totalTxCount = result.consolidatedGroups.reduce((s, g) => s + g.count, 0);
            expect(totalTxCount).toBe(22);

            // COC group should have 3 transactions
            const cocGroup = result.consolidatedGroups.find(g => g.key === 'COC');
            expect(cocGroup?.count).toBe(3);
            expect(cocGroup?.transactions.length).toBe(3);
        });

        it('handles multi-hop transitive convergence (A -> B -> C)', () => {
            // Group with 3 typos/variants that chain
            const initialGroups = [
                { key: 'CHECKERS HYPER STORE', count: 2, transactions: [{ id: 't1' }] },
                { key: 'CHECKERS HYPER', count: 5, transactions: [{ id: 't2' }] },
                { key: 'CHECKERS', count: 15, transactions: [{ id: 't3' }] }
            ];

            const result = consolidateMerchantGroupsIterative(initialGroups);
            expect(result.consolidatedGroups.length).toBe(1);
            expect(result.consolidatedGroups[0].key).toBe('CHECKERS');
            expect(result.consolidatedGroups[0].count).toBe(22);
        });

        it('stops and returns 0 merges when groups are completely distinct', () => {
            const initialGroups = [
                { key: 'UBER', count: 5, transactions: [{ id: 't1' }] },
                { key: 'SHELL', count: 8, transactions: [{ id: 't2' }] },
                { key: 'VODACOM', count: 3, transactions: [{ id: 't3' }] }
            ];

            const result = consolidateMerchantGroupsIterative(initialGroups);
            expect(result.totalMergesApplied).toBe(0);
            expect(result.passesExecuted).toBe(1);
            expect(result.consolidatedGroups.length).toBe(3);
        });
    });
});

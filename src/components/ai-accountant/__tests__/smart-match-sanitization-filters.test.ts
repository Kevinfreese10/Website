import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { sanitizeKeyword } from '@/lib/keyword-sanitizer';

describe('Smart Match Queue: Keyword Sanitization, Filters & 1-Click Card Rule Approval', () => {
    const sanitizerPath = path.resolve(__dirname, '../../../lib/keyword-sanitizer.ts');
    const modalPath = path.resolve(__dirname, '../dialogs/AiResearchResultsModal.tsx');
    const cardPath = path.resolve(__dirname, '../components/MerchantGroupCard.tsx');
    const tabPath = path.resolve(__dirname, '../SmartMatchQueueTab.tsx');

    const modalContent = fs.readFileSync(modalPath, 'utf-8');
    const cardContent = fs.readFileSync(cardPath, 'utf-8');
    const tabContent = fs.readFileSync(tabPath, 'utf-8');

    describe('1. Keyword Sanitizer Utility', () => {
        it('1.1: Sanitizes national root brands to canonical names', () => {
            expect(sanitizeKeyword('ENGEN WIERDA PARK 1234')).toBe('ENGEN');
            expect(sanitizeKeyword('SHELL V-POWER CT01')).toBe('SHELL');
            expect(sanitizeKeyword('TOTALENERGIES SANDTON')).toBe('TOTAL');
            expect(sanitizeKeyword('WOOLWORTHS WATERFRONT CT')).toBe('WOOLWORTHS');
            expect(sanitizeKeyword('CHECKERS HYPER MENLYN')).toBe('CHECKERS HYPER');
            expect(sanitizeKeyword('CHECKERS SANDTON')).toBe('CHECKERS');
        });

        it('1.2: Strips bank transaction prefixes', () => {
            expect(sanitizeKeyword('POS PURCHASE BASS LAKE')).toBe('BASS LAKE');
            expect(sanitizeKeyword('CARD PURCHASE KLOOF BAKERY')).toBe('KLOOF BAKERY');
            expect(sanitizeKeyword('EFT PMT FAST SERVICES')).toBe('FAST SERVICES');
            expect(sanitizeKeyword('DEBIT ORDER VODACOM')).toBe('VODACOM');
        });

        it('1.3: Strips card masks, store/POS numbers, dates, and trailing noise', () => {
            expect(sanitizeKeyword('BASS LAKE *4321 2026/09/23')).toBe('BASS LAKE');
            expect(sanitizeKeyword('UBER EATS STORE #9876')).toBe('UBER EATS');
            expect(sanitizeKeyword('TAKEALOT ONLINE REF:123456')).toBe('TAKEALOT');
            expect(sanitizeKeyword('NEDBANK CHARGES 54321')).toBe('NEDBANK');
        });

        it('1.4: Handles fallback cleanly', () => {
            expect(sanitizeKeyword('   ')).toBe('');
            expect(sanitizeKeyword('SPOTIFY')).toBe('SPOTIFY');
        });
    });

    describe('2. Expanded & Streamlined AI Research Modal (max-w-5xl)', () => {
        it('2.1: Dialog container is expanded to max-w-5xl', () => {
            expect(modalContent).toContain('max-w-5xl');
        });

        it('2.2: Renders Master Select All checkbox with selected item count', () => {
            expect(modalContent).toContain('id="modal-select-all"');
            expect(modalContent).toContain('Select All');
            expect(modalContent).toContain('handleToggleAll');
        });

        it('2.3: Provides bulk rule mode buttons (Existing vs New for all)', () => {
            expect(modalContent).toContain('handleSetAllToExisting');
            expect(modalContent).toContain('handleSetAllToNew');
            expect(modalContent).toContain('Add to Existing Rule (Where Available)');
            expect(modalContent).toContain('Create New Rule for All');
        });

        it('2.4: Provides inline editable sanitized keyword input per row', () => {
            expect(modalContent).toContain('handleKeywordChange');
            expect(modalContent).toContain('sanitizedKeyword');
            expect(modalContent).toContain('title="Sanitized keyword for rule matching. Click to edit."');
        });

        it('2.5: Supports No Rule option in addition to Add to Existing and Create New', () => {
            expect(modalContent).toContain('No Rule');
            expect(modalContent).toContain("action === 'none'");
        });
    });

    describe('3. Individual MerchantGroupCard 1-Click 3-Way Rule Selector', () => {
        it('3.1: Replaces binary checkbox with 3-way toggle (No Rule, Save to Account, New Rule)', () => {
            expect(cardContent).toContain('No Rule');
            expect(cardContent).toContain('Save to Account');
            expect(cardContent).toContain('New Rule');
            expect(cardContent).toContain("ruleMode === 'none'");
            expect(cardContent).toContain("ruleMode === 'append'");
            expect(cardContent).toContain("ruleMode === 'new'");
        });

        it('3.2: Computes matchingRules for the allocated account', () => {
            expect(cardContent).toContain('const matchingRules = useMemo(() => {');
            expect(cardContent).toContain('return r.accountId === currentAccountId;');
        });

        it('3.3: Provides sanitized editable keyword input on the card', () => {
            expect(cardContent).toContain('defaultKeyword = useMemo(() => sanitizeKeyword(group.merchantKey)');
            expect(cardContent).toContain('title="Sanitized keyword for rule matching"');
        });

        it('3.4: Renders account label and keyword input when ruleMode is active', () => {
            expect(cardContent).toContain('Account:');
            expect(cardContent).toContain('accountLabel');
            expect(cardContent).toContain("ruleMode !== 'none'");
        });

        it('3.5: Renders full transaction labels (View Transactions and Transactions)', () => {
            expect(cardContent).toContain('View Transactions →');
            expect(cardContent).toContain("group.transactions.length === 1 ? 'Transaction' : 'Transactions'");
        });
    });

    describe('4. Smart Match Queue Filters & 1-Click Approval Execution', () => {
        it('4.1: Queue state has confidenceFilter and statusFilter', () => {
            expect(tabContent).toContain("const [confidenceFilter, setConfidenceFilter] = useState<");
            expect(tabContent).toContain("const [statusFilter, setStatusFilter] = useState<");
        });

        it('4.2: filteredGroups filters by confidence (high, medium, low) and status (allocated, pending)', () => {
            expect(tabContent).toContain("confidenceFilter === 'high'");
            expect(tabContent).toContain("confidenceFilter === 'medium'");
            expect(tabContent).toContain("confidenceFilter === 'low'");
            expect(tabContent).toContain("statusFilter === 'allocated'");
            expect(tabContent).toContain("statusFilter === 'pending'");
        });

        it('4.3: Toolbar renders Confidence and Status Select dropdowns', () => {
            expect(tabContent).toContain('All Confidence');
            expect(tabContent).toContain('High (≥80%)');
            expect(tabContent).toContain('Medium (20-79%)');
            expect(tabContent).toContain('All Statuses');
            expect(tabContent).toContain('Allocated (Ready)');
        });

        it('4.4: handleApproveGroup executes 1-click rule creation and keyword appending with sanitized keyword', () => {
            expect(tabContent).toContain("const sanitizedKw = (settings.customKeyword || sanitizeKeyword(group.merchantKey)).toUpperCase().trim();");
            expect(tabContent).toContain("if (ruleMode === 'append' || ruleMode === 'new')");
            expect(tabContent).toContain("await commitGroupApproval(group, settings, true);");
        });

        it('4.5: handleApproveAiResearchResults uses sanitized keyword and respects action === none', () => {
            expect(tabContent).toContain("if (item.action === 'none') {");
            expect(tabContent).toContain("const kwUpper = (item.sanitizedKeyword || sanitizeKeyword(item.merchantKey)).toUpperCase().trim();");
        });
    });
});

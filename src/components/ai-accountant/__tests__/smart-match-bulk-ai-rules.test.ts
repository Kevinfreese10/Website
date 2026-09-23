import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Smart Match Queue: Append Keyword to Existing Rule & Bulk AI Research Modal (80%+)', () => {
    const dialogPath = path.resolve(__dirname, '../dialogs/CreateRuleDialog.tsx');
    const modalPath = path.resolve(__dirname, '../dialogs/AiResearchResultsModal.tsx');
    const tabPath = path.resolve(__dirname, '../SmartMatchQueueTab.tsx');
    const typesPath = path.resolve(__dirname, '../types.ts');

    const dialogContent = fs.readFileSync(dialogPath, 'utf-8');
    const modalContent = fs.readFileSync(modalPath, 'utf-8');
    const tabContent = fs.readFileSync(tabPath, 'utf-8');
    const typesContent = fs.readFileSync(typesPath, 'utf-8');

    describe('1. CreateRuleDialog: Option to Add Keyword to Existing Rule', () => {
        it('1.1: RuleFormValues schema supports mode and existingRuleId', () => {
            expect(typesContent).toContain("mode: z.enum(['new', 'append'])");
            expect(typesContent).toContain("existingRuleId: z.string().optional()");
        });

        it('1.2: Calculates matching rules matching the selected account allocation', () => {
            expect(dialogContent).toContain('const matchingRules = useMemo(() => {');
            expect(dialogContent).toContain('return r.accountId === watchAccountId;');
        });

        it('1.3: Renders radio toggle between New Rule and Add to Existing Rule', () => {
            expect(dialogContent).toContain('value="append"');
            expect(dialogContent).toContain('value="new"');
            expect(dialogContent).toContain('Add to Existing Rule');
            expect(dialogContent).toContain('Create New Rule');
        });

        it('1.4: Displays existing rules selector with keyword count and keyword preview badges', () => {
            expect(dialogContent).toContain('Select Matching Rule to Update:');
            expect(dialogContent).toContain('keywords?.length');
            expect(dialogContent).toContain('Current keywords');
        });

        it('1.5: Appends keyword to existing rule in Firestore with deduplication and uppercase', () => {
            expect(dialogContent).toContain('Array.from(new Set([...(r.keywords || []), ...keywordsArray]))');
            expect(dialogContent).toContain("updateDoc(clientRef, { allocationRules: updatedRules })");
        });
    });

    describe('2. Smart Match Queue: Select All Groups Button', () => {
        it('2.1: Declares targetGroupsForSelect, isAllGroupsSelected, and handleToggleSelectAllGroups', () => {
            expect(tabContent).toContain('const targetGroupsForSelect = filteredGroups.length > 0 ? filteredGroups : groups;');
            expect(tabContent).toContain('const isAllGroupsSelected = targetGroupsForSelect.length > 0 && targetGroupsForSelect.every(');
            expect(tabContent).toContain('const handleToggleSelectAllGroups = () => {');
        });

        it('2.2: Renders Select All Groups button in Review Identifiable Merchants header', () => {
            expect(tabContent).toContain('onClick={handleToggleSelectAllGroups}');
            expect(tabContent).toMatch(/isAllGroupsSelected \? "Deselect All" : `Select All Groups/);
        });
    });

    describe('3. Bulk AI Research Modal: 80%+ Confidence & Rule Approval', () => {
        it('3.1: AiResearchResultsModal component is implemented and exported', () => {
            expect(fs.existsSync(modalPath)).toBe(true);
            expect(modalContent).toContain('export function AiResearchResultsModal');
        });

        it('3.2: Bulk research filters for high confidence (>= 80%)', () => {
            expect(tabContent).toContain('if (res && res.confidence >= 80 && res.accountId) {');
            expect(tabContent).toContain('lowCount++;');
        });

        it('3.3: Low-confidence items (<80%) are left in queue for manual review with badge indicator', () => {
            expect(modalContent).toContain('lowConfidenceCount > 0');
            expect(modalContent).toContain('left for manual review');
            expect(tabContent).toContain('setLowConfidenceCount(lowCount);');
        });

        it('3.4: Modal allows choosing between adding keyword to existing rule or creating new rule per row', () => {
            expect(modalContent).toContain("handleActionChange(item.merchantKey, 'append')");
            expect(modalContent).toContain("handleActionChange(item.merchantKey, 'new')");
            expect(modalContent).toContain('Add to Existing Rule');
            expect(modalContent).toContain('Create New Rule');
        });

        it('3.5: Mounts AiResearchResultsModal in SmartMatchQueueTab with approval handler', () => {
            expect(tabContent).toContain('<AiResearchResultsModal');
            expect(tabContent).toContain('open={isAiResultsModalOpen}');
            expect(tabContent).toContain('results={aiResearchResults}');
            expect(tabContent).toContain('onApproveAll={handleApproveAiResearchResults}');
        });

        it('3.6: handleApproveAiResearchResults applies transactions and updates rules', () => {
            expect(tabContent).toContain('const handleApproveAiResearchResults = async (approvedItems: AiResearchItemResult[]) => {');
            expect(tabContent).toContain("status: 'reviewed'");
            expect(tabContent).toContain("allocationSource: 'ai'");
            expect(tabContent).toContain('batch.commit()');
        });
    });
});

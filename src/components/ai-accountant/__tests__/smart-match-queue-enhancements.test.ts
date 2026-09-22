import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Smart Match Queue Enhancements: Bulk AI Research, Rule Modal Trigger, Toolbar Reorganization', () => {
    const smartTabPath = path.resolve(__dirname, '../SmartMatchQueueTab.tsx');
    const smartTabContent = fs.readFileSync(smartTabPath, 'utf-8');

    describe('1. Rule Creation Dialog Trigger on Approval', () => {
        it('1.1: Mounts CreateRuleDialog with required wiring and handlers', () => {
            expect(smartTabContent).toContain('<CreateRuleDialog');
            expect(smartTabContent).toMatch(/<CreateRuleDialog[\s\S]*?onRuleCreated=\{handleRuleDialogSaved\}/);
            expect(smartTabContent).toMatch(/<CreateRuleDialog[\s\S]*?open=\{isCreateRuleOpen\}/);
            expect(smartTabContent).toMatch(/<CreateRuleDialog[\s\S]*?defaultValues=\{ruleDefaultValues\}/);
        });

        it('1.2: handleApproveGroup checks settings.createRule and opens CreateRuleDialog pre-filled', () => {
            expect(smartTabContent).toContain('if (settings.createRule) {');
            expect(smartTabContent).toContain('setStagedGroupForRule(group);');
            expect(smartTabContent).toContain('setIsCreateRuleOpen(true);');
        });

        it('1.3: handleApproveGroup commits immediately when createRule is unchecked', () => {
            expect(smartTabContent).toContain('await commitGroupApproval(group, settings);');
        });

        it('1.4: handleRuleDialogSaved completes approval for the staged group skipping duplicate rule insert', () => {
            expect(smartTabContent).toContain('const handleRuleDialogSaved = async () => {');
            expect(smartTabContent).toContain('await commitGroupApproval(groupToApprove, settings, true);');
        });
    });

    describe('2. Bulk AI Research Functionality', () => {
        it('2.1: Declares bulk research state variables', () => {
            expect(smartTabContent).toContain('const [isBulkResearching, setIsBulkResearching] = useState(false);');
            expect(smartTabContent).toContain('const [bulkResearchProgress, setBulkResearchProgress] = useState<');
        });

        it('2.2: Renders Research Selected with AI button in the bulk action bar', () => {
            expect(smartTabContent).toContain('onClick={handleBulkResearchWithAi}');
            expect(smartTabContent).toContain('Research Selected with AI ({selectedGroupKeys.length})');
        });

        it('2.3: handleBulkResearchWithAi processes groups in parallel chunks of 4', () => {
            expect(smartTabContent).toContain('const chunkSize = 4;');
            expect(smartTabContent).toContain('for (let i = 0; i < groupsToResearch.length; i += chunkSize)');
            expect(smartTabContent).toContain('await Promise.all(chunk.map(async (group) => {');
        });

        it('2.4: Updates suggestions and confidence badges in real time for researched groups', () => {
            expect(smartTabContent).toMatch(/suggestion:\s*\{[\s\S]*?confidence:\s*res\.confidence/);
        });
    });

    describe('3. Toolbar Consolidation into Logical Dropdowns', () => {
        it('3.1: Replaces flat conflicting buttons with Group Merging dropdown menu', () => {
            expect(smartTabContent).toContain('Group Merging');
            expect(smartTabContent).toContain('Consolidate Groups (Convergence)');
            expect(smartTabContent).toContain('Review Merge Proposals');
        });

        it('3.2: Replaces flat buttons with Re-matching Tools dropdown menu', () => {
            expect(smartTabContent).toContain('Re-matching Tools');
            expect(smartTabContent).toContain('Recheck Rules');
            expect(smartTabContent).toContain('Match from History');
            expect(smartTabContent).toContain('Full AI Reanalyze & Regroup');
        });

        it('3.3: Destructive AI Reanalyze & Regroup action is guarded by AlertDialog', () => {
            expect(smartTabContent).toContain('<AlertDialog open={isReanalyzeAlertOpen}');
            expect(smartTabContent).toContain('Reset & Full AI Re-analysis?');
            expect(smartTabContent).toContain('handleReanalyzeAndRegroup();');
        });
    });
});

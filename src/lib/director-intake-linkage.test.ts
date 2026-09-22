import { describe, it, expect } from 'vitest';
import { 
  isDirectorCountRequirement, 
  parseDirectorCount, 
  getNumberedDirectorIndex, 
  evaluateDirectorSlotStatus 
} from './director-linkage';
import { checkCompleteness } from './verification/mechanical';

describe('Director Intake Linkage', () => {
  describe('isDirectorCountRequirement', () => {
    it('detects remove director count label', () => {
      expect(isDirectorCountRequirement('Number of Directors Resigning or Being Removed')).toBe(true);
      expect(isDirectorCountRequirement('number of directors resigning')).toBe(true);
      expect(isDirectorCountRequirement('How many directors are being removed?')).toBe(true);
    });

    it('detects company registration director count label', () => {
      expect(isDirectorCountRequirement('Number of Directors to Register')).toBe(true);
      expect(isDirectorCountRequirement('How many directors to register?')).toBe(true);
    });

    it('returns false for individual director slot labels or unrelated labels', () => {
      expect(isDirectorCountRequirement('Director 1: Full Name')).toBe(false);
      expect(isDirectorCountRequirement('Certified ID Copies of Directors')).toBe(false);
      expect(isDirectorCountRequirement('SARS eFiling Username')).toBe(false);
    });
  });

  describe('parseDirectorCount', () => {
    it('parses numeric values and strings', () => {
      expect(parseDirectorCount(1)).toBe(1);
      expect(parseDirectorCount('2')).toBe(2);
      expect(parseDirectorCount('3 directors')).toBe(3);
      expect(parseDirectorCount('5+')).toBe(5);
      expect(parseDirectorCount('1 (Sole Director)')).toBe(1);
    });

    it('returns null for missing or invalid values', () => {
      expect(parseDirectorCount(null)).toBeNull();
      expect(parseDirectorCount(undefined)).toBeNull();
      expect(parseDirectorCount('')).toBeNull();
      expect(parseDirectorCount('N/A (No)')).toBeNull();
    });
  });

  describe('getNumberedDirectorIndex', () => {
    it('extracts director number from slot labels', () => {
      expect(getNumberedDirectorIndex('Director 1: Full Name')).toBe(1);
      expect(getNumberedDirectorIndex('Director 2: Full Name')).toBe(2);
      expect(getNumberedDirectorIndex('Director 3: Full Name (Resigning)')).toBe(3);
      expect(getNumberedDirectorIndex('Director 5: Full Name')).toBe(5);
    });

    it('returns null for non-numbered director labels', () => {
      expect(getNumberedDirectorIndex('Director Full Name')).toBeNull();
      expect(getNumberedDirectorIndex('Company Name')).toBeNull();
    });
  });

  describe('evaluateDirectorSlotStatus', () => {
    it('keeps Director 1 active by default and marks Director 2+ as pending_count before count is chosen', () => {
      expect(evaluateDirectorSlotStatus('Director 1: Full Name', null)).toBe('active');
      expect(evaluateDirectorSlotStatus('Director 2: Full Name', null)).toBe('pending_count');
      expect(evaluateDirectorSlotStatus('Director 3: Full Name', '')).toBe('pending_count');
    });

    it('activates exactly N slots and skips slots beyond N', () => {
      const selectedCount = '2';
      expect(evaluateDirectorSlotStatus('Director 1: Full Name', selectedCount)).toBe('active');
      expect(evaluateDirectorSlotStatus('Director 2: Full Name', selectedCount)).toBe('active');
      expect(evaluateDirectorSlotStatus('Director 3: Full Name', selectedCount)).toBe('skipped');
      expect(evaluateDirectorSlotStatus('Director 4: Full Name', selectedCount)).toBe('skipped');
      expect(evaluateDirectorSlotStatus('Director 5: Full Name', selectedCount)).toBe('skipped');
    });

    it('returns not_numbered for regular requirements', () => {
      expect(evaluateDirectorSlotStatus('CIPC Registration Certificate', '2')).toBe('not_numbered');
    });
  });

  describe('checkCompleteness integration with director count', () => {
    const requirements = [
      { id: 'count', label: 'Number of Directors Resigning or Being Removed', isRequired: true },
      { id: 'dir1', label: 'Director 1: Full Name', isRequired: true },
      { id: 'dir2', label: 'Director 2: Full Name', isRequired: true },
      { id: 'dir3', label: 'Director 3: Full Name', isRequired: true },
      { id: 'dir4', label: 'Director 4: Full Name', isRequired: true },
      { id: 'dir5', label: 'Director 5: Full Name', isRequired: true },
    ];

    it('passes completeness when client selected 2 directors and provided only 2 director names', () => {
      const uploads = [
        { requirementLabel: 'Number of Directors Resigning or Being Removed', textValue: '2', status: 'approved' },
        { requirementLabel: 'Director 1: Full Name', textValue: 'John Doe', status: 'approved' },
        { requirementLabel: 'Director 2: Full Name', textValue: 'Jane Smith', status: 'approved' },
      ];

      const result = checkCompleteness(requirements, uploads);
      expect(result.complete).toBe(true);
      expect(result.missingRequired).toHaveLength(0);
      expect(result.rejected).toHaveLength(0);
    });

    it('flags Director 2 as missing if client selected 2 directors but only provided 1', () => {
      const uploads = [
        { requirementLabel: 'Number of Directors Resigning or Being Removed', textValue: '2', status: 'approved' },
        { requirementLabel: 'Director 1: Full Name', textValue: 'John Doe', status: 'approved' },
      ];

      const result = checkCompleteness(requirements, uploads);
      expect(result.complete).toBe(false);
      expect(result.missingRequired).toEqual([{ id: 'dir2', label: 'Director 2: Full Name' }]);
    });
  });
});

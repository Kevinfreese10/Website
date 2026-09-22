import { describe, it, expect } from 'vitest';
import {
  STANDARD_DOCUMENT_REQUIREMENT_GROUPS,
  STANDARD_PREREQUISITE_GROUPS,
  SARS_EFILING_LOGIN_PACK,
  isCoveredByStandardDocumentPreset,
  isCoveredByStandardPrerequisitePreset,
  extractUniqueDocumentsFromServices,
  extractUniquePrerequisitesFromServices,
} from './service-presets';

describe('service-presets', () => {
  describe('STANDARD_DOCUMENT_REQUIREMENT_GROUPS', () => {
    it('has unique IDs across all document requirement groups', () => {
      const allIds = STANDARD_DOCUMENT_REQUIREMENT_GROUPS.flatMap(g => g.items.map(i => i.id));
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('has unique labels across all document requirement groups', () => {
      const allLabels = STANDARD_DOCUMENT_REQUIREMENT_GROUPS.flatMap(g => g.items.map(i => i.label.toLowerCase().trim()));
      const uniqueLabels = new Set(allLabels);
      expect(uniqueLabels.size).toBe(allLabels.length);
    });

    it('has valid types and non-empty labels/helpText for every document preset', () => {
      STANDARD_DOCUMENT_REQUIREMENT_GROUPS.forEach(group => {
        expect(group.category).toBeTruthy();
        expect(group.items.length).toBeGreaterThan(0);
        group.items.forEach(item => {
          expect(item.id).toBeTruthy();
          expect(item.label.trim().length).toBeGreaterThan(2);
          expect(item.helpText.trim().length).toBeGreaterThan(5);
          expect(['pdf', 'excel', 'image', 'text', 'any', 'coida_industry', 'datetime']).toContain(item.type);
        });
      });
    });

    it('contains distinct canonical CIPC documents', () => {
      const allLabels = STANDARD_DOCUMENT_REQUIREMENT_GROUPS.flatMap(g => g.items.map(i => i.label));
      expect(allLabels).toContain('CIPC Registration Certificate (COR14.3 / MOI)');
      expect(allLabels).toContain('Non-Profit Company Registration Documents (COR14.3 / NPC MOI)');
      expect(allLabels).toContain('CIPC Director Change Documents (COR39 / Resignation / Resolution)');
      expect(allLabels).toContain('CIPC Beneficial Ownership Register & Securities Register');
    });

    it('does not duplicate SARS eFiling credentials in other categories', () => {
      const otherCategories = STANDARD_DOCUMENT_REQUIREMENT_GROUPS.filter(g => g.category !== 'SARS eFiling Login & OTP Pack');
      const otherLabels = otherCategories.flatMap(g => g.items.map(i => i.label));
      expect(otherLabels).not.toContain('SARS eFiling Username');
      expect(otherLabels).not.toContain('SARS eFiling Password');
    });
  });

  describe('STANDARD_PREREQUISITE_GROUPS', () => {
    it('has unique IDs across all prerequisite groups', () => {
      const allIds = STANDARD_PREREQUISITE_GROUPS.flatMap(g => g.items.map(i => i.id));
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('has unique titles across all prerequisite groups', () => {
      const allTitles = STANDARD_PREREQUISITE_GROUPS.flatMap(g => g.items.map(i => i.title.toLowerCase().trim()));
      const uniqueTitles = new Set(allTitles);
      expect(uniqueTitles.size).toBe(allTitles.length);
    });
  });

  describe('isCoveredByStandardDocumentPreset', () => {
    it('detects and covers all 16 historical variations of COR14.3', () => {
      const cor143Variations = [
        'Company registration documents (e.g., COR14.3',
        'Certified copy of company registration documents (e.g., CIPC CoR14.3)',
        'COR14.3 (Company registration document) (e.g., CIPC COR14.3',
        'Company registration certificate (COR14.3)',
        'Company Registration Documents (COR14.3).',
        'Company registration documents (e.g., CIPC documents)',
        'Company registration number or COR14.3 certificate',
        'Company Registration Certificate',
        'CoR14.3',
        'COR14.3',
        'COR 14.3',
        'Company registration certificate (COR14.3) for an NPC',
        'Company Registration Document (COR14.3)',
        'CIPC Registration Documents',
        'CIPC COR14.3 Certificate',
        'CIPC Registration Certificate',
        'CIPC Documents (COR14.3 / MOI)',
        'Certified copy of company registration documents',
      ];

      cor143Variations.forEach(variation => {
        expect(isCoveredByStandardDocumentPreset(variation)).toBe(true);
      });
    });

    it('detects and covers variations of Director IDs and Passports', () => {
      const idVariations = [
        'ID copy of each shareholder',
        'Certified ID copies of all directors/members',
        'ID copies of all directors as per company registration certificate ',
        'Certified ID / passport copies of all shareholders/owners',
        'Certified copy of the ID (both sides of a smart card)',
        'Identity documents of directors or members',
      ];

      idVariations.forEach(v => {
        expect(isCoveredByStandardDocumentPreset(v)).toBe(true);
      });
    });

    it('detects and covers Proof of Address variations', () => {
      const addressVariations = [
        'Proof of business address (not older than 3 months)',
        'Proof of address',
        'Proof of residential address',
        'Proof of address (utility bill)',
      ];

      addressVariations.forEach(v => {
        expect(isCoveredByStandardDocumentPreset(v)).toBe(true);
      });
    });

    it('detects and covers Bank Confirmation and Statement variations', () => {
      const bankingVariations = [
        'Bank confirmation letter',
        'Bank Confirmation Letter (Stamped)',
        'Stamped bank letter',
        'Bank account confirmation letter',
        'Bank statements for the full financial year',
        'Bank statements and reconciliations',
        '12-Month Bank Statements',
        'Consecutive 6 to 12 months official bank statements',
      ];

      bankingVariations.forEach(v => {
        expect(isCoveredByStandardDocumentPreset(v)).toBe(true);
      });
    });

    it('detects and covers non-document form questions or placeholders', () => {
      const nonDocs = [
        'Company Name',
        'Turnover amount for year to be filed',
        'Annual turnover for the last financial year (Rand)',
        'What percentage of the company is black owned?',
        'What percentage of the company is white owned?',
        'Individuals name',
        'Relevant tax year details for which the return is required',
        'Confirmation that the company had no taxable income or business activity for the specific tax year',
      ];

      nonDocs.forEach(v => {
        expect(isCoveredByStandardDocumentPreset(v)).toBe(true);
      });
    });

    it('allows genuine custom non-standard statutory documents to pass through', () => {
      const customDocs = [
        'National Credit Regulator (NCR) Form 2 Application',
        'PSIRA Security Service Provider Certificate',
        'Liquor Authority Compliance Certificate',
        'Estate Agency Affairs Board (EAAB) Fidelity Fund Certificate',
        'National Regulator for Compulsory Specifications (NRCS) Letter of Authority',
      ];

      customDocs.forEach(v => {
        expect(isCoveredByStandardDocumentPreset(v)).toBe(false);
      });
    });
  });

  describe('extractUniqueDocumentsFromServices', () => {
    it('filters out standard document variations and only preserves genuine custom items in Title Case', () => {
      const mockServices = [
        {
          informationToProvide: [
            { label: 'Company registration documents (e.g., COR14.3', type: 'pdf' },
            { label: 'Certified copy of company registration documents (e.g., CIPC CoR14.3)', type: 'pdf' },
            { label: 'COR14.3 (Company registration document) (e.g., CIPC COR14.3', type: 'pdf' },
            { label: 'ID copy of each shareholder', type: 'pdf' },
            { label: 'Bank confirmation letter', type: 'pdf' },
            { label: 'national credit regulator (ncr) form 2 application', type: 'pdf', helpText: 'Signed NCR Form 2' },
          ],
        },
        {
          informationToProvide: [
            { label: 'COR 14.3', type: 'pdf' },
            { label: 'Proof of residential address', type: 'pdf' },
            { label: 'PSIRA security service provider certificate', type: 'pdf', helpText: 'Current PSIRA cert' },
          ],
        },
      ];

      const extracted = extractUniqueDocumentsFromServices(mockServices);

      // COR14.3, ID copy, Bank letter, Proof of address should be filtered out
      expect(extracted.length).toBe(2);
      expect(extracted.map(d => d.label)).toEqual([
        'National Credit Regulator (NCR) Form 2 Application',
        'PSIRA Security Service Provider Certificate',
      ]);
    });
  });
});

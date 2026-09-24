import { describe, it, expect, vi } from 'vitest';
import { buildPracticeAllocationRulesWorkbook, exportPracticeAllocationRulesToExcel } from '../export-practice-allocation-rules';
import { AllocationRule } from '../types';
import * as XLSX from 'xlsx-js-style';

describe('Export Practice Allocation Rules to Excel', () => {
  const mockRules: AllocationRule[] = [
    {
      id: 'rule_fuel_1',
      description: 'Fuel & Service Station Purchases',
      keywords: ['ENGEN', 'SHELL', 'TOTAL', 'CALTEX'],
      accountId: '3000-033',
      vatType: 'standard_rated_purchases',
      category: 'fuel_motor_expenses',
      categoryLabel: 'Fuel & Motor',
      type: 'hard',
      scope: 'global',
    } as any,
    {
      id: 'rule_telecom_1',
      description: 'Telecoms & Internet',
      keywords: ['VODACOM', 'MTN', 'TELKOM'],
      accountId: '3000-008',
      vatType: 'standard_rated_purchases',
      category: 'telecoms_internet',
      type: 'hard',
      scope: 'global',
    } as any,
  ];

  it('builds a 2-sheet workbook with Practice Allocation Rules and Chart of Accounts Reference', () => {
    const wb = buildPracticeAllocationRulesWorkbook(mockRules);

    expect(wb.SheetNames).toContain('Practice Allocation Rules');
    expect(wb.SheetNames).toContain('Chart of Accounts Reference');

    const rulesSheet = wb.Sheets['Practice Allocation Rules'];
    expect(rulesSheet).toBeDefined();

    // Check header row content
    const sheetData = XLSX.utils.sheet_to_json<any[]>(rulesSheet, { header: 1 });
    expect(sheetData[0][0]).toBe('PRACTICE ALLOCATION RULES DATABASE');
    
    // Row index 4 is the headers
    const headers = sheetData[4];
    expect(headers).toContain('Rule Description');
    expect(headers).toContain('Keywords');
    expect(headers).toContain('Keyword Count');
    expect(headers).toContain('Account Code');
    expect(headers).toContain('Account Name');
    expect(headers).toContain('VAT Treatment');

    // Row index 5 is first rule
    const firstRow = sheetData[5];
    expect(firstRow[0]).toBe('Fuel & Service Station Purchases');
    expect(firstRow[1]).toBe('Fuel & Motor');
    expect(firstRow[2]).toBe('ENGEN, SHELL, TOTAL, CALTEX');
    expect(firstRow[3]).toBe(4);
    expect(firstRow[4]).toBe('3000-033');
    expect(firstRow[5]).toBe('Fuel');
  });

  it('executes export and invokes write function with expected filename', () => {
    const writeFn = vi.fn();

    const result = exportPracticeAllocationRulesToExcel(mockRules, {
      filename: 'Test_Rules.xlsx',
      writeFn,
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.filename).toBe('Test_Rules.xlsx');
    expect(writeFn).toHaveBeenCalledWith(expect.anything(), 'Test_Rules.xlsx');
  });
});

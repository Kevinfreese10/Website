import * as XLSX from 'xlsx-js-style';
import { AllocationRule } from './types';
import { chartOfAccounts as defaultChartOfAccounts } from './chart-of-accounts';
import { allVatTypes } from './vat-types';

export interface ExportRulesOptions {
  filename?: string;
  categoryLabelMap?: Record<string, string>;
  writeFn?: (wb: XLSX.WorkBook, filename: string) => void;
}

export function buildPracticeAllocationRulesWorkbook(
  rules: AllocationRule[],
  options?: ExportRulesOptions
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const getAccountInfo = (accountId: string) => {
    const acc = defaultChartOfAccounts.find(
      (a) => a.id === accountId || a.accountNumber === accountId
    );
    return {
      code: acc?.accountNumber || acc?.id || accountId,
      name: acc?.description || acc?.name || 'Unassigned',
      full: acc ? `${acc.accountNumber || acc.id} - ${acc.description || acc.name}` : accountId,
    };
  };

  const getVatLabel = (vatName?: string) => {
    if (!vatName) return 'No VAT';
    const vt = allVatTypes.find((v) => v.name === vatName);
    return vt ? vt.label : vatName;
  };

  // Sheet 1: Practice Allocation Rules
  const rows: any[][] = [];

  // Header Title Block
  rows.push(['PRACTICE ALLOCATION RULES DATABASE']);
  rows.push(['Exported Date', new Date().toLocaleDateString('en-ZA') + ' ' + new Date().toLocaleTimeString('en-ZA')]);
  rows.push(['Total Rules', rules.length]);
  rows.push([]);

  // Column Headers
  const headers = [
    'Rule Description',
    'Category',
    'Keywords',
    'Keyword Count',
    'Account Code',
    'Account Name',
    'Allocate To (Full Label)',
    'VAT Code',
    'VAT Treatment',
    'Rule Type',
    'Scope'
  ];
  rows.push(headers);

  // Data rows
  rules.forEach((rule) => {
    const acc = getAccountInfo(rule.accountId);
    const keywords = (rule.keywords || []).map((k) => k.trim()).filter(Boolean);
    const catLabel =
      (rule as any).categoryLabel ||
      (options?.categoryLabelMap && (rule as any).category
        ? options.categoryLabelMap[(rule as any).category]
        : (rule as any).category || 'General');

    rows.push([
      rule.description || acc.name,
      catLabel,
      keywords.join(', '),
      keywords.length,
      acc.code,
      acc.name,
      acc.full,
      rule.vatType || 'no_vat',
      getVatLabel(rule.vatType),
      rule.type ? rule.type.toUpperCase() : 'HARD',
      rule.scope ? rule.scope.toUpperCase() : 'GLOBAL'
    ]);
  });

  const wsRules = XLSX.utils.aoa_to_sheet(rows);

  // Column Widths
  wsRules['!cols'] = [
    { wch: 38 }, // Rule Description
    { wch: 24 }, // Category
    { wch: 55 }, // Keywords
    { wch: 15 }, // Keyword Count
    { wch: 15 }, // Account Code
    { wch: 32 }, // Account Name
    { wch: 38 }, // Allocate To (Full Label)
    { wch: 25 }, // VAT Code
    { wch: 32 }, // VAT Treatment
    { wch: 14 }, // Rule Type
    { wch: 16 }, // Scope
  ];

  // Styling
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
    fill: { fgColor: { rgb: '1E293B' } }, // Slate 800
    alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
    border: {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'medium', color: { rgb: '0F172A' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } },
    },
  };

  const titleStyle = {
    font: { bold: true, color: { rgb: '0F172A' }, sz: 14 },
    alignment: { horizontal: 'left', vertical: 'center' },
  };

  const metaStyle = {
    font: { italic: true, color: { rgb: '64748B' }, sz: 10 },
  };

  // Apply styling to title & meta rows
  if (wsRules['A1']) wsRules['A1'].s = titleStyle;
  if (wsRules['A2']) wsRules['A2'].s = metaStyle;
  if (wsRules['B2']) wsRules['B2'].s = metaStyle;
  if (wsRules['A3']) wsRules['A3'].s = metaStyle;
  if (wsRules['B3']) wsRules['B3'].s = { font: { bold: true, sz: 10 } };

  // Apply styling to Table Headers (Row 5, 0-indexed row 4)
  const headerRowIdx = 4;
  headers.forEach((_, colIdx) => {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIdx, c: colIdx });
    if (wsRules[cellRef]) {
      wsRules[cellRef].s = headerStyle;
    }
  });

  XLSX.utils.book_append_sheet(wb, wsRules, 'Practice Allocation Rules');

  // Sheet 2: Chart of Accounts Reference
  const coaRows: any[][] = [
    ['STANDARD CHART OF ACCOUNTS REFERENCE'],
    [],
    ['Account Code', 'Account Name', 'Financial Statement Section', 'FS Category / Group', 'Default VAT']
  ];

  defaultChartOfAccounts.forEach((acc) => {
    coaRows.push([
      acc.accountNumber || acc.id,
      acc.description || acc.name,
      acc.section || '',
      acc.category || '',
      getVatLabel((acc as any).defaultVatType)
    ]);
  });

  const wsCoa = XLSX.utils.aoa_to_sheet(coaRows);
  wsCoa['!cols'] = [
    { wch: 15 },
    { wch: 35 },
    { wch: 25 },
    { wch: 30 },
    { wch: 30 },
  ];

  const coaHeaderRowIdx = 2;
  ['A', 'B', 'C', 'D', 'E'].forEach((col) => {
    const ref = `${col}${coaHeaderRowIdx + 1}`;
    if (wsCoa[ref]) wsCoa[ref].s = headerStyle;
  });

  XLSX.utils.book_append_sheet(wb, wsCoa, 'Chart of Accounts Reference');

  return wb;
}

export function exportPracticeAllocationRulesToExcel(
  rules: AllocationRule[],
  options?: ExportRulesOptions
): { success: boolean; count: number; filename: string } {
  const filename =
    options?.filename ||
    `Practice_Allocation_Rules_${new Date().toISOString().split('T')[0]}.xlsx`;

  const wb = buildPracticeAllocationRulesWorkbook(rules, options);
  const write = options?.writeFn || XLSX.writeFile;
  write(wb, filename);

  return {
    success: true,
    count: rules.length,
    filename,
  };
}

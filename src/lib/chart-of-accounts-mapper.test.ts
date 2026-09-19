import { describe, it, expect } from 'vitest';
import { resolveAccountForCategory } from './chart-of-accounts-mapper';
import { MASTER_ALLOCATION_RULES } from './master-allocation-rules';
import { ChartOfAccount } from './types';

describe('Chart of Accounts Semantic Mapper', () => {
  const sampleCOA: any[] = [
    { id: '1', accountNumber: '1000', accountName: 'Main Bank Account', description: 'Main Bank Account', accountType: 'Bank', isActive: true },
    { id: '2', accountNumber: '3200', accountName: 'Bank Charges & Fees', description: 'Bank Charges & Fees', accountType: 'Expense', isActive: true },
    { id: '3', accountNumber: '6100', accountName: 'Cell Phone & Internet', description: 'Cell Phone & Internet', accountType: 'Expense', isActive: true },
    { id: '4', accountNumber: '6250', accountName: 'Fuel and Oil', description: 'Fuel and Oil', accountType: 'Expense', isActive: true },
    { id: '5', accountNumber: '6300', accountName: 'Electricity and Water', description: 'Electricity and Water', accountType: 'Expense', isActive: true },
    { id: '6', accountNumber: '6400', accountName: 'Repairs and Maintenance', description: 'Repairs and Maintenance', accountType: 'Expense', isActive: true },
    { id: '7', accountNumber: '6500', accountName: 'Software Subscriptions', description: 'Software Subscriptions', accountType: 'Expense', isActive: true },
    { id: '8', accountNumber: '6600', accountName: 'Courier and Freight', description: 'Courier and Freight', accountType: 'Expense', isActive: true },
    { id: '9', accountNumber: '6700', accountName: 'Client Entertainment', description: 'Client Entertainment', accountType: 'Expense', isActive: true },
    { id: '10', accountNumber: '9999', accountName: 'General Expenses', description: 'General Expenses', accountType: 'Expense', isActive: true },
  ];

  it('resolves exact account number matches', () => {
    const bankRule = MASTER_ALLOCATION_RULES.find(r => r.id === 'master_bank_fnb_fees')!;
    const res = resolveAccountForCategory(sampleCOA, bankRule);
    expect(res).not.toBeNull();
    expect(res?.accountNumber).toBe('3200');
  });

  it('semantically resolves telecom accounts with non-standard codes', () => {
    const vodacomRule = MASTER_ALLOCATION_RULES.find(r => r.id === 'master_tel_vodacom')!;
    // Default is 4500, but client has 6100 "Cell Phone & Internet"
    const res = resolveAccountForCategory(sampleCOA, vodacomRule);
    expect(res).not.toBeNull();
    expect(res?.accountNumber).toBe('6100');
    expect(res?.accountName).toBe('Cell Phone & Internet');
  });

  it('semantically resolves fuel accounts with non-standard codes', () => {
    const shellRule = MASTER_ALLOCATION_RULES.find(r => r.id === 'master_fuel_shell')!;
    // Default is 3800, but client has 6250 "Fuel and Oil"
    const res = resolveAccountForCategory(sampleCOA, shellRule);
    expect(res).not.toBeNull();
    expect(res?.accountNumber).toBe('6250');
    expect(res?.accountName).toBe('Fuel and Oil');
  });

  it('semantically resolves software subscriptions', () => {
    const googleRule = MASTER_ALLOCATION_RULES.find(r => r.id === 'master_it_google')!;
    const res = resolveAccountForCategory(sampleCOA, googleRule);
    expect(res).not.toBeNull();
    expect(res?.accountNumber).toBe('6500');
    expect(res?.accountName).toBe('Software Subscriptions');
  });

  it('semantically resolves entertainment and client meals', () => {
    const uberEatsRule = MASTER_ALLOCATION_RULES.find(r => r.id === 'master_ent_ubereats')!;
    const res = resolveAccountForCategory(sampleCOA, uberEatsRule);
    expect(res).not.toBeNull();
    expect(res?.accountNumber).toBe('6700');
    expect(res?.accountName).toBe('Client Entertainment');
  });

  it('aligns legacy 4-digit codes to standard 7-digit Chart of Accounts', async () => {
    const { chartOfAccounts: masterCoA } = await import('./chart-of-accounts');
    const { alignRuleAccountId, alignRulesToChartOfAccounts } = await import('./chart-of-accounts-mapper');

    // Single account alignment
    expect(alignRuleAccountId('4500', masterCoA)).toBe('3000-051'); // Telephone & Internet
    expect(alignRuleAccountId('3200', masterCoA)).toBe('3000-004'); // Bank Charges
    expect(alignRuleAccountId('3800', masterCoA)).toBe('3000-033'); // Fuel
    expect(alignRuleAccountId('2150', masterCoA)).toBe('7000-008'); // VAT Control
    expect(alignRuleAccountId('8500-000', masterCoA)).toBe('7000-008'); // VAT Control

    // Batch alignment
    const unalignedRules = [
      { id: 'r1', description: 'Vodacom Cell', accountId: '4500' },
      { id: 'r2', description: 'FNB Fees', accountId: '3200' },
      { id: 'r3', description: 'Already Valid', accountId: '3000-000' },
    ];
    const aligned = alignRulesToChartOfAccounts(unalignedRules, masterCoA);
    expect(aligned[0].accountId).toBe('3000-051');
    expect(aligned[1].accountId).toBe('3000-004');
    expect(aligned[2].accountId).toBe('3000-000');
  });

  it('guarantees 100% of MASTER_ALLOCATION_RULES align to master Chart of Accounts', async () => {
    const { chartOfAccounts: masterCoA } = await import('./chart-of-accounts');
    const masterAccountIds = new Set(masterCoA.map(a => a.id));

    MASTER_ALLOCATION_RULES.forEach(rule => {
      expect(masterAccountIds.has(rule.defaultAccountCode)).toBe(true);
    });
  });
});

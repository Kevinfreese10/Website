import * as fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

async function getAllPagesText(filePath: string): Promise<string> {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = getDocument({ data });
  const doc = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    const content = await pg.getTextContent();
    const sorted = [...content.items]
      .map((item: any) => ({ str: item.str, x: item.transform?.[4] ?? 0, y: item.transform?.[5] ?? 0 }))
      .sort((a, b) => b.y - a.y || a.x - b.x);
    let lastY = -999;
    for (const tok of sorted) {
      if (Math.abs(tok.y - lastY) > 3) { text += '\n'; lastY = tok.y; }
      if (tok.str.trim()) text += tok.str + '  ';
    }
  }
  return text;
}

interface CreditTx {
  date: string;
  description: string;
  amount: number;
  category: string;
}

function categorize(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes('rtc credit')) return 'RTC Credit (3rd Party)';
  if (d.includes('payshap credit')) return 'PayShap Credit (3rd Party)';
  if (d.includes('adt cash deposit')) return 'Cash Deposit (ATM/Branch)';
  if (d.includes('fnb app payment from glowgrid') || d.includes('salary glowgrid') || d.includes('payment from glowgrid')) return 'Business Payment - Glowgrid';
  if (d.includes('fnb app payment from alby')) return 'Self Transfer - Alby Own Account';
  if (d.includes('fnb app transfer from payment')) return 'FNB Internal Transfer From (Possibly Self)';
  if (d.includes('wongaloans')) return 'Loan Receipt - Wonga';
  if (d.includes('confidentdev')) return 'Business Payment - Confident Dev';
  if (d.includes('dr interest rebate') || d.includes('interest rebate')) return 'Bank Interest Rebate';
  if (d.includes('byc debit') || d.includes('byc credit')) return 'Bank Yield Credit';
  if (d.includes('69.00') || d.includes('fee') || d.includes('charges')) return 'Fee Reversal / Bank Credit';
  return 'Other Credit';
}

async function analyzeStatement(filePath: string, label: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`STATEMENT: ${label}`);
  console.log(`${'='.repeat(80)}`);

  const text = await getAllPagesText(filePath);
  const lines = text.split('\n');

  const credits: CreditTx[] = [];

  // Pattern: DATE  DESCRIPTION  AMOUNT  Cr  BALANCE
  const crLineRegex = /^([\d]{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))\s+(.*?)\s+([\d]{1,3}(?:,\d{3})*\.\d{2})\s+Cr\s/;

  for (const line of lines) {
    const m = line.match(crLineRegex);
    if (!m) continue;
    const date = m[1].trim();
    const desc = m[2].trim();
    const amount = parseFloat(m[3].replace(/,/g, ''));
    if (amount < 1) continue;
    const category = categorize(desc);
    credits.push({ date, description: desc, amount, category });
  }

  // Group by category
  const grouped: Record<string, { count: number; total: number; txs: CreditTx[] }> = {};
  for (const cr of credits) {
    if (!grouped[cr.category]) grouped[cr.category] = { count: 0, total: 0, txs: [] };
    grouped[cr.category].count++;
    grouped[cr.category].total += cr.amount;
    grouped[cr.category].txs.push(cr);
  }

  let stmtTotal = 0;
  let genuineIncome = 0;
  let suspectTransfers = 0;

  for (const [cat, data] of Object.entries(grouped).sort((a, b) => b[1].total - a[1].total)) {
    const isTransfer = cat.includes('Transfer') || cat.includes('Self') || cat.includes('Loan') || cat.includes('Interest') || cat.includes('Fee') || cat.includes('Bank Yield');
    const flag = isTransfer ? '⚠️  POSSIBLE TRANSFER/EXCLUDE' : '✅ LIKELY GENUINE INCOME';
    console.log(`\n  ${flag}`);
    console.log(`  Category: ${cat}`);
    console.log(`  Transactions: ${data.count}   Total: R ${data.total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    for (const t of data.txs) {
      console.log(`    ${t.date.padEnd(6)} | ${t.description.substring(0, 55).padEnd(55)} | R ${t.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    }
    stmtTotal += data.total;
    if (isTransfer) suspectTransfers += data.total;
    else genuineIncome += data.total;
  }

  console.log(`\n  ─────────────────────────────────────────────────────────────────`);
  console.log(`  STATEMENT CREDIT TOTAL (bank-reported):  R ${stmtTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log(`  ✅ LIKELY GENUINE INCOME (excl. transfers): R ${genuineIncome.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log(`  ⚠️  SUSPECT TRANSFERS/EXCLUSIONS:           R ${suspectTransfers.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);

  return { stmtTotal, genuineIncome, suspectTransfers };
}

async function main() {
  const r1 = await analyzeStatement('scratch/order_10143_audit/06_June.pdf', 'Statement #42 — 06 May to 06 Jun 2026');
  const r2 = await analyzeStatement('scratch/order_10143_audit/06_July.pdf', 'Statement #43 — 06 Jun to 06 Jul 2026');
  const r3 = await analyzeStatement('scratch/order_10143_audit/06_August.pdf', 'Statement #44 — 06 Jul to 06 Aug 2026');

  const grandTotal = r1.stmtTotal + r2.stmtTotal + r3.stmtTotal;
  const grandGenuine = r1.genuineIncome + r2.genuineIncome + r3.genuineIncome;
  const grandSuspect = r1.suspectTransfers + r2.suspectTransfers + r3.suspectTransfers;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 GRAND SUMMARY — ALL 3 STATEMENTS`);
  console.log(`${'='.repeat(80)}`);
  console.log(`  Bank-Reported Total Credits:          R ${grandTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log(`  ✅ Likely Genuine Income (3 months):  R ${grandGenuine.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log(`  ⚠️  Possible Transfers to Exclude:    R ${grandSuspect.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log(`\n  Average Monthly (Bank Total):         R ${(grandTotal / 3).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log(`  Average Monthly (Genuine Only):       R ${(grandGenuine / 3).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log(`\n  Applicant Declared Monthly Drawings:  R 235,000.00`);
}

main().catch(console.error);

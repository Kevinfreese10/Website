import * as fs from 'fs';
import * as path from 'path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractTextFromPdf(filePath: string): Promise<string> {
  const absPath = path.resolve(filePath);
  const data = new Uint8Array(fs.readFileSync(absPath));
  const loadingTask = getDocument({ data });
  const doc = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    const content = await pg.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(' ');
    fullText += ' ' + pageText;
  }
  return fullText;
}

async function analyzeStatement(filePath: string, label: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`STATEMENT: ${label}`);
  console.log(`${'='.repeat(80)}`);

  const text = await extractTextFromPdf(filePath);
  
  // RMB Bank statement format has amounts in the form:
  //   AMOUNT  "Cr"  BALANCE    (for credits)
  //   AMOUNT  BALANCE           (for debits — no "Cr" marker)
  // We need to find all occurrences of "(amount)  Cr  (balance)" = credit
  // and "(amount)  (balance)" without Cr = debit
  
  // Split into tokens around amounts
  // Strategy: find all "Cr" markers. The number immediately preceding each "Cr" is a credit.
  // The number immediately after "Cr" is the running balance (not an inflow).

  const creditAmounts: number[] = [];
  const debitAmounts: number[] = [];
  
  // Find credits: number followed by "Cr"
  const crRegex = /([\d,]+\.\d{2})\s+Cr\b/g;
  let m;
  while ((m = crRegex.exec(text)) !== null) {
    creditAmounts.push(parseFloat(m[1].replace(/,/g, '')));
  }

  // Find debits: number NOT followed by "Cr" - harder. 
  // Better: scan all amounts + context
  // A debit line looks like: Description  AMOUNT  BALANCE (no "Cr")
  // A credit line looks like: Description  AMOUNT  Cr  BALANCE
  
  // Approach: split text by lines (spaces to simulate)
  // Find every pattern:  (description words)  (amount)  [optional Cr]  (balance)
  const lineRegex = /([A-Za-z].+?)\s+([\d]{1,3}(?:,\d{3})*\.\d{2})\s+(Cr\s+)?([\d]{1,3}(?:,\d{3})*\.\d{2})/g;
  
  const allTx: { desc: string; amount: number; isCr: boolean }[] = [];
  while ((m = lineRegex.exec(text)) !== null) {
    const desc = m[1].trim();
    const amount = parseFloat(m[2].replace(/,/g, ''));
    const isCr = !!m[3];
    // Filter out very small amounts (bank charges, etc.) and closing balance lines
    if (amount < 1 || desc.toLowerCase().includes('closing') || desc.toLowerCase().includes('opening') || desc.toLowerCase().includes('balance') || desc.toLowerCase().includes('page')) continue;
    allTx.push({ desc, amount, isCr });
  }

  const credits = allTx.filter(t => t.isCr);
  const debits = allTx.filter(t => !t.isCr);
  const totalCredits = creditAmounts.reduce((s, a) => s + a, 0);
  
  console.log(`\n✅ CREDIT INFLOWS — via "Cr" marker (${creditAmounts.length} transactions):`);
  
  // Re-extract credits with description
  const crWithDescRegex = /([A-Za-z][^0-9\n]{3,50}?)\s+([\d]{1,3}(?:,\d{3})*\.\d{2})\s+Cr\b/g;
  const crTxs: { desc: string; amount: number }[] = [];
  while ((m = crWithDescRegex.exec(text)) !== null) {
    const desc = m[1].trim();
    const amount = parseFloat(m[2].replace(/,/g, ''));
    if (amount < 1) continue;
    crTxs.push({ desc, amount });
  }

  crTxs.forEach(t => {
    console.log(`   ${t.desc.substring(0, 50).padEnd(50)} CR  R ${t.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  });

  const crTotal = crTxs.reduce((s, t) => s + t.amount, 0);
  console.log(`\n   TOTAL CREDIT INFLOWS:  R ${crTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} (${crTxs.length} transactions)`);

  return crTotal;
}

async function main() {
  const r1 = await analyzeStatement('scratch/order_10143_audit/06_June.pdf', 'Statement #42 — 06 May 2026 to 06 Jun 2026');
  const r2 = await analyzeStatement('scratch/order_10143_audit/06_July.pdf', 'Statement #43 — 06 Jun 2026 to 06 Jul 2026');
  const r3 = await analyzeStatement('scratch/order_10143_audit/06_August.pdf', 'Statement #44 — 06 Jul 2026 to 06 Aug 2026');

  const grandTotal = r1 + r2 + r3;
  const avg = grandTotal / 3;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 VERIFIED GRAND SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`   Statement #42 (May-Jun):   R ${r1.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log(`   Statement #43 (Jun-Jul):   R ${r2.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log(`   Statement #44 (Jul-Aug):   R ${r3.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log(`\n   3-Month Total Inflows:     R ${grandTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log(`   Average Monthly Inflow:    R ${avg.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log(`\n   LETTER STATES:             R 1,120,608.73 total / R 373,536.24 avg`);
  console.log(`   MATCH:                     ${Math.abs(grandTotal - 1120608.73) < 1 ? '✅ CONFIRMED' : `❌ DISCREPANCY of R ${Math.abs(grandTotal - 1120608.73).toFixed(2)}`}`);
}

main().catch(console.error);

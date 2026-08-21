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

async function main() {
  // July statement (43) - find its summary on any page
  const text = await getAllPagesText('scratch/order_10143_audit/06_July.pdf');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/turnover|credit transactions|debit transactions|closing balance/i.test(lines[i])) {
      console.log(lines[i].trim());
    }
  }
}

main().catch(console.error);

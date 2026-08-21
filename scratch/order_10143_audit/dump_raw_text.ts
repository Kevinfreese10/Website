import * as fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

async function dumpRawText(filePath: string, label: string) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = getDocument({ data });
  const doc = await loadingTask.promise;
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`RAW TEXT: ${label} (${doc.numPages} pages)`);
  console.log(`${'='.repeat(80)}`);

  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    const content = await pg.getTextContent();
    const tokens = content.items.map((item: any) => ({ str: item.str, x: (item as any).transform?.[4] ?? 0, y: (item as any).transform?.[5] ?? 0 }));
    
    console.log(`\n--- Page ${i} ---`);
    // Print tokens in reading order (roughly by Y descending, X ascending)
    const sorted = [...tokens].sort((a, b) => b.y - a.y || a.x - b.x);
    let lastY = -999;
    for (const tok of sorted) {
      if (Math.abs(tok.y - lastY) > 3) {
        process.stdout.write('\n');
        lastY = tok.y;
      }
      if (tok.str.trim()) process.stdout.write(tok.str + '  ');
    }
    console.log('');
  }
}

async function main() {
  await dumpRawText('scratch/order_10143_audit/06_June.pdf', 'Statement #42 May-Jun');
}

main().catch(console.error);

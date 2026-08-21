import * as fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

async function dumpPdf(filePath: string, label: string) {
  if (!fs.existsSync(filePath)) {
    console.log(`Not found: ${filePath}`);
    return;
  }
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = getDocument({ data });
  const doc = await loadingTask.promise;
  console.log(`\n======================================================`);
  console.log(`FILE: ${label} (${doc.numPages} pages)`);
  console.log(`======================================================`);
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    const content = await pg.getTextContent();
    const sorted = [...content.items]
      .map((item: any) => ({ str: item.str, x: item.transform?.[4] ?? 0, y: item.transform?.[5] ?? 0 }))
      .sort((a, b) => b.y - a.y || a.x - b.x);
    let lastY = -999;
    console.log(`\n--- Page ${i} ---`);
    for (const tok of sorted) {
      if (Math.abs(tok.y - lastY) > 3) { process.stdout.write('\n'); lastY = tok.y; }
      if (tok.str.trim()) process.stdout.write(tok.str + '  ');
    }
    console.log('');
  }
}

async function main() {
  await dumpPdf(
    'C:\\Users\\kev\\OneDrive\\Documents\\Power of Attorney - Kevin Freese - Super Valet Paarl.pdf',
    'Power of Attorney - Super Valet Paarl'
  );
  await dumpPdf(
    'C:\\Users\\kev\\OneDrive\\Documents\\CF-1B Form Application for Change of Nature of Business_ORIGINAL_BACKUP.pdf',
    'CF-1B ORIGINAL BACKUP'
  );
}

main().catch(console.error);

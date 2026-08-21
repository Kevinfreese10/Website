import * as fs from 'fs';
import * as path from 'path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

async function inspectTemplate(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.log(`File does not exist at: ${filePath}`);
    return;
  }

  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = getDocument({ data });
  const doc = await loadingTask.promise;
  console.log(`Loaded template: ${filePath} (${doc.numPages} pages)`);

  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    const content = await pg.getTextContent();
    const sorted = [...content.items]
      .map((item: any) => ({ str: item.str, x: item.transform?.[4] ?? 0, y: item.transform?.[5] ?? 0 }))
      .sort((a, b) => b.y - a.y || a.x - b.x);
    let lastY = -999;
    console.log(`\n================== PAGE ${i} ==================`);
    for (const tok of sorted) {
      if (Math.abs(tok.y - lastY) > 3) { process.stdout.write('\n'); lastY = tok.y; }
      if (tok.str.trim()) process.stdout.write(tok.str + '  ');
    }
    console.log('');
  }
}

async function main() {
  const examplePath = 'C:\\Users\\kev\\OneDrive\\Documents\\CF-1B Form Application for Change of Nature of Business.pdf';
  await inspectTemplate(examplePath);
}

main().catch(console.error);

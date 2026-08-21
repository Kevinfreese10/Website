import * as fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractExactPositions(filePath: string) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = getDocument({ data });
  const doc = await loadingTask.promise;

  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    const content = await pg.getTextContent();
    console.log(`\n================== PAGE ${i} ==================`);
    const sorted = [...content.items]
      .map((item: any) => ({
        str: item.str,
        x: Math.round(item.transform?.[4] ?? 0),
        y: Math.round(item.transform?.[5] ?? 0),
      }))
      .sort((a, b) => b.y - a.y || a.x - b.x);

    for (const item of sorted) {
      if (item.str.trim()) {
        console.log(`x: ${item.x.toString().padStart(3)}, y: ${item.y.toString().padStart(3)} | "${item.str}"`);
      }
    }
  }
}

async function main() {
  await extractExactPositions('C:\\Users\\kev\\OneDrive\\Documents\\CF-1B Form Application for Change of Nature of Business.pdf');
}

main().catch(console.error);

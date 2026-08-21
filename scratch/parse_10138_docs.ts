import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';

async function parsePdf() {
  const url = "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/uploads%2FhCTT7dPOdbX3Y0ExvLWRwL6sujM2%2Forders%2F10138%2F1787237824919_0_DISCLOSR__014_.pdf?alt=media&token=be832cbc-c62c-458a-95b8-7bd964bc97ff";
  
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  
  const outDir = path.resolve('c:/myacc/scratch/order_10138_audit');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'COR14.3_Disclosure.pdf'), buffer);
  
  const parsed = await pdfParse(buffer);
  console.log('=== PDF TEXT CONTENT ===');
  console.log(parsed.text);
}

parsePdf().catch(console.error);

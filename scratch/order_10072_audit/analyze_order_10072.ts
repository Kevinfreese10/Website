import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import https from 'https';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function downloadFileWithRetry(url: string, dest: string, retries = 5): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            https.get(response.headers.location!, (res) => {
              res.pipe(file);
              file.on('finish', () => { file.close(); resolve(dest); });
            }).on('error', reject);
          } else {
            response.pipe(file);
            file.on('finish', () => { file.close(); resolve(dest); });
          }
        }).on('error', reject);
      });
      return dest;
    } catch (err) {
      console.warn(`Download attempt ${attempt} failed:`, (err as any)?.message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('Download failed');
}

async function extractPdfText(filePath: string): Promise<string> {
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
    text += `\n--- Page ${i} ---\n`;
    for (const tok of sorted) {
      if (Math.abs(tok.y - lastY) > 3) { text += '\n'; lastY = tok.y; }
      if (tok.str.trim()) text += tok.str + '  ';
    }
  }
  return text;
}

async function analyzeAllOrderDocs() {
  const dir = path.resolve('scratch/order_10072_audit');
  
  // Download Doc 1 (REQUEST.pdf)
  const doc1Url = 'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/uploads%2FCkgvnz5TvPO001lHa8P9ZW8twSf1%2Forders%2F10072%2F1787305267826_0_REQUEST.pdf?alt=media&token=4e815c82-e5b4-4c98-bb3a-f78fdb36083c';
  const doc1Path = path.join(dir, '1_Signed_Instruction_Letter.pdf');
  console.log('Downloading Doc 1 (Signed Instruction Letter)...');
  await downloadFileWithRetry(doc1Url, doc1Path);
  console.log('✓ Downloaded Doc 1');

  // Let's inspect each downloaded PDF in the directory
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
  for (const f of files) {
    const fullPath = path.join(dir, f);
    console.log(`\n======================================================`);
    console.log(`FILE: ${f}`);
    console.log(`======================================================`);
    try {
      const text = await extractPdfText(fullPath);
      console.log(text.substring(0, 3000));
    } catch (e) {
      console.log(`Error reading ${f}:`, (e as any)?.message);
    }
  }
}

analyzeAllOrderDocs().catch(console.error);

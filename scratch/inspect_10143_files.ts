import * as fs from 'fs';
import * as path from 'path';
import https from 'https';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function extractText(pdfPath: string) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  console.log(`\n=== ${pdfPath} (${doc.numPages} pages) ===`);
  for (let i = 1; i <= Math.min(doc.numPages, 3); i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map((item: any) => item.str);
    console.log(`--- Page ${i} ---`);
    console.log(strings.join(' ').substring(0, 500));
  }
}

async function run() {
  const outDir = path.resolve('scratch/order_10143_audit');

  const statements = [
    {
      name: '06_July.pdf',
      url: 'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/uploads%2FMBF4y9HOVlZH3BG7JRop9v8tG7M2%2Forders%2F10143%2Fnotes%2F1787298725542-06%20July.pdf?alt=media&token=688cd174-d9d1-4a15-9281-d74c064a44a8',
    },
    {
      name: '06_June.pdf',
      url: 'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/uploads%2FMBF4y9HOVlZH3BG7JRop9v8tG7M2%2Forders%2F10143%2Fnotes%2F1787298725543-06%20June.pdf?alt=media&token=ae6f332a-60f1-49ca-8213-a109a5a57f26',
    },
    {
      name: '06_August.pdf',
      url: 'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/uploads%2FMBF4y9HOVlZH3BG7JRop9v8tG7M2%2Forders%2F10143%2Fnotes%2F1787298725543-06%20August.pdf?alt=media&token=ec0a2760-a915-4d7d-9542-4dbe71e17b36',
    },
  ];

  for (const s of statements) {
    const dest = path.join(outDir, s.name);
    console.log(`Downloading ${s.name}...`);
    await downloadFile(s.url, dest);
    console.log(`✓ Saved ${s.name} (${fs.statSync(dest).size} bytes)`);
  }

  await extractText(path.join(outDir, 'doc_1.pdf'));
  await extractText(path.join(outDir, '06_June.pdf'));
  await extractText(path.join(outDir, '06_July.pdf'));
  await extractText(path.join(outDir, '06_August.pdf'));
}

run().catch(console.error);

import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function inspectShareCert() {
  const file = 'C:\\Users\\kev\\OneDrive\\Documents\\SHARE CERTIFICATE (Professional).pdf';
  const bytes = fs.readFileSync(file);
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPage(0);
  const { width, height } = page.getSize();
  console.log(`Share Certificate Dimensions: width=${width}, height=${height}`);
}

inspectShareCert().catch(console.error);

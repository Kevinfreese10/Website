import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PDFDocument } from 'pdf-lib';

// Load env variables
dotenv.config();

import { extractStatementMetadata } from '../src/ai/flows/extract-statement-metadata';
import { extractStatementData } from '../src/ai/flows/extract-statement-data';

async function testPdf(pdfPath: string) {
  console.log(`\n========================================`);
  console.log(`Testing PDF: ${pdfPath}`);
  console.log(`GEMINI_API_KEY exists: ${!!process.env.GEMINI_API_KEY}`);
  
  if (!fs.existsSync(pdfPath)) {
    console.error("File does not exist!");
    return;
  }

  try {
    const arrayBuffer = fs.readFileSync(pdfPath).buffer;
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    console.log("PDF loaded successfully! Page count:", pageCount);

    if (pageCount === 0) {
      console.error("PDF has no pages!");
      return;
    }

    // Extract page 1
    const firstPageDoc = await PDFDocument.create();
    const pages = await firstPageDoc.copyPages(pdfDoc, [0]);
    firstPageDoc.addPage(pages[0]);
    const firstPageBase64 = `data:application/pdf;base64,${await firstPageDoc.saveAsBase64()}`;

    console.log("Running extractStatementMetadata on Page 1...");
    const metadata = await extractStatementMetadata({ statementPdf: firstPageBase64 });
    console.log("Metadata Extracted successfully:");
    console.log(JSON.stringify(metadata, null, 2));

    console.log("\nRunning extractStatementData on first chunk (up to 5 pages)...");
    const chunkSize = Math.min(5, pageCount);
    const chunkDoc = await PDFDocument.create();
    const pagesToCopy = Array.from({ length: chunkSize }, (_, idx) => idx);
    const copiedPages = await chunkDoc.copyPages(pdfDoc, pagesToCopy);
    copiedPages.forEach(p => chunkDoc.addPage(p));
    const chunkBase64 = `data:application/pdf;base64,${await chunkDoc.saveAsBase64()}`;

    const data = await extractStatementData({ statementFile: chunkBase64 });
    console.log(`Extracted ${data.transactions?.length || 0} transactions:`);
    console.log(JSON.stringify(data.transactions?.slice(0, 5), null, 2));

  } catch (error: any) {
    console.error("Test failed with error:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
  }
}

async function run() {
  const targetPdf = 'C:/Users/kev/Downloads/04 13.pdf';
  await testPdf(targetPdf);
}

run();

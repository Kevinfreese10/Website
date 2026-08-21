const fs = require('fs');
const path = require('path');
const { PDFDocument } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function inspect10057() {
  const buf = fs.readFileSync('c:/myacc/scratch/sample_ncr_10057.pdf');
  const pdfDoc = await PDFDocument.load(buf);
  console.log('10057 PDF Page Count:', pdfDoc.getPageCount());
  
  const pages = pdfDoc.getPages();
  pages.forEach((p, idx) => {
    const { width, height } = p.getSize();
    console.log(`Page ${idx + 1}: ${width} x ${height}`);
  });
}

inspect10057().catch(console.error);

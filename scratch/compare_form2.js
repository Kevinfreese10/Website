const fs = require('fs');
const path = require('path');
const { PDFDocument } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function comparePdfs() {
  const form2Path = 'C:\\Users\\kev\\Downloads\\form 2.pdf';
  const form2Doc = await PDFDocument.load(fs.readFileSync(form2Path));
  console.log('form 2.pdf Page Count:', form2Doc.getPageCount());

  const sampleDoc = await PDFDocument.load(fs.readFileSync('c:/myacc/scratch/sample_ncr_10057.pdf'));
  console.log('sample_ncr_10057.pdf Page Count:', sampleDoc.getPageCount());
}

comparePdfs().catch(console.error);

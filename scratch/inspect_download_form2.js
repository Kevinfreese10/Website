const fs = require('fs');
const path = require('path');
const { PDFDocument } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function inspectForm2() {
  const filePath = 'C:\\Users\\kev\\Downloads\\form 2.pdf';
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }

  const buf = fs.readFileSync(filePath);
  console.log('File size:', buf.length, 'bytes');

  const pdfDoc = await PDFDocument.load(buf);
  console.log('Page Count:', pdfDoc.getPageCount());

  // Check if AcroForm fields exist
  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    console.log('Form Fields count:', fields.length);
    fields.forEach((f, idx) => {
      console.log(`Field #${idx + 1}: Name="${f.getName()}" | Type=${f.constructor.name}`);
    });
  } catch (e) {
    console.log('No interactive form fields:', e.message);
  }
}

inspectForm2().catch(console.error);

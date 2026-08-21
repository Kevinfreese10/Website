const fs = require('fs');
const path = require('path');
const { PDFDocument } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function inspectSample() {
  const buf = fs.readFileSync('c:/myacc/scratch/sample_ncr_form.pdf');
  const pdfDoc = await PDFDocument.load(buf);
  console.log('Sample PDF Page Count:', pdfDoc.getPageCount());

  // Check if form fields exist (acroform)
  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    console.log('Total Form Fields found:', fields.length);
    fields.forEach(f => {
      console.log(`Field Name: "${f.getName()}" | Type: ${f.constructor.name}`);
    });
  } catch (e) {
    console.log('No AcroForm fields:', e.message);
  }
}

inspectSample().catch(console.error);

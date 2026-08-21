const fs = require('fs');
const path = require('path');
const { PDFDocument } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function inspectAllFields() {
  const filePath = 'C:\\Users\\kev\\Downloads\\NCR_Form_2_Fillable.pdf';
  const buf = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(buf);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  for (let i = 0; i < 100; i++) {
    const field = fields[i];
    console.log(`[${i + 1}] "${field.getName()}" (${field.constructor.name})`);
  }
}

inspectAllFields().catch(console.error);

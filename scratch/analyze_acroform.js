// Try using pdf-lib to get the actual AcroForm fields / annotations
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function analyzeFormFields(pdfPath) {
  const buf = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
  
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  
  console.log(`Total form fields: ${fields.length}`);
  for (const field of fields) {
    const name = field.getName();
    const type = field.constructor.name;
    const widgets = field.acroField.getWidgets();
    for (const widget of widgets) {
      const rect = widget.getRectangle();
      console.log(`Field: "${name}" | Type: ${type} | x:${rect.x.toFixed(1)} y:${rect.y.toFixed(1)} w:${rect.width.toFixed(1)} h:${rect.height.toFixed(1)}`);
    }
  }
}

analyzeFormFields('C:\\Users\\kev\\Downloads\\form 2.pdf').catch(console.error);

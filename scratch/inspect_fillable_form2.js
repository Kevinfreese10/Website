const fs = require('fs');
const path = require('path');
const { PDFDocument } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function inspectFillablePdf() {
  const filePath = 'C:\\Users\\kev\\Downloads\\NCR_Form_2_Fillable.pdf';
  if (!fs.existsSync(filePath)) {
    console.error(`File does not exist: ${filePath}`);
    return;
  }

  const buf = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(buf);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log(`✅ Loaded ${filePath}`);
  console.log(`Total AcroForm fields: ${fields.length}\n`);

  fields.forEach((field, idx) => {
    const name = field.getName();
    const type = field.constructor.name;
    let details = '';
    try {
      if (type === 'PDFTextField') {
        details = `(Text) Value: "${field.getText() || ''}"`;
      } else if (type === 'PDFCheckBox') {
        details = `(CheckBox) Checked: ${field.isChecked()}`;
      } else if (type === 'PDFRadioGroup') {
        details = `(RadioGroup) Options: [${field.getOptions().join(', ')}], Selected: "${field.getSelected() || ''}"`;
      } else if (type === 'PDFDropdown') {
        details = `(Dropdown) Options: [${field.getOptions().join(', ')}], Selected: "${field.getSelected() || ''}"`;
      }
    } catch (e) {
      details = `(Error getting details: ${e.message})`;
    }
    console.log(`[${idx + 1}] Field: "${name}" | Type: ${type} | ${details}`);
  });
}

inspectFillablePdf().catch(console.error);

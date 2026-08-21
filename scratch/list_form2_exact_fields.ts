import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function listPageFields() {
  const bytes = fs.readFileSync('public/templates/NCR_Form_2_Fillable.pdf');
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = doc.getForm();
  
  const fields = form.getFields();
  console.log(`Total fields: ${fields.length}\n`);

  fields.forEach(f => {
    const name = f.getName();
    const type = f.constructor.name;
    console.log(`${name} (${type})`);
  });
}

listPageFields().catch(console.error);

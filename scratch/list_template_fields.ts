import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function listAllFields() {
  const form2Bytes = fs.readFileSync('public/templates/NCR_Form_2_Fillable.pdf');
  const form2Doc = await PDFDocument.load(form2Bytes, { ignoreEncryption: true });
  const form2 = form2Doc.getForm();
  
  console.log('=== NCR FORM 2 FILLABLE FIELDS ===');
  form2.getFields().forEach(f => {
    console.log(`- ${f.getName()} (${f.constructor.name})`);
  });

  const annexureBytes = fs.readFileSync('public/templates/NCR_Annexure_Confirmation_of_Fees_Fillable.pdf');
  const annexureDoc = await PDFDocument.load(annexureBytes, { ignoreEncryption: true });
  const annexure = annexureDoc.getForm();

  console.log('\n=== NCR ANNEXURE CONFIRMATION OF FEES FIELDS ===');
  annexure.getFields().forEach(f => {
    console.log(`- ${f.getName()} (${f.constructor.name})`);
  });
}

listAllFields().catch(console.error);

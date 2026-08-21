import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function checkPdfStructure() {
  const filePath = 'C:\\Users\\kev\\OneDrive\\Documents\\CF-1B Form Application for Change of Nature of Business.pdf';
  const data = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(data);
  console.log('Pages count:', pdfDoc.getPageCount());
  
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  console.log('Form interactive fields count:', fields.length);
  fields.forEach(f => {
    console.log(`Field: ${f.getName()} (Type: ${f.constructor.name})`);
  });
}

checkPdfStructure().catch(console.error);

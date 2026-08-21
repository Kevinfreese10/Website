import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';

const files = [
  'C:\\Users\\kev\\Downloads\\NCR_Form_2_Fillable.pdf',
  'C:\\Users\\kev\\Downloads\\NCR_Annexure_Confirmation_of_Fees_Fillable.pdf',
  'C:\\Users\\kev\\OneDrive\\Documents\\SHARE CERTIFICATE (Professional).pdf',
];

async function inspectTemplates() {
  for (const f of files) {
    console.log(`\n======================================================`);
    console.log(`Inspecting: ${f}`);
    console.log(`======================================================`);
    if (!fs.existsSync(f)) {
      console.error(`File does not exist: ${f}`);
      continue;
    }

    const bytes = fs.readFileSync(f);
    console.log(`Size: ${bytes.length} bytes`);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    console.log(`Pages: ${doc.getPageCount()}`);
    
    try {
      const form = doc.getForm();
      const fields = form.getFields();
      console.log(`AcroForm Fields Count: ${fields.length}`);
      fields.forEach((field, idx) => {
        const name = field.getName();
        const type = field.constructor.name;
        console.log(`  ${idx + 1}. [${type}] "${name}"`);
      });
    } catch (e: any) {
      console.log(`No AcroForm / Error getting form: ${e.message}`);
    }
  }
}

inspectTemplates().catch(console.error);

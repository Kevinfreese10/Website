const fs = require('fs');
const path = require('path');

async function inspectSample() {
  const buf = fs.readFileSync('c:/myacc/scratch/sample_ncr_form.pdf');
  console.log('Sample Form PDF size:', buf.length, 'bytes');
  
  // Try pdf-parse or strings
  try {
    const pdf = require('c:/myacc/node_modules/pdf-parse');
    const data = await pdf(buf);
    console.log('--- NUMBER OF PAGES ---', data.numpages);
    console.log('--- SAMPLE FORM TEXT ---');
    console.log(data.text.substring(0, 3500));
  } catch (e) {
    console.error('Error reading sample PDF:', e.message);
  }
}

inspectSample().catch(console.error);

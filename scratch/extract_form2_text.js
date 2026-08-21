const fs = require('fs');
const path = require('path');

async function extractAllText() {
  const filePath = 'C:\\Users\\kev\\Downloads\\form 2.pdf';
  const data = new Uint8Array(fs.readFileSync(filePath));
  
  const pdfjsLib = require(path.resolve('c:/myacc/node_modules/pdfjs-dist/legacy/build/pdf.js'));
  const doc = await pdfjsLib.getDocument({ data }).promise;

  console.log('=== EXTRACTING TEXT FROM C:\\Users\\kev\\Downloads\\form 2.pdf ===');
  console.log('Total Pages:', doc.numPages);

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    console.log(`\n--- PAGE ${i} ---`);
    console.log(strings.join(' '));
  }
}

extractAllText().catch(console.error);

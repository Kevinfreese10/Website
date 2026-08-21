const fs = require('fs');
const zlib = require('zlib');

function extractTextFromPdf(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  console.log(`Parsing ${pdfPath} (${buffer.length} bytes)...`);

  let pos = 0;
  let pageIndex = 1;

  while (true) {
    const s = buffer.indexOf(Buffer.from('stream'), pos);
    if (s === -1) break;
    const start = buffer[s + 6] === 0x0a ? s + 7 : (buffer[s + 6] === 0x0d && buffer[s + 7] === 0x0a ? s + 8 : s + 6);
    const e = buffer.indexOf(Buffer.from('endstream'), start);
    if (e === -1) break;
    const chunk = buffer.slice(start, e);

    try {
      const decomp = zlib.unzipSync(chunk).toString('latin1');
      if (decomp.includes('BT') && decomp.includes('ET')) {
        console.log(`\n=================== TEXT STREAM #${pageIndex++} ===================`);
        // Extract string literals in parentheses (text)
        const strings = [];
        const regex = /\((.*?)\)/g;
        let m;
        while ((m = regex.exec(decomp)) !== null) {
          if (m[1].length > 0) {
            strings.push(m[1]);
          }
        }
        console.log(strings.join(' '));
      }
    } catch (err) {}

    pos = e + 9;
  }
}

extractTextFromPdf('C:\\Users\\kev\\Downloads\\form 2.pdf');

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function extractVectors(pdfPath) {
  const buf = fs.readFileSync(pdfPath);
  console.log(`\n=== EXTRACTING VECTOR BOX RECTANGLES FROM ${pdfPath} ===`);
  let pos = 0;
  let pageIdx = 1;

  while (true) {
    const s = buf.indexOf(Buffer.from('stream'), pos);
    if (s === -1) break;
    const start = buf[s + 6] === 0x0a ? s + 7 : (buf[s + 6] === 0x0d && buf[s + 7] === 0x0a ? s + 8 : s + 6);
    const e = buf.indexOf(Buffer.from('endstream'), start);
    if (e === -1) break;
    const chunk = buf.slice(start, e);

    try {
      const decomp = zlib.unzipSync(chunk).toString('latin1');
      // Look for rectangle operations "x y w h re" or round rect curves
      if (decomp.includes(' re') || decomp.includes(' m ') || decomp.includes(' l ')) {
        console.log(`\n--- PAGE / STREAM ${pageIdx} ---`);
        const lines = decomp.split('\n');
        for (const l of lines) {
          if (l.includes(' re') || (l.includes(' m') && l.includes(' c '))) {
            console.log(l.substring(0, 120));
          }
        }
      }
    } catch (err) {}

    pos = e + 9;
    pageIdx++;
  }
}

extractVectors('C:\\Users\\kev\\Downloads\\form 2.pdf');

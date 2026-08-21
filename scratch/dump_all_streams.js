// The form has no AcroForm fields - the boxes are drawn graphics.
// Let's analyze the PDF's raw xref/object structure to find all annotation rectangles
// and drawn rounded rectangles (the input boxes).

const fs = require('fs');
const zlib = require('zlib');

function analyzeAllStreams(pdfPath) {
  const buf = fs.readFileSync(pdfPath);
  let pos = 0;
  let idx = 0;
  const results = [];

  while (true) {
    const s = buf.indexOf(Buffer.from('stream'), pos);
    if (s === -1) break;
    
    const start = buf[s + 6] === 0x0a ? s + 7 : (buf[s + 6] === 0x0d && buf[s + 7] === 0x0a ? s + 8 : s + 6);
    const e = buf.indexOf(Buffer.from('endstream'), start);
    if (e === -1) break;
    const chunk = buf.slice(start, e);
    
    let decomp;
    try {
      decomp = zlib.unzipSync(chunk).toString('binary');
    } catch (err) {
      // not compressed
      decomp = chunk.toString('binary');
    }
    
    // Dump EVERYTHING for first 5 streams that look like page content
    if (decomp.includes('cm') || decomp.includes(' m ') || decomp.includes('BT')) {
      idx++;
      results.push({ idx, decomp: decomp.substring(0, 2000) });
      if (idx <= 5) {
        console.log(`\n=== STREAM ${idx} (first 2000 chars) ===`);
        console.log(decomp.substring(0, 2000));
      }
    }
    
    pos = e + 9;
  }
  
  return results;
}

analyzeAllStreams('C:\\Users\\kev\\Downloads\\form 2.pdf');

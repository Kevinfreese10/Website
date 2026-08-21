const fs = require('fs');
const zlib = require('zlib');

function inspectPdfPositions(pdfPath) {
  const buf = fs.readFileSync(pdfPath);
  console.log(`\n=================== INSPECTING ${pdfPath} ===================`);
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
      if (decomp.includes('Tm') || decomp.includes('Td')) {
        console.log(`\n--- PAGE / STREAM ${pageIdx++} ---`);
        // Find text matrix operations like "1 0 0 1 x y Tm" or "x y Td"
        const lines = decomp.split('\n');
        for (const l of lines) {
          if (l.includes('Tm') || l.includes('Td') || l.includes('Tj') || l.includes('TJ')) {
            console.log(l.trim());
          }
        }
      }
    } catch (err) {}

    pos = e + 9;
  }
}

inspectPdfPositions('c:/myacc/scratch/sample_ncr_10057.pdf');

const fs = require('fs');
const zlib = require('zlib');

function inspect10097() {
  const buf = fs.readFileSync('c:/myacc/scratch/sample_ncr_form.pdf');
  console.log('=== INSPECTING ORDER 10097 SAMPLE FORM ===');
  let pos = 0;
  let page = 1;

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
        console.log(`\n--- PAGE ${page++} ---`);
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

inspect10097();

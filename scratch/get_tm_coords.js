const fs = require('fs');
const zlib = require('zlib');

function getTmCoords() {
  const buf = fs.readFileSync('c:/myacc/scratch/sample_ncr_form.pdf');
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
      if (decomp.includes('Tm') && decomp.includes('TJ')) {
        console.log(`\n=================== PAGE ${page++} ===================`);
        const lines = decomp.split('\n');
        for (const l of lines) {
          if (l.includes('Tm')) {
            const parts = l.trim().split(/\s+/);
            // parts: ["1", "0", "0.000000", "-1", "7565.120117", "12989.599609", "Tm"]
            if (parts.length >= 7) {
              const rawX = parseFloat(parts[4]);
              const rawY = parseFloat(parts[5]);
              const xPt = rawX * 0.0375;
              const yPt = 841.92 - (rawY * 0.0375);
              console.log(`x: ${xPt.toFixed(1)}, y: ${yPt.toFixed(1)} (raw: ${rawX}, ${rawY})`);
            }
          }
        }
      }
    } catch (err) {}
    pos = e + 9;
  }
}

getTmCoords();

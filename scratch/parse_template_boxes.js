const fs = require('fs');
const zlib = require('zlib');

function parseTemplateBoxes(pdfPath) {
  const buf = fs.readFileSync(pdfPath);
  console.log(`=== PARSING FORM 2 TEMPLATE LABELS AND POSITIONS ===`);
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
      if (decomp.includes('BT') && decomp.includes('ET')) {
        console.log(`\n=================== PAGE ${page++} ===================`);
        const lines = decomp.split('\n');
        let curTm = '';
        for (const l of lines) {
          if (l.includes('Tm')) {
            curTm = l.trim();
          } else if (l.includes('Tj') || l.includes('TJ')) {
            const strings = [];
            const regex = /\((.*?)\)/g;
            let m;
            while ((m = regex.exec(l)) !== null) {
              if (m[1].length > 0) strings.push(m[1]);
            }
            if (strings.length > 0) {
              const text = strings.join(' ');
              const parts = curTm.split(/\s+/);
              if (parts.length >= 7) {
                const x = parseFloat(parts[4]);
                const y = parseFloat(parts[5]);
                console.log(`y: ${y.toFixed(1)}, x: ${x.toFixed(1)} => "${text}"`);
              }
            }
          }
        }
      }
    } catch (err) {}

    pos = e + 9;
  }
}

parseTemplateBoxes('C:\\Users\\kev\\Downloads\\form 2.pdf');

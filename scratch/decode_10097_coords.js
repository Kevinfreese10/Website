const fs = require('fs');
const zlib = require('zlib');

function decodeSample10097() {
  const buf = fs.readFileSync('c:/myacc/scratch/sample_ncr_form.pdf');
  
  // Find cmap
  let cmaps = {};
  let pos = 0;
  while (true) {
    const s = buf.indexOf(Buffer.from('stream'), pos);
    if (s === -1) break;
    const start = buf[s + 6] === 0x0a ? s + 7 : (buf[s + 6] === 0x0d && buf[s + 7] === 0x0a ? s + 8 : s + 6);
    const e = buf.indexOf(Buffer.from('endstream'), start);
    if (e === -1) break;
    const chunk = buf.slice(start, e);
    try {
      const decomp = zlib.unzipSync(chunk).toString('latin1');
      if (decomp.includes('beginbfchar') || decomp.includes('beginbfrange')) {
        const bfcharRegex = /<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>/g;
        let m;
        while ((m = bfcharRegex.exec(decomp)) !== null) {
          cmaps[parseInt(m[1], 16)] = String.fromCharCode(parseInt(m[2], 16));
        }
        const bfrangeRegex = /<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>/g;
        while ((m = bfrangeRegex.exec(decomp)) !== null) {
          let dest = parseInt(m[3], 16);
          for (let code = parseInt(m[1], 16); code <= parseInt(m[2], 16); code++) {
            cmaps[code] = String.fromCharCode(dest++);
          }
        }
      }
    } catch (err) {}
    pos = e + 9;
  }

  // Now extract text with coordinates from streams
  pos = 0;
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
      if (decomp.includes('Tm') && (decomp.includes('TJ') || decomp.includes('Tj'))) {
        console.log(`\n=== STREAM FOR PAGE ${page++} ===`);
        const lines = decomp.split('\n');
        let curTm = '';
        for (const l of lines) {
          if (l.includes('Tm')) {
            curTm = l.trim();
          } else if (l.includes('TJ') || l.includes('Tj')) {
            // decode hex
            const hexes = l.match(/<([0-9A-Fa-f]+)>/g) || [];
            let str = '';
            for (const h of hexes) {
              const clean = h.replace(/[<>]/g, '');
              for (let i = 0; i < clean.length; i += 4) {
                const code = parseInt(clean.substring(i, i + 4), 16);
                str += cmaps[code] || '?';
              }
            }
            if (str.trim().length > 0) {
              console.log(`${curTm} => "${str}"`);
            }
          }
        }
      }
    } catch (err) {}
    pos = e + 9;
  }
}

decodeSample10097();

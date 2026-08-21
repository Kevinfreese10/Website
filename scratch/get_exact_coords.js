const fs = require('fs');
const zlib = require('zlib');

function getExactCoordinates() {
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

  // Find all text and cm
  pos = 0;
  let page = 1;
  while (true) {
    const s = buf.indexOf(Buffer.from('stream'), pos);
    if (s === -1) break;
    const start = bufferStart(buf, s);
    const e = buf.indexOf(Buffer.from('endstream'), start);
    if (e === -1) break;
    const chunk = buf.slice(start, e);
    try {
      const decomp = zlib.unzipSync(chunk).toString('latin1');
      if (decomp.includes('Tm') && (decomp.includes('TJ') || decomp.includes('Tj'))) {
        console.log(`\n=================== PAGE ${page++} ===================`);
        
        // Find cm if any
        let scale = 1.0;
        let translateY = 841.92;
        const cmMatch = decomp.match(/([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+cm/);
        if (cmMatch) {
          scale = parseFloat(cmMatch[1]);
          translateY = parseFloat(cmMatch[6]);
        }

        const lines = decomp.split('\n');
        let curX = 0, curY = 0;
        for (const l of lines) {
          const tmMatch = l.match(/1\s+0\s+0\s+-1\s+([0-9.-]+)\s+([0-9.-]+)\s+Tm/);
          if (tmMatch) {
            const rawX = parseFloat(tmMatch[1]);
            const rawY = parseFloat(tmMatch[2]);
            // Convert to PDF points (origin bottom-left):
            curX = rawX * 0.0375;
            curY = 841.92 - (rawY * 0.0375);
          } else if (l.includes('TJ') || l.includes('Tj')) {
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
              console.log(`x: ${curX.toFixed(1)}, y: ${curY.toFixed(1)} => "${str}"`);
            }
          }
        }
      }
    } catch (err) {}
    pos = e + 9;
  }
}

function bufferStart(buf, s) {
  return buf[s + 6] === 0x0a ? s + 7 : (buf[s + 6] === 0x0d && buf[s + 7] === 0x0a ? s + 8 : s + 6);
}

getExactCoordinates();

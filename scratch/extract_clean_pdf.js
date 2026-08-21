const https = require('https');
const zlib = require('zlib');

const url = "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10036%2Fnotes%2F1784712302062-Power%20of%20Attorney.pdf?alt=media&token=a233f79e-2fa1-4adf-8b88-f7614a0db881";

function parseCMap(cmapStr) {
  const map = {};
  
  // parse bfchar
  const bfcharRegex = /<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>/g;
  let m;
  while ((m = bfcharRegex.exec(cmapStr)) !== null) {
    const src = parseInt(m[1], 16);
    const dst = String.fromCharCode(parseInt(m[2], 16));
    map[src] = dst;
  }

  // parse bfrange: <start> <end> <destStart>
  const bfrangeRegex = /<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>/g;
  while ((m = bfrangeRegex.exec(cmapStr)) !== null) {
    const start = parseInt(m[1], 16);
    const end = parseInt(m[2], 16);
    let dest = parseInt(m[3], 16);
    for (let code = start; code <= end; code++) {
      map[code] = String.fromCharCode(dest);
      dest++;
    }
  }

  return map;
}

https.get(url, res => {
  let buf = [];
  res.on('data', d => buf.push(d));
  res.on('end', () => {
    const buffer = Buffer.concat(buf);
    
    // Find all streams
    let cmaps = {};
    let textStreams = [];
    
    let pos = 0;
    while (true) {
      const s = buffer.indexOf(Buffer.from('stream'), pos);
      if (s === -1) break;
      const start = buffer[s + 6] === 0x0a ? s + 7 : (buffer[s + 6] === 0x0d && buffer[s + 7] === 0x0a ? s + 8 : s + 6);
      const e = buffer.indexOf(Buffer.from('endstream'), start);
      if (e === -1) break;
      const chunk = buffer.slice(start, e);
      try {
        const uncompressed = zlib.unzipSync(chunk).toString('utf-8');
        if (uncompressed.includes('beginbfchar') || uncompressed.includes('beginbfrange')) {
          Object.assign(cmaps, parseCMap(uncompressed));
        } else if (uncompressed.includes('TJ') || uncompressed.includes('Tj')) {
          textStreams.push(uncompressed);
        }
      } catch (err) {}
      pos = e + 9;
    }

    console.log('Total CMap entries:', Object.keys(cmaps).length);

    for (const ts of textStreams) {
      const lines = ts.split('\n');
      let fullText = '';
      for (const line of lines) {
        if (line.includes('TJ')) {
          const match = line.match(/\[(.*?)\]\s*TJ/);
          if (match) {
            const inner = match[1];
            const hexMatches = inner.match(/<([0-9A-Fa-f]+)>/g) || [];
            let lineText = '';
            for (const h of hexMatches) {
              const hex = h.replace(/[<>]/g, '');
              for (let i = 0; i < hex.length; i += 4) {
                const code = parseInt(hex.substring(i, i + 4), 16);
                lineText += cmaps[code] || ' ';
              }
            }
            fullText += lineText + '\n';
          }
        }
      }
      console.log('--- EXTRACTED TEXT FROM PDF ---');
      console.log(fullText);
    }
  });
});

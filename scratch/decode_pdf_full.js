const https = require('https');
const zlib = require('zlib');

const url = "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10036%2Fnotes%2F1784712302062-Power%20of%20Attorney.pdf?alt=media&token=a233f79e-2fa1-4adf-8b88-f7614a0db881";

function parseCMap(cmapStr) {
  const map = {};
  const lines = cmapStr.split('\n');
  for (const line of lines) {
    const m = line.match(/<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>/);
    if (m) {
      const src = m[1].toUpperCase();
      const dst = String.fromCharCode(parseInt(m[2], 16));
      map[src] = dst;
    }
  }
  return map;
}

https.get(url, res => {
  let buf = [];
  res.on('data', d => buf.push(d));
  res.on('end', () => {
    const buffer = Buffer.concat(buf);
    
    // Find CMap
    let cmaps = [];
    let pos = 0;
    while (true) {
      const cmapPos = buffer.indexOf(Buffer.from('/ToUnicode'), pos);
      if (cmapPos === -1) break;
      const streamPos = buffer.indexOf(Buffer.from('stream'), cmapPos);
      const streamEnd = buffer.indexOf(Buffer.from('endstream'), streamPos);
      if (streamPos !== -1 && streamEnd !== -1) {
        const start = buffer[streamPos + 6] === 0x0a ? streamPos + 7 : (buffer[streamPos + 6] === 0x0d && buffer[streamPos + 7] === 0x0a ? streamPos + 8 : streamPos + 6);
        const chunk = buffer.slice(start, streamEnd);
        try {
          const uncompressed = zlib.unzipSync(chunk).toString('utf-8');
          cmaps.push(parseCMap(uncompressed));
        } catch (e) {}
      }
      pos = cmapPos + 10;
    }

    const mergedMap = Object.assign({}, ...cmaps);
    
    // Find text stream
    pos = 0;
    while (true) {
      const s = buffer.indexOf(Buffer.from('stream'), pos);
      if (s === -1) break;
      const start = buffer[s + 6] === 0x0a ? s + 7 : (buffer[s + 6] === 0x0d && buffer[s + 7] === 0x0a ? streamPos + 8 : s + 6);
      const e = buffer.indexOf(Buffer.from('endstream'), start);
      if (e === -1) break;
      const chunk = buffer.slice(start, e);
      try {
        const uncompressed = zlib.unzipSync(chunk).toString('utf-8');
        if (uncompressed.includes('TJ') || uncompressed.includes('Tj')) {
          // Decode hex strings <0093>
          const decoded = uncompressed.replace(/<([0-9A-Fa-f]+)>/g, (match, hex) => {
            let res = '';
            for (let i = 0; i < hex.length; i += 4) {
              const code = hex.substring(i, i + 4).toUpperCase();
              res += mergedMap[code] || '?';
            }
            return res;
          });
          
          // Clean up TJ syntax
          const textOnly = decoded.replace(/\[(.*?)\]\s*TJ/g, (m, inner) => {
            return inner.replace(/[-0-9.]+/g, '').replace(/[<>]/g, '');
          }).replace(/[0-9.]+\s+[0-9.]+\s+Tf/g, '').replace(/BT|ET|q|Q|rg|Tm|Tr/g, '');
          
          console.log('--- DECODED PDF CONTENT ---');
          console.log(textOnly);
        }
      } catch (err) {}
      pos = e + 9;
    }
  });
});

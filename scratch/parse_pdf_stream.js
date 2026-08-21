const https = require('https');
const zlib = require('zlib');

const url = "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10036%2Fnotes%2F1784712302062-Power%20of%20Attorney.pdf?alt=media&token=a233f79e-2fa1-4adf-8b88-f7614a0db881";

https.get(url, res => {
  let buf = [];
  res.on('data', d => buf.push(d));
  res.on('end', () => {
    const buffer = Buffer.concat(buf);
    const streamStart = buffer.indexOf(Buffer.from('stream\r\n')) + 8;
    const streamEnd = buffer.indexOf(Buffer.from('\r\nendstream'));
    if (streamStart > 7 && streamEnd > streamStart) {
      const compressed = buffer.slice(streamStart, streamEnd);
      zlib.inflate(compressed, (err, decompressed) => {
        if (!err) {
          console.log('Decompressed 1st stream:');
          console.log(decompressed.toString('utf-8'));
        } else {
          // Try inflateRaw
          zlib.inflateRaw(compressed, (err2, decompressed2) => {
            if (!err2) {
              console.log('Decompressed raw:');
              console.log(decompressed2.toString('utf-8'));
            } else {
              console.error('Inflate error:', err.message);
            }
          });
        }
      });
    } else {
      console.log('Stream marker not found exactly, searching all streams...');
      // Extract all stream chunks
      let pos = 0;
      while (true) {
        const s = buffer.indexOf(Buffer.from('stream'), pos);
        if (s === -1) break;
        const start = buffer[s + 6] === 0x0a ? s + 7 : (buffer[s + 6] === 0x0d && buffer[s + 7] === 0x0a ? s + 8 : s + 6);
        const e = buffer.indexOf(Buffer.from('endstream'), start);
        if (e === -1) break;
        const chunk = buffer.slice(start, e);
        try {
          const uncompressed = zlib.unzipSync(chunk);
          const text = uncompressed.toString('utf-8');
          if (text.length > 50 && !text.includes('FontDescriptor')) {
            console.log('--- FOUND STREAM CONTENT ---');
            console.log(text);
          }
        } catch (err) {}
        pos = e + 9;
      }
    }
  });
});

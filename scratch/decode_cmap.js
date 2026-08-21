const https = require('https');
const zlib = require('zlib');

const url = "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10036%2Fnotes%2F1784712302062-Power%20of%20Attorney.pdf?alt=media&token=a233f79e-2fa1-4adf-8b88-f7614a0db881";

https.get(url, res => {
  let buf = [];
  res.on('data', d => buf.push(d));
  res.on('end', () => {
    const buffer = Buffer.concat(buf);
    
    // Find ToUnicode cmap streams
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
          const uncompressed = zlib.unzipSync(chunk);
          console.log('--- TOUNICODE CMAP ---');
          console.log(uncompressed.toString('utf-8'));
        } catch (e) {}
      }
      pos = cmapPos + 10;
    }
  });
});

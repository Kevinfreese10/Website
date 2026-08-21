const fs = require('fs');
const zlib = require('zlib');

function dumpFirstPages(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  let pos = 0;
  let idx = 1;

  while (true) {
    const s = buffer.indexOf(Buffer.from('stream'), pos);
    if (s === -1) break;
    const start = buffer[s + 6] === 0x0a ? s + 7 : (buffer[s + 6] === 0x0d && buffer[s + 7] === 0x0a ? s + 8 : s + 6);
    const e = buffer.indexOf(Buffer.from('endstream'), start);
    if (e === -1) break;
    const chunk = buffer.slice(start, e);

    try {
      const decomp = zlib.unzipSync(chunk).toString('latin1');
      if (decomp.includes('BT') && decomp.includes('ET')) {
        console.log(`\n=================== PAGE / STREAM ${idx} ===================`);
        const strings = [];
        const regex = /\((.*?)\)/g;
        let m;
        while ((m = regex.exec(decomp)) !== null) {
          if (m[1].length > 0) {
            strings.push(m[1]);
          }
        }
        console.log(strings.join(' '));
        idx++;
        if (idx > 7) break;
      }
    } catch (err) {}

    pos = e + 9;
  }
}

dumpFirstPages('C:\\Users\\kev\\Downloads\\form 2.pdf');

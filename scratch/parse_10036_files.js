const fs = require('fs');
const zlib = require('zlib');

function getStrings(filePath) {
  const buf = fs.readFileSync(filePath);
  console.log(`\n=================== ${filePath} ===================`);
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
      const strings = [];
      const regex = /\((.*?)\)/g;
      let m;
      while ((m = regex.exec(decomp)) !== null) {
        if (m[1].length > 0) strings.push(m[1]);
      }
      if (strings.length > 0) {
        console.log(strings.join(' ').substring(0, 1000));
      }
    } catch (err) {}
    pos = e + 9;
  }
}

['cipc', 'tax', 'bank', 'id', 'saps'].forEach(k => getStrings(`c:/myacc/scratch/10036_${k}.pdf`));

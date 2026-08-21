const fs = require('fs');
const zlib = require('zlib');

// The PDF uses a coordinate system where:
// - The "1 0 0 -1 x y Tm" matrix means the text is rotated 180 degrees vertically
// - Raw coordinates need to be divided to get actual PDF points
// - Page size is 595.276 x 841.89 points (A4)

// Strategy: Find ALL rectangle (re) operations per page to identify input box positions
function findInputBoxes(pdfPath) {
  const buf = fs.readFileSync(pdfPath);
  let pos = 0;
  let streamIdx = 0;
  
  while (true) {
    const s = buf.indexOf(Buffer.from('stream'), pos);
    if (s === -1) break;
    
    // Check what's before this stream to find the dictionary
    let dictStart = pos;
    const dictEnd = s;
    const dictText = buf.slice(Math.max(0, dictStart), dictEnd).toString('latin1');
    
    const start = buf[s + 6] === 0x0a ? s + 7 : (buf[s + 6] === 0x0d && buf[s + 7] === 0x0a ? s + 8 : s + 6);
    const e = buf.indexOf(Buffer.from('endstream'), start);
    if (e === -1) break;
    const chunk = buf.slice(start, e);
    
    try {
      const decomp = zlib.unzipSync(chunk).toString('latin1');
      
      // Look for rectangle drawing operations in content streams
      if ((decomp.includes(' re') || decomp.includes('RG') || decomp.includes(' rg')) && 
          !decomp.includes('beginbfchar') && !decomp.includes('beginbfrange')) {
        
        streamIdx++;
        console.log(`\n=== STREAM ${streamIdx} (potential page content) ===`);
        
        const lines = decomp.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i].trim();
          // Rectangle: x y w h re
          if (l.endsWith(' re') || l.endsWith(' re\r')) {
            const parts = l.replace('\r', '').split(/\s+/);
            if (parts.length >= 5) {
              const x = parseFloat(parts[0]);
              const y = parseFloat(parts[1]);
              const w = parseFloat(parts[2]);
              const h = parseFloat(parts[3]);
              // Filter for reasonable box sizes (input fields)
              if (Math.abs(w) > 20 && Math.abs(h) > 5 && Math.abs(h) < 50) {
                // Convert to standard PDF coords (bottom-left origin)
                console.log(`  Box: x=${x.toFixed(1)}, y=${y.toFixed(1)}, w=${w.toFixed(1)}, h=${h.toFixed(1)}`);
              }
            }
          }
        }
      }
    } catch (err) {}
    
    pos = e + 9;
  }
}

findInputBoxes('C:\\Users\\kev\\Downloads\\form 2.pdf');

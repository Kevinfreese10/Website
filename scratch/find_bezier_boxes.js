// Take a completely different approach: use MuPDF or Ghostscript via CLI to render page to image
// OR - let's parse the actual page content streams correctly by looking at the cross-reference
// table to identify page objects and their content streams

const fs = require('fs');
const zlib = require('zlib');

function fullPdfParse(pdfPath) {
  const raw = fs.readFileSync(pdfPath);
  const text = raw.toString('binary');
  
  // Find the startxref offset
  const startxrefMatch = text.match(/startxref\s+(\d+)/);
  if (!startxrefMatch) {
    console.log('No startxref found');
    return;
  }
  
  // Find all page content objects by looking for "cm" transformation matrices 
  // These define how the page coordinate system is set up
  
  // Strategy: find all decompressed streams and look for the page content
  // The key insight is: the form boxes use "c" (bezier curves) for rounded rectangles
  let pos = 0;
  let streamNum = 0;
  
  while (true) {
    const sIdx = raw.indexOf(Buffer.from('stream'), pos);
    if (sIdx === -1) break;
    
    // Get stream start
    let dataStart;
    if (raw[sIdx + 6] === 0x0d && raw[sIdx + 7] === 0x0a) dataStart = sIdx + 8;
    else if (raw[sIdx + 6] === 0x0a) dataStart = sIdx + 7;
    else dataStart = sIdx + 6;
    
    const endIdx = raw.indexOf(Buffer.from('endstream'), dataStart);
    if (endIdx === -1) break;
    
    const chunk = raw.slice(dataStart, endIdx);
    streamNum++;
    
    try {
      const dec = zlib.unzipSync(chunk).toString('binary');
      
      // Look for "c" bezier curve commands which make rounded rectangles
      // Also "m" (moveto), "l" (lineto), "c" (curveto), "S/s/F/f" (stroke/fill)
      if (dec.includes(' c\n') || dec.includes(' c\r') || dec.includes(' C\n')) {
        // Check if it has the typical pattern of a graphical element with coordinates
        const hasCoords = /\d+\.\d+ \d+\.\d+ m/.test(dec) || /\d+ \d+ m/.test(dec);
        if (hasCoords) {
          console.log(`\n=== STREAM ${streamNum} has bezier paths ===`);
          // Extract all path coordinates
          const pathLines = dec.split('\n').filter(l => {
            const t = l.trim();
            return t.endsWith(' m') || t.endsWith(' l') || t.endsWith(' c') || 
                   t === 'S' || t === 's' || t === 'f' || t === 'F' || t === 'B' ||
                   t.endsWith(' cm') || t.endsWith(' w');
          });
          if (pathLines.length > 0 && pathLines.length < 200) {
            pathLines.forEach(l => console.log('  ', l.trim()));
          }
        }
      }
    } catch(e) {}
    
    pos = endIdx + 9;
  }
}

fullPdfParse('C:\\Users\\kev\\Downloads\\form 2.pdf');

// The PDF boxes use bezier curves. Let me instead use a screenshot approach.
// Use the Chrome DevTools MCP to take a screenshot of each page to visually identify boxes.
// But first, let me try converting the PDF to get coordinates by extracting annotation objects.

// Actually, the best approach is to read the PDF raw binary and find the Rect arrays in annotation/widget objects
// which give us the exact bounding boxes of every visual element.

const fs = require('fs');

function findRectArrays(pdfPath) {
  const raw = fs.readFileSync(pdfPath);
  const text = raw.toString('binary');
  
  // Find all /Rect [ x1 y1 x2 y2 ] patterns
  const rectRegex = /\/Rect\s*\[\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*\]/g;
  let match;
  const rects = [];
  
  while ((match = rectRegex.exec(text)) !== null) {
    const x1 = parseFloat(match[1]);
    const y1 = parseFloat(match[2]);
    const x2 = parseFloat(match[3]);
    const y2 = parseFloat(match[4]);
    rects.push({ x1, y1, x2, y2, x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
  }
  
  // Find /MediaBox and /CropBox for page dimensions
  const mediaBoxRegex = /\/MediaBox\s*\[\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*\]/g;
  let mbMatch;
  while ((mbMatch = mediaBoxRegex.exec(text)) !== null) {
    console.log(`MediaBox: ${mbMatch[1]} ${mbMatch[2]} ${mbMatch[3]} ${mbMatch[4]}`);
  }
  
  console.log(`\nFound ${rects.length} /Rect arrays:\n`);
  rects.forEach((r, i) => {
    console.log(`[${i+1}] x:${r.x.toFixed(1)} y:${r.y.toFixed(1)} w:${r.w.toFixed(1)} h:${r.h.toFixed(1)} (x1:${r.x1} y1:${r.y1} x2:${r.x2} y2:${r.y2})`);
  });
  
  return rects;
}

findRectArrays('C:\\Users\\kev\\Downloads\\form 2.pdf');

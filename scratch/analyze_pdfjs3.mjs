import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Get pdfjs using proper import
const pdfjs = await import(new URL('file:///c:/myacc/node_modules/pdfjs-dist/build/pdf.mjs'));

const { getDocument, OPS, GlobalWorkerOptions } = pdfjs;

GlobalWorkerOptions.workerSrc = false;

const data = new Uint8Array(readFileSync('C:\\Users\\kev\\Downloads\\form 2.pdf'));

const loadingTask = getDocument({ 
  data, 
  useWorkerFetch: false, 
  isEvalSupported: false,
  disableFontFace: true
});

const pdfDocument = await loadingTask.promise;
console.log(`Pages: ${pdfDocument.numPages}`);

for (let pageNum = 1; pageNum <= 3; pageNum++) {
  const page = await pdfDocument.getPage(pageNum);
  console.log(`\n=== PAGE ${pageNum} ===`);
  
  const opList = await page.getOperatorList();
  
  let pathPoints = [];
  let inPath = false;
  let boxes = [];
  
  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i];
    
    if (fn === OPS.moveTo) {
      inPath = true;
      pathPoints = [{ x: args[0], y: args[1] }];
    }
    if (fn === OPS.lineTo && inPath) {
      pathPoints.push({ x: args[0], y: args[1] });
    }
    if (fn === OPS.curveTo && inPath) {
      pathPoints.push({ x: args[4], y: args[5] });
    }
    if (fn === OPS.rectangle) {
      const [rx, ry, rw, rh] = args;
      if (Math.abs(rw) > 20 && Math.abs(rh) > 3 && Math.abs(rh) < 60) {
        boxes.push({ type: 'rect', x: rx, y: ry, w: rw, h: rh });
      }
    }
    if ((fn === OPS.stroke || fn === OPS.fill || fn === OPS.eoFill || fn === OPS.fillStroke) && inPath) {
      if (pathPoints.length >= 3) {
        const xs = pathPoints.map(p => p.x);
        const ys = pathPoints.map(p => p.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const w = maxX - minX, h = maxY - minY;
        if (w > 30 && h > 3 && h < 40 && w < 600) {
          boxes.push({ type: 'path', x: minX, y: minY, w, h });
        }
      }
      inPath = false;
      pathPoints = [];
    }
  }
  
  // Sort by y (top to bottom on page - y decreases going down in PDF space)
  boxes.sort((a, b) => b.y - a.y);
  
  for (const b of boxes) {
    // In PDF space, y is from bottom. text_y_from_top = page_height - y - h
    const textY = 841.89 - b.y - Math.abs(b.h); // inside top of box
    const textX = b.x + 3; // small left padding inside box
    console.log(`  [${b.type}] text placement: x:${textX.toFixed(1)} y:${textY.toFixed(1)} | box: x:${b.x.toFixed(1)} y:${b.y.toFixed(1)} w:${Math.abs(b.w).toFixed(1)} h:${Math.abs(b.h).toFixed(1)}`);
  }
}

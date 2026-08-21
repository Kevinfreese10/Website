// Use the legacy build with proper DOMMatrix polyfill
import { readFileSync } from 'fs';

// Polyfill DOMMatrix for Node.js
if (typeof DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor(init) {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
    static fromMatrix(m) { return new DOMMatrix(); }
  };
}

const pdfjs = await import(new URL('file:///c:/myacc/node_modules/pdfjs-dist/legacy/build/pdf.mjs'));
const { getDocument, OPS, GlobalWorkerOptions } = pdfjs;

GlobalWorkerOptions.workerSrc = false;

const data = new Uint8Array(readFileSync('C:\\Users\\kev\\Downloads\\form 2.pdf'));

const loadingTask = getDocument({ 
  data, 
  useWorkerFetch: false, 
  isEvalSupported: false,
  disableFontFace: true,
  standardFontDataUrl: null
});

const pdfDocument = await loadingTask.promise;
console.log(`Pages: ${pdfDocument.numPages}`);

for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
  const page = await pdfDocument.getPage(pageNum);
  const vp = page.getViewport({ scale: 1.0 });
  console.log(`\n=== PAGE ${pageNum} (${vp.width.toFixed(0)}x${vp.height.toFixed(0)}) ===`);
  
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
      if (Math.abs(rw) > 30 && Math.abs(rh) > 5 && Math.abs(rh) < 60) {
        boxes.push({ type: 'rect', x: rx, y: ry, w: Math.abs(rw), h: Math.abs(rh) });
      }
    }
    if ((fn === OPS.stroke || fn === OPS.fill || fn === OPS.eoFill || fn === OPS.fillStroke || fn === OPS.endPath) && inPath && pathPoints.length >= 3) {
      const xs = pathPoints.map(p => p.x);
      const ys = pathPoints.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const w = maxX - minX, h = maxY - minY;
      if (w > 30 && h > 5 && h < 40 && w < 580) {
        boxes.push({ type: 'path', x: minX, y: minY, w, h });
      }
      inPath = false;
      pathPoints = [];
    }
    if (fn === OPS.endPath) {
      inPath = false;
      pathPoints = [];
    }
  }
  
  // Deduplicate
  const unique = boxes.filter((b, i) => {
    return !boxes.slice(0, i).some(prev => Math.abs(prev.x - b.x) < 2 && Math.abs(prev.y - b.y) < 2);
  });
  
  // Sort top to bottom (in PDF space, higher y = higher on page)
  unique.sort((a, b) => b.y - a.y);
  
  for (const b of unique) {
    // For drawText in pdf-lib: x is from left, y is from BOTTOM of page
    // Text y should be roughly: b.y + (b.h / 4) to be vertically centered inside box
    const textY_pdflib = b.y + (b.h * 0.25);
    const textX_pdflib = b.x + 4;
    console.log(`  BOX: pdflib_x:${textX_pdflib.toFixed(1)} pdflib_y:${textY_pdflib.toFixed(1)} | box raw: x:${b.x.toFixed(1)} y:${b.y.toFixed(1)} w:${b.w.toFixed(1)} h:${b.h.toFixed(1)}`);
  }
}

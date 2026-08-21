// Use pdfjs-dist ESM build via dynamic import
const fs = require('fs');

async function main() {
  // Use dynamic import for ESM module
  const pdfjsLib = await import('file:///c:/myacc/node_modules/pdfjs-dist/build/pdf.mjs');
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = false;
  
  const data = new Uint8Array(fs.readFileSync('C:\\Users\\kev\\Downloads\\form 2.pdf'));
  
  const loadingTask = pdfjsLib.getDocument({ 
    data, 
    useWorkerFetch: false, 
    isEvalSupported: false,
    disableFontFace: true
  });
  
  const pdfDocument = await loadingTask.promise;
  console.log(`Pages: ${pdfDocument.numPages}`);
  
  // Analyze pages 1 and 2
  for (let pageNum = 1; pageNum <= 2; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    console.log(`\n=== PAGE ${pageNum} ===`);
    
    const opList = await page.getOperatorList();
    const OPS = pdfjsLib.OPS;
    
    let pathPoints = [];
    let inPath = false;
    
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
      if (fn === OPS.curveTo2 && inPath) {
        pathPoints.push({ x: args[2], y: args[3] });
      }
      if (fn === OPS.curveTo3 && inPath) {
        pathPoints.push({ x: args[2], y: args[3] });
      }
      if (fn === OPS.rectangle) {
        const [rx, ry, rw, rh] = args;
        if (Math.abs(rw) > 20 && Math.abs(rh) > 5 && Math.abs(rh) < 60) {
          console.log(`  RECT: x:${rx.toFixed(1)} y:${ry.toFixed(1)} w:${rw.toFixed(1)} h:${rh.toFixed(1)}`);
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
            console.log(`  BOX: x:${minX.toFixed(1)} y:${minY.toFixed(1)} w:${w.toFixed(1)} h:${h.toFixed(1)}`);
          }
        }
        inPath = false;
        pathPoints = [];
      }
    }
  }
}

main().catch(e => {
  console.error('Error:', e.message);
});

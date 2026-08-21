// Use pdfjs-dist to get all operators and their coordinates per page
// This will tell us exactly where the rounded boxes are drawn

const path = require('path');
const fs = require('fs');

async function analyzePdfCoordinates() {
  // pdfjs-dist needs to run in a browser-like context for full rendering
  // But we can use the non-rendering parsing to get all operator lists
  const pdfjsLib = require('c:/myacc/node_modules/pdfjs-dist/legacy/build/pdf.js');
  
  // Disable worker for Node.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = false;
  
  const data = new Uint8Array(fs.readFileSync('C:\\Users\\kev\\Downloads\\form 2.pdf'));
  
  const loadingTask = pdfjsLib.getDocument({ data, useWorkerFetch: false, isEvalSupported: false });
  const pdfDocument = await loadingTask.promise;
  
  console.log(`Pages: ${pdfDocument.numPages}`);
  
  // Analyze page 1
  for (let pageNum = 1; pageNum <= Math.min(2, pdfDocument.numPages); pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    
    console.log(`\n=== PAGE ${pageNum} - Size: ${viewport.width.toFixed(1)} x ${viewport.height.toFixed(1)} ===`);
    
    // Get operator list
    const opList = await page.getOperatorList();
    const OPS = pdfjsLib.OPS;
    
    // Track graphics state
    let currentMatrix = [1, 0, 0, 1, 0, 0];
    let pathPoints = [];
    let inPath = false;
    
    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      const args = opList.argsArray[i];
      
      // Transform/CTM
      if (fn === OPS.transform) {
        currentMatrix = args;
      }
      
      // Move to / Begin path
      if (fn === OPS.moveTo) {
        inPath = true;
        pathPoints = [{ x: args[0], y: args[1] }];
      }
      
      // Line to
      if (fn === OPS.lineTo && inPath) {
        pathPoints.push({ x: args[0], y: args[1] });
      }
      
      // Bezier curve (curveTo)
      if (fn === OPS.curveTo && inPath) {
        pathPoints.push({ x: args[4], y: args[5] }); // end point
      }
      if (fn === OPS.curveTo2 && inPath) {
        pathPoints.push({ x: args[2], y: args[3] });
      }
      if (fn === OPS.curveTo3 && inPath) {
        pathPoints.push({ x: args[2], y: args[3] });
      }
      
      // Rectangle
      if (fn === OPS.rectangle) {
        const [rx, ry, rw, rh] = args;
        // These are in page coordinate space (bottom-left origin)
        if (Math.abs(rw) > 20 && Math.abs(rh) > 5 && Math.abs(rh) < 60) {
          console.log(`  RECT: x:${rx.toFixed(1)} y:${ry.toFixed(1)} w:${rw.toFixed(1)} h:${rh.toFixed(1)}`);
        }
      }
      
      // Stroke/Fill (end of path)
      if ((fn === OPS.stroke || fn === OPS.fill || fn === OPS.eoFill || fn === OPS.fillStroke) && inPath) {
        if (pathPoints.length >= 3) {
          const xs = pathPoints.map(p => p.x);
          const ys = pathPoints.map(p => p.y);
          const minX = Math.min(...xs), maxX = Math.max(...xs);
          const minY = Math.min(...ys), maxY = Math.max(...ys);
          const w = maxX - minX, h = maxY - minY;
          // Filter for input box shapes
          if (w > 30 && h > 5 && h < 40 && w < 600) {
            console.log(`  PATH-BOX: x:${minX.toFixed(1)} y:${minY.toFixed(1)} w:${w.toFixed(1)} h:${h.toFixed(1)} pts:${pathPoints.length}`);
          }
        }
        inPath = false;
        pathPoints = [];
      }
    }
  }
}

analyzePdfCoordinates().catch(e => console.error(e));

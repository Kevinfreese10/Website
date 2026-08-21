// The form boxes are drawn as graphical paths using bezier curves (c operator).
// Let's use Chrome DevTools / browser to render the PDF and take a screenshot.
// This will give us a visual to calibrate from.

// First, let me try to use MuPDF via wsl or powershell if available
// Also check if Ghostscript is installed

const { execSync } = require('child_process');

// Try mutool
try {
  const r1 = execSync('where mutool', { encoding: 'utf8' });
  console.log('mutool found:', r1);
} catch(e) { console.log('mutool not found'); }

// Try gs (Ghostscript)
try {
  const r2 = execSync('where gs', { encoding: 'utf8' });
  console.log('gs found:', r2);
} catch(e) { console.log('gs not found'); }

// Try gswin64c
try {
  const r3 = execSync('where gswin64c', { encoding: 'utf8' });
  console.log('gswin64c found:', r3);
} catch(e) { console.log('gswin64c not found'); }

// Try pdftotext
try {
  const r4 = execSync('where pdftotext', { encoding: 'utf8' });
  console.log('pdftotext found:', r4);
} catch(e) { console.log('pdftotext not found'); }

// Try pdftoppm
try {
  const r5 = execSync('where pdftoppm', { encoding: 'utf8' });
  console.log('pdftoppm found:', r5);
} catch(e) { console.log('pdftoppm not found'); }

// Check if canvas module is available (can render PDF via pdf.js)
try {
  require.resolve('c:/myacc/node_modules/canvas');
  console.log('canvas module available');
} catch(e) { console.log('canvas module not available'); }

// Check pdfjs-dist
try {
  require.resolve('c:/myacc/node_modules/pdfjs-dist');
  console.log('pdfjs-dist module available');
} catch(e) { console.log('pdfjs-dist module not available'); }

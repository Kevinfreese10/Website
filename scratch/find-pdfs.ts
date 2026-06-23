import * as fs from 'fs';
import * as path from 'path';

function searchDirectory(dir: string, extension: string, maxResults = 10): string[] {
  let results: string[] = [];
  
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        // Exclude node_modules, .next, .git
        if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
          results = results.concat(searchDirectory(filePath, extension, maxResults));
          if (results.length >= maxResults) return results;
        }
      } else if (file.endsWith(extension)) {
        results.push(filePath);
        if (results.length >= maxResults) return results;
      }
    }
  } catch (e) {
    // ignore errors
  }
  
  return results;
}

console.log("Searching workspace for PDFs...");
const pdfs = searchDirectory('c:/myacc', '.pdf');
console.log("Found PDFs:", pdfs);

console.log("Searching Downloads folder for PDFs...");
const downloadsDir = 'C:/Users/kev/Downloads';
const downloadPdfs = searchDirectory(downloadsDir, '.pdf');
console.log("Found Downloads PDFs:", downloadPdfs);

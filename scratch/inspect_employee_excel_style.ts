import * as XLSX from 'xlsx-js-style';
import * as path from 'path';
import * as fs from 'fs';

const filePath = "C:\\Users\\kev\\OneDrive\\Documents\\Employee_import_template (21.08.2026).xlsx";

if (!fs.existsSync(filePath)) {
  console.error("File not found at:", filePath);
  process.exit(1);
}

const workbook = XLSX.readFile(filePath);
console.log("Sheet names:", workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n================================`);
  console.log(`--- Sheet: ${sheetName} ---`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`Total rows: ${data.length}`);
  console.log("Header row:", data[0]);
  console.log("All Rows:");
  data.forEach((row, i) => console.log(`Row ${i}:`, JSON.stringify(row)));
});

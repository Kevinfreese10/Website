const xlsx = require('xlsx');

function run() {
  const filePath = 'C:/Users/kev/Downloads/www.myacc.co.za_http_4xx_client_errors_20260715.xlsx';
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error('Error reading excel file:', e);
  }
}

run();

const https = require('https');
const fs = require('fs');

const url = "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10057%2Fnotes%2F1784199050154-NCR%20Form.pdf?alt=media&token=062dc00a-e2a0-4dfc-ad88-0cedbaf45be0";

https.get(url, res => {
  const file = fs.createWriteStream('c:/myacc/scratch/sample_ncr_10057.pdf');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Sample 10057 PDF downloaded.');
  });
});

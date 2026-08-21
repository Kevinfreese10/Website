const https = require('https');
const fs = require('fs');

const url = "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10097%2Fnotes%2F1785499462904-NCR%20Form.pdf?alt=media&token=d8dd083b-8126-492f-8926-abf17cfffd9f";

https.get(url, res => {
  const file = fs.createWriteStream('c:/myacc/scratch/sample_ncr_form.pdf');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Sample NCR Form PDF downloaded successfully.');
  });
});

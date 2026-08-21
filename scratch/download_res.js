const https = require('https');
const fs = require('fs');

const url = "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10036%2Fnotes%2F1784712527209-Resolution.pdf?alt=media&token=80d18f6d-d2ad-4810-8fad-ae5b6fe8b463";

https.get(url, res => {
  const file = fs.createWriteStream('c:/myacc/scratch/10036_res.pdf');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded resolution.');
  });
});

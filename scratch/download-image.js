const https = require('https');
const fs = require('fs');

const url = 'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/uploads%2FLRM285EOq3gwNMKayY6vtzooaC03%2F1776234075137-9.png?alt=media&token=57ca538e-856c-4e86-8f08-d19f1110c5de';
const filePath = 'c:\\myacc\\scratch\\add-director.png';
const file = fs.createWriteStream(filePath);

https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close();
    console.log('Download complete:', filePath);
  });
}).on('error', function(err) {
  fs.unlink(filePath, () => {});
  console.error('Download failed:', err);
});

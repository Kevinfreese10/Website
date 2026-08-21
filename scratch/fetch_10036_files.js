const https = require('https');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

const docUrls = {
  cipc: "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10036%2F1783286167649-COR14.3%20Registration%20cerificate.pdf?alt=media&token=e24bd0de-4af3-4022-8211-e6acb26e118e",
  tax: "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10036%2F1783285211288-Tax%20Clearance.pdf?alt=media&token=381e86e5-8ae8-449b-86d7-0981608f98ec",
  bank: "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10036%2F1783285060192-Account%20Confirmation_5404.pdf?alt=media&token=c9ff8c9c-77d8-4a52-9fce-ba4d1c56ae23",
  id: "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10036%2F1783286000331-Nastasia%20ID.pdf?alt=media&token=fa23097e-6e99-4e4c-ade6-ff3eb0145951",
  saps: "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/uploads%2Fspr6hPr6W9S047rv0wR5fRptYJo1%2Forders%2F10036%2F1786692058668-SAPS_Clearance_Certificate_260814_091236.pdf?alt=media&token=2737c8c7-c4bd-465a-b4f2-fa9d68dd87c1"
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', reject);
    });
  });
}

async function fetchAll() {
  for (const [key, url] of Object.entries(docUrls)) {
    const dest = `c:/myacc/scratch/10036_${key}.pdf`;
    await download(url, dest);
    console.log(`Downloaded ${key} to ${dest}`);
  }
}

fetchAll().catch(console.error);

import * as fs from 'fs';
import * as path from 'path';
import https from 'https';

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function prepareAudit() {
  const auditDir = path.resolve('scratch/order_10139_audit');
  if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });

  const cipcUrl = 'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/uploads%2FFs5UYnpDBFVJfs6j7nMelYDxsnl2%2Forders%2F10139%2F1787281892893-DISCLOSR.pdf?alt=media&token=de9f18a4-6a36-4a41-9204-fb3dd871a479';
  const idUrl = 'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/uploads%2FFs5UYnpDBFVJfs6j7nMelYDxsnl2%2Forders%2F10139%2F1787282067445-ID_-_Roger_Staples.pdf?alt=media&token=0b88e742-941c-4627-8568-8c0b30ef21fa';

  console.log('Downloading CIPC document...');
  await downloadFile(cipcUrl, path.join(auditDir, 'DISCLOSR.pdf'));
  console.log('Downloading ID document...');
  await downloadFile(idUrl, path.join(auditDir, 'ID_-_Roger_Staples.pdf'));

  // Copy BEE Affidavit template
  const templateSrc = 'C:/Users/kev/OneDrive/Documents/Affidavit-EME-Gen.pdf';
  const templateDest = path.join(auditDir, 'Affidavit-EME-Gen.pdf');
  const publicDest = path.resolve('public/templates/Affidavit-EME-Gen.pdf');

  if (fs.existsSync(templateSrc)) {
    fs.copyFileSync(templateSrc, templateDest);
    fs.copyFileSync(templateSrc, publicDest);
    console.log(`✓ Copied template from ${templateSrc} to ${templateDest} and ${publicDest}`);
  } else {
    console.warn(`Template not found at ${templateSrc}`);
  }

  console.log('Files downloaded and ready for inspection.');
}

prepareAudit().catch(console.error);

import * as fs from 'fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function testShareCertFill() {
  const templatePath = 'public/templates/Share_Certificate_Professional.pdf';
  const bytes = fs.readFileSync(templatePath);
  const doc = await PDFDocument.load(bytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const page = doc.getPage(0);
  const { width, height } = page.getSize();
  console.log(`Page dimensions: width=${width}, height=${height}`);

  // Test drawing sample company text on the certificate
  page.drawText('FIRST BLOOM FINANCE (PTY) LTD', {
    x: width / 2 - 150,
    y: height - 195,
    size: 16,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  page.drawText('Registration Number: 2026/507901/07', {
    x: width / 2 - 100,
    y: height - 215,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });

  const outBytes = await doc.save();
  fs.writeFileSync('scratch/order_10135_audit/test_share_cert_rendered.pdf', outBytes);
  console.log('Saved test share certificate to scratch/order_10135_audit/test_share_cert_rendered.pdf');
}

testShareCertFill().catch(console.error);

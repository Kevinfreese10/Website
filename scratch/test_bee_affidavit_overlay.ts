import * as fs from 'fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function testBeeAffidavit() {
  const templatePath = 'public/templates/Affidavit-EME-Gen.pdf';
  const templateBytes = fs.readFileSync(templatePath);
  const doc = await PDFDocument.load(templateBytes);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page1 = doc.getPage(0);
  const { width: p1W, height: p1H } = page1.getSize();
  console.log(`Page 1: width=${p1W}, height=${p1H}`);

  const page2 = doc.getPage(1);
  const { width: p2W, height: p2H } = page2.getSize();
  console.log(`Page 2: width=${p2W}, height=${p2H}`);

  const navy = rgb(0.06, 0.13, 0.22);

  // --- PAGE 1 POPULATION ---
  // Deponent Name & ID (under "I, the undersigned,")
  // Full name & Surname:
  page1.drawText('ROGER BRENDON STAPLES', { x: 230, y: p1H - 128, size: 10, font: fontBold, color: navy });
  // Identity number:
  page1.drawText('8303045032083', { x: 230, y: p1H - 148, size: 10, font: fontBold, color: navy });

  // Enterprise details table (Right column starts at x ≈ 250)
  // Enterprise Name:
  page1.drawText('NO404 (PTY) LTD', { x: 245, y: p1H - 248, size: 9.5, font: fontBold, color: navy });
  // Trading Name (If Applicable):
  page1.drawText('NO404 (PTY) LTD', { x: 245, y: p1H - 268, size: 9.5, font: fontRegular, color: navy });
  // Registration Number:
  page1.drawText('2025/106479/07', { x: 245, y: p1H - 288, size: 9.5, font: fontBold, color: navy });
  // Enterprise Physical Address:
  page1.drawText('5 GAMKA CLOSE, KRAAIBOSCH MANOR, GEORGE, 6529', { x: 245, y: p1H - 308, size: 8, font: fontRegular, color: navy });
  // Type of Entity (CC, (Pty) Ltd, Sole Prop etc.):
  page1.drawText('Private Company ((Pty) Ltd)', { x: 245, y: p1H - 338, size: 9.5, font: fontRegular, color: navy });
  // Nature of Business:
  page1.drawText('Information Technology & Professional Services', { x: 245, y: p1H - 365, size: 9.5, font: fontRegular, color: navy });

  // --- PAGE 2 POPULATION ---
  // • The Enterprise is ____% Black Owned
  page2.drawText('0', { x: 205, y: p2H - 80, size: 10, font: fontBold, color: navy });
  // • The Enterprise is ____% Black Female Owned
  page2.drawText('0', { x: 205, y: p2H - 110, size: 10, font: fontBold, color: navy });
  // • The Enterprise is ____% Black Designated Group Owned
  page2.drawText('0', { x: 205, y: p2H - 140, size: 10, font: fontBold, color: navy });

  // Black Designated Group Breakdown
  // • Black Youth % =
  page2.drawText('0', { x: 195, y: p2H - 185, size: 9.5, font: fontBold, color: navy });
  // • Black Disabled % =
  page2.drawText('0', { x: 195, y: p2H - 200, size: 9.5, font: fontBold, color: navy });
  // • Black Unemployed % =
  page2.drawText('0', { x: 195, y: p2H - 215, size: 9.5, font: fontBold, color: navy });
  // • Black People living in Rural areas % =
  page2.drawText('0', { x: 235, y: p2H - 230, size: 9.5, font: fontBold, color: navy });
  // • Black Military Veterans % =
  page2.drawText('0', { x: 215, y: p2H - 245, size: 9.5, font: fontBold, color: navy });

  // • Based on the Financial Statements... latest financial year-end of
  page2.drawText('28 February 2026', { x: 440, y: p2H - 275, size: 9.5, font: fontBold, color: navy });

  // Table Level Contributor Checkbox: Less than 51% Black Owned -> Level Four
  // Draw tick 'X' in the 3rd row box (x ≈ 470, y ≈ p2H - 390)
  page2.drawText('X', { x: 470, y: p2H - 380, size: 14, font: fontBold, color: navy });

  // Deponent Signature Date
  page2.drawText('21 August 2026', { x: 380, y: p2H - 515, size: 10, font: fontBold, color: navy });

  const outBytes = await doc.save();
  const outPath = 'scratch/order_10139_audit/BEE_Affidavit_EME_NO404_Test.pdf';
  fs.writeFileSync(outPath, outBytes);
  console.log(`Saved test BEE affidavit to ${outPath} (${outBytes.length} bytes)`);
}

testBeeAffidavit().catch(console.error);

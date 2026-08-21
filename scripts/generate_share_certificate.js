/**
 * Executive Share Certificate Generator (South Africa / Companies Act 71 of 2008)
 * 
 * Usage:
 *   node scripts/generate_share_certificate.js --company "FLEXIWIL (PTY) LTD" --regNo "2003/002867/07" --shareholder "LETHABO SELAELO RAMAPHAKELA" --shares 100 --output "output.pdf"
 */

const puppeteer = require('C:/Users/kev/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

function numberToWords(num) {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  
  const n = parseInt(num, 10);
  if (isNaN(n)) return num.toString().toUpperCase();
  if (n === 0) return 'ZERO';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' AND ' + numberToWords(n % 100) : '');
  if (n < 1000000) return numberToWords(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + numberToWords(n % 1000) : '');
  return n.toString().toUpperCase();
}

function buildHtml(data) {
  const sharesWords = data.sharesInWords || numberToWords(data.shareCount);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Share Certificate - ${data.companyName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Montserrat:wght@300;400;500;600;700&family=Alex+Brush&family=Pinyon+Script&display=swap');

    @page {
      size: A4 landscape;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      width: 297mm;
      height: 210mm;
      margin: 0;
      padding: 8mm;
      background-color: #f4efe6;
      font-family: 'Cormorant Garamond', Georgia, serif;
      color: #1a2238;
      display: flex;
      justify-content: center;
      align-items: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .certificate-container {
      width: 281mm;
      height: 194mm;
      background: #ffffff;
      position: relative;
      padding: 10mm 15mm 10mm 15mm;
      box-shadow: inset 0 0 80px rgba(197, 160, 89, 0.08);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    /* Outer Ornate Border System */
    .border-outer {
      position: absolute;
      top: 3.5mm;
      left: 3.5mm;
      right: 3.5mm;
      bottom: 3.5mm;
      border: 3.5px solid #0f2137;
      pointer-events: none;
    }

    .border-gold-accent {
      position: absolute;
      top: 5mm;
      left: 5mm;
      right: 5mm;
      bottom: 5mm;
      border: 1px solid #c5a059;
      pointer-events: none;
    }

    .border-middle {
      position: absolute;
      top: 6.5mm;
      left: 6.5mm;
      right: 6.5mm;
      bottom: 6.5mm;
      border: 1.5px solid #0f2137;
      pointer-events: none;
    }

    .border-inner-fine {
      position: absolute;
      top: 8mm;
      left: 8mm;
      right: 8mm;
      bottom: 8mm;
      border: 0.5px dashed #b89047;
      pointer-events: none;
    }

    /* Corner Filigree */
    .corner-ornament {
      position: absolute;
      width: 44px;
      height: 44px;
      z-index: 10;
    }
    .top-left { top: 8.5mm; left: 8.5mm; }
    .top-right { top: 8.5mm; right: 8.5mm; transform: rotate(90deg); }
    .bottom-right { bottom: 8.5mm; right: 8.5mm; transform: rotate(180deg); }
    .bottom-left { bottom: 8.5mm; left: 8.5mm; transform: rotate(270deg); }

    /* Security Watermark */
    .watermark-bg {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 145mm;
      height: 145mm;
      opacity: 0.032;
      pointer-events: none;
      z-index: 1;
    }

    .content {
      position: relative;
      z-index: 2;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Top Metadata Bar */
    .header-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4mm;
    }

    .meta-box {
      border: 1.5px solid #c5a059;
      background: linear-gradient(135deg, #fdfbf7 0%, #f4ece1 100%);
      padding: 4px 16px;
      border-radius: 2px;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.03);
      min-width: 42mm;
    }

    .meta-box .label {
      font-family: 'Montserrat', sans-serif;
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #795d28;
      display: block;
      margin-bottom: 1px;
    }

    .meta-box .val {
      font-family: 'Cinzel', serif;
      font-size: 11.5pt;
      font-weight: 800;
      color: #0f2137;
      letter-spacing: 1.5px;
    }

    .header-center-type {
      text-align: center;
    }

    .header-center-type .cert-title-badge {
      font-family: 'Cinzel', serif;
      font-size: 11pt;
      font-weight: 700;
      color: #9e782f;
      letter-spacing: 5px;
      text-transform: uppercase;
      border-bottom: 1px solid #d4b26f;
      padding-bottom: 2px;
    }

    /* Company Section */
    .company-section {
      text-align: center;
      margin-top: 1mm;
    }

    .crest-icon {
      width: 20px;
      height: 20px;
      margin: 0 auto 2px auto;
      display: block;
    }

    .main-title {
      font-family: 'Cinzel', serif;
      font-size: 26pt;
      font-weight: 900;
      color: #0b1a2f;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .statutory-line {
      font-family: 'Montserrat', sans-serif;
      font-size: 7.5pt;
      font-weight: 500;
      color: #5a6578;
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }

    .reg-details {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 3px;
      font-family: 'Montserrat', sans-serif;
      font-size: 8pt;
      font-weight: 600;
      color: #2c3e50;
    }

    .reg-details span strong {
      color: #8c6d2d;
    }

    .reg-details .dot-sep {
      color: #c5a059;
      font-size: 10pt;
    }

    /* Ornate Divider */
    .ornate-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      margin: 2mm 0 1mm 0;
    }

    .divider-line {
      height: 1px;
      width: 120px;
      background: linear-gradient(to right, transparent, #c5a059, transparent);
    }

    .divider-diamond {
      width: 6px;
      height: 6px;
      background-color: #c5a059;
      transform: rotate(45deg);
    }

    /* Certification Body */
    .certify-intro {
      text-align: center;
      font-family: 'Pinyon Script', 'Alex Brush', cursive;
      font-size: 23pt;
      color: #8c6d2d;
      line-height: 1;
      margin-bottom: 1mm;
    }

    .shareholder-wrapper {
      text-align: center;
      margin-bottom: 1.5mm;
    }

    .shareholder-name {
      font-family: 'Cinzel', serif;
      font-size: 19pt;
      font-weight: 800;
      color: #0b1a2f;
      letter-spacing: 1.8px;
      text-transform: uppercase;
      padding: 0 15px 2px 15px;
      border-bottom: 2px solid #c5a059;
      display: inline-block;
    }

    .shareholder-id {
      text-align: center;
      font-family: 'Montserrat', sans-serif;
      font-size: 8.5pt;
      font-weight: 500;
      color: #4a5568;
      letter-spacing: 1px;
      margin-top: 1.5px;
    }

    .shareholder-id strong {
      color: #0f2137;
    }

    .share-details-text {
      text-align: center;
      font-size: 11.5pt;
      line-height: 1.5;
      color: #2b3548;
      max-width: 232mm;
      margin: 0 auto;
    }

    .share-details-text .highlight {
      font-family: 'Cinzel', serif;
      font-weight: 700;
      color: #0b1a2f;
      font-size: 12pt;
    }

    .issue-date-clause {
      text-align: center;
      font-size: 10pt;
      font-style: italic;
      color: #4a5568;
      margin-top: 1mm;
    }

    /* Footer & Signatures */
    .footer-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 8mm;
      margin-top: 1mm;
    }

    .signature-block {
      width: 68mm;
      text-align: center;
    }

    .sig-line {
      border-top: 1.2px solid #0f2137;
      margin-bottom: 4px;
    }

    .sig-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 8pt;
      font-weight: 700;
      color: #0f2137;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .sig-subtitle {
      font-family: 'Cormorant Garamond', serif;
      font-size: 9pt;
      font-style: italic;
      color: #6b778c;
    }

    /* Ornate Gold Corporate Seal */
    .seal-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .seal-wrapper {
      position: relative;
      width: 30mm;
      height: 30mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .seal-starburst {
      position: absolute;
      width: 30mm;
      height: 30mm;
      z-index: 1;
    }

    .seal-circle-body {
      width: 23.5mm;
      height: 23.5mm;
      border: 1.8px solid #a88133;
      border-radius: 50%;
      background: radial-gradient(circle, #fffefc 0%, #fcf7ec 60%, #eeddb8 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      z-index: 2;
      box-shadow: inset 0 0 8px rgba(184, 144, 71, 0.45), 0 2px 5px rgba(0,0,0,0.12);
      padding: 2px;
    }

    .seal-text-top {
      font-family: 'Montserrat', sans-serif;
      font-size: 4.8pt;
      font-weight: 700;
      letter-spacing: 1px;
      color: #6a4f1a;
      text-transform: uppercase;
      line-height: 1;
    }

    .seal-text-mid {
      font-family: 'Cinzel', serif;
      font-size: 8pt;
      font-weight: 900;
      color: #0b1a2f;
      letter-spacing: 1.2px;
      margin: 1.5px 0;
    }

    .seal-text-bottom {
      font-family: 'Montserrat', sans-serif;
      font-size: 4.2pt;
      font-weight: 600;
      color: #6a4f1a;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      line-height: 1;
    }

    .legal-notice {
      text-align: center;
      font-family: 'Montserrat', sans-serif;
      font-size: 5.5pt;
      color: #8c97a8;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-top: 1mm;
      margin-bottom: 0.5mm;
    }
  </style>
</head>
<body>

  <div class="certificate-container">
    <!-- Ornate Borders -->
    <div class="border-outer"></div>
    <div class="border-gold-accent"></div>
    <div class="border-middle"></div>
    <div class="border-inner-fine"></div>

    <!-- SVG Corner Filigree Flourishes -->
    <svg class="corner-ornament top-left" viewBox="0 0 100 100" fill="none" stroke="#b89047" stroke-width="1.8">
      <path d="M10,10 L90,10 M10,10 L10,90 M22,22 L78,22 M22,22 L22,78 M10,10 Q50,50 90,10 M10,10 Q50,50 10,90 M28,28 C40,16 60,16 72,28 M28,28 C16,40 16,60 28,72" />
      <circle cx="22" cy="22" r="3.5" fill="#b89047" />
    </svg>
    <svg class="corner-ornament top-right" viewBox="0 0 100 100" fill="none" stroke="#b89047" stroke-width="1.8">
      <path d="M10,10 L90,10 M10,10 L10,90 M22,22 L78,22 M22,22 L22,78 M10,10 Q50,50 90,10 M10,10 Q50,50 10,90 M28,28 C40,16 60,16 72,28 M28,28 C16,40 16,60 28,72" />
      <circle cx="22" cy="22" r="3.5" fill="#b89047" />
    </svg>
    <svg class="corner-ornament bottom-right" viewBox="0 0 100 100" fill="none" stroke="#b89047" stroke-width="1.8">
      <path d="M10,10 L90,10 M10,10 L10,90 M22,22 L78,22 M22,22 L22,78 M10,10 Q50,50 90,10 M10,10 Q50,50 10,90 M28,28 C40,16 60,16 72,28 M28,28 C16,40 16,60 28,72" />
      <circle cx="22" cy="22" r="3.5" fill="#b89047" />
    </svg>
    <svg class="corner-ornament bottom-left" viewBox="0 0 100 100" fill="none" stroke="#b89047" stroke-width="1.8">
      <path d="M10,10 L90,10 M10,10 L10,90 M22,22 L78,22 M22,22 L22,78 M10,10 Q50,50 90,10 M10,10 Q50,50 10,90 M28,28 C40,16 60,16 72,28 M28,28 C16,40 16,60 28,72" />
      <circle cx="22" cy="22" r="3.5" fill="#b89047" />
    </svg>

    <!-- Watermark Background -->
    <svg class="watermark-bg" viewBox="0 0 200 200" fill="#0f2137">
      <circle cx="100" cy="100" r="92" fill="none" stroke="#0f2137" stroke-width="2.5" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="#0f2137" stroke-width="1.2" stroke-dasharray="4 2" />
      <path d="M100,28 L116,74 L165,74 L125,103 L141,149 L100,120 L59,149 L75,103 L35,74 L84,74 Z" opacity="0.8" />
    </svg>

    <div class="content">
      <!-- Header Meta Bar -->
      <div class="header-top-bar">
        <div class="meta-box">
          <span class="label">Certificate No.</span>
          <span class="val">${data.certificateNo || '01'}</span>
        </div>
        <div class="header-center-type">
          <span class="cert-title-badge">Share Certificate</span>
        </div>
        <div class="meta-box">
          <span class="label">Number of Shares</span>
          <span class="val">${data.shareCount || '100'}</span>
        </div>
      </div>

      <!-- Company Details -->
      <div class="company-section">
        <svg class="crest-icon" viewBox="0 0 40 40" fill="#b89047">
          <path d="M20,2 L24,14 L36,14 L26,22 L30,34 L20,26 L10,34 L14,22 L4,14 L16,14 Z" />
        </svg>
        <h1 class="main-title">${data.companyName}</h1>
        <div class="statutory-line">Incorporated in the Republic of South Africa in terms of the Companies Act, No. 71 of 2008</div>
        <div class="reg-details">
          <span>Registration Number: <strong>${data.registrationNo}</strong></span>
          <span class="dot-sep">•</span>
          <span>Class of Shares: <strong>${data.shareClass || 'Ordinary Shares'}</strong></span>
          <span class="dot-sep">•</span>
          <span>Distinctive Numbers: <strong>${data.distinctiveNumbers || '001 to ' + data.shareCount}</strong></span>
        </div>
      </div>

      <!-- Divider -->
      <div class="ornate-divider">
        <div class="divider-line"></div>
        <div class="divider-diamond"></div>
        <div class="divider-line"></div>
      </div>

      <!-- Shareholder Attestation -->
      <div class="certify-intro">This is to Certify that</div>
      <div class="shareholder-wrapper">
        <div class="shareholder-name">${data.shareholderName}</div>
        <div class="shareholder-id">Identity / Registration No: <strong>${data.shareholderId}</strong></div>
      </div>

      <!-- Shareholdings Description -->
      <div class="share-details-text">
        of <strong>${data.shareholderAddress}</strong> is the registered proprietor of <span class="highlight">${sharesWords} (${data.shareCount}) ${(data.shareClass || 'Ordinary Shares').toUpperCase()}</span> of no-par value in the above-named Company, fully paid up, subject to the Memorandum of Incorporation and the Rules and Regulations of the said Company.
      </div>

      <div class="issue-date-clause">
        Given under the authority of the Board of Directors of the Company at <strong>${data.issuedAtPlace || 'Gauteng'}</strong> this <strong>${data.issueDay || '22nd'}</strong> day of <strong>${data.issueMonthYear || 'August 2017'}</strong>.
      </div>

      <!-- Footer Signatures & Seal -->
      <div class="footer-section">
        <div class="signature-block">
          <div class="sig-line"></div>
          <div class="sig-title">Director</div>
          <div class="sig-subtitle">Authorized Signatory</div>
        </div>

        <div class="seal-container">
          <div class="seal-wrapper">
            <!-- Serrated Gold Rosette -->
            <svg class="seal-starburst" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#fdf1cd" />
                  <stop offset="50%" stop-color="#cda758" />
                  <stop offset="100%" stop-color="#9a7322" />
                </linearGradient>
              </defs>
              <path fill="url(#goldGrad)" d="M50 0 L55 10 L65 4 L67 15 L78 12 L77 23 L88 23 L84 34 L94 37 L88 47 L97 50 L88 53 L94 63 L84 66 L88 77 L77 77 L78 88 L67 85 L65 96 L55 90 L50 100 L45 90 L35 96 L33 85 L22 88 L23 77 L12 77 L16 66 L6 63 L12 53 L3 50 L12 47 L6 37 L16 34 L12 23 L23 23 L22 12 L33 15 L35 4 L45 10 Z" />
            </svg>

            <div class="seal-circle-body">
              <span class="seal-text-top">Official Seal</span>
              <span class="seal-text-mid">OFFICIAL</span>
              <span class="seal-text-bottom">Republic of South Africa</span>
            </div>
          </div>
        </div>

        <div class="signature-block">
          <div class="sig-line"></div>
          <div class="sig-title">Director / Secretary</div>
          <div class="sig-subtitle">Authorized Signatory</div>
        </div>
      </div>

      <!-- Transfer Condition Notice -->
      <div class="legal-notice">
        Notice: No transfer of any portion of the shares represented by this certificate can be registered unless accompanied by this certificate.
      </div>
    </div>
  </div>

</body>
</html>`;
}

async function generatePdf(data, outputPath) {
  const html = buildHtml(data);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 990, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();
}

module.exports = { buildHtml, generatePdf };

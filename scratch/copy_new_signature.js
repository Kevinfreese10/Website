import * as fs from 'fs';
import * as path from 'path';

const newSigSrc = 'C:/Users/kev/Downloads/ChatGPT Image Aug 21, 2026, 10_03_09 AM.png';
const dest1 = path.resolve('public/templates/Signature.png');
const dest2 = path.resolve('public/templates/Signature_Kevin_New.png');
const destScratch = path.resolve('scratch/order_10139_audit/Signature_New.png');

if (fs.existsSync(newSigSrc)) {
  const stat = fs.statSync(newSigSrc);
  console.log(`Found new signature image: ${newSigSrc} (${stat.size} bytes)`);
  fs.copyFileSync(newSigSrc, dest1);
  fs.copyFileSync(newSigSrc, dest2);
  fs.copyFileSync(newSigSrc, destScratch);
  console.log('✓ Successfully copied new signature to public/templates and scratch.');
} else {
  console.error(`File NOT found at ${newSigSrc}`);
  // List files in Downloads to see exact name
  const downloads = fs.readdirSync('C:/Users/kev/Downloads').filter(f => f.includes('ChatGPT') || f.includes('Image') || f.endsWith('.png'));
  console.log('Matching files in Downloads:', downloads);
}

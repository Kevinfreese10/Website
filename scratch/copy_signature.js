import * as fs from 'fs';
import * as path from 'path';

const sigSrc = 'C:/Users/kev/OneDrive/Documents/Signature.png';
const sigPublic = path.resolve('public/templates/Signature.png');
const sigScratch = path.resolve('scratch/order_10139_audit/Signature.png');

if (fs.existsSync(sigSrc)) {
  fs.copyFileSync(sigSrc, sigPublic);
  fs.copyFileSync(sigSrc, sigScratch);
  console.log(`✓ Copied Signature.png (${fs.statSync(sigSrc).size} bytes) to ${sigPublic}`);
} else {
  console.error(`Signature.png not found at ${sigSrc}`);
}

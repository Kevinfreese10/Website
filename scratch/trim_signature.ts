import * as fs from 'fs';
import * as path from 'path';

// Let's check with sharp if available, or write a quick pixel trimmer
async function trimSignature() {
  try {
    const sharp = require('sharp');
    const inputPath = 'public/templates/Signature_Kevin_New.png';
    const outputPath = 'public/templates/Signature_Kevin_Trimmed.png';

    await sharp(inputPath)
      .trim() // removes surrounding white/transparent borders
      .toFile(outputPath);

    console.log('✓ Successfully trimmed signature using sharp!');
  } catch (e) {
    console.log('Sharp not installed, checking if we can install or do manual crop');
  }
}

trimSignature().catch(console.error);

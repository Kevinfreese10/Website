import fs from 'fs';
import path from 'path';

const PROGRESS_FILE = path.join(__dirname, 'import-progress.json');
const slug = process.argv[2];

function main() {
  if (!slug) {
    console.error('Please provide a slug');
    return;
  }
  
  const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  const record = progress.find((p: any) => p.slug === slug);
  
  if (record) {
    record.status = 'completed';
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    console.log(`Marked ${slug} as completed.`);
  } else {
    console.log(`Product ${slug} not found.`);
  }
}

main();

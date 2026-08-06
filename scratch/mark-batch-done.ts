import fs from 'fs';
import path from 'path';

const PROGRESS_FILE = path.join(__dirname, 'import-progress.json');
const CURRENT_BATCH_FILE = path.join(__dirname, 'current-batch.json');

function main() {
  if (!fs.existsSync(CURRENT_BATCH_FILE)) {
    console.log('No current batch file found.');
    return;
  }
  
  const batch = JSON.parse(fs.readFileSync(CURRENT_BATCH_FILE, 'utf-8'));
  const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));

  batch.forEach((item: any) => {
    const record = progress.find((p: any) => p.slug === item.slug);
    if (record) {
      record.status = 'completed';
      console.log(`Marked ${item.slug} as completed.`);
    }
  });

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  console.log(`Progress saved.`);
}

main();

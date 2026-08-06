import fs from 'fs';
import path from 'path';

const PROGRESS_FILE = path.join(__dirname, 'import-progress.json');
const CURRENT_BATCH_FILE = path.join(__dirname, 'current-batch.json');
const BATCH_SIZE = 10;

function main() {
  const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  const pending = data.filter((d: any) => d.status !== 'completed');
  
  if (pending.length === 0) {
    console.log('All products processed!');
    if (fs.existsSync(CURRENT_BATCH_FILE)) {
      fs.unlinkSync(CURRENT_BATCH_FILE);
    }
    return;
  }

  const batch = pending.slice(0, BATCH_SIZE);
  console.log(`Preparing batch of ${batch.length} products...`);

  const batchDetails = batch.map((item: any) => ({
    slug: item.slug,
    title: item.title,
    category: item.category,
    price: item.price,
    description: item.description,
    productUrl: `https://www.myacc.co.za/products/${item.slug}`,
    imagePath: item.localImagePath
  }));

  fs.writeFileSync(CURRENT_BATCH_FILE, JSON.stringify(batchDetails, null, 2));
  console.log(`Batch details written to ${CURRENT_BATCH_FILE}`);
}

main();

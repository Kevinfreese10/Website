import fs from 'fs';
import path from 'path';

const PROGRESS_FILE = path.join(__dirname, 'import-progress.json');

function main() {
  const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  const pending = data.filter((d: any) => d.status !== 'completed');
  
  if (pending.length === 0) {
    console.log('DONE');
    return;
  }

  const item = pending[0];
  console.log(JSON.stringify({
    slug: item.slug,
    title: item.title,
    category: item.category,
    price: item.price,
    description: item.description,
    productUrl: `https://www.myacc.co.za/products/${item.slug}`,
    imagePath: item.localImagePath
  }));
}

main();

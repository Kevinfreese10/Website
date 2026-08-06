import fs from 'fs';
import path from 'path';
import https from 'https';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { getAdminDb } from '../src/lib/firebase-admin';

const PROGRESS_FILE = path.join(__dirname, 'import-progress.json');
const SUMMARY_FILE = path.join(__dirname, 'services-summary.json');
const IMAGES_DIR = path.join(__dirname, 'product-images');
const CURRENT_BATCH_FILE = path.join(__dirname, 'current-batch.json');

const BATCH_SIZE = 5;

async function downloadImage(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR);
  }

  let progress: Record<string, boolean> = {};
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    } catch (e) {
      console.log('Error reading progress file. Starting fresh.');
    }
  } else {
    // We already did "add-director"
    progress['add-director'] = true;
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  }

  const summary = JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf-8'));
  
  const pending = summary.filter((s: any) => !progress[s.slug]);
  console.log(`Total remaining products: ${pending.length}`);

  if (pending.length === 0) {
    console.log('All products processed!');
    return;
  }

  const batch = pending.slice(0, BATCH_SIZE);
  console.log(`Preparing batch of ${batch.length} products...`);

  const db = getAdminDb();
  const batchDetails = [];

  for (const item of batch) {
    console.log(`Fetching details for: ${item.slug}`);
    const snap = await db.collection('services').where('slug', '==', item.slug).get();
    if (snap.empty) {
      console.error(`Missing from DB: ${item.slug}`);
      continue;
    }
    const data = snap.docs[0].data();
    const imageUrl = data.image || data.imageUrl || data.seoImageUrl;
    
    let localImagePath = null;
    if (imageUrl) {
      localImagePath = path.join(IMAGES_DIR, `${item.slug}.png`);
      if (!fs.existsSync(localImagePath)) {
        console.log(`Downloading image for ${item.slug}...`);
        await downloadImage(imageUrl, localImagePath);
      } else {
        console.log(`Image already exists for ${item.slug}.`);
      }
    }

    batchDetails.push({
      slug: item.slug,
      title: item.title,
      category: item.category,
      price: item.price,
      description: item.metaDescription, // Or long description if required, but meta is concise
      productUrl: `https://myaccountant.co.za/services/${item.slug}`,
      imagePath: localImagePath
    });
  }

  fs.writeFileSync(CURRENT_BATCH_FILE, JSON.stringify(batchDetails, null, 2));
  console.log(`Batch details written to ${CURRENT_BATCH_FILE}`);
}

main().catch(console.error);

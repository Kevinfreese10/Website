import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { getAdminDb } from '../src/lib/firebase-admin';
import fs from 'fs';
import path from 'path';
import https from 'https';

const IMAGES_DIR = path.join('c:', 'myacc', 'scratch', 'product-images');
const PROGRESS_FILE = path.join('c:', 'myacc', 'scratch', 'import-progress.json');

async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: Status code ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function prepare() {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  const db = getAdminDb();
  console.log('Fetching services from Firestore...');
  const snapshot = await db.collection('services').get();
  console.log(`Found ${snapshot.size} services.`);

  let progressData: any[] = [];
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      progressData = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      console.log(`Loaded ${progressData.length} existing products from progress file.`);
    } catch (e) {
      console.log('Error parsing existing progress file, creating new one.');
    }
  }

  const progressMap = new Map<string, any>();
  progressData.forEach(item => progressMap.set(item.slug, item));

  const itemsToSave: any[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const slug = data.slug || doc.id;
    const title = data.title;
    const category = data.category || 'Accounting Services';
    const price = data.price || 0;
    
    // Choose description
    let description = data.description || '';
    if (data.longDescription && data.longDescription.length > description.length) {
      description = data.longDescription;
    }
    // Clean description to fit in Google's limit (usually around 1000 characters)
    if (description.length > 950) {
      description = description.substring(0, 947) + '...';
    }

    const imageUrl = data.imageUrl || data.seoImageUrl;
    let localImagePath = '';

    const existing = progressMap.get(slug);

    if (imageUrl) {
      // Determine file extension
      let ext = '.png';
      if (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg')) {
        ext = '.jpg';
      }
      const destPath = path.join(IMAGES_DIR, `${slug}${ext}`);
      
      if (fs.existsSync(destPath)) {
        console.log(`Image already exists locally for ${slug}`);
        localImagePath = destPath;
      } else {
        try {
          console.log(`Downloading image for ${slug}...`);
          await downloadFile(imageUrl, destPath);
          localImagePath = destPath;
          console.log(`Downloaded image for ${slug}`);
        } catch (err) {
          console.error(`Failed to download image for ${slug}:`, err);
        }
      }
    }

    let status = 'pending';
    // Mark 'add-director' as completed as it was already done
    if (slug === 'add-director') {
      status = 'completed';
    } else if (existing && existing.status === 'completed') {
      status = 'completed';
    }

    itemsToSave.push({
      id: doc.id,
      slug,
      title,
      category,
      price,
      description,
      localImagePath,
      status
    });
  }

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(itemsToSave, null, 2));
  console.log(`Prepared ${itemsToSave.length} items and saved to ${PROGRESS_FILE}`);
}

prepare().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});

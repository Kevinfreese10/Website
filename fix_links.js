const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const serviceAccountPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!global._firebaseAdminInitialized) {
  initializeApp({
    credential: cert(serviceAccount)
  });
  global._firebaseAdminInitialized = true;
}

const db = getFirestore();

// Helper to check if a URL is valid
function checkUrl(urlStr) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true); // Valid
        } else {
          resolve(false); // Broken (404, 500, etc)
        }
      });
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch (e) {
      resolve(false); // Invalid URL
    }
  });
}

async function run() {
  const postsRef = db.collection('blogPosts');
  const snapshot = await postsRef.get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.content) continue;
    
    let content = data.content;
    let modified = false;
    
    const linkRegex = /href="([^"]+)"/g;
    let match;
    const linksToCheck = [];
    
    // Find all links
    while ((match = linkRegex.exec(data.content)) !== null) {
      if (match[1].startsWith('http')) {
        linksToCheck.push(match[1]);
      }
    }
    
    // Deduplicate
    const uniqueLinks = [...new Set(linksToCheck)];
    
    for (const link of uniqueLinks) {
      const isOk = await checkUrl(link);
      if (!isOk) {
        // Replace with origin URL
        try {
          const origin = new URL(link).origin;
          console.log(`Fixing broken link in [${data.slug}]: ${link} -> ${origin}`);
          content = content.split(link).join(origin);
          modified = true;
        } catch(e) {}
      }
    }
    
    if (modified) {
      await postsRef.doc(doc.id).update({ content });
      console.log(`Updated post: ${data.slug}`);
    }
  }
  
  console.log("All done!");
}

run().catch(console.error);

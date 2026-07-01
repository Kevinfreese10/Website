const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const https = require('https');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json');

if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = getFirestore();

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
    const publicBlogDir = path.join('C:', 'myacc', 'public', 'blog');
    if (!fs.existsSync(publicBlogDir)){
        fs.mkdirSync(publicBlogDir, { recursive: true });
    }

    const snapshot = await db.collection('blogPosts').get();
    let count = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const title = data.title || doc.id;
        let slug = data.slug;
        if (!slug) {
            slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        }

        const fileName = `${slug}.jpg`;
        const destPath = path.join(publicBlogDir, fileName);
        const relativeUrl = `/blog/${fileName}`;

        // Construct a tailored prompt to ensure high-quality, relevant results
        const promptString = `High quality corporate stock photo, professional photography, modern South African business context, bright lighting, representing: ${title}`;
        const promptUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptString)}?width=800&height=500&nologo=true&seed=${count}`;

        console.log(`Generating image for: ${title}`);
        
        try {
            await downloadImage(promptUrl, destPath);
            await db.collection('blogPosts').doc(doc.id).update({
                imageUrl: relativeUrl
            });
            console.log(`✅ Saved ${fileName}`);
        } catch (error) {
            console.error(`❌ Failed for ${title}:`, error.message);
        }

        // Small delay to prevent rate-limiting/overloading
        await delay(3000);
        count++;
    }
    
    console.log(`Finished generating and assigning unique images for ${count} posts.`);
}

run().catch(console.error);

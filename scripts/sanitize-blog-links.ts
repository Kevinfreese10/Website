import { getAdminDb } from '../src/lib/firebase-admin';

async function sanitizeBlogLinks() {
  const db = getAdminDb();
  const postsRef = db.collection('blogPosts');
  const snap = await postsRef.get();
  
  let totalFixed = 0;

  for (const doc of snap.docs) {
    let content = doc.data().content || '';
    let modified = false;

    // We look for href="..." that contains &lt; or <
    const linkRegex = /href="([^"]+)"/g;
    let match;
    let newContent = content;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[1];
      if (url.includes('&lt;') || url.includes('<')) {
        console.log(`Found malformed link in post ${doc.id} (${doc.data().slug}): ${url}`);
        
        // Strategy: Strip out anything from &lt; or < onwards
        let fixedUrl = url;
        const ltIndex = fixedUrl.indexOf('&lt;');
        if (ltIndex !== -1) {
          fixedUrl = fixedUrl.substring(0, ltIndex);
        }
        const ltCharIndex = fixedUrl.indexOf('<');
        if (ltCharIndex !== -1) {
          fixedUrl = fixedUrl.substring(0, ltCharIndex);
        }

        // Clean up trailing slashes or weird chars if any
        if (fixedUrl.endsWith('/')) {
            fixedUrl = fixedUrl.substring(0, fixedUrl.length - 1);
        }

        console.log(`Fixing to: ${fixedUrl}`);
        newContent = newContent.replace(`href="${url}"`, `href="${fixedUrl}"`);
        modified = true;
      }
    }

    if (modified) {
      await postsRef.doc(doc.id).update({ content: newContent });
      console.log(`Updated post ${doc.id}`);
      totalFixed++;
    }
  }

  console.log(`Sanitization complete. Fixed ${totalFixed} posts.`);
}

sanitizeBlogLinks().catch(console.error);

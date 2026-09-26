import { getAdminDb } from '../src/lib/firebase-admin';

async function checkAllPostEndings() {
  const db = getAdminDb();
  const snap = await db.collection('blogPosts').get();

  console.log(`Checking ${snap.docs.length} blog posts for truncation and tag issues...\n`);

  for (const doc of snap.docs) {
    const d = doc.data();
    const content = (d.content || '').trim();
    const last100 = content.slice(-100);

    // Check if ends with punctuation or closing tag
    const endsWithTag = />$/.test(content);
    const endsWithPunctuation = /[.!?]$/.test(content.replace(/<[^>]+>/g, '').trim());

    if (!endsWithTag && !endsWithPunctuation) {
      console.log(`[SUSPICIOUS ENDING] Doc ${doc.id} (slug: ${d.slug}):`);
      console.log(`  Tail: "${last100}"\n`);
    }

    // Check for open tags at end
    const tokens = content.match(/<[^>]+>/g) || [];
    const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
    
    const stack: string[] = [];
    for (const t of tokens) {
      const match = t.match(/<\/?([a-zA-Z0-9]+)/);
      if (!match) continue;
      const tag = match[1].toLowerCase();
      if (voidTags.has(tag)) continue;
      if (t.endsWith('/>')) continue;

      if (t.startsWith('</')) {
        const idx = stack.lastIndexOf(tag);
        if (idx !== -1) {
          stack.splice(idx, 1);
        }
      } else {
        stack.push(tag);
      }
    }

    if (stack.length > 0) {
      console.log(`[UNCLOSED TAGS] Doc ${doc.id} (slug: ${d.slug}): unclosed [${stack.join(', ')}]`);
      console.log(`  Tail: "${last100}"\n`);
    }
  }
}

checkAllPostEndings().catch(console.error);

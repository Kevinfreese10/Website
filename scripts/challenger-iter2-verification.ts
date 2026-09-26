import { getAdminDb } from '../src/lib/firebase-admin';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

function auditHtml(html: string) {
  const stripped = html.replace(/<!--[\s\S]*?-->/g, '');
  const tagRegex = /<\/?([a-zA-Z0-9]+)(\s[^>]*)?(\/?)>/g;
  let match: RegExpExecArray | null;
  const counts: Record<string, { open: number; close: number }> = {};
  const stack: string[] = [];

  while ((match = tagRegex.exec(stripped)) !== null) {
    const rawTag = match[0];
    const tagName = match[1].toLowerCase();
    const isClosing = rawTag.startsWith('</');
    const isSelfClosing = match[3] === '/' || rawTag.endsWith('/>');

    if (VOID_ELEMENTS.has(tagName) || isSelfClosing) continue;

    if (!counts[tagName]) counts[tagName] = { open: 0, close: 0 };
    if (isClosing) {
      counts[tagName].close++;
      const last = stack.pop();
      // note if stack doesn't match
    } else {
      counts[tagName].open++;
      stack.push(tagName);
    }
  }

  const unbalanced = Object.entries(counts)
    .filter(([_, { open, close }]) => open !== close)
    .map(([tag, { open, close }]) => ({ tag, open, close }));

  return { unbalanced, counts, stackRemainder: stack };
}

async function main() {
  console.log('=== CHALLENGER ITERATION 2 ADVERSARIAL VERIFICATION ===\n');

  const adminDb = getAdminDb();
  let failed = false;

  // 1. blogPosts/NHaTQqDokqYz1STpfFX9
  console.log('--- Checking blogPosts/NHaTQqDokqYz1STpfFX9 ---');
  const snap1 = await adminDb.collection('blogPosts').doc('NHaTQqDokqYz1STpfFX9').get();
  if (!snap1.exists) {
    console.error('FAIL: NHaTQqDokqYz1STpfFX9 does not exist in Firestore!');
    failed = true;
  } else {
    const data = snap1.data()!;
    const content = data.content as string;

    const audit = auditHtml(content);
    console.log('HTML Audit:', JSON.stringify(audit.unbalanced));

    const olOpen = (content.match(/<ol\b[^>]*>/gi) || []).length;
    const olClose = (content.match(/<\/ol>/gi) || []).length;
    const liOpen = (content.match(/<li\b[^>]*>/gi) || []).length;
    const liClose = (content.match(/<\/li>/gi) || []).length;

    console.log(`ol tags: open=${olOpen}, close=${olClose}`);
    console.log(`li tags: open=${liOpen}, close=${liClose}`);

    if (olOpen !== olClose || olOpen === 0) {
      console.error(`FAIL: Unbalanced <ol> tags: ${olOpen} open vs ${olClose} close`);
      failed = true;
    } else {
      console.log('PASS: <ol> tags perfectly balanced.');
    }

    if (liOpen !== liClose || liOpen === 0) {
      console.error(`FAIL: Unbalanced <li> tags: ${liOpen} open vs ${liClose} close`);
      failed = true;
    } else {
      console.log('PASS: <li> tags perfectly balanced.');
    }

    // Check sentence completion
    console.log('Last 250 characters of NHaTQqDokqYz1STpfFX9:');
    console.log(content.slice(-250));
    if (content.includes('where you should find an option to \n') || content.trim().endsWith('where you should find an option to')) {
      console.error('FAIL: Sentence still truncated at "where you should find an option to"');
      failed = true;
    } else {
      console.log('PASS: Sentence is complete and ends properly.');
    }
  }

  // 2. blogPosts/BmXeaVKj7HlX0hHeis3x
  console.log('\n--- Checking blogPosts/BmXeaVKj7HlX0hHeis3x ---');
  const snap2 = await adminDb.collection('blogPosts').doc('BmXeaVKj7HlX0hHeis3x').get();
  if (!snap2.exists) {
    console.error('FAIL: BmXeaVKj7HlX0hHeis3x does not exist in Firestore!');
    failed = true;
  } else {
    const data = snap2.data()!;
    const content = data.content as string;

    const audit = auditHtml(content);
    console.log('HTML Audit:', JSON.stringify(audit.unbalanced));

    const pOpen = (content.match(/<p\b[^>]*>/gi) || []).length;
    const pClose = (content.match(/<\/p>/gi) || []).length;
    console.log(`p tags: open=${pOpen}, close=${pClose}`);

    if (pOpen !== pClose) {
      console.error(`FAIL: Unbalanced <p> tags: ${pOpen} open vs ${pClose} close`);
      failed = true;
    } else {
      console.log('PASS: <p> tags perfectly balanced.');
    }

    console.log('Last 250 characters of BmXeaVKj7HlX0hHeis3x:');
    console.log(content.slice(-250));
    if (content.includes('individuals are \n') || content.trim().endsWith('individuals are')) {
      console.error('FAIL: Sentence still truncated at "individuals are"');
      failed = true;
    } else {
      console.log('PASS: Sentence is complete and ends with closing tag.');
    }
  }

  // 3. blogPosts/yvHjOj1gwpiaMZMp8oXA
  console.log('\n--- Checking blogPosts/yvHjOj1gwpiaMZMp8oXA ---');
  const snap3 = await adminDb.collection('blogPosts').doc('yvHjOj1gwpiaMZMp8oXA').get();
  if (!snap3.exists) {
    console.error('FAIL: yvHjOj1gwpiaMZMp8oXA does not exist in Firestore!');
    failed = true;
  } else {
    const data = snap3.data()!;
    const content = data.content as string;

    const hasBackticks = content.includes('`');
    console.log(`Contains backticks: ${hasBackticks}`);
    if (hasBackticks) {
      console.error('FAIL: Content contains backticks!');
      failed = true;
    } else {
      console.log('PASS: No backticks found in content.');
    }
    console.log('Last 150 characters of yvHjOj1gwpiaMZMp8oXA:');
    console.log(content.slice(-150));
  }

  // 4. blogPosts/SCWeQaAJIsAjh3L9xrIz and BPXcPqPy6eVydBREP4wc
  console.log('\n--- Checking slug collision between SCWeQaAJIsAjh3L9xrIz & BPXcPqPy6eVydBREP4wc ---');
  const snap4a = await adminDb.collection('blogPosts').doc('SCWeQaAJIsAjh3L9xrIz').get();
  const snap4b = await adminDb.collection('blogPosts').doc('BPXcPqPy6eVydBREP4wc').get();

  if (!snap4a.exists || !snap4b.exists) {
    console.error('FAIL: One of the documents does not exist!');
    failed = true;
  } else {
    const slugA = snap4a.data()!.slug;
    const slugB = snap4b.data()!.slug;
    console.log(`SCWeQaAJIsAjh3L9xrIz slug: "${slugA}"`);
    console.log(`BPXcPqPy6eVydBREP4wc slug: "${slugB}"`);

    const expectedSlugA = 'beneficial-ownership-register-south-africa-guide';
    if (slugA !== expectedSlugA) {
      console.error(`FAIL: SCWeQaAJIsAjh3L9xrIz slug is "${slugA}", expected "${expectedSlugA}"`);
      failed = true;
    } else {
      console.log(`PASS: SCWeQaAJIsAjh3L9xrIz slug matches "${expectedSlugA}".`);
    }

    if (slugA === slugB) {
      console.error(`FAIL: Slugs collide: "${slugA}" vs "${slugB}"`);
      failed = true;
    } else {
      console.log('PASS: Slugs are distinct.');
    }

    // Check querying each by slug
    const queryA = await adminDb.collection('blogPosts').where('slug', '==', slugA).get();
    const queryB = await adminDb.collection('blogPosts').where('slug', '==', slugB).get();
    console.log(`Query for slugA returned ${queryA.size} document(s).`);
    console.log(`Query for slugB returned ${queryB.size} document(s).`);

    if (queryA.size !== 1 || queryA.docs[0].id !== 'SCWeQaAJIsAjh3L9xrIz') {
      console.error(`FAIL: Query for slugA did not return exactly SCWeQaAJIsAjh3L9xrIz!`);
      failed = true;
    }
    if (queryB.size !== 1 || queryB.docs[0].id !== 'BPXcPqPy6eVydBREP4wc') {
      console.error(`FAIL: Query for slugB did not return exactly BPXcPqPy6eVydBREP4wc!`);
      failed = true;
    }
  }

  // 5. Global slug collision & layout container check on all 76 posts
  console.log('\n--- Checking all 76 posts for slug collisions & layout container integrity ---');
  const allPostsSnap = await adminDb.collection('blogPosts').get();
  console.log(`Total blog posts in Firestore: ${allPostsSnap.size}`);
  if (allPostsSnap.size !== 76) {
    console.error(`FAIL: Expected 76 blog posts, found ${allPostsSnap.size}`);
    failed = true;
  }

  const slugMap = new Map<string, string>();
  let unclosedContainerCount = 0;

  for (const doc of allPostsSnap.docs) {
    const data = doc.data();
    const slug = data.slug;
    if (slugMap.has(slug)) {
      console.error(`FAIL: Slug collision: slug "${slug}" in doc ${doc.id} already used in doc ${slugMap.get(slug)}`);
      failed = true;
    } else {
      slugMap.set(slug, doc.id);
    }

    const content = data.content as string;
    // Check critical container balance: ol, ul, blockquote
    const olO = (content.match(/<ol\b[^>]*>/gi) || []).length;
    const olC = (content.match(/<\/ol>/gi) || []).length;
    const ulO = (content.match(/<ul\b[^>]*>/gi) || []).length;
    const ulC = (content.match(/<\/ul>/gi) || []).length;
    const bqO = (content.match(/<blockquote\b[^>]*>/gi) || []).length;
    const bqC = (content.match(/<\/blockquote>/gi) || []).length;

    if (olO !== olC || ulO !== ulC || bqO !== bqC) {
      console.error(`FAIL: Doc ${doc.id} (${slug}) has unclosed container: ol(${olO}/${olC}), ul(${ulO}/${ulC}), bq(${bqO}/${bqC})`);
      unclosedContainerCount++;
      failed = true;
    }
  }

  if (slugMap.size === 76) {
    console.log('PASS: All 76 blog posts have unique slugs.');
  }
  if (unclosedContainerCount === 0) {
    console.log('PASS: Zero unclosed layout containers across all 76 blog posts.');
  }

  console.log('\n======================================================');
  if (failed) {
    console.error('CHALLENGER ITERATION 2 VERDICT: REJECT (Failures detected)');
    process.exit(1);
  } else {
    console.log('CHALLENGER ITERATION 2 VERDICT: APPROVE (All requirements passed)');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

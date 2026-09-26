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
      if (stack.length > 0 && stack[stack.length - 1] === tagName) {
        stack.pop();
      } else {
        stack.push(`UNMATCHED_CLOSE_${tagName}`);
      }
    } else {
      counts[tagName].open++;
      stack.push(tagName);
    }
  }

  const unbalanced = Object.entries(counts).filter(([_, c]) => c.open !== c.close);
  return { unbalanced, stackRemainder: stack };
}

async function fixEdgeCases() {
  const db = getAdminDb();
  console.log('Starting legacy edge cases remediation...\n');

  // 1. NHaTQqDokqYz1STpfFX9: Fix unclosed <ol> and <li> tags in content
  const doc1Ref = db.collection('blogPosts').doc('NHaTQqDokqYz1STpfFX9');
  const doc1Snap = await doc1Ref.get();
  if (!doc1Snap.exists) throw new Error('Doc NHaTQqDokqYz1STpfFX9 not found');
  let content1 = doc1Snap.data()!.content as string;

  const targetSuffix1 = 'where you should find an option to ';
  if (content1.includes(targetSuffix1)) {
    const completion1 = 'request penalty remission (RFR) or dispute the assessment. Complete the required details, detail your grounds for reasonable cause, and upload all supporting documentation.</li><li><strong>Await Outcome and Follow Up:</strong> SARS will review your submission and issue an outcome letter. If your remission request is declined, you have 30 business days to lodge a formal Notice of Objection.</li></ol><p>Navigating SARS penalty disputes can be challenging and time-sensitive. If you require expert guidance, <a href="/contact">contact My Accountant</a> to assist with your SARS penalty remission application.</p>';
    content1 = content1.replace(targetSuffix1, targetSuffix1 + completion1);
    const audit1 = auditHtml(content1);
    console.log('NHaTQqDokqYz1STpfFX9 HTML audit after fix:', audit1);
    if (audit1.unbalanced.length > 0) throw new Error('NHaTQqDokqYz1STpfFX9 still has unbalanced tags!');
    await doc1Ref.update({ content: content1 });
    console.log('Updated NHaTQqDokqYz1STpfFX9 successfully.\n');
  } else {
    console.log('NHaTQqDokqYz1STpfFX9 target suffix not found or already fixed.\n');
  }

  // 2. BmXeaVKj7HlX0hHeis3x: Fix unclosed <p> tag in content
  const doc2Ref = db.collection('blogPosts').doc('BmXeaVKj7HlX0hHeis3x');
  const doc2Snap = await doc2Ref.get();
  if (!doc2Snap.exists) throw new Error('Doc BmXeaVKj7HlX0hHeis3x not found');
  let content2 = doc2Snap.data()!.content as string;

  const targetSuffix2 = 'The NCR assesses whether the applicant and its key individuals are ';
  if (content2.includes(targetSuffix2)) {
    const completion2 = 'fit and proper persons to operate a credit business in South Africa. This involves vetting directors, managers, and major shareholders for financial integrity, competence, and the absence of any disqualifying criminal convictions or insolvency proceedings.</p><h3>Submitting Your Application</h3><p>Once all statutory documentation and application forms (Form 2) are completed, the application pack along with proof of payment for the NCR application and annual registration fee is submitted directly to the National Credit Regulator for evaluation.</p><p>For professional guidance and hands-on support in preparing and lodging your compliance pack, <a href="/contact">contact My Accountant</a> today.</p>';
    content2 = content2.replace(targetSuffix2, targetSuffix2 + completion2);
    const audit2 = auditHtml(content2);
    console.log('BmXeaVKj7HlX0hHeis3x HTML audit after fix:', audit2);
    if (audit2.unbalanced.length > 0) throw new Error('BmXeaVKj7HlX0hHeis3x still has unbalanced tags!');
    await doc2Ref.update({ content: content2 });
    console.log('Updated BmXeaVKj7HlX0hHeis3x successfully.\n');
  } else {
    console.log('BmXeaVKj7HlX0hHeis3x target suffix not found or already fixed.\n');
  }

  // 3. yvHjOj1gwpiaMZMp8oXA: Remove trailing literal markdown ticks (\n```\n) in content
  const doc3Ref = db.collection('blogPosts').doc('yvHjOj1gwpiaMZMp8oXA');
  const doc3Snap = await doc3Ref.get();
  if (!doc3Snap.exists) throw new Error('Doc yvHjOj1gwpiaMZMp8oXA not found');
  let content3 = doc3Snap.data()!.content as string;

  if (content3.includes('```')) {
    content3 = content3.replace(/```+\s*$/g, '').trim();
    const audit3 = auditHtml(content3);
    console.log('yvHjOj1gwpiaMZMp8oXA HTML audit after fix:', audit3);
    if (audit3.unbalanced.length > 0) throw new Error('yvHjOj1gwpiaMZMp8oXA has unbalanced tags!');
    await doc3Ref.update({ content: content3 });
    console.log('Updated yvHjOj1gwpiaMZMp8oXA successfully.\n');
  } else {
    console.log('yvHjOj1gwpiaMZMp8oXA markdown ticks not found or already cleaned.\n');
  }

  // 4. SCWeQaAJIsAjh3L9xrIz: Rename duplicate slug to beneficial-ownership-register-south-africa-guide
  const doc4Ref = db.collection('blogPosts').doc('SCWeQaAJIsAjh3L9xrIz');
  const doc4Snap = await doc4Ref.get();
  if (!doc4Snap.exists) throw new Error('Doc SCWeQaAJIsAjh3L9xrIz not found');
  const data4 = doc4Snap.data()!;
  let content4 = data4.content as string;
  if (!content4.endsWith('</p>')) {
    content4 = content4.trim() + '</p>';
  }
  const audit4 = auditHtml(content4);
  console.log('SCWeQaAJIsAjh3L9xrIz HTML audit after fix:', audit4);
  if (audit4.unbalanced.length > 0) throw new Error('SCWeQaAJIsAjh3L9xrIz has unbalanced tags!');

  const newSlug = 'beneficial-ownership-register-south-africa-guide';
  await doc4Ref.update({
    slug: newSlug,
    content: content4,
  });
  console.log(`Updated SCWeQaAJIsAjh3L9xrIz slug to "${newSlug}" and closed trailing </p>.\n`);

  console.log('All legacy edge cases successfully remediated in Firestore!');
}

fixEdgeCases().catch(err => {
  console.error('Error remediating legacy edge cases:', err);
  process.exit(1);
});

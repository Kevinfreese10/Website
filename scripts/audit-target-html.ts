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

async function main() {
  const db = getAdminDb();
  const ids = [
    'NHaTQqDokqYz1STpfFX9',
    'BmXeaVKj7HlX0hHeis3x',
    'yvHjOj1gwpiaMZMp8oXA',
    'SCWeQaAJIsAjh3L9xrIz',
    'BPXcPqPy6eVydBREP4wc'
  ];

  for (const id of ids) {
    const doc = await db.collection('blogPosts').doc(id).get();
    if (!doc.exists) continue;
    const data = doc.data()!;
    const res = auditHtml(data.content || '');
    console.log(`=== ID: ${id} (${data.slug}) ===`);
    console.log('Unbalanced tags:', res.unbalanced);
    console.log('Stack remainder:', res.stackRemainder.slice(-10));
    console.log('');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

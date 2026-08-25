/**
 * Renders every registered template with sample fields to /tmp/docs-smoke. No Firestore.
 *   npx tsx scripts/smoke-render-documents.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { TEMPLATES } from '../src/lib/documents/registry';
import { SAMPLE_FIELDS } from './smoke-sample-fields';

async function main() {
  const out = '/tmp/docs-smoke';
  fs.mkdirSync(out, { recursive: true });
  let failed = 0;
  for (const [id, tpl] of Object.entries(TEMPLATES)) {
    const fields = SAMPLE_FIELDS[id];
    if (!fields) { console.log(`?  ${id}: no sample fields`); failed++; continue; }
    try {
      const r = await tpl.render(fields, { signed: false, date: '2026-08-24' });
      fs.writeFileSync(path.join(out, `${id}.pdf`), r.buffer);
      console.log(`✔  ${id}: ${r.pageCount} page(s), ${r.buffer.length} bytes${r.warnings.length ? ' — warnings: ' + r.warnings.join(' | ') : ''}`);
      if (tpl.signature === 'kevin') {
        const s = await tpl.render(fields, { signed: true, date: '2026-08-24' });
        fs.writeFileSync(path.join(out, `${id}.SIGNED.pdf`), s.buffer);
      }
    } catch (e: any) {
      failed++; console.log(`✖  ${id}: ${e.message}`);
    }
  }
  console.log(failed ? `${failed} failed` : 'all templates rendered');
  process.exit(failed ? 1 : 0);
}
main();

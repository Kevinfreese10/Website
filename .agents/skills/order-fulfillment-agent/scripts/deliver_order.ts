/**
 * Posts an approved deliverable pack to the order's Communication History.
 *
 * There is no automatic posting: the old confidence-based auto-post, the `orders/{id}/notes`
 * subcollection writes (invisible in the portal), and fuzzy SOP checklist completion were removed.
 * Delivery always goes through approveAndPostOrderPack, which posts only the exact files and
 * text frozen in the review manifest that Kevin approved.
 *
 * Usage:
 *   tsx deliver_order.ts --order-id <ID> --approve-and-post [--manifest <path>] [--note-file <path>] [--force]
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { approveAndPostOrderPack, findLatestReviewManifest } from '../../../../src/lib/agent/order-audit-pipeline';

async function main() {
  const args = process.argv.slice(2);
  const argVal = (name: string) => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : undefined; };
  const orderId = argVal('--order-id');

  if (!orderId) {
    console.error('Usage: tsx deliver_order.ts --order-id <ID> --approve-and-post [--manifest <path>] [--note-file <path>] [--force]');
    process.exit(1);
  }

  if (!args.includes('--approve-and-post')) {
    const manifest = findLatestReviewManifest(orderId);
    console.log('Nothing posted. Delivery requires Kevin\'s explicit approval.');
    console.log(manifest
      ? `Latest review manifest: ${manifest}\nAfter Kevin approves it, re-run with --approve-and-post.`
      : 'No review manifest yet. Run: audit_order.ts audit --order-id <ID>');
    return;
  }

  const noteFile = argVal('--note-file');
  const res = await approveAndPostOrderPack(orderId, 'Kevin Freese', true, {
    manifestPath: argVal('--manifest'),
    noteText: noteFile ? fs.readFileSync(noteFile, 'utf8') : undefined,
    force: args.includes('--force'),
  });
  console.log(JSON.stringify(res, null, 2));
}

main().catch(err => {
  console.error('Fatal Error:', err.message || err);
  process.exit(1);
});

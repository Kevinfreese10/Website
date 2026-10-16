/**
 * CLI and programmatic entry point for the order-fulfillment-agent skill.
 * Usage:
 *   npx tsx scripts/order_audit_pipeline.ts --order-id <ID> [--live]
 *   npx tsx scripts/order_audit_pipeline.ts --order-id <ID> --approve-and-post [--manifest <path>] [--note-file <path>] [--force]
 *
 * Dry-run is the default. --live dispatches the review email (to Kevin) or Tax Rep dossier.
 */

import * as fs from 'fs';
import { runOrderAuditPipeline, approveAndPostOrderPack } from '../../../../src/lib/agent/order-audit-pipeline';

export { runOrderAuditPipeline, approveAndPostOrderPack };

async function main() {
  const args = process.argv.slice(2);
  const argVal = (name: string) => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : undefined; };
  const orderId = argVal('--order-id');

  if (!orderId) {
    console.error('Usage: npx tsx scripts/order_audit_pipeline.ts --order-id <ID> [--live] | --approve-and-post [--manifest <path>] [--note-file <path>] [--force]');
    process.exit(1);
  }

  const dryRun = !args.includes('--live');
  const approveAndPost = args.includes('--approve-and-post');

  if (approveAndPost) {
    console.log(`[order_audit_pipeline] Approving and committing deliverables for Order #${orderId}...`);
    const noteFile = argVal('--note-file');
    const res = await approveAndPostOrderPack(orderId, 'Kevin Freese', true, {
      manifestPath: argVal('--manifest'),
      noteText: noteFile ? fs.readFileSync(noteFile, 'utf8') : undefined,
      force: args.includes('--force'),
    });
    console.log(`[order_audit_pipeline] Deliverables committed successfully. Note ID: ${res.noteId} (manifest: ${res.manifestPath})`);
    process.exit(0);
  }

  console.log(`[order_audit_pipeline] Running audit and statutory document generation for Order #${orderId} (dryRun=${dryRun})...`);
  const result = await runOrderAuditPipeline({
    orderId,
    dryRun,
  });

  console.log('\n=============================================================');
  console.log(`ORDER AUDIT COMPLETE: #${result.orderNumber} (${result.entityName})`);
  console.log('=============================================================');
  console.log(`Service: ${result.serviceTitle}`);
  console.log(`Customer: ${result.customerName} (${result.customerEmail})`);
  console.log('\nForensic & Compliance Checklist:');
  result.forensicChecks.forEach(c => {
    console.log(`- [${c.status.toUpperCase()}] ${c.name}: ${c.details}`);
  });

  console.log('\nGenerated Statutory Deliverables:');
  result.documentsGenerated.forEach(d => {
    console.log(`- ${d.fileName} (${d.pageCount} page(s), Single-Page Compliant: ${d.isSinglePageBudgetCompliant})`);
    console.log(`  Local Path: ${d.localPath}`);
  });

  console.log('\nProposed Client Communication Note (Clean Plain Text):');
  console.log('-------------------------------------------------------------');
  console.log(result.proposedClientCommunication);
  console.log('-------------------------------------------------------------');

  console.log(`\nReview Email Status: ${result.reviewEmailSent ? `DISPATCHED to ${result.reviewEmail.to}` : 'PREPARED (Dry-Run)'}`);
  console.log(`Portal Notes Modified: ${result.portalNotesModified} (Strict Invariant Preserved)`);
  console.log('=============================================================\n');
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal Error in order_audit_pipeline:', err.message || err);
    process.exit(1);
  });
}

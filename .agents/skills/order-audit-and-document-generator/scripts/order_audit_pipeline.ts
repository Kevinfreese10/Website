/**
 * CLI and programmatic entry point for order-audit-and-document-generator skill.
 * Usage:
 *   npx tsx scripts/order_audit_pipeline.ts --order-id <ID> [--dry-run] [--approve-and-post]
 */

import { runOrderAuditPipeline, approveAndPostOrderPack } from '../../../../src/lib/agent/order-audit-pipeline';

export { runOrderAuditPipeline, approveAndPostOrderPack };

async function main() {
  const args = process.argv.slice(2);
  const orderIdIdx = args.indexOf('--order-id');
  const orderId = orderIdIdx !== -1 ? args[orderIdIdx + 1] : undefined;

  if (!orderId) {
    console.error('Usage: npx tsx scripts/order_audit_pipeline.ts --order-id <ID> [--dry-run] [--approve-and-post]');
    process.exit(1);
  }

  const dryRun = args.includes('--dry-run');
  const approveAndPost = args.includes('--approve-and-post');

  if (approveAndPost) {
    console.log(`[order_audit_pipeline] Approving and committing deliverables for Order #${orderId}...`);
    const res = await approveAndPostOrderPack(orderId, 'Kevin Freese');
    console.log(`[order_audit_pipeline] Deliverables committed successfully. Note ID: ${res.noteId}`);
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

  console.log(`\nReview Email Status: ${result.reviewEmailSent ? 'DISPATCHED to kev@thinkestry.co.za' : 'PREPARED (Dry-Run)'}`);
  console.log(`Portal Notes Modified: ${result.portalNotesModified} (Strict Invariant Preserved)`);
  console.log('=============================================================\n');
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal Error in order_audit_pipeline:', err);
    process.exit(1);
  });
}

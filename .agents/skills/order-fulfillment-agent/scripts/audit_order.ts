import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Repo env wins; the legacy scratch .env only fills gaps (it used to override .env.local).
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const scratchEnv = 'C:/Users/kev/.gemini/antigravity/scratch/.env';
if (fs.existsSync(scratchEnv)) {
  dotenv.config({ path: scratchEnv });
}

import { getAdminDb } from '../../../../src/lib/firebase-admin';
import { Order } from '../../../../src/lib/types';
import { runOrderAuditPipeline, resolveOrderDoc, approveAndPostOrderPack } from '../../../../src/lib/agent/order-audit-pipeline';
import { getTemplate } from '../../../../src/lib/documents/registry';
import { buildOrderDocumentContext } from '../../../../src/lib/documents/context';

async function getOrder(orderId: string): Promise<Order> {
  const db = getAdminDb();
  const { doc, data } = await resolveOrderDoc(db, orderId);
  return { id: doc.id, ...data } as Order;
}

async function fetchCmd(orderId: string) {
  const order = await getOrder(orderId);
  console.log('====================================================');
  console.log(`ORDER SNAPSHOT: #${order.id}`);
  console.log('====================================================');
  console.log(`Client: ${order.customerName} (${order.customerEmail})`);
  console.log(`Status: ${order.status} | Fulfillment: ${order.fulfillmentStatus || 'Awaiting Documents'}`);
  console.log(`Service: ${order.items?.map(i => i.title).join(', ') || 'N/A'}`);
  console.log(`Created: ${order.createdAt}`);
  
  console.log('\n--- EXTRACTED / STORED ENTITY DETAILS ---');
  console.log(`Company Name: ${(order as any).companyName || (order as any).clientEntityName || 'N/A'}`);
  console.log(`Reg Number: ${(order as any).companyRegistrationNumber || (order as any).regNumber || 'N/A'}`);
  console.log(`Tax Number: ${(order as any).taxNumber || (order as any).sarsTaxNumber || 'N/A'}`);
  console.log(`Director: ${(order as any).directorName || order.customerName}`);
  console.log(`Director ID: ${(order as any).idNumber || (order as any).directorIdNumber || 'N/A'}`);
  console.log(`Registered Address: ${(order as any).address || (order as any).registeredAddress || 'N/A'}`);

  console.log('\n--- UPLOADED DOCUMENTS ---');
  const uploads = order.documentUploads || [];
  if (uploads.length === 0) {
    console.log('No documents uploaded yet.');
  } else {
    uploads.forEach((doc, idx) => {
      const aiStatus = doc.aiVerification ? `[AI: ${doc.aiVerification.recommendation.toUpperCase()} (${doc.aiVerification.confidence}%)]` : '[No AI verification]';
      console.log(`${idx + 1}. [${doc.status.toUpperCase()}] ${doc.requirementLabel || doc.id} - ${doc.fileUrl || doc.textValue || 'No file'} ${aiStatus}`);
    });
  }

  console.log('\n--- SOP CHECKLIST PROGRESS ---');
  const checklist = order.checklist || [];
  if (checklist.length === 0) {
    console.log('No SOP checklist initialized.');
  } else {
    checklist.forEach((step, idx) => {
      const art = step.artifactUrl ? `(Artifact: ${step.artifactUrl})` : '';
      console.log(`${idx + 1}. [${step.status.toUpperCase()}] ${step.title} ${art}`);
    });
  }

  console.log('\n--- COMMUNICATION HISTORY (NOTES) ---');
  const notes = (order as any).notes || [];
  if (notes.length === 0) {
    console.log('No notes posted yet.');
  } else {
    notes.forEach((n: any, idx: number) => {
      const when = n.date?.toDate ? n.date.toDate().toISOString() : (n.date || n.createdAt || n.timestamp);
      const visibility = n.isInternal ? 'INTERNAL' : 'CLIENT-VISIBLE';
      console.log(`\nNote #${idx + 1} | ${visibility} | Author: ${n.authorName || n.author || n.userName} | Date: ${when}${n.subject ? ` | ${n.subject}` : ''}`);
      console.log(n.text || n.message || n.content);
      if (n.attachments?.length) {
        console.log('Attachments:', n.attachments.map((a: any) => a.fileName || a.name).join(', '));
      }
    });
  }
}

async function auditCmd(orderId: string, dryRun: boolean = true, force: boolean = false) {
  console.log(`Executing full audit and statutory document generation pipeline for Order #${orderId}... (force: ${force})`);
  const result = await runOrderAuditPipeline({ orderId, dryRun, forceRegenerate: force });
  console.log('\n====================================================');
  console.log(`AUDIT FINISHED: #${result.orderNumber} (${result.entityName})`);
  console.log('====================================================');
  console.log(`Service: ${result.serviceTitle}`);
  console.log(`Audit Passed: ${result.auditPassed}`);
  console.log(`Documents Generated: ${result.documentsGenerated.length}`);
  result.documentsGenerated.forEach(d => {
    console.log(`- ${d.fileName} (${d.pageCount} page(s), Single-Page Compliant: ${d.isSinglePageBudgetCompliant})`);
  });
  console.log('\nProposed Client Communication Note:');
  console.log(result.proposedClientCommunication);
  console.log(`\nReview Email Status: ${result.reviewEmailSent ? 'Sent to Kevin' : 'Prepared (dry-run)'}`);
}

async function approveCmd(orderId: string, opts: { manifestPath?: string; noteText?: string; force?: boolean }) {
  console.log(`Executing explicit sign-off and portal commit for Order #${orderId}...`);
  const res = await approveAndPostOrderPack(orderId, 'Kevin Freese', true, opts);
  console.log(`Manifest: ${res.manifestPath}`);
  console.log('\n====================================================');
  console.log(`ORDER SIGN-OFF COMMITTED: #${orderId}`);
  console.log('====================================================');
  console.log(`Success: ${res.success}`);
  console.log(`Portal Note ID: ${res.noteId}`);
  console.log(`Attachments Uploaded: ${res.attachmentsCount}`);
  console.log(`Status Updated: ${res.statusUpdated ? 'Advanced to Waiting on Customer' : 'Maintained current'}`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const orderIdIdx = args.indexOf('--order-id');
  const orderId = orderIdIdx !== -1 ? args[orderIdIdx + 1] : undefined;

  if (!orderId) {
    console.error('Usage: npx tsx scripts/audit_order.ts <fetch|audit|approve> --order-id <ID> [--live] [--force] [--manifest <path>] [--note-file <path>]');
    process.exit(1);
  }
  const argVal = (name: string) => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : undefined; };

  const dryRun = !args.includes('--live');
  const force = args.includes('--force');
  const approveAndPost = command === 'approve' || args.includes('--approve-and-post');

  if (approveAndPost) {
    const noteFile = argVal('--note-file');
    await approveCmd(orderId, {
      manifestPath: argVal('--manifest'),
      noteText: noteFile ? fs.readFileSync(noteFile, 'utf8') : undefined,
      force,
    });
  } else if (command === 'fetch' || command === 'status') {
    await fetchCmd(orderId);
  } else if (command === 'audit' || command === 'generate' || command === 'run' || command?.startsWith('--')) {
    await auditCmd(orderId, dryRun, force);
  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});

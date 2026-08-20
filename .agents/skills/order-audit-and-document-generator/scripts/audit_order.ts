import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../../../../src/lib/firebase-admin';
import { Order } from '../../../../src/lib/types';
import * as generators from '../../../../src/lib/pdf/template-generators';

async function getOrder(orderId: string): Promise<Order> {
  const db = getAdminDb();
  const doc = await db.collection('orders').doc(orderId).get();
  if (!doc.exists) {
    throw new Error(`Order #${orderId} not found in Firestore.`);
  }
  return { id: doc.id, ...doc.data() } as Order;
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
}

async function generateCmd(orderId: string, docType: string) {
  const order = await getOrder(orderId);
  const outDir = path.resolve(process.cwd(), `scratch/order_${orderId}_audit`);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const results: { name: string; path: string; size: number }[] = [];

  const genMap: Record<string, Function> = {
    'accounting-officer-letter': generators.generateAccountingOfficerConsentDraft,
    'ncr-form-2': generators.generateNcrForm2Draft,
    'ncr-director-resolution': generators.generateNcrDirectorResolutionDraft,
    'ncr-annexure-fees': generators.generateNcrAnnexureFeesDraft,
    'share-certificate': generators.generateShareCertificateDraft,
    'tp-poa': generators.generatePowerOfAttorneyResolutionDraft,
    'engagement-letter': generators.generateEngagementLetterDraft,
    'sars-public-officer-resolution': generators.generateSarsPublicOfficerResolutionDraft,
    'accountants-letter': generators.generateAccountantsLetterDraft,
    'coida-cf1b': generators.generateCoidaCf1bApplicationDraft,
  };

  const docsToGenerate = docType === 'all' ? Object.keys(genMap) : [docType];

  for (const key of docsToGenerate) {
    const fn = genMap[key];
    if (!fn) {
      console.warn(`Unknown document generator: ${key}`);
      continue;
    }

    try {
      const draft = await fn(order);
      const filePath = path.join(outDir, draft.fileName);
      fs.writeFileSync(filePath, draft.buffer);
      results.push({
        name: draft.fileName,
        path: filePath,
        size: draft.buffer.length,
      });
      console.log(`Generated: ${draft.fileName} (${draft.buffer.length} bytes)`);
    } catch (err: any) {
      console.error(`Failed to generate ${key}:`, err.message);
    }
  }

  console.log('\n====================================================');
  console.log(`GENERATION COMPLETE — ${results.length} DOCUMENT(S) READY FOR KEVIN'S REVIEW`);
  console.log('Output directory:', outDir);
  console.log('====================================================');
  results.forEach(r => console.log(`- ${r.name} (${r.size} bytes)`));
  console.log('\nCheckpoint: Please review these documents before running deliver_order.ts.');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const orderIdIdx = args.indexOf('--order-id');
  const orderId = orderIdIdx !== -1 ? args[orderIdIdx + 1] : undefined;

  if (!orderId) {
    console.error('Usage: npx tsx scripts/audit_order.ts <fetch|generate> --order-id <ID> [--doc <id|all>]');
    process.exit(1);
  }

  if (command === 'fetch' || command === 'status') {
    await fetchCmd(orderId);
  } else if (command === 'generate') {
    const docIdx = args.indexOf('--doc');
    const docType = docIdx !== -1 ? args[docIdx + 1] : 'accounting-officer-letter';
    await generateCmd(orderId, docType);
  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});

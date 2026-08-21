import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';
import { Order } from '../src/lib/types';
import * as generators from '../src/lib/pdf/template-generators';

async function generateOrder10135Pack() {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc('10135');
  const snap = await orderRef.get();
  if (!snap.exists) {
    throw new Error('Order 10135 not found');
  }

  const rawOrder = snap.data() as Order;

  // Enrich order with extracted entity details
  const enrichedEntity = {
    companyName: 'FIRST BLOOM FINANCE (PTY) LTD',
    regNumber: '2026/507901/07',
    taxNumber: 'N/A',
    customerName: 'Peturnia Tiyiselani Mavundlha',
    directorName: 'Peturnia Tiyiselani Mavundlha',
    idNumber: '9901300233087',
    address: 'Stand No 51, Makhushane, Phalaborwa, Limpopo, 1390',
    phone: '0760422792',
    email: 'peturniamavundlha@gmail.com',
    bankName: 'Standard Bank',
    accountNumber: '0000010284230314',
    branchCode: '051001',
    shareholderName: 'Peturnia Tiyiselani Mavundlha',
    sharePercentage: '100%',
    numberOfShares: '100',
    orderId: '10135',
    orderDate: '21 August 2026',
  };

  // Update order in Firestore with enriched company info
  await orderRef.update({
    companyName: enrichedEntity.companyName,
    clientEntityName: enrichedEntity.companyName,
    companyRegistrationNumber: enrichedEntity.regNumber,
    directorName: enrichedEntity.directorName,
    idNumber: enrichedEntity.idNumber,
    registeredAddress: enrichedEntity.address,
    updatedAt: new Date().toISOString(),
  });
  console.log('✓ Updated Order #10135 entity metadata in Firestore.');

  const orderForGen: Order = {
    ...rawOrder,
    ...enrichedEntity,
  } as any;

  const outDir = path.resolve('scratch/order_10135_audit/generated_statutory_pack');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const docs = [
    { name: 'Accounting Officer Appointment Letter', fn: generators.generateAccountingOfficerConsentDraft },
    { name: 'NCR Form 2 — Application for Registration', fn: generators.generateNcrForm2Draft },
    { name: 'NCR Director Resolution & Signatory Mandate', fn: generators.generateNcrDirectorResolutionDraft },
    { name: 'Third Party Power of Attorney (TP-POA)', fn: generators.generatePowerOfAttorneyResolutionDraft },
    { name: 'NCR Annexure: Confirmation of Payment of Fees', fn: generators.generateNcrAnnexureFeesDraft },
    { name: 'Share Certificate', fn: generators.generateShareCertificateDraft },
  ];

  console.log('\n--- Generating Complete Statutory NCR Document Pack ---');
  const generatedFiles: { name: string; filename: string; size: number; path: string }[] = [];

  for (const doc of docs) {
    try {
      const result = await doc.fn(orderForGen, enrichedEntity);
      const filePath = path.join(outDir, result.fileName);
      fs.writeFileSync(filePath, result.buffer);
      generatedFiles.push({
        name: doc.name,
        filename: result.fileName,
        size: result.buffer.length,
        path: filePath,
      });
      console.log(`✓ Generated: ${doc.name} -> ${result.fileName} (${result.buffer.length} bytes)`);
    } catch (err: any) {
      console.error(`✗ Error generating ${doc.name}:`, err.message);
    }
  }

  console.log('\n======================================================');
  console.log(`AUDIT & DRAFTING COMPLETE FOR ORDER #10135`);
  console.log(`Generated ${generatedFiles.length} Statutory Documents in: ${outDir}`);
  console.log('======================================================');
}

generateOrder10135Pack().catch(console.error);

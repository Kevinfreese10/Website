import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';
import { generateBeeAffidavitDraft } from '../src/lib/pdf/template-generators';
import { Order } from '../src/lib/types';

async function generateOrder10139Bee() {
  const db = getAdminDb();
  const snap = await db.collection('orders').doc('10139').get();
  if (!snap.exists) throw new Error('Order #10139 not found');

  const order = snap.data() as Order;

  // Extracted from CIPC DISCLOSR.pdf & ID_-_Roger_Staples.pdf
  const entityInfo = {
    companyName: 'NO404 (PTY) LTD',
    regNumber: '2025/106479/07',
    customerName: 'Roger Brendon Staples',
    idNumber: '8303045032083',
    address: '5 GAMKA CLOSE, KRAAIBOSCH MANOR, GEORGE, 6529',
    enterpriseType: 'Private Company ((Pty) Ltd)',
    natureOfBusiness: 'Information Technology & Professional Services',
    blackOwnedPercent: '0',
    blackFemaleOwnedPercent: '0',
    blackDesignatedGroupPercent: '0',
    blackYouthPercent: '0',
    blackDisabledPercent: '0',
    blackUnemployedPercent: '0',
    blackRuralPercent: '0',
    blackMilitaryVeteransPercent: '0',
    financialYearEnd: '28 February 2026',
    orderDate: '21 August 2026',
    orderId: '10139',
  };

  console.log('Generating B-BBEE Sworn Affidavit for Order #10139...');
  const { buffer, fileName } = await generateBeeAffidavitDraft(order, entityInfo);

  const outDir = path.resolve('scratch/order_10139_audit');
  const outPath = path.join(outDir, fileName);
  fs.writeFileSync(outPath, buffer);

  console.log(`✓ Successfully generated: ${outPath} (${buffer.length} bytes)`);
}

generateOrder10139Bee().catch(console.error);

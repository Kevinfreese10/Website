import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';
import { Order } from '../src/lib/types';

async function reviewActiveOrders() {
  const db = getAdminDb();
  const snapshot = await db.collection('orders')
    .orderBy('createdAt', 'desc')
    .limit(30)
    .get();

  console.log(`Fetched ${snapshot.docs.length} recent orders from Firestore:\n`);

  const actionableOrders: any[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as Order;
    const id = doc.id;
    const status = data.status;
    const fulfillmentStatus = data.fulfillmentStatus || 'Unknown';
    const client = data.customerName || 'Unknown';
    const email = data.customerEmail || 'Unknown';
    const company = (data as any).companyName || (data as any).clientEntityName || '';
    const service = data.items?.map(i => i.title).join(', ') || 'Unknown Service';
    const checklist = data.checklist || [];
    const uploads = data.documentUploads || [];

    const pendingSteps = checklist.filter(s => s.status === 'pending' || s.status === 'in_progress');
    const pendingUploads = uploads.filter(u => u.status === 'pending');
    const approvedUploads = uploads.filter(u => u.status === 'approved');

    const isActionable = status !== 'Completed' && status !== 'Cancelled';

    if (isActionable) {
      actionableOrders.push({
        id,
        status,
        fulfillmentStatus,
        client,
        email,
        company,
        service,
        pendingStepsCount: pendingSteps.length,
        pendingSteps: pendingSteps.map(s => s.title),
        totalSteps: checklist.length,
        uploadsCount: uploads.length,
        pendingUploadsCount: pendingUploads.length,
        approvedUploadsCount: approvedUploads.length,
        createdAt: data.createdAt,
      });
    }
  }

  console.log(JSON.stringify(actionableOrders, null, 2));
}

reviewActiveOrders().catch(console.error);

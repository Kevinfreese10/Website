import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';
import { Order } from '../src/lib/types';

async function listAllRecentOrders() {
  const db = getAdminDb();
  const snapshot = await db.collection('orders').get();

  const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

  // Sort orders by ID numerically descending
  allOrders.sort((a, b) => {
    const numA = parseInt(a.id, 10);
    const numB = parseInt(b.id, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
    return b.id.localeCompare(a.id);
  });

  console.log(`Total orders in Firestore: ${allOrders.length}`);
  console.log('\nTop 25 most recent orders:');

  const actionable: any[] = [];

  allOrders.slice(0, 25).forEach(o => {
    const service = o.items?.map(i => i.title).join(', ') || (o as any).serviceTitle || 'No Service Name';
    const entity = (o as any).companyName || (o as any).clientEntityName || o.customerName || 'No Entity';
    const status = o.status;
    const fulfillmentStatus = o.fulfillmentStatus || 'N/A';
    const isCompleted = status === 'Completed' || status === 'completed';

    console.log(`- Order #${o.id} | Status: ${status} [${fulfillmentStatus}] | Client/Entity: ${entity} | Service: ${service}`);

    if (!isCompleted && status !== 'Cancelled' && status !== 'cancelled') {
      const checklist = o.checklist || [];
      const pendingSteps = checklist.filter(s => s.status === 'pending' || s.status === 'in_progress');
      const uploads = o.documentUploads || [];
      const pendingUploads = uploads.filter(u => u.status === 'pending');

      actionable.push({
        id: o.id,
        status,
        fulfillmentStatus,
        entity,
        clientName: o.customerName,
        clientEmail: o.customerEmail,
        service,
        pendingSteps: pendingSteps.map(s => s.title),
        totalSteps: checklist.length,
        uploads: uploads.length,
        pendingUploads: pendingUploads.length,
        hasGeneratedDrafts: !!(o as any).generatedDrafts && Object.keys((o as any).generatedDrafts).length > 0,
      });
    }
  });

  console.log('\n=========================================');
  console.log(`ACTIONABLE ORDERS SUMMARY (${actionable.length} orders):`);
  console.log('=========================================');
  console.log(JSON.stringify(actionable, null, 2));
}

listAllRecentOrders().catch(console.error);

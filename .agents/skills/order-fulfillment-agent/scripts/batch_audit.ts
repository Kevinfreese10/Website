import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../../../../src/lib/firebase-admin';
import { Order } from '../../../../src/lib/types';

async function queryOrders(filter: { status?: string; service?: string; orderIds?: string[] }): Promise<Order[]> {
  const db = getAdminDb();
  let query: any = db.collection('orders');

  if (filter.orderIds && filter.orderIds.length > 0) {
    const orders: Order[] = [];
    for (const id of filter.orderIds) {
      const snap = await db.collection('orders').doc(id).get();
      if (snap.exists) {
        orders.push({ id: snap.id, ...snap.data() } as Order);
      }
    }
    return orders;
  }

  if (filter.status) {
    query = query.where('status', '==', filter.status);
  }

  const snapshot = await query.limit(20).get();
  let results = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Order));

  if (filter.service) {
    const sLow = filter.service.toLowerCase();
    results = results.filter((o: Order) => 
      o.items?.some(i => i.title.toLowerCase().includes(sLow))
    );
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const statusIdx = args.indexOf('--status');
  const status = statusIdx !== -1 ? args[statusIdx + 1] : undefined;

  const serviceIdx = args.indexOf('--service');
  const service = serviceIdx !== -1 ? args[serviceIdx + 1] : undefined;

  const idsIdx = args.indexOf('--ids');
  const ids = idsIdx !== -1 ? args[idsIdx + 1].split(',').map(s => s.trim()) : undefined;

  console.log('Querying orders with criteria:', { status, service, ids });
  const orders = await queryOrders({ status, service, orderIds: ids });

  console.log(`Found ${orders.length} order(s):\n`);
  for (const o of orders) {
    const serviceTitle = o.items?.map(i => i.title).join(', ') || 'Unknown Service';
    const entity = (o as any).companyName || o.customerName;
    console.log(`- Order #${o.id} | ${entity} | Status: ${o.status} | Service: ${serviceTitle}`);
  }
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});

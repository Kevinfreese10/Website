import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../../../../src/lib/firebase-admin';
import { Order } from '../../../../src/lib/types';
import { resolveOrderDoc } from '../../../../src/lib/agent/order-audit-pipeline';

async function queryOrders(filter: { status?: string; service?: string; orderIds?: string[]; limit: number }): Promise<Order[]> {
  const db = getAdminDb();

  if (filter.orderIds && filter.orderIds.length > 0) {
    const orders: Order[] = [];
    for (const id of filter.orderIds) {
      try {
        // Accepts portal order numbers as well as Firestore doc IDs
        const { doc, data } = await resolveOrderDoc(db, id);
        orders.push({ id: doc.id, ...data } as Order);
      } catch (_) {
        console.warn(`Order ${id} not found.`);
      }
    }
    return orders;
  }

  let query: any = db.collection('orders');
  if (filter.status) {
    query = query.where('status', '==', filter.status);
  }

  // Filter by service before limiting, otherwise matches beyond the first page are silently dropped
  const snapshot = await query.get();
  let results = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Order));

  if (filter.service) {
    const sLow = filter.service.toLowerCase();
    results = results.filter((o: Order) =>
      o.items?.some(i => (i.title || '').toLowerCase().includes(sLow))
    );
  }

  return results.slice(0, filter.limit);
}

async function main() {
  const args = process.argv.slice(2);
  const argVal = (name: string) => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : undefined; };
  const status = argVal('--status');
  const service = argVal('--service');
  const ids = argVal('--ids')?.split(',').map(s => s.trim()).filter(Boolean);
  const limit = parseInt(argVal('--limit') || '50', 10);

  console.log('Querying orders with criteria:', { status, service, ids, limit });
  const orders = await queryOrders({ status, service, orderIds: ids, limit });

  console.log(`Found ${orders.length} order(s):\n`);
  for (const o of orders) {
    const serviceTitle = o.items?.map(i => i.title).join(', ') || 'Unknown Service';
    const entity = (o as any).companyName || o.customerName;
    const orderNo = (o as any).originalOrderId || o.id;
    console.log(`- Order #${orderNo} | ${entity} | Status: ${o.status} | Updated: ${(o as any).updatedAt || 'n/a'} | Service: ${serviceTitle}`);
  }
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});

/**
 * Builds an OrderDocumentContext from an order: the resolved entity, questionnaire answers by
 * label, and Layer 2 facts. Renderers' suggestFields() read from this; they never read the order.
 */
import type { Order } from '@/lib/types';
import { resolveOrderEntityContext } from '@/lib/service-utils';
import type { OrderDocumentContext } from './types';

export function buildOrderDocumentContext(order: Order & { id: string }, serviceId?: string): OrderDocumentContext {
  const ctx = resolveOrderEntityContext(order);
  const uploads = (order.documentUploads || []).filter(u => !serviceId || u.serviceId === serviceId || true);
  const answers: Record<string, string> = {};
  const facts: Record<string, any> = {};
  for (const u of uploads) {
    if (u.type === 'text' && u.textValue && !u.isEncrypted) answers[(u.requirementLabel || '').trim().toLowerCase()] = u.textValue.trim();
    if (u.aiVerification?.extractedData?.facts && u.id) facts[u.id] = u.aiVerification.extractedData.facts;
  }
  const find = (...keys: string[]) => {
    for (const [label, v] of Object.entries(answers)) if (keys.some(k => label.includes(k))) return v;
    return undefined;
  };
  // Address: prefer explicit questionnaire, then an address printed on a CoR14.3 / proof of address.
  let address = find('company address', 'business address', 'physical address', 'registered address', 'address to be captured');
  if (!address) for (const f of Object.values(facts)) if (f?.addressText && ['cor14_3', 'proof_of_address'].includes(f.documentKind)) { address = f.addressText; break; }
  let taxNumber = find('income tax number', 'tax number', 'tax reference');
  if (!taxNumber) for (const f of Object.values(facts)) { const t = (f?.identifiers || []).find((i: any) => i.type === 'income_tax_ref'); if (t) { taxNumber = t.value; break; } }
  const svc = serviceId ? (order.serviceSnapshots || []).find(s => s.serviceId === serviceId) : undefined;

  return {
    orderId: order.id,
    orderNumber: String(order.originalOrderId || order.id),
    serviceTitle: svc?.title || order.items?.[0]?.title || '',
    entity: {
      entityName: ctx.entityName,
      registrationNumber: ctx.registrationNumber,
      idNumber: ctx.idNumber,
      directorName: ctx.directorName || order.endCustomerName || order.customerName,
      orderingContactName: ctx.orderingContactName,
      address,
      taxNumber,
      email: order.endCustomerEmail || order.customerEmail,
      phone: order.endCustomerPhone || order.customerPhone,
    },
    answers,
    facts,
    today: new Date().toISOString().slice(0, 10),
  };
}

/** Case-insensitive answer lookup by substring, for suggestFields implementations. */
export function answer(ctx: OrderDocumentContext, ...keys: string[]): string | undefined {
  for (const [label, v] of Object.entries(ctx.answers)) if (keys.some(k => label.includes(k.toLowerCase()))) return v;
  return undefined;
}

/**
 * DOCUMENT adapter service: draft, store, approve (sign), post to client.
 * Drafts live under orders/{id}/drafts/ in Storage and in `generatedDrafts[]` on the order.
 * A signed PDF is only ever produced by approveDraft(), re-rendering the stored fields with
 * `signed: true` — so what Kevin approved is exactly what gets signed.
 */

import { getAdminDb, cleanFirestoreData, uploadBufferToStorage } from '@/lib/firebase-admin';
import type { Order } from '@/lib/types';
import { getTemplate, UNSUPPORTED_TEMPLATE_IDS } from './registry';
import { buildOrderDocumentContext } from './context';
import { MissingFieldsError, type DraftRecord, type OrderDocumentContext } from './types';

export type DraftAttempt =
  | { templateId: string; ok: true; draft: DraftRecord }
  | { templateId: string; ok: false; missing: string[]; labels: string[]; error?: string };

/** Merge suggested fields with explicit overrides and try to render each template as an unsigned draft. */
export async function draftDocumentsForOrder(orderId: string, templateIds: string[], overrides: Record<string, Record<string, any>> = {}, serviceId?: string): Promise<{ attempts: DraftAttempt[]; ctx: OrderDocumentContext }> {
  const db = getAdminDb();
  const ref = db.collection('orders').doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Order ${orderId} not found`);
  const order = { ...(snap.data() as Order), id: orderId };
  const ctx = buildOrderDocumentContext(order, serviceId);

  const attempts: DraftAttempt[] = [];
  const newDrafts: DraftRecord[] = [];

  for (const templateId of templateIds) {
    if (UNSUPPORTED_TEMPLATE_IDS.has(templateId)) { attempts.push({ templateId, ok: false, missing: [], labels: [], error: 'Produced by the AI Accountant module (Phase 7), not the document adapter.' }); continue; }
    const tpl = getTemplate(templateId);
    if (!tpl) { attempts.push({ templateId, ok: false, missing: [], labels: [], error: `Unknown template "${templateId}"` }); continue; }
    const fields = { ...(tpl.suggestFields?.(ctx) || {}), ...(overrides[templateId] || {}), orderId: ctx.orderNumber };
    try {
      const result = await tpl.render(fields, { signed: false, date: ctx.today });
      const draftId = `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const path = `orders/${orderId}/drafts/${draftId}_${result.fileName}`;
      const fileUrl = await uploadBufferToStorage(result.buffer, path, 'application/pdf');
      const draft: DraftRecord = { id: draftId, templateId: tpl.id, templateType: tpl.id, title: tpl.title, fileUrl, fileName: result.fileName, generatedAt: new Date().toISOString(), status: 'draft', fields, warnings: result.warnings };
      newDrafts.push(draft);
      attempts.push({ templateId, ok: true, draft });
    } catch (e: any) {
      if (e instanceof MissingFieldsError) attempts.push({ templateId, ok: false, missing: e.missing, labels: e.missing.map(m => tpl.fieldLabels[m] || m) });
      else attempts.push({ templateId, ok: false, missing: [], labels: [], error: e?.message || String(e) });
    }
  }

  if (newDrafts.length) {
    const existing: DraftRecord[] = (order.generatedDrafts as any) || [];
    // Supersede earlier unsigned drafts of the same template.
    const kept = existing.map(d => (newDrafts.some(n => n.templateId === d.templateId) && d.status === 'draft') ? { ...d, status: 'regenerated' as const } : d);
    await ref.update(cleanFirestoreData({ generatedDrafts: [...kept, ...newDrafts], updatedAt: new Date().toISOString() }));
  }
  return { attempts, ctx };
}

/** Re-render with the signature and mark approved. Returns the signed file URL. */
export async function approveDraft(orderId: string, draftId: string, approvedBy: string): Promise<{ signedFileUrl: string; fileName: string; draft: DraftRecord }> {
  const db = getAdminDb();
  const ref = db.collection('orders').doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Order ${orderId} not found`);
  const drafts: DraftRecord[] = ((snap.data() as any).generatedDrafts) || [];
  const draft = drafts.find(d => d.id === draftId);
  if (!draft) throw new Error('Draft not found');
  if (draft.status === 'approved') return { signedFileUrl: draft.signedFileUrl || draft.fileUrl, fileName: draft.fileName, draft };
  const tpl = getTemplate(draft.templateId);
  if (!tpl) throw new Error(`Template ${draft.templateId} no longer exists`);

  const signed = tpl.signature === 'kevin';
  const result = await tpl.render(draft.fields, { signed, date: new Date().toISOString() });
  const path = `orders/${orderId}/drafts/${draftId}_${signed ? 'SIGNED_' : 'APPROVED_'}${result.fileName}`;
  const signedFileUrl = await uploadBufferToStorage(result.buffer, path, 'application/pdf');
  const updated: DraftRecord = { ...draft, status: 'approved', approvedAt: new Date().toISOString(), approvedBy, signedFileUrl };
  await ref.update(cleanFirestoreData({ generatedDrafts: drafts.map(d => (d.id === draftId ? updated : d)), updatedAt: new Date().toISOString() }));
  return { signedFileUrl, fileName: result.fileName, draft: updated };
}

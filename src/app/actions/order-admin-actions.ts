'use server';

import { getAdminDb, cleanFirestoreData, serializeDbData } from '@/lib/firebase-admin';
import { AuditEntry, Order, DocumentUpload, OrderChecklistItem } from '@/lib/types';
import { sendOrderStatusUpdateEmailAction } from './order-actions';
import { resolvePartnerMirrorOrderId } from '@/lib/service-utils';
import { getVerifiedAuthContext, getAuthContext } from '@/lib/server-auth';

export type StatusTransitionOptions = {
  details?: string;
  bypassChecks?: boolean;
  bypassReason?: string;
  fulfillmentStatus?: Order['fulfillmentStatus'];
};

export type PerformerInput = { id?: string; name?: string; idToken?: string; role?: string } | string;

import { INTERNAL_SYSTEM_ACTOR, InternalActor } from '@/lib/internal-actor';

/**
 * Resolves and cryptographically validates the acting user from an ID token or performer object.
 * Strictly prevents caller identity spoofing and enforces role-based authorization for staff and partners.
 */
async function resolveVerifiedActor(performerOrToken: PerformerInput | InternalActor, orderData: Order) {
  // Trusted in-process automation. Reference identity — unreachable from a network caller.
  if (performerOrToken === INTERNAL_SYSTEM_ACTOR) {
    return {
      id: 'system',
      name: 'System Automation',
      role: 'system',
      isStaffOrAdmin: true,
      isPartner: false,
    };
  }

  let idToken = typeof performerOrToken === 'string'
    ? (performerOrToken.length > 50 ? performerOrToken : null)
    : ((performerOrToken as any)?.idToken || (performerOrToken as any)?.token);

  if (idToken) {
    const authCtx = await getVerifiedAuthContext(idToken);
    if (!authCtx) {
      throw new Error('Unauthorized: Invalid or expired authentication token.');
    }
    const isStaffOrAdmin = authCtx.isAdmin || authCtx.user.role === 'admin' || authCtx.user.role === 'staff' || authCtx.user.role === 'cap_staff' || authCtx.user.role === 'cap_supervisor';
    const isPartner = authCtx.userId === orderData.resellerId ||
                      authCtx.userId === orderData.partnerId ||
                      (orderData.resellerId && authCtx.user.partnerId === orderData.resellerId) ||
                      (orderData.partnerId && authCtx.user.partnerId === orderData.partnerId);

    if (!isStaffOrAdmin && !isPartner) {
      throw new Error('Forbidden: You do not have permission to manage this order.');
    }

    return {
      id: authCtx.userId,
      name: authCtx.user.name || authCtx.user.email || 'Verified Staff',
      role: authCtx.user.role,
      isStaffOrAdmin,
      isPartner,
    };
  }

  // No verified token. Previously this fell back to looking the caller-supplied id up in `users`
  // and adopting that user's role — meaning anyone who knew (or guessed) a staff uid was granted
  // that staff member's authority. There is no way to authenticate a bare id, so this is now a
  // hard failure.
  throw new Error('Unauthorized: A valid authentication token is required to perform this action.');
}

/**
 * Canonical State Machine Transition Engine for Orders.
 * Enforces deterministic validation rules before permitting state changes:
 * - Completed: Checks incomplete dependencies, pending/rejected uploads, uncompleted checklist items.
 */
export async function transitionOrderStatusAtomic(
  orderId: string,
  newStatus: Order['status'] | string,
  performer: PerformerInput | InternalActor,
  options?: StatusTransitionOptions
) {
  try {
    const db = getAdminDb();
    const batch = db.batch();

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      throw new Error(`Order ${orderId} not found`);
    }

    const orderData = (orderDoc.data() || {}) as Order;
    const actor = await resolveVerifiedActor(performer, orderData);
    const previousStatus = orderData.status;

    // ─── Guardrails for Completion ──────────────────────────────────────────
    if (newStatus === 'Completed' && !options?.bypassChecks) {
      // 1. Check prerequisite orders
      if (orderData.dependsOnOrderIds && orderData.dependsOnOrderIds.length > 0) {
        const prereqSnaps = await Promise.all(
          orderData.dependsOnOrderIds.map(id => db.collection('orders').doc(id).get())
        );
        const incompletePrereqs = prereqSnaps
          .filter(snap => snap.exists && snap.data()?.status !== 'Completed')
          .map(snap => `#${snap.id} (${snap.data()?.status || 'Unknown'})`);

        if (incompletePrereqs.length > 0) {
          return {
            success: false,
            error: `Cannot complete Order #${orderId}. Incomplete prerequisite orders: ${incompletePrereqs.join(', ')}. Resolve prerequisites or specify a bypass reason.`,
            isBlockedByPrerequisites: true,
            incompletePrerequisites: incompletePrereqs,
          };
        }
      }

      // 2. Check document uploads
      const uploads = orderData.documentUploads || [];
      const pendingUploads = uploads.filter(u => u.status === 'pending');
      const rejectedUploads = uploads.filter(u => u.status === 'rejected');

      if (pendingUploads.length > 0 || rejectedUploads.length > 0) {
        const docIssues: string[] = [];
        if (pendingUploads.length > 0) docIssues.push(`${pendingUploads.length} pending review`);
        if (rejectedUploads.length > 0) docIssues.push(`${rejectedUploads.length} rejected/outstanding`);

        return {
          success: false,
          error: `Cannot complete Order #${orderId}. Document issues: ${docIssues.join(', ')}. All documents must be approved before completion.`,
          isBlockedByDocuments: true,
        };
      }
    }

    // Determine appropriate fulfillmentStatus
    let targetFulfillmentStatus: Order['fulfillmentStatus'] = options?.fulfillmentStatus || orderData.fulfillmentStatus;
    if (newStatus === 'Completed') {
      targetFulfillmentStatus = 'Completed';
    } else if (newStatus === 'Cancelled') {
      targetFulfillmentStatus = 'Blocked';
    } else if (newStatus === 'Processing' && (!targetFulfillmentStatus || targetFulfillmentStatus === 'Awaiting Documents')) {
      const allDocsApproved = (orderData.documentUploads || []).length > 0 && (orderData.documentUploads || []).every(d => d.status === 'approved');
      targetFulfillmentStatus = allDocsApproved ? 'In Execution' : 'Awaiting Documents';
    }

    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'STATUS_CHANGE',
      performedBy: actor.id,
      performedByName: actor.name,
      timestamp: new Date().toISOString(),
      previousValue: previousStatus,
      newValue: newStatus,
      details: options?.details || (options?.bypassReason ? `Status changed to ${newStatus} (Bypass reason: ${options.bypassReason})` : `Status changed from ${previousStatus} to ${newStatus}`),
    };

    const auditLog = [...(orderData.auditLog || []), auditEntry];

    const updatePayload: Record<string, any> = {
      status: newStatus,
      fulfillmentStatus: targetFulfillmentStatus,
      auditLog,
      updatedAt: new Date().toISOString(),
    };

    batch.update(orderRef, updatePayload);

    // If this order is linked to an original partner order, update that atomically as well
    const mirrorId = resolvePartnerMirrorOrderId({ ...orderData, id: orderId });
    if (mirrorId) {
      const originalRef = db.collection('orders').doc(mirrorId);
      const originalDoc = await originalRef.get();
      if (originalDoc.exists) {
        const originalData = originalDoc.data() || {};
        const originalAuditLog = [...(originalData.auditLog || []), auditEntry];
        batch.update(originalRef, {
          status: newStatus,
          fulfillmentStatus: targetFulfillmentStatus,
          auditLog: originalAuditLog,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await batch.commit();

    // Trigger order status update email (includes review request when Completed)
    try {
      await sendOrderStatusUpdateEmailAction(orderId, newStatus);
    } catch (emailErr) {
      console.error('[transitionOrderStatusAtomic] Email notification failed:', emailErr);
    }

    return { success: true, message: `Status updated to ${newStatus}`, fulfillmentStatus: targetFulfillmentStatus };
  } catch (error: any) {
    console.error('Error transitioning order status atomically:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Backward compatibility alias for transitionOrderStatusAtomic.
 */
export async function updateOrderStatusAtomic(
  orderId: string,
  newStatus: Order['status'],
  performerOrToken: PerformerInput | InternalActor,
  options?: StatusTransitionOptions
) {
  return transitionOrderStatusAtomic(orderId, newStatus, performerOrToken, options);
}

/**
 * Reviews an uploaded document atomically (Approve/Reject) and logs audit trail.
 */
export async function reviewOrderDocumentAtomic(
  orderId: string,
  identifier: string, // requirementId, fileUrl, or textValue
  status: 'approved' | 'rejected',
  performer: PerformerInput,
  reason?: string
) {
  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);

    const orderData = orderDoc.data() || {};
    const actor = await resolveVerifiedActor(performer, orderData as Order);
    const uploads: DocumentUpload[] = orderData.documentUploads || [];

    let targetDocLabel = '';
    const updatedUploads = uploads.map(doc => {
      const isMatch = (doc.id && doc.id === identifier) ||
                      (doc.requirementId && doc.requirementId === identifier) ||
                      doc.fileUrl === identifier ||
                      doc.textValue === identifier ||
                      doc.requirementLabel === identifier;

      if (isMatch) {
        targetDocLabel = doc.requirementLabel;
        const updatedItem: DocumentUpload = {
          ...doc,
          status,
          rejectionReason: status === 'rejected' ? (reason || '') : '',
        };
        return updatedItem;
      }
      return doc;
    });

    const cleanedUploads = cleanFirestoreData(updatedUploads);

    const allApproved = cleanedUploads.length > 0 && cleanedUploads.every((d: any) => d.status === 'approved');
    let newFulfillmentStatus: Order['fulfillmentStatus'] = orderData.fulfillmentStatus;
    if (allApproved && orderData.status === 'Processing' && (!orderData.fulfillmentStatus || orderData.fulfillmentStatus === 'Awaiting Documents')) {
      newFulfillmentStatus = 'In Execution';
    } else if (status === 'rejected') {
      newFulfillmentStatus = 'Awaiting Documents';
    }

    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'DOCUMENT_REVIEW',
      performedBy: actor.id,
      performedByName: actor.name,
      timestamp: new Date().toISOString(),
      previousValue: 'pending',
      newValue: status,
      details: `${status === 'approved' ? 'Approved' : 'Rejected'} document: "${targetDocLabel || identifier}"${reason ? ` (Reason: ${reason})` : ''}`,
    };

    const batch = db.batch();
    const updatePayload = cleanFirestoreData({
      documentUploads: cleanedUploads,
      fulfillmentStatus: newFulfillmentStatus,
      auditLog: [...(orderData.auditLog || []), auditEntry],
      updatedAt: new Date().toISOString(),
    });

    batch.update(orderRef, updatePayload);

    const mirrorId = resolvePartnerMirrorOrderId({ ...orderData, id: orderId });
    if (mirrorId) {
      const originalRef = db.collection('orders').doc(mirrorId);
      batch.update(originalRef, updatePayload);
    }

    await batch.commit();

    // If a document was rejected, send immediate feedback email to the client with reasons
    if (status === 'rejected') {
      try {
        const clientEmail = orderData.endCustomerEmail || orderData.customerEmail;
        const clientName = orderData.endCustomerName || orderData.customerName || 'Valued Client';
        if (clientEmail) {
          const { sendDocumentReviewFeedback } = await import('@/app/actions/notifications');
          await sendDocumentReviewFeedback({
            orderId,
            clientName,
            clientEmail,
            documentUploads: cleanedUploads,
            resellerId: orderData.resellerId,
          });
        }
      } catch (emailErr) {
        console.error('Error sending rejection feedback email:', emailErr);
      }
    }

    return serializeDbData({
      success: true,
      message: `Document "${targetDocLabel || identifier}" marked as ${status}`,
      fulfillmentStatus: newFulfillmentStatus,
      documentUploads: cleanedUploads,
    });
  } catch (error: any) {
    console.error('Error reviewing order document:', error);
    return { success: false, error: error.message };
  }
}

export type ChecklistItemUpdate = {
  status?: OrderChecklistItem['status'];
  notes?: string;
  artifactUrl?: string;
  artifactName?: string;
  isAiRecommended?: boolean;
  aiNotes?: string;
  /** Required when status is 'skipped'. */
  skipReason?: string;
};

/**
 * Updates a single SOP checklist step on an order atomically (rebuilt after v1 was removed in aba0cdd2).
 *
 * Guards:
 * - Staff/admin or the internal system actor only. Partners may not tick checklist steps.
 * - Skipping a step requires a reason, which is written to the audit log.
 * - Never transitions the client-visible `status`; only `fulfillmentStatus` may be nudged, and
 *   only from 'Awaiting Documents' → 'In Execution' when work starts. Completion still goes
 *   through transitionOrderStatusAtomic and its guardrails.
 */
export async function updateOrderChecklistItemAtomic(
  orderId: string,
  stepId: string,
  update: ChecklistItemUpdate,
  performer: PerformerInput | InternalActor
) {
  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);

    const orderData = orderDoc.data() || {};
    const actor = await resolveVerifiedActor(performer, orderData as Order);
    if (!actor.isStaffOrAdmin) {
      throw new Error('Forbidden: Only staff may update fulfilment checklist steps.');
    }

    if (update.status === 'skipped' && !update.skipReason?.trim()) {
      throw new Error('A reason is required to skip a checklist step.');
    }

    const checklist: OrderChecklistItem[] = orderData.checklist || [];
    const idx = checklist.findIndex(c => c.id === stepId);
    if (idx === -1) throw new Error(`Checklist step "${stepId}" not found on order #${orderId}`);

    const previous = checklist[idx];
    const nowIso = new Date().toISOString();
    const nextStatus = update.status ?? previous.status;

    const updatedItem: OrderChecklistItem = {
      ...previous,
      status: nextStatus,
      ...(update.notes !== undefined ? { notes: update.notes } : {}),
      ...(update.artifactUrl !== undefined ? { artifactUrl: update.artifactUrl } : {}),
      ...(update.artifactName !== undefined ? { artifactName: update.artifactName } : {}),
      ...(update.isAiRecommended !== undefined ? { isAiRecommended: update.isAiRecommended } : {}),
      ...(update.aiNotes !== undefined ? { aiNotes: update.aiNotes } : {}),
      ...(update.skipReason ? { notes: [previous.notes, `Skipped: ${update.skipReason}`].filter(Boolean).join('\n') } : {}),
    };

    if (nextStatus === 'completed' || nextStatus === 'skipped') {
      updatedItem.completedAt = nowIso;
      updatedItem.completedBy = actor.id;
      updatedItem.completedByName = actor.name;
    } else if (previous.status === 'completed' || previous.status === 'skipped') {
      // Re-opened
      delete (updatedItem as any).completedAt;
      delete (updatedItem as any).completedBy;
      delete (updatedItem as any).completedByName;
    }

    const updatedChecklist = [...checklist];
    updatedChecklist[idx] = updatedItem;

    let newFulfillmentStatus: Order['fulfillmentStatus'] = orderData.fulfillmentStatus;
    const anyStarted = updatedChecklist.some(c => c.status === 'in_progress' || c.status === 'completed');
    if (anyStarted && (!newFulfillmentStatus || newFulfillmentStatus === 'Awaiting Documents') && orderData.status === 'Processing') {
      newFulfillmentStatus = 'In Execution';
    }

    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'CHECKLIST_UPDATE',
      performedBy: actor.id,
      performedByName: actor.name,
      timestamp: nowIso,
      previousValue: previous.status,
      newValue: nextStatus,
      details: `Checklist step "${previous.title}" ${previous.status} → ${nextStatus}${update.skipReason ? ` (Skip reason: ${update.skipReason})` : ''}${update.notes ? ` — ${update.notes}` : ''}`,
    };

    const updatePayload = cleanFirestoreData({
      checklist: updatedChecklist,
      fulfillmentStatus: newFulfillmentStatus,
      auditLog: [...(orderData.auditLog || []), auditEntry],
      updatedAt: nowIso,
    });

    const batch = db.batch();
    batch.update(orderRef, updatePayload);
    const mirrorId = resolvePartnerMirrorOrderId({ ...orderData, id: orderId });
    if (mirrorId) {
      batch.update(db.collection('orders').doc(mirrorId), updatePayload);
    }
    await batch.commit();

    return serializeDbData({
      success: true,
      message: `Step "${previous.title}" marked ${nextStatus}`,
      checklist: updatedChecklist,
      fulfillmentStatus: newFulfillmentStatus,
    });
  } catch (error: any) {
    console.error('Error updating checklist item:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reveals an encrypted credential value (isSecret requirement) to staff. Every reveal is
 * audit-logged on the order. Partners and clients are refused.
 */
export async function revealSecretUploadValueAtomic(
  orderId: string,
  uploadId: string,
  performer: PerformerInput | InternalActor
) {
  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);
    const orderData = orderDoc.data() || {};
    const actor = await resolveVerifiedActor(performer, orderData as Order);
    if (!actor.isStaffOrAdmin) throw new Error('Forbidden: Only staff may reveal credentials.');

    const upload = (orderData.documentUploads || []).find((u: DocumentUpload) => u.id === uploadId || u.requirementId === uploadId);
    if (!upload) throw new Error('Upload not found');
    if (!upload.textValue) throw new Error('This requirement has no text value');

    const { decrypt } = await import('@/lib/encryption');
    const value = upload.isEncrypted ? decrypt(upload.textValue) : upload.textValue;

    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'CREDENTIAL_REVEALED',
      performedBy: actor.id,
      performedByName: actor.name,
      timestamp: new Date().toISOString(),
      details: `Revealed credential "${upload.requirementLabel}"`,
    };
    await orderRef.update({ auditLog: [...(orderData.auditLog || []), auditEntry] });

    return { success: true, value };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Posts a note to an order's Communication History server-side (mirrors the admin UI's
 * arrayUnion write) and audit-logs it. Used by the AI agent's approved proposals.
 */
export async function postOrderNoteAtomic(
  orderId: string,
  note: { text: string; isInternal?: boolean; subject?: string | null; attachments?: { name: string; url: string }[] | null },
  performer: PerformerInput | InternalActor
) {
  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);
    const orderData = orderDoc.data() || {};
    const actor = await resolveVerifiedActor(performer, orderData as Order);
    if (!actor.isStaffOrAdmin) throw new Error('Forbidden: Only staff may post notes via this action.');

    const nowIso = new Date().toISOString();
    const newNote = cleanFirestoreData({
      text: note.text,
      authorId: actor.id,
      date: new Date(),
      type: 'note',
      isInternal: !!note.isInternal,
      subject: note.subject ?? null,
      attachments: note.attachments && note.attachments.length ? note.attachments : null,
    });
    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: note.isInternal ? 'INTERNAL_NOTE_POSTED' : 'CLIENT_NOTE_POSTED',
      performedBy: actor.id,
      performedByName: actor.name,
      timestamp: nowIso,
      details: `${note.isInternal ? 'Internal' : 'Client-visible'} note posted (${note.text.length} chars).`,
    };
    const { FieldValue } = await import('firebase-admin/firestore');
    const batch = db.batch();
    batch.update(orderRef, { notes: FieldValue.arrayUnion(newNote), auditLog: FieldValue.arrayUnion(auditEntry), updatedAt: nowIso });
    const mirrorId = resolvePartnerMirrorOrderId({ ...orderData, id: orderId });
    if (mirrorId) batch.update(db.collection('orders').doc(mirrorId), { notes: FieldValue.arrayUnion(newNote), updatedAt: nowIso });
    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error('Error posting order note:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Requests a custom document from the client atomically and logs an audit trail.
 */
export async function requestCustomDocumentAtomic(
  orderId: string,
  serviceId: string,
  requirementLabel: string,
  type: 'file' | 'text',
  performer: PerformerInput
) {
  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { success: false, error: 'Order not found' };
    }

    const orderData = orderDoc.data() as Order;
    const actor = await resolveVerifiedActor(performer, orderData);

    const nowIso = new Date().toISOString();
    const newRequest: DocumentUpload = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      serviceId,
      requirementLabel: requirementLabel.trim(),
      type,
      uploadedAt: nowIso,
      status: 'pending',
    };

    const updatedUploads = [...(orderData.documentUploads || []), newRequest];
    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: nowIso,
      action: 'DOCUMENT_UPLOADED',
      performedBy: actor.id,
      performedByName: actor.name,
      details: `Requested custom document: "${requirementLabel.trim()}"`,
    };

    const updatePayload = cleanFirestoreData({
      documentUploads: updatedUploads,
      fulfillmentStatus: 'Awaiting Documents',
      auditLog: [...(orderData.auditLog || []), auditEntry],
      updatedAt: nowIso,
    });

    const batch = db.batch();
    batch.update(orderRef, updatePayload);

    const mirrorId = resolvePartnerMirrorOrderId({ ...orderData, id: orderId });
    if (mirrorId) {
      const origRef = db.collection('orders').doc(mirrorId);
      batch.update(origRef, updatePayload);
    }

    await batch.commit();
    return { success: true, message: `Requested: "${requirementLabel.trim()}"` };
  } catch (error: any) {
    console.error('Error requesting custom document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reassigns staff members to an order atomically, updates original partner order if present, and logs audit trail.
 */
export async function reassignOrderStaffAtomic(
  orderId: string,
  staffIds: string[],
  department: 'Accounting and Tax' | 'Administration' | 'CAP' | null,
  performer: PerformerInput
) {
  try {
    const db = getAdminDb();
    const batch = db.batch();

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      throw new Error(`Order ${orderId} not found`);
    }

    const orderData = orderDoc.data() || {};
    const actor = await resolveVerifiedActor(performer, orderData as Order);
    const previousAssigned = orderData.assignedTo?.join(', ') || 'Unassigned';
    const newAssigned = staffIds.join(', ') || 'Unassigned';

    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'REASSIGN_STAFF',
      performedBy: actor.id,
      performedByName: actor.name,
      timestamp: new Date().toISOString(),
      previousValue: previousAssigned,
      newValue: newAssigned,
      details: `Reassigned staff to: ${newAssigned}`,
    };

    const auditLog = [...(orderData.auditLog || []), auditEntry];

    batch.update(orderRef, {
      assignedTo: staffIds,
      department: department || null,
      auditLog,
      updatedAt: new Date().toISOString(),
    });

    const mirrorId = resolvePartnerMirrorOrderId({ ...orderData, id: orderId });
    if (mirrorId) {
      const originalRef = db.collection('orders').doc(mirrorId);
      const originalDoc = await originalRef.get();
      if (originalDoc.exists) {
        const originalData = originalDoc.data() || {};
        const originalAuditLog = [...(originalData.auditLog || []), auditEntry];
        batch.update(originalRef, {
          assignedTo: staffIds,
          department: department || null,
          auditLog: originalAuditLog,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await batch.commit();
    return { success: true, message: `Staff reassigned successfully` };
  } catch (error: any) {
    console.error('Error reassigning order staff atomically:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Persisted round-robin staff assignment via Firestore counter doc (`meta/staffAssignment`)
 */
export async function getNextStaffMemberPersisted(
  dept: string,
  staffMembers: { id: string; name: string; department?: string }[]
): Promise<{ id: string; name: string } | null> {
  if (!staffMembers || staffMembers.length === 0) return null;

  try {
    const db = getAdminDb();
    const metaRef = db.collection('meta').doc('staffAssignment');

    const result = await db.runTransaction(async (transaction) => {
      const metaDoc = await transaction.get(metaRef);
      let counters: Record<string, number> = {};

      if (metaDoc.exists) {
        counters = metaDoc.data()?.counters || {};
      }

      const currentIndex = counters[dept] ?? 0;
      const nextIndex = (currentIndex + 1) % staffMembers.length;
      const selectedStaff = staffMembers[currentIndex % staffMembers.length];

      counters[dept] = nextIndex;

      transaction.set(metaRef, { counters }, { merge: true });

      return selectedStaff;
    });

    return result;
  } catch (error) {
    console.error('Error in persisted round-robin assignment:', error);
    return staffMembers[0] || null;
  }
}

/**
 * Links a prerequisite order dependency atomically.
 * (orderId depends on prerequisiteOrderId being finished first)
 */
export async function linkOrderDependencyAtomic(
  orderId: string,
  prerequisiteOrderId: string,
  performer: PerformerInput
) {
  try {
    if (orderId === prerequisiteOrderId) {
      return { success: false, error: 'An order cannot depend on itself.' };
    }

    const db = getAdminDb();
    const batch = db.batch();

    const orderRef = db.collection('orders').doc(orderId);
    const prereqRef = db.collection('orders').doc(prerequisiteOrderId);

    const [orderDoc, prereqDoc] = await Promise.all([
      orderRef.get(),
      prereqRef.get(),
    ]);

    if (!orderDoc.exists) {
      return { success: false, error: `Order #${orderId} not found.` };
    }
    if (!prereqDoc.exists) {
      return { success: false, error: `Prerequisite Order #${prerequisiteOrderId} not found.` };
    }

    const orderData = orderDoc.data() || {};
    const prereqData = prereqDoc.data() || {};
    const actor = await resolveVerifiedActor(performer, orderData as Order);

    const existingDependsOn: string[] = orderData.dependsOnOrderIds || [];
    if (existingDependsOn.includes(prerequisiteOrderId)) {
      return { success: false, error: `Order #${orderId} is already linked to prerequisite #${prerequisiteOrderId}.` };
    }

    // Circular dependency check: does prereqData already depend on orderId?
    const prereqDependsOn: string[] = prereqData.dependsOnOrderIds || [];
    if (prereqDependsOn.includes(orderId)) {
      return {
        success: false,
        error: `Circular dependency detected: Order #${prerequisiteOrderId} already depends on Order #${orderId}.`,
      };
    }

    const updatedDependsOn = [...existingDependsOn, prerequisiteOrderId];
    const existingBlocked: string[] = prereqData.blockedOrderIds || [];
    const updatedBlocked = Array.from(new Set([...existingBlocked, orderId]));

    const auditEntryOrder: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'LINK_DEPENDENCY',
      performedBy: actor.id,
      performedByName: actor.name,
      timestamp: new Date().toISOString(),
      details: `Linked prerequisite Order #${prerequisiteOrderId} (Must finish before this order)`,
    };

    const auditEntryPrereq: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'LINK_DEPENDENCY',
      performedBy: actor.id,
      performedByName: actor.name,
      timestamp: new Date().toISOString(),
      details: `Linked dependent Order #${orderId} (Waiting on this order to finish)`,
    };

    batch.update(orderRef, {
      dependsOnOrderIds: updatedDependsOn,
      auditLog: [...(orderData.auditLog || []), auditEntryOrder],
      updatedAt: new Date().toISOString(),
    });

    batch.update(prereqRef, {
      blockedOrderIds: updatedBlocked,
      auditLog: [...(prereqData.auditLog || []), auditEntryPrereq],
      updatedAt: new Date().toISOString(),
    });

    await batch.commit();

    return { success: true, message: `Successfully linked Order #${prerequisiteOrderId} as prerequisite for Order #${orderId}.` };
  } catch (error: any) {
    console.error('Error linking order dependency atomically:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Removes a prerequisite order dependency link atomically.
 */
export async function unlinkOrderDependencyAtomic(
  orderId: string,
  prerequisiteOrderId: string,
  performer: PerformerInput
) {
  try {
    const db = getAdminDb();
    const batch = db.batch();

    const orderRef = db.collection('orders').doc(orderId);
    const prereqRef = db.collection('orders').doc(prerequisiteOrderId);

    const [orderDoc, prereqDoc] = await Promise.all([
      orderRef.get(),
      prereqRef.get(),
    ]);

    if (!orderDoc.exists) {
      return { success: false, error: `Order #${orderId} not found.` };
    }

    const orderData = orderDoc.data() || {};
    const actor = await resolveVerifiedActor(performer, orderData as Order);
    const existingDependsOn: string[] = orderData.dependsOnOrderIds || [];
    const updatedDependsOn = existingDependsOn.filter((id) => id !== prerequisiteOrderId);

    const auditEntryOrder: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'UNLINK_DEPENDENCY',
      performedBy: actor.id,
      performedByName: actor.name,
      timestamp: new Date().toISOString(),
      details: `Removed prerequisite link to Order #${prerequisiteOrderId}`,
    };

    batch.update(orderRef, {
      dependsOnOrderIds: updatedDependsOn,
      auditLog: [...(orderData.auditLog || []), auditEntryOrder],
      updatedAt: new Date().toISOString(),
    });

    if (prereqDoc.exists) {
      const prereqData = prereqDoc.data() || {};
      const existingBlocked: string[] = prereqData.blockedOrderIds || [];
      const updatedBlocked = existingBlocked.filter((id) => id !== orderId);

      const auditEntryPrereq: AuditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        action: 'UNLINK_DEPENDENCY',
        performedBy: actor.id,
        performedByName: actor.name,
        timestamp: new Date().toISOString(),
        details: `Removed dependent link from Order #${orderId}`,
      };

      batch.update(prereqRef, {
        blockedOrderIds: updatedBlocked,
        auditLog: [...(prereqData.auditLog || []), auditEntryPrereq],
        updatedAt: new Date().toISOString(),
      });
    }

    await batch.commit();

    return { success: true, message: `Successfully unlinked prerequisite Order #${prerequisiteOrderId}.` };
  } catch (error: any) {
    console.error('Error unlinking order dependency atomically:', error);
    return { success: false, error: error.message };
  }
}

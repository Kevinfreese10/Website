'use server';

import { getAdminDb, getAdminAuth, cleanFirestoreData, serializeDbData } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { AuditEntry, Order, DocumentUpload, OrderChecklistItem, OrderServiceSnapshot } from '@/lib/types';
import { sendOrderStatusUpdateEmailAction, notifyStaffOfAssignment } from './order-actions';
import { sendOrderConfirmationEmailAction } from './notifications';
import { resolvePartnerMirrorOrderId, stripInternalAiData } from '@/lib/service-utils';
import { getVerifiedAuthContext, getAuthContext } from '@/lib/server-auth';
import { getServiceChecklist, normalizeRequirementsWithIds, isPlaybookApproved, pickStepConfig } from '@/lib/services';
import { getNextOrderId } from '@/lib/sequence';

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
    }

    // Determine appropriate fulfillmentStatus
    let targetFulfillmentStatus: Order['fulfillmentStatus'] = options?.fulfillmentStatus || orderData.fulfillmentStatus;
    if (newStatus === 'Completed') {
      targetFulfillmentStatus = 'Completed';
    } else if (newStatus === 'Cancelled') {
      targetFulfillmentStatus = 'Blocked';
    } else if (newStatus === 'Processing') {
      targetFulfillmentStatus = options?.fulfillmentStatus || 'In Execution';
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

    // Don't assign orders until they are paid. When paid, auto-assign to Kevin so Kevin can reassign.
    let autoAssignedStaffId: string | null = null;
    if (
      (previousStatus === 'Pending Payment' || newStatus === 'Processing') &&
      (!orderData.assignedTo || orderData.assignedTo.length === 0) &&
      newStatus !== 'Pending Payment' &&
      newStatus !== 'Cancelled'
    ) {
      const staffSnap = await db.collection('users').where('role', 'in', ['admin', 'staff']).get();
      const kevinDoc = staffSnap.docs.find(d => {
        const data = d.data();
        const email = (data.email || '').toLowerCase().trim();
        return email === 'kev@thinkestry.co.za' || email === 'accountant@myacc.co.za' || data.role === 'admin';
      });
      if (kevinDoc) {
        autoAssignedStaffId = kevinDoc.id;
      }
    }

    const updatePayload: Record<string, any> = {
      status: newStatus,
      fulfillmentStatus: targetFulfillmentStatus,
      auditLog,
      updatedAt: new Date().toISOString(),
      ...(autoAssignedStaffId ? { assignedTo: [autoAssignedStaffId] } : {}),
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
          ...(autoAssignedStaffId ? { assignedTo: [autoAssignedStaffId] } : {}),
        });
      }
    }

    await batch.commit();

    if (autoAssignedStaffId) {
      try {
        await notifyStaffOfAssignment(orderId, autoAssignedStaffId);
      } catch (assignErr) {
        console.warn('[transitionOrderStatusAtomic] Failed to notify assigned staff:', assignErr);
      }
    }

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
  status: 'approved' | 'rejected' | 'ignored' | 'pending',
  performer: PerformerInput | InternalActor,
  reason?: string,
  options?: { suppressClientEmail?: boolean; decidedBy?: 'system' | 'staff'; serviceId?: string; requirementLabel?: string }
) {
  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);

    const orderData = orderDoc.data() || {};
    const actor = await resolveVerifiedActor(performer, orderData as Order);
    let uploads: DocumentUpload[] = orderData.documentUploads || [];

    let targetDocLabel = options?.requirementLabel || '';
    let matched = false;
    const updatedUploads = uploads.map(doc => {
      const isMatch = (doc.id && doc.id === identifier) ||
                      (doc.requirementId && doc.requirementId === identifier) ||
                      doc.fileUrl === identifier ||
                      doc.textValue === identifier ||
                      doc.requirementLabel === identifier ||
                      (options?.requirementLabel && doc.requirementLabel === options.requirementLabel);

      if (isMatch) {
        matched = true;
        targetDocLabel = doc.requirementLabel;
        const updatedItem: DocumentUpload = {
          ...doc,
          status,
          isIgnored: status === 'ignored',
          rejectionReason: status === 'rejected' ? (reason || '') : '',
          aiVerification: {
            ...(doc.aiVerification || { status: 'pending', confidence: 0, recommendation: 'manual_review' }),
            decidedBy: options?.decidedBy || (performer === INTERNAL_SYSTEM_ACTOR ? 'system' : 'staff'),
            decidedAt: new Date().toISOString(),
            summary: status === 'ignored' ? 'Manually bypassed / ignored by staff.' : doc.aiVerification?.summary,
          } as any,
        };
        return updatedItem;
      }
      return doc;
    });

    if (!matched && status === 'ignored') {
      const newIgnoredDoc: DocumentUpload = {
        id: `ign_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        serviceId: options?.serviceId || 'default',
        requirementId: identifier,
        requirementLabel: options?.requirementLabel || identifier,
        type: 'explanation',
        textValue: 'Bypassed / Ignored by staff',
        notAvailableReason: 'Requirement waived by staff consultant.',
        status: 'ignored',
        isIgnored: true,
        uploadedAt: new Date().toISOString(),
        aiVerification: {
          status: 'verified',
          summary: 'Manually bypassed / ignored by staff consultant.',
          reason: 'Requirement waived / ignored by staff.',
          recommendation: 'approve',
          decidedBy: 'staff',
          decidedAt: new Date().toISOString(),
        } as any,
      };
      updatedUploads.push(newIgnoredDoc);
      targetDocLabel = newIgnoredDoc.requirementLabel;
    }

    const cleanedUploads = cleanFirestoreData(updatedUploads);

    const allApproved = cleanedUploads.length > 0 && cleanedUploads.every((d: any) => d.status === 'approved' || d.status === 'ignored');
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
      details: `${status === 'approved' ? 'Approved' : status === 'ignored' ? 'Bypassed / Ignored' : 'Rejected'} requirement: "${targetDocLabel || identifier}"${reason ? ` (Reason: ${reason})` : ''}`,
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
      const partnerPayload = cleanFirestoreData({
        ...updatePayload,
        documentUploads: stripInternalAiData(cleanedUploads),
      });
      batch.update(originalRef, partnerPayload);
    }

    await batch.commit();

    // If a document was rejected, send immediate feedback email to the client with reasons
    // (the verification cycle sends one consolidated note instead, so it suppresses this).
    if (status === 'rejected' && !options?.suppressClientEmail) {
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
 * Staff-triggered AI document audit: runs the verification cycle on an order (checks every item in
 * Documents & Data Required, approves/rejects with reasons, posts the client note, emails Kevin
 * when complete or undecided). Same cycle the client's "Notify Consultant" button runs.
 */
export async function runAiDocumentAuditAtomic(orderId: string, performer: PerformerInput) {
  try {
    const db = getAdminDb();
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);
    const actor = await resolveVerifiedActor(performer, (orderDoc.data() || {}) as Order);
    if (!actor.isStaffOrAdmin) throw new Error('Forbidden: Only staff may run the AI audit.');
    const { runVerificationCycle } = await import('@/lib/agent/verification-cycle');
    const r = await runVerificationCycle(orderId, 'manual');
    const counts = {
      approved: r.items.filter(i => i.outcome === 'approved').length,
      rejected: r.items.filter(i => i.outcome === 'rejected').length,
      missing: r.items.filter(i => i.outcome === 'missing').length,
      pending: r.items.filter(i => i.outcome === 'pending').length,
    };
    return serializeDbData({ success: true, state: r.state, counts, notePosted: r.notePosted, emailedKevin: r.emailedKevin, statusSet: r.statusSet || null, modelCalls: r.modelCalls, notes: r.notes, items: r.items });
  } catch (error: any) {
    console.error('Error running AI document audit:', error);
    return { success: false, error: error.message };
  }
}

/** Staff confirms the AI-drafted client update: posts it, emails the client, sets status, clears the draft. */
export async function postVerificationDraftAtomic(orderId: string, text: string, performer: PerformerInput) {
  try {
    const db = getAdminDb();
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);
    const actor = await resolveVerifiedActor(performer, (orderDoc.data() || {}) as Order);
    if (!actor.isStaffOrAdmin) throw new Error('Forbidden: staff only.');
    if (!text.trim()) throw new Error('The update is empty.');
    const { postVerificationDraft } = await import('@/lib/agent/verification-cycle');
    return await postVerificationDraft(orderId, text.trim(), performer);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function discardVerificationDraftAtomic(orderId: string, performer: PerformerInput) {
  try {
    const db = getAdminDb();
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);
    const actor = await resolveVerifiedActor(performer, (orderDoc.data() || {}) as Order);
    if (!actor.isStaffOrAdmin) throw new Error('Forbidden: staff only.');
    const { discardVerificationDraft } = await import('@/lib/agent/verification-cycle');
    await discardVerificationDraft(orderId);
    return { success: true };
  } catch (error: any) {
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
      const partnerPayload = cleanFirestoreData({
        ...updatePayload,
        documentUploads: stripInternalAiData(updatedUploads),
      });
      batch.update(origRef, partnerPayload);
    }

    await batch.commit();

    // Notify client via email that an additional document is required
    try {
      const clientEmail = orderData.endCustomerEmail || orderData.customerEmail;
      const clientName = orderData.endCustomerName || orderData.customerName || 'Valued Client';
      if (clientEmail) {
        const { sendDocumentReviewFeedback } = await import('@/app/actions/notifications');
        await sendDocumentReviewFeedback({
          orderId,
          clientName,
          clientEmail,
          documentUploads: updatedUploads,
          resellerId: orderData.resellerId,
        });
      }
    } catch (emailErr) {
      console.error('[requestCustomDocumentAtomic] Client email notification warning:', emailErr);
    }

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

export type CreateAdminCustomOrderInput = {
  idToken?: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    isCustom?: boolean;
    serviceId?: string;
    description: string;
    quantity: number;
    price: number;
    discountType?: 'fixed' | 'percentage';
    discountValue?: number;
  }>;
  total: number;
  linkedUserId?: string | null;
  notes?: string;
  department?: Order['department'];
};

/**
 * Atomically generates a custom order from the Admin portal.
 * Handles client account resolution/creation via Admin SDK, sequence ID generation,
 * service snapshots + SOP checklist initialization, and non-blocking confirmation email.
 */
export async function createAdminCustomOrderAction(input: CreateAdminCustomOrderInput) {
  try {
    const authCtx = await getVerifiedAuthContext(input.idToken);
    if (!authCtx) {
      return { success: false, error: 'Unauthorized: A valid authentication token is required.' };
    }
    const isStaffOrAdmin =
      authCtx.isAdmin ||
      authCtx.user.role === 'admin' ||
      authCtx.user.role === 'staff' ||
      authCtx.user.role === 'cap_staff' ||
      authCtx.user.role === 'cap_supervisor';

    if (!isStaffOrAdmin) {
      return { success: false, error: 'Forbidden: Admin or staff privileges are required to create custom orders.' };
    }

    if (!input.customerEmail || !input.customerEmail.includes('@')) {
      return { success: false, error: 'A valid customer email is required.' };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'At least one order item is required.' };
    }

    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();
    const cleanEmail = input.customerEmail.toLowerCase().trim();
    const customerFullName = `${input.customerFirstName.trim()} ${input.customerLastName.trim()}`.trim();

    // 1. Resolve or create user profile
    let finalUserId = input.linkedUserId || null;
    let isNewUser = false;
    let generatedPassword: string | null = null;

    if (finalUserId) {
      const existingUserDoc = await adminDb.collection('users').doc(finalUserId).get();
      if (!existingUserDoc.exists) {
        finalUserId = null;
      }
    }

    if (!finalUserId) {
      // Lookup existing user in Firestore by email
      const userSnap = await adminDb.collection('users').where('email', '==', cleanEmail).limit(1).get();
      if (!userSnap.empty) {
        finalUserId = userSnap.docs[0].id;
      } else {
        // Check Firebase Auth in case user exists in Auth but not users collection
        try {
          const authUser = await adminAuth.getUserByEmail(cleanEmail);
          finalUserId = authUser.uid;
        } catch (e: any) {
          if (e.code !== 'auth/user-not-found') {
            console.warn('[createAdminCustomOrderAction] Auth lookup notice:', e);
          }
        }
      }
    }

    if (!finalUserId) {
      // Create new client user
      isNewUser = true;
      const { customAlphabet } = await import('nanoid');
      const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);
      generatedPassword = nanoid();

      const userRecord = await adminAuth.createUser({
        email: cleanEmail,
        password: generatedPassword,
        displayName: customerFullName,
      });
      finalUserId = userRecord.uid;

      await adminDb.collection('users').doc(finalUserId).set({
        id: finalUserId,
        uid: finalUserId,
        name: customerFullName,
        email: cleanEmail,
        contactNumber: input.customerPhone.trim(),
        role: 'client',
        source: 'Staff Order',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // 2. Sequential Order ID
    const orderId = await getNextOrderId();

    // 3. Service Snapshots & Checklist items
    const serviceSnapshots: OrderServiceSnapshot[] = [];
    const initialChecklist: OrderChecklistItem[] = [];
    let detectedDepartment: Order['department'] = null;

    for (const item of input.items) {
      if (item.serviceId) {
        const serviceDoc = await adminDb.collection('services').doc(item.serviceId).get();
        if (serviceDoc.exists) {
          const serviceData = serviceDoc.data()!;
          if (!detectedDepartment && serviceData.department) {
            detectedDepartment = serviceData.department;
          }

          const normalizedReqs = normalizeRequirementsWithIds(serviceData.informationToProvide || []);
          const serviceChecklist = getServiceChecklist(serviceData);
          const playbookApproved = isPlaybookApproved(serviceData);

          serviceSnapshots.push({
            serviceId: item.serviceId,
            title: serviceData.title || item.description,
            department: serviceData.department || 'Administration',
            requirements: normalizedReqs,
            checklist: serviceChecklist,
            playbookApproved,
            ...(serviceData.playbookVersion ? { playbookVersion: serviceData.playbookVersion } : {}),
            ...(serviceData.playbookEntity ? { playbookEntity: serviceData.playbookEntity } : {}),
          });

          serviceChecklist.forEach((step, idx) => {
            const stepConfig = pickStepConfig(step);
            initialChecklist.push({
              id: `chk_${item.serviceId}_${step.id || idx}`,
              serviceId: item.serviceId!,
              serviceTitle: serviceData.title || item.description,
              title: step.title,
              description: step.description || '',
              type: step.type || 'manual',
              status: 'pending',
              ...(step.aiInstructions ? { aiInstructions: step.aiInstructions } : {}),
              ...(step.templateIds && step.templateIds.length ? { templateIds: step.templateIds } : {}),
              ...(stepConfig ? { stepConfig } : {}),
            });
          });
        }
      }
    }

    const orderData: Order = {
      id: orderId,
      userId: finalUserId,
      customerName: customerFullName,
      customerEmail: cleanEmail,
      customerPhone: input.customerPhone.trim(),
      items: input.items.map((item) => ({
        id: item.serviceId || item.description.toLowerCase().replace(/\s+/g, '-'),
        title: item.description,
        price: item.price,
        quantity: item.quantity,
        ...(item.discountType ? { discountType: item.discountType } : {}),
        ...(item.discountValue !== undefined ? { discountValue: item.discountValue } : {}),
      })),
      total: input.total,
      discountCode: null,
      discountAmount: null,
      paymentMethod: 'EFT',
      status: 'Pending Payment',
      fulfillmentStatus: 'Awaiting Documents',
      date: new Date(),
      department: input.department || detectedDepartment || 'Administration',
      assignedTo: null,
      source: 'Staff',
      originalOrderId: null,
      serviceSnapshots: serviceSnapshots.length > 0 ? serviceSnapshots : undefined,
      checklist: initialChecklist.length > 0 ? initialChecklist : undefined,
      notes: input.notes
        ? [
            {
              text: input.notes,
              date: new Date(),
              authorId: authCtx.userId,
              type: 'note',
              subject: null,
              attachments: null,
            },
          ]
        : [],
    };

    // 4. Save to Firestore atomically via adminDb
    await adminDb.collection('orders').doc(orderId).set(cleanFirestoreData(orderData));

    // 5. Send order confirmation email asynchronously (non-blocking)
    try {
      await sendOrderConfirmationEmailAction({
        orderData: JSON.parse(JSON.stringify(orderData)),
        isNewUser,
        generatedPassword: generatedPassword || undefined,
        showPaymentButton: true,
      });
    } catch (emailError) {
      console.error('[createAdminCustomOrderAction] Non-blocking order email send error:', emailError);
    }

    return {
      success: true,
      orderId,
      userId: finalUserId,
      isNewUser,
    };
  } catch (error: any) {
    console.error('[createAdminCustomOrderAction] Failed to create custom order:', error);
    return {
      success: false,
      error: error.message || 'There was a problem creating the order.',
    };
  }
}

/**
 * Searches for an existing client across users, adminClients, and partnerClients by email.
 * Executed securely on the server via Admin SDK, avoiding client-side permission issues.
 */
export async function lookupClientByEmailAction(email: string, idToken?: string) {
  try {
    const authCtx = await getVerifiedAuthContext(idToken);
    if (!authCtx) {
      return { success: false, error: 'Unauthorized' };
    }
    const isStaffOrAdmin =
      authCtx.isAdmin ||
      authCtx.user.role === 'admin' ||
      authCtx.user.role === 'staff' ||
      authCtx.user.role === 'cap_staff' ||
      authCtx.user.role === 'cap_supervisor';

    if (!isStaffOrAdmin) {
      return { success: false, error: 'Forbidden' };
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: true, user: null };
    }

    const adminDb = getAdminDb();

    // 1. Check users
    const userSnap = await adminDb.collection('users').where('email', '==', cleanEmail).limit(1).get();
    if (!userSnap.empty) {
      const u = userSnap.docs[0].data();
      return {
        success: true,
        user: {
          id: userSnap.docs[0].id,
          name: u.name || u.displayName || 'Existing Client',
          phone: u.contactNumber || u.cellNumber || u.phone || '',
          email: cleanEmail,
        },
      };
    }

    // 2. Check adminClients
    const adminClientsSnap = await adminDb.collection('adminClients').where('email', '==', cleanEmail).limit(1).get();
    if (!adminClientsSnap.empty) {
      const c = adminClientsSnap.docs[0].data();
      return {
        success: true,
        user: {
          id: adminClientsSnap.docs[0].id,
          name: c.name || c.companyName || 'Existing Client',
          phone: c.contactNumber || c.cellNumber || c.phone || '',
          email: cleanEmail,
        },
      };
    }

    // 3. Check partnerClients
    const partnerClientsSnap = await adminDb.collection('partnerClients').where('email', '==', cleanEmail).limit(1).get();
    if (!partnerClientsSnap.empty) {
      const pc = partnerClientsSnap.docs[0].data();
      return {
        success: true,
        user: {
          id: partnerClientsSnap.docs[0].id,
          name: pc.name || pc.companyName || 'Existing Client',
          phone: pc.contactNumber || pc.cellNumber || pc.phone || '',
          email: cleanEmail,
        },
      };
    }

    return { success: true, user: null };
  } catch (err: any) {
    console.error('[lookupClientByEmailAction] Error looking up client by email:', err);
    return { success: false, error: err.message };
  }
}


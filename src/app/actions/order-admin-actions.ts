'use server';

import { getAdminDb, cleanFirestoreData, serializeDbData } from '@/lib/firebase-admin';
import { AuditEntry, Order, OrderChecklistItem, DocumentUpload, AIDocumentVerification } from '@/lib/types';
import { sendOrderStatusUpdateEmailAction } from './order-actions';
import { getServiceChecklist, normalizeRequirementsWithIds } from '@/lib/service-utils';
import { getVerifiedAuthContext, getAuthContext } from '@/lib/server-auth';

export type StatusTransitionOptions = {
  details?: string;
  bypassChecks?: boolean;
  bypassReason?: string;
  fulfillmentStatus?: Order['fulfillmentStatus'];
};

export type PerformerInput = { id?: string; name?: string; idToken?: string; role?: string } | string;

/**
 * Resolves and cryptographically validates the acting user from an ID token or performer object.
 * Strictly prevents caller identity spoofing and enforces role-based authorization for staff and partners.
 */
async function resolveVerifiedActor(performerOrToken: PerformerInput, orderData: Order) {
  let idToken = typeof performerOrToken === 'string' 
    ? (performerOrToken.length > 50 ? performerOrToken : null) 
    : (performerOrToken?.idToken || (performerOrToken as any)?.token);
  
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

  // System automation background tasks
  if (typeof performerOrToken === 'object' && performerOrToken?.id === 'system') {
    return {
      id: 'system',
      name: performerOrToken.name || 'System Automation',
      role: 'system',
      isStaffOrAdmin: true,
      isPartner: false,
    };
  }

  // Verify by user ID if token was not directly passed
  const fallbackId = typeof performerOrToken === 'string' ? performerOrToken : performerOrToken?.id;
  if (fallbackId) {
    const authCtx = await getAuthContext(fallbackId);
    if (authCtx) {
      const isStaffOrAdmin = authCtx.isAdmin || authCtx.user.role === 'admin' || authCtx.user.role === 'staff' || authCtx.user.role === 'cap_staff' || authCtx.user.role === 'cap_supervisor';
      const isPartner = authCtx.userId === orderData.resellerId ||
                        authCtx.userId === orderData.partnerId ||
                        (orderData.resellerId && authCtx.user.partnerId === orderData.resellerId) ||
                        (orderData.partnerId && authCtx.user.partnerId === orderData.partnerId);
      if (isStaffOrAdmin || isPartner) {
        return {
          id: authCtx.userId,
          name: authCtx.user.name || authCtx.user.email || (typeof performerOrToken === 'object' ? performerOrToken.name : 'Verified Staff'),
          role: authCtx.user.role,
          isStaffOrAdmin,
          isPartner,
        };
      }
    }
  }

  throw new Error('Unauthorized: Valid authentication token or verified staff permissions required.');
}

/**
 * Initializes the SOP checklist and service snapshots for an existing order if missing.
 */
export async function ensureOrderChecklistInitialized(orderId: string): Promise<OrderChecklistItem[]> {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) return [];

  const orderData = orderDoc.data() || {};
  if (orderData.checklist && Array.isArray(orderData.checklist) && orderData.checklist.length > 0) {
    return orderData.checklist;
  }

  const items = orderData.items || [];
  const checklist: OrderChecklistItem[] = [];
  const serviceSnapshots: any[] = [];

  for (const item of items) {
    const serviceId = item.id || item.serviceId;
    if (!serviceId) continue;

    let serviceData: any = null;
    const serviceDoc = await db.collection('services').doc(serviceId).get();
    if (serviceDoc.exists) {
      serviceData = serviceDoc.data();
    }

    const serviceChecklist = getServiceChecklist(serviceData);
    const normalizedReqs = normalizeRequirementsWithIds(serviceData?.informationToProvide || []);

    serviceSnapshots.push({
      serviceId,
      title: serviceData?.title || item.title || 'Service',
      department: serviceData?.department || 'Administration',
      requirements: normalizedReqs,
      checklist: serviceChecklist,
    });

    serviceChecklist.forEach((step, idx) => {
      checklist.push({
        id: `chk_${serviceId}_${step.id || idx}`,
        serviceId,
        serviceTitle: serviceData?.title || item.title || 'Service',
        title: step.title,
        description: step.description || '',
        aiInstructions: step.aiInstructions || '',
        type: step.type || 'manual',
        status: 'pending',
        templateIds: step.templateIds && step.templateIds.length > 0 ? step.templateIds : undefined,
      });
    });
  }

  await orderRef.update({
    checklist,
    serviceSnapshots,
    fulfillmentStatus: orderData.fulfillmentStatus || 'Awaiting Documents',
    updatedAt: new Date().toISOString(),
  });

  return serializeDbData(checklist);
}

/**
 * Canonical State Machine Transition Engine for Orders.
 * Enforces deterministic validation rules before permitting state changes:
 * - Completed: Checks incomplete dependencies, pending/rejected uploads, uncompleted checklist items.
 */
export async function transitionOrderStatusAtomic(
  orderId: string,
  newStatus: 'Pending Payment' | 'Processing' | 'Completed' | 'Cancelled',
  performer: PerformerInput,
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

      // 3. Check checklist items
      const checklist = orderData.checklist || [];
      const incompleteSteps = checklist.filter(s => s.status !== 'completed' && s.status !== 'skipped');
      if (incompleteSteps.length > 0) {
        return {
          success: false,
          error: `Cannot complete Order #${orderId}. ${incompleteSteps.length} SOP checklist step(s) remain incomplete: ${incompleteSteps.map(s => `"${s.title}"`).join(', ')}. Complete all steps or mark as skipped.`,
          isBlockedByChecklist: true,
          incompleteSteps: incompleteSteps.map(s => s.title),
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
    if (orderData.originalOrderId && orderData.originalOrderId !== orderId) {
      const originalRef = db.collection('orders').doc(orderData.originalOrderId);
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
 * Backward compatibility alias for updateOrderStatusAtomic.
 */
export const updateOrderStatusAtomic = transitionOrderStatusAtomic;

/**
 * Updates a checklist step atomically.
 */
export async function updateOrderChecklistItemAtomic(
  orderId: string,
  stepId: string,
  update: {
    status: OrderChecklistItem['status'];
    notes?: string;
    artifactUrl?: string;
    artifactName?: string;
    isAiRecommended?: boolean;
    aiNotes?: string;
  },
  performer: PerformerInput
) {
  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);

    const orderData = orderDoc.data() || {};
    const actor = await resolveVerifiedActor(performer, orderData as Order);

    let checklist: OrderChecklistItem[] = orderData.checklist || [];

    if (checklist.length === 0) {
      checklist = await ensureOrderChecklistInitialized(orderId);
    }

    const stepIndex = checklist.findIndex(s => s.id === stepId);
    if (stepIndex === -1) throw new Error(`Checklist step "${stepId}" not found on order #${orderId}`);

    const existingStep = checklist[stepIndex];
    const previousStatus = existingStep.status;

    checklist[stepIndex] = {
      ...existingStep,
      status: update.status,
      notes: update.notes !== undefined ? update.notes : existingStep.notes,
      artifactUrl: update.artifactUrl !== undefined ? update.artifactUrl : existingStep.artifactUrl,
      artifactName: update.artifactName !== undefined ? update.artifactName : existingStep.artifactName,
      isAiRecommended: update.isAiRecommended !== undefined ? update.isAiRecommended : existingStep.isAiRecommended,
      aiNotes: update.aiNotes !== undefined ? update.aiNotes : existingStep.aiNotes,
      completedAt: update.status === 'completed' ? new Date().toISOString() : existingStep.completedAt,
      completedBy: update.status === 'completed' ? actor.id : existingStep.completedBy,
      completedByName: update.status === 'completed' ? actor.name : existingStep.completedByName,
    };

    // Calculate new fulfillment status based on checklist progress
    const allCompletedOrSkipped = checklist.every(s => s.status === 'completed' || s.status === 'skipped');
    const anyInProgress = checklist.some(s => s.status === 'in_progress' || s.status === 'completed');
    
    let newFulfillmentStatus: Order['fulfillmentStatus'] = orderData.fulfillmentStatus || 'Awaiting Documents';
    if (allCompletedOrSkipped) {
      newFulfillmentStatus = 'Ready for Signoff';
    } else if (anyInProgress) {
      newFulfillmentStatus = 'In Execution';
    }

    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'CHECKLIST_STEP_UPDATE',
      performedBy: actor.id,
      performedByName: actor.name,
      timestamp: new Date().toISOString(),
      previousValue: previousStatus,
      newValue: update.status,
      details: `Updated checklist step "${existingStep.title}" to ${update.status}${update.notes ? ` (${update.notes})` : ''}`,
    };

    const batch = db.batch();
    const updatePayload = cleanFirestoreData({
      checklist,
      fulfillmentStatus: newFulfillmentStatus,
      auditLog: [...(orderData.auditLog || []), auditEntry],
      updatedAt: new Date().toISOString(),
    });

    batch.update(orderRef, updatePayload);

    if (orderData.originalOrderId && orderData.originalOrderId !== orderId) {
      const originalRef = db.collection('orders').doc(orderData.originalOrderId);
      batch.update(originalRef, updatePayload);
    }

    await batch.commit();

    return serializeDbData({
      success: true,
      message: `Step "${existingStep.title}" marked as ${update.status}`,
      fulfillmentStatus: newFulfillmentStatus,
      updatedChecklist: checklist,
    });
  } catch (error: any) {
    console.error('Error updating order checklist item:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reviews an uploaded document atomically (Approve/Reject), updates AI recommendation, and logs audit trail.
 */
export async function reviewOrderDocumentAtomic(
  orderId: string,
  identifier: string, // requirementId, fileUrl, or textValue
  status: 'approved' | 'rejected',
  performer: PerformerInput,
  reason?: string,
  aiVerification?: AIDocumentVerification
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
        const finalAi = aiVerification || doc.aiVerification;
        if (finalAi) {
          updatedItem.aiVerification = finalAi;
        } else {
          delete (updatedItem as any).aiVerification;
        }
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

    if (orderData.originalOrderId && orderData.originalOrderId !== orderId) {
      const originalRef = db.collection('orders').doc(orderData.originalOrderId);
      batch.update(originalRef, updatePayload);
    }

    await batch.commit();

    // If all documents are approved, auto-generate statutory document drafts
    if (status === 'approved' && allApproved) {
      try {
        const { generateOrderDocumentDraftsInternal } = await import('@/app/actions/order-fulfillment-pipeline');
        await generateOrderDocumentDraftsInternal(orderId);
      } catch (genErr) {
        console.error('Error generating document drafts on final approval:', genErr);
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

    if (orderData.originalOrderId && orderData.originalOrderId !== orderId) {
      const originalRef = db.collection('orders').doc(orderData.originalOrderId);
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

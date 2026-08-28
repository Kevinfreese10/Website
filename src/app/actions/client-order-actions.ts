'use server';

import { getAdminDb, cleanFirestoreData, serializeDbData } from '@/lib/firebase-admin';
import { getVerifiedAuthContext } from '@/lib/server-auth';
import { resolvePartnerMirrorOrderId } from '@/lib/service-utils';
import { Order, DocumentUpload, AuditEntry } from '@/lib/types';
import { runUploadChecks, findRequirement, collectExistingHashes } from '@/lib/verification/run-upload-checks';
import { after } from 'next/server';

export interface SubmitClientDocParams {
  idToken: string;
  orderId: string;
  serviceId: string;
  requirementId?: string;
  requirementLabel: string;
  type: 'file' | 'text';
  fileUrl?: string;
  /**
   * All files submitted for this requirement. The UI explicitly supports selecting many files at
   * once (e.g. 12 monthly bank statements) — previously only `fileUrl` was persisted, so every
   * file after the first was silently discarded while the client was told all of them were saved.
   */
  files?: { fileUrl: string; fileName?: string; uploadedAt?: string }[];
  textValue?: string;
  notAvailableReason?: string;
}

/**
 * Securely submits a client document or information input.
 * Strictly enforces 'pending' status and prevents self-approval or forged AI verifications.
 */
export async function submitClientDocumentUploadAction(params: SubmitClientDocParams) {
  try {
    const authCtx = await getVerifiedAuthContext(params.idToken);
    if (!authCtx) {
      return { success: false, error: 'Unauthorized: Valid authentication required.' };
    }

    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(params.orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { success: false, error: `Order #${params.orderId} not found.` };
    }

    const order = orderDoc.data() as Order;

    // Validate access to order
    const isClient = authCtx.userId === order.userId || 
                     authCtx.userId === order.clientId || 
                     authCtx.user.email?.toLowerCase() === order.customerEmail?.toLowerCase() ||
                     authCtx.user.email?.toLowerCase() === order.endCustomerEmail?.toLowerCase();
    
    const isPartner = authCtx.userId === order.resellerId ||
                      authCtx.userId === order.partnerId ||
                      (order.resellerId && authCtx.user.partnerId === order.resellerId) ||
                      (order.partnerId && authCtx.user.partnerId === order.partnerId);

    if (!authCtx.isAdmin && !isClient && !isPartner) {
      return { success: false, error: 'Forbidden: You do not have permission to upload documents to this order.' };
    }

    const currentUploads: DocumentUpload[] = order.documentUploads || [];
    const uploadId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const nowIso = new Date().toISOString();

    const submittedFiles = params.type === 'file' && Array.isArray(params.files)
      ? params.files.filter(f => f && f.fileUrl).map(f => ({
          id: (f as any).id || `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          fileUrl: f.fileUrl,
          fileName: f.fileName || 'document',
          uploadedAt: f.uploadedAt || nowIso,
        }))
      : [];

    const newDocItemRaw: DocumentUpload = {
      id: uploadId,
      serviceId: params.serviceId || order.items?.[0]?.id || 'service',
      requirementId: params.requirementId || undefined,
      requirementLabel: params.requirementLabel.trim(),
      type: params.type,
      // Keep `fileUrl` as the primary/first file for backwards compatibility with existing
      // consumers, and persist the complete set alongside it.
      fileUrl: params.type === 'file' ? (params.fileUrl || submittedFiles[0]?.fileUrl) : undefined,
      files: submittedFiles.length > 0 ? submittedFiles : undefined,
      textValue: params.type === 'text' ? params.textValue : undefined,
      notAvailableReason: params.notAvailableReason?.trim() || undefined,
      uploadedAt: nowIso,
      status: 'pending', // Strictly enforced server-side
      rejectionReason: undefined,
    };

    // Layer 1 mechanical checks (AI-ORDER-AGENT-PLAN.md §6.2): file integrity, ID/registration
    // number formats, duplicates; secret text values are encrypted at rest. Never blocks the
    // submission — the result is stored on the upload and the client gets immediate feedback.
    const requirement = findRequirement(order, params.serviceId, params.requirementId, params.requirementLabel);
    const existingHashes = collectExistingHashes(currentUploads.filter(u =>
      !((params.requirementId && (u.requirementId === params.requirementId || u.id === params.requirementId)) ||
        (u.requirementLabel === params.requirementLabel && u.serviceId === params.serviceId))));
    const { upload: newDocItem, feedback: mechanicalFeedback } = await runUploadChecks(newDocItemRaw, requirement, existingHashes);

    let itemReplaced = false;
    const updatedUploads = currentUploads.map(doc => {
      const isMatch = (params.requirementId && doc.requirementId === params.requirementId) ||
                      (params.requirementId && doc.id === params.requirementId) ||
                      (doc.requirementLabel === params.requirementLabel && doc.serviceId === params.serviceId);

      if (isMatch) {
        itemReplaced = true;
        return {
          ...doc,
          ...newDocItem,
          id: doc.id || uploadId,
        };
      }
      return doc;
    });

    if (!itemReplaced) {
      updatedUploads.push(newDocItem);
    }

    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: nowIso,
      action: 'DOCUMENT_UPLOADED',
      performedBy: authCtx.userId,
      performedByName: authCtx.user.name || authCtx.user.email || 'Client',
      details: `Submitted requirement "${params.requirementLabel}" (${params.type === 'file' ? 'File Upload' : params.notAvailableReason ? 'Missing Doc Note' : 'Text Input'}). Status: Pending Verification.${newDocItem.mechanicalCheck ? ` Mechanical check: ${newDocItem.mechanicalCheck.status}${newDocItem.mechanicalCheck.issues.length ? ' — ' + newDocItem.mechanicalCheck.issues.map(i => i.code).join(', ') : ''}.` : ''}`,
    };

    const updatePayload: any = {
      documentUploads: cleanFirestoreData(updatedUploads),
      auditLog: [...(order.auditLog || []), auditEntry],
      updatedAt: nowIso,
    };

    if (order.fulfillmentStatus === 'Awaiting Documents' || !order.fulfillmentStatus) {
      updatePayload.fulfillmentStatus = 'Under Review';
    }

    await orderRef.update(updatePayload);

    // Sync with original order if this is an outsourced sub-order
    const mirrorId = resolvePartnerMirrorOrderId({ ...order, id: params.orderId });
    if (mirrorId) {
      const origRef = db.collection('orders').doc(mirrorId);
      await origRef.update({
        documentUploads: cleanFirestoreData(updatedUploads),
        auditLog: [...(order.auditLog || []), auditEntry],
        fulfillmentStatus: updatePayload.fulfillmentStatus || order.fulfillmentStatus,
        updatedAt: nowIso,
      });
    }

    // Run the verification cycle after the response is sent (Next 15+ `after`): the new file is
    // checked and the client hears back in Communication History if anything is wrong.
    after(async () => {
      try {
        const { runVerificationCycle } = await import('@/lib/agent/verification-cycle');
        await runVerificationCycle(params.orderId, 'upload');
      } catch (e) {
        console.error('[submitClientDocumentUploadAction] verification cycle failed:', e);
      }
    });

    return {
      success: true,
      message: mechanicalFeedback
        ? (newDocItem.mechanicalCheck?.status === 'fail'
            ? `We've saved your submission, but there's a problem: ${mechanicalFeedback}`
            : `Document submitted for verification. Note: ${mechanicalFeedback}`)
        : 'Document successfully submitted for verification.',
      mechanicalStatus: newDocItem.mechanicalCheck?.status || null,
      mechanicalFeedback: mechanicalFeedback,
      documentUploads: serializeDbData(updatedUploads),
    };
  } catch (error: any) {
    console.error('[submitClientDocumentUploadAction] Error:', error);
    return { success: false, error: error.message || 'Failed to submit document upload.' };
  }
}

export interface RemoveClientDocFileParams {
  idToken: string;
  orderId: string;
  serviceId: string;
  requirementLabel: string;
  fileId: string;
}

/**
 * Securely removes a file from a client's document upload requirement.
 */
export async function removeClientDocumentFileAction(params: RemoveClientDocFileParams) {
  try {
    const authCtx = await getVerifiedAuthContext(params.idToken);
    if (!authCtx) {
      return { success: false, error: 'Unauthorized: Valid authentication required.' };
    }

    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(params.orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { success: false, error: `Order #${params.orderId} not found.` };
    }

    const order = orderDoc.data() as Order;

    const isClient = authCtx.userId === order.userId || 
                     authCtx.userId === order.clientId || 
                     authCtx.user.email?.toLowerCase() === order.customerEmail?.toLowerCase() ||
                     authCtx.user.email?.toLowerCase() === order.endCustomerEmail?.toLowerCase();
    
    const isPartner = authCtx.userId === order.resellerId ||
                      authCtx.userId === order.partnerId ||
                      (order.resellerId && authCtx.user.partnerId === order.resellerId) ||
                      (order.partnerId && authCtx.user.partnerId === order.partnerId);

    if (!authCtx.isAdmin && !isClient && !isPartner) {
      return { success: false, error: 'Forbidden: You do not have permission to remove files from this order.' };
    }

    const currentUploads: DocumentUpload[] = order.documentUploads || [];
    const existingIndex = currentUploads.findIndex(d => 
      (d.serviceId === params.serviceId || d.serviceId === order.items?.[0]?.id) && 
      d.requirementLabel === params.requirementLabel
    );

    if (existingIndex === -1) {
      return { success: false, error: 'Document requirement not found.' };
    }

    const existingUpload = currentUploads[existingIndex];
    let currentFiles = existingUpload.files || [];
    if (currentFiles.length === 0 && existingUpload.fileUrl) {
      currentFiles = [{
        id: 'legacy',
        fileUrl: existingUpload.fileUrl,
        fileName: existingUpload.fileName || 'Uploaded Document',
        uploadedAt: new Date().toISOString(),
      }];
    }

    const remainingFiles = currentFiles.filter(f => f.id !== params.fileId && f.fileUrl !== params.fileId);
    const updatedUploads = [...currentUploads];

    if (remainingFiles.length > 0) {
      updatedUploads[existingIndex] = {
        ...existingUpload,
        fileUrl: remainingFiles[0].fileUrl,
        fileName: remainingFiles[0].fileName,
        files: remainingFiles,
        status: 'pending',
      };
    } else {
      updatedUploads[existingIndex] = {
        ...existingUpload,
        fileUrl: '',
        fileName: '',
        files: [],
        status: 'pending',
      };
    }

    const nowIso = new Date().toISOString();
    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: nowIso,
      action: 'DOCUMENT_UPLOADED',
      performedBy: authCtx.userId,
      performedByName: authCtx.user.name || authCtx.user.email || 'Client',
      details: `Removed attached file from requirement "${params.requirementLabel}".`,
    };

    await orderRef.update({
      documentUploads: cleanFirestoreData(updatedUploads),
      auditLog: [...(order.auditLog || []), auditEntry],
      updatedAt: nowIso,
    });

    const mirrorId = resolvePartnerMirrorOrderId({ ...order, id: params.orderId });
    if (mirrorId) {
      const origRef = db.collection('orders').doc(mirrorId);
      await origRef.update({
        documentUploads: cleanFirestoreData(updatedUploads),
        auditLog: [...(order.auditLog || []), auditEntry],
        updatedAt: nowIso,
      });
    }

    return {
      success: true,
      message: 'File removed successfully.',
      documentUploads: serializeDbData(updatedUploads),
    };
  } catch (error: any) {
    console.error('[removeClientDocumentFileAction] Error:', error);
    return { success: false, error: error.message || 'Failed to remove file.' };
  }
}

export interface SyncQuestionnaireParams {
  idToken: string;
  orderId: string;
  serviceId: string;
  requirementLabel: string;
  answerValue: 'Applicable (Yes)' | 'N/A (No)' | string;
}

/**
 * Securely saves client answers to conditional questionnaire prompts.
 */
export async function syncClientQuestionnaireAction(params: SyncQuestionnaireParams) {
  try {
    const authCtx = await getVerifiedAuthContext(params.idToken);
    if (!authCtx) {
      return { success: false, error: 'Unauthorized: Valid authentication required.' };
    }

    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(params.orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { success: false, error: `Order #${params.orderId} not found.` };
    }

    const order = orderDoc.data() as Order;

    const isClient = authCtx.userId === order.userId || 
                     authCtx.userId === order.clientId || 
                     authCtx.user.email?.toLowerCase() === order.customerEmail?.toLowerCase() ||
                     authCtx.user.email?.toLowerCase() === order.endCustomerEmail?.toLowerCase();

    if (!authCtx.isAdmin && !isClient) {
      return { success: false, error: 'Forbidden: Cannot update this questionnaire.' };
    }

    const currentUploads: DocumentUpload[] = order.documentUploads || [];
    const uploadId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const nowIso = new Date().toISOString();

    const existingIndex = currentUploads.findIndex(d => 
      (d.serviceId === params.serviceId || d.serviceId === order.items?.[0]?.id) &&
      d.requirementLabel === params.requirementLabel
    );

    const newUpload: DocumentUpload = {
      id: existingIndex > -1 ? currentUploads[existingIndex].id : uploadId,
      serviceId: params.serviceId,
      requirementLabel: params.requirementLabel,
      type: 'text',
      textValue: params.answerValue,
      uploadedAt: nowIso,
      status: 'pending',
    };

    let updatedUploads = [...currentUploads];
    if (existingIndex > -1) {
      updatedUploads[existingIndex] = {
        ...currentUploads[existingIndex],
        ...newUpload,
      };
    } else {
      updatedUploads.push(newUpload);
    }

    await orderRef.update({
      documentUploads: cleanFirestoreData(updatedUploads),
      updatedAt: nowIso,
    });

    const mirrorId = resolvePartnerMirrorOrderId({ ...order, id: params.orderId });
    if (mirrorId) {
      const origRef = db.collection('orders').doc(mirrorId);
      await origRef.update({
        documentUploads: cleanFirestoreData(updatedUploads),
        updatedAt: nowIso,
      });
    }

    return {
      success: true,
      message: 'Questionnaire response saved.',
      documentUploads: serializeDbData(updatedUploads),
    };
  } catch (error: any) {
    console.error('[syncClientQuestionnaireAction] Error:', error);
    return { success: false, error: error.message || 'Failed to sync questionnaire.' };
  }
}

/**
 * Called when the client presses "Notify Consultant of All Submissions". Runs the full
 * verification cycle for the order and returns a short summary for the toast.
 */
export async function notifyConsultantAndVerifyAction(params: { idToken: string; orderId: string }) {
  try {
    const authCtx = await getVerifiedAuthContext(params.idToken);
    if (!authCtx) return { success: false, error: 'Unauthorized' };
    const db = getAdminDb();
    const snap = await db.collection('orders').doc(params.orderId).get();
    if (!snap.exists) return { success: false, error: 'Order not found' };
    const order = snap.data() as Order;
    const isClient = authCtx.userId === order.userId || authCtx.userId === order.clientId ||
      authCtx.user.email?.toLowerCase() === order.customerEmail?.toLowerCase() ||
      authCtx.user.email?.toLowerCase() === order.endCustomerEmail?.toLowerCase();
    if (!authCtx.isAdmin && !isClient) return { success: false, error: 'Forbidden' };

    const { runVerificationCycle } = await import('@/lib/agent/verification-cycle');
    const r = await runVerificationCycle(params.orderId, 'notify');
    
    // Ensure order is flagged as Under Review
    await db.collection('orders').doc(params.orderId).update({
      fulfillmentStatus: 'Under Review',
      lastClientSubmissionAt: new Date().toISOString(),
    });

    const c = { 
      approved: r.items.filter(i => i.outcome === 'approved').length, 
      rejected: r.items.filter(i => i.outcome === 'rejected').length, 
      missing: r.items.filter(i => i.outcome === 'missing').length, 
      pending: r.items.filter(i => i.outcome === 'pending').length 
    };

    const message = r.state === 'complete'
      ? 'All your documents have been verified and approved. Your consultant has received the full audit report.'
      : r.state === 'awaiting_consultant'
        ? `${c.approved} document(s) verified; ${c.pending} item(s) are with your consultant for review. Audit report sent.`
        : `${c.approved} approved; ${c.rejected + c.missing} item(s) need your attention — see your order notes. Audit report sent to consultant.`;

    return { success: true, state: r.state, counts: c, message };
  } catch (e: any) {
    console.error('[notifyConsultantAndVerifyAction]', e);
    return { success: false, error: e.message || 'Verification failed' };
  }
}

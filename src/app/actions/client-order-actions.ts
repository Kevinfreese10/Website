'use server';

import { getAdminDb, cleanFirestoreData, serializeDbData } from '@/lib/firebase-admin';
import { getVerifiedAuthContext } from '@/lib/server-auth';
import { resolvePartnerMirrorOrderId } from '@/lib/service-utils';
import { Order, DocumentUpload, AuditEntry } from '@/lib/types';
import { runUploadChecks, findRequirement, collectExistingHashes } from '@/lib/verification/run-upload-checks';


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
 * Called when the client presses "Submit Intake & Notify Consultant". Updates order status
 * to 'Under Review', logs an audit entry, appends a note, and notifies the assigned staff/admin for review.
 */
export async function notifyConsultantAndVerifyAction(params: { idToken: string; orderId: string }) {
  try {
    const authCtx = await getVerifiedAuthContext(params.idToken);
    if (!authCtx) return { success: false, error: 'Unauthorized: Authentication required.' };
    const db = getAdminDb();
    let orderRef = db.collection('orders').doc(params.orderId);
    let snap = await orderRef.get();
    if (!snap.exists) {
      const numQuery = await db.collection('orders').where('orderNumber', '==', isNaN(Number(params.orderId)) ? params.orderId : Number(params.orderId)).limit(1).get();
      if (!numQuery.empty) {
        orderRef = numQuery.docs[0].ref;
        snap = numQuery.docs[0];
      } else {
        return { success: false, error: 'Order not found' };
      }
    }
    const order = snap.data() as Order;
    const isClient = authCtx.userId === order.userId || 
                     authCtx.userId === order.clientId ||
                     authCtx.userId === order.resellerId ||
                     authCtx.userId === order.partnerId ||
                     (order.resellerId && authCtx.user.partnerId === order.resellerId) ||
                     (order.partnerId && authCtx.user.partnerId === order.partnerId) ||
                     authCtx.user.email?.toLowerCase() === order.customerEmail?.toLowerCase() ||
                     authCtx.user.email?.toLowerCase() === order.endCustomerEmail?.toLowerCase() ||
                     authCtx.isAdmin ||
                     authCtx.isStaff;
    if (!isClient) return { success: false, error: 'Forbidden: You do not have permission to update this order.' };

    const nowIso = new Date().toISOString();
    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: nowIso,
      action: 'SUBMISSION_NOTIFIED',
      performedBy: authCtx.userId,
      performedByName: authCtx.user.name || authCtx.user.email || 'Client',
      details: 'Client submitted document intake and notified consultant for review.',
    };

    const newNote = {
      text: "Client has submitted their documents for review.",
      authorId: authCtx.userId,
      date: new Date().toISOString(),
      type: 'note',
      subject: null,
      attachments: null,
    };

    const currentNotes = Array.isArray(order.notes) ? order.notes : [];
    const updatePayload: Record<string, any> = {
      status: 'Under Review',
      fulfillmentStatus: 'Under Review',
      lastClientSubmissionAt: nowIso,
      notes: [...currentNotes, newNote],
      auditLog: [...(order.auditLog || []), auditEntry],
      updatedAt: nowIso,
    };

    await orderRef.update(updatePayload);

    // Sync partner mirror order if applicable
    const mirrorId = resolvePartnerMirrorOrderId({ ...order, id: params.orderId });
    if (mirrorId) {
      const origRef = db.collection('orders').doc(mirrorId);
      const origSnap = await origRef.get();
      if (origSnap.exists) {
        const origData = origSnap.data() as Order;
        const origNotes = Array.isArray(origData.notes) ? origData.notes : [];
        await origRef.update({
          status: 'Under Review',
          fulfillmentStatus: 'Under Review',
          lastClientSubmissionAt: nowIso,
          notes: [...origNotes, newNote],
          auditLog: [...(origData.auditLog || []), auditEntry],
          updatedAt: nowIso,
        });
      }
    }

    // Notify staff asynchronously without blocking or failing the action
    try {
      const { notifyStaffOfClientNote } = await import('@/app/actions/notifications');
      await notifyStaffOfClientNote({
        orderId: snap.id,
        senderName: authCtx.user.name || authCtx.user.email || 'Client',
        noteText: 'Client has submitted their documents for review.',
      });
    } catch (mailErr) {
      console.error('[notifyConsultantAndVerifyAction] Email notification warning:', mailErr);
    }

    const message = "Your documents have been submitted and queued for your consultant's review.";
    return { success: true, message };
  } catch (e: any) {
    console.error('[notifyConsultantAndVerifyAction] Error:', e);
    return { success: false, error: e.message || 'Notification failed' };
  }
}

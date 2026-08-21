'use server';

import { getAdminDb, cleanFirestoreData, serializeDbData } from '@/lib/firebase-admin';
import { getVerifiedAuthContext } from '@/lib/server-auth';
import { Order, DocumentUpload, AuditEntry } from '@/lib/types';
import { triggerOrderAutomatedFulfillmentReview } from './order-fulfillment-pipeline';

export interface SubmitClientDocParams {
  idToken: string;
  orderId: string;
  serviceId: string;
  requirementId?: string;
  requirementLabel: string;
  type: 'file' | 'text';
  fileUrl?: string;
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

    const newDocItem: DocumentUpload = {
      id: uploadId,
      serviceId: params.serviceId || order.items?.[0]?.id || 'service',
      requirementId: params.requirementId || undefined,
      requirementLabel: params.requirementLabel.trim(),
      type: params.type,
      fileUrl: params.type === 'file' ? params.fileUrl : undefined,
      textValue: params.type === 'text' ? params.textValue : undefined,
      notAvailableReason: params.notAvailableReason?.trim() || undefined,
      uploadedAt: nowIso,
      status: 'pending', // Strictly enforced server-side
      rejectionReason: undefined,
    };

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
      details: `Submitted requirement "${params.requirementLabel}" (${params.type === 'file' ? 'File Upload' : params.notAvailableReason ? 'Missing Doc Note' : 'Text Input'}). Status: Pending Verification.`,
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
    if (order.originalOrderId) {
      const origRef = db.collection('orders').doc(order.originalOrderId);
      await origRef.update({
        documentUploads: cleanFirestoreData(updatedUploads),
        auditLog: [...(order.auditLog || []), auditEntry],
        fulfillmentStatus: updatePayload.fulfillmentStatus || order.fulfillmentStatus,
        updatedAt: nowIso,
      });
    }

    // Asynchronously kick off the AI automated review pipeline silently on upload
    const isAllRequirementsComplete = updatedUploads.length > 0 && updatedUploads.every(d => Boolean((d.files && d.files.length > 0) || d.fileUrl || d.textValue || d.notAvailableReason));
    triggerOrderAutomatedFulfillmentReview(params.orderId, authCtx.user.name, { notifyStaff: isAllRequirementsComplete }).catch(err => {
      console.error('[client-order-actions] Error kicking off AI review pipeline:', err);
    });

    return {
      success: true,
      message: 'Document successfully submitted for verification.',
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

    if (order.originalOrderId) {
      const origRef = db.collection('orders').doc(order.originalOrderId);
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

    if (order.originalOrderId) {
      const origRef = db.collection('orders').doc(order.originalOrderId);
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

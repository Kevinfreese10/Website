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

    // Asynchronously kick off the AI automated review pipeline
    triggerOrderAutomatedFulfillmentReview(params.orderId, authCtx.user.name).catch(err => {
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

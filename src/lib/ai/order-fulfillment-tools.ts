'use server';

/**
 * @fileOverview AI Order Fulfillment Tools & Server Actions.
 * Provides the execution API for the autonomous Order Fulfillment AI Agent and the Admin Dashboard.
 */

import { getAdminDb } from '@/lib/firebase-admin';
import { Order, OrderChecklistItem, DocumentUpload, AIDocumentVerification } from '@/lib/types';
import { verifyOrderDocument } from '@/ai/flows/verify-order-document';
import { resolveOrderEntityContext, stripInternalAiData } from '@/lib/service-utils';
import { getVerifiedAuthContext } from '@/lib/server-auth';
import {
  transitionOrderStatusAtomic,
  updateOrderChecklistItemAtomic,
  reviewOrderDocumentAtomic,
  ensureOrderChecklistInitialized,
} from '@/app/actions/order-admin-actions';

/**
 * Verifies the caller is My Accountant staff/admin.
 *
 * Everything in this file exposes internal AI audit capability — verification results, confidence
 * scores, extracted client data and full order dumps. These are `'use server'` exports, which means
 * they are directly-callable HTTP endpoints: not rendering a button is NOT access control. Partners
 * and clients must be rejected here, on the server, regardless of what any UI shows.
 */
async function requireStaffActor(idToken: string | undefined | null) {
  const authCtx = await getVerifiedAuthContext(idToken);
  if (!authCtx) {
    throw new Error('Unauthorized: A valid authentication token is required.');
  }
  const role = authCtx.user.role;
  const isStaffOrAdmin =
    authCtx.isAdmin || role === 'admin' || role === 'staff' || role === 'cap_staff' || role === 'cap_supervisor';
  if (!isStaffOrAdmin) {
    throw new Error('Forbidden: AI verification is restricted to My Accountant staff.');
  }
  return {
    id: authCtx.userId,
    name: authCtx.user.name || authCtx.user.email || 'Verified Staff',
  };
}

/**
 * Retrieves the full fulfillment context for an order (order, checklist, uploads, snapshots, dependencies).
 * Staff-only: returns the complete internal order record including AI verification data.
 */
export async function getOrderFulfillmentContext(orderId: string, idToken?: string) {
  try {
    await requireStaffActor(idToken);
    const db = getAdminDb();
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return { success: false, error: `Order #${orderId} not found` };
    }

    const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;

    // Ensure checklist is populated
    let checklist = orderData.checklist || [];
    if (checklist.length === 0) {
      checklist = await ensureOrderChecklistInitialized(orderId);
    }

    // Prerequisite status inspection
    const prereqs: { id: string; status: string; isComplete: boolean }[] = [];
    if (orderData.dependsOnOrderIds && orderData.dependsOnOrderIds.length > 0) {
      for (const pId of orderData.dependsOnOrderIds) {
        const pDoc = await db.collection('orders').doc(pId).get();
        if (pDoc.exists) {
          const pStatus = pDoc.data()?.status || 'Unknown';
          prereqs.push({
            id: pId,
            status: pStatus,
            isComplete: pStatus === 'Completed',
          });
        }
      }
    }

    const uploads = orderData.documentUploads || [];
    const pendingDocs = uploads.filter(d => d.status === 'pending');
    const approvedDocs = uploads.filter(d => d.status === 'approved');
    const rejectedDocs = uploads.filter(d => d.status === 'rejected');

    const completedSteps = checklist.filter(s => s.status === 'completed' || s.status === 'skipped');
    const progressPercent = checklist.length > 0
      ? Math.round((completedSteps.length / checklist.length) * 100)
      : 0;

    return {
      success: true,
      order: orderData,
      checklist,
      prerequisites: prereqs,
      documentStats: {
        total: uploads.length,
        pending: pendingDocs.length,
        approved: approvedDocs.length,
        rejected: rejectedDocs.length,
      },
      fulfillmentProgress: {
        totalSteps: checklist.length,
        completedSteps: completedSteps.length,
        progressPercent,
        fulfillmentStatus: orderData.fulfillmentStatus || 'Awaiting Documents',
      },
    };
  } catch (error: any) {
    console.error('Error fetching order fulfillment context:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Triggers AI document verification on an uploaded document and stores the analysis.
 */
export async function runAiDocumentVerification(orderId: string, requirementIdentifier: string, idToken?: string) {
  try {
    await requireStaffActor(idToken);
    const db = getAdminDb();
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);

    const orderData = orderDoc.data() as Order;
    const uploads: DocumentUpload[] = orderData.documentUploads || [];

    const targetDoc = uploads.find(d =>
      (d.id && d.id === requirementIdentifier) ||
      (d.requirementId && d.requirementId === requirementIdentifier) ||
      d.fileUrl === requirementIdentifier ||
      d.textValue === requirementIdentifier ||
      d.requirementLabel === requirementIdentifier
    );

    if (!targetDoc) {
      throw new Error(`Document "${requirementIdentifier}" not found on Order #${orderId}`);
    }

    if (!targetDoc.fileUrl) {
      return {
        success: false,
        error: 'Text inputs do not require automated vision verification.',
      };
    }

    // Resolve the SUBJECT ENTITY the service is for (often a company, not the person who ordered).
    // Left undefined when it cannot be determined, rather than defaulting to the ordering contact.
    const entityContext = resolveOrderEntityContext(orderData);

    const aiResult = await verifyOrderDocument({
      fileUrl: targetDoc.fileUrl,
      requirementLabel: targetDoc.requirementLabel,
      serviceTitle: orderData.items?.[0]?.title,
      orderingContactName: entityContext.orderingContactName,
      expectedCompanyName: entityContext.entityName,
      expectedRegistrationNumber: entityContext.registrationNumber,
      expectedIdNumber: entityContext.idNumber,
      expectedDirectorName: entityContext.directorName,
      currentDate: new Date().toISOString().split('T')[0],
    });

    const aiVerification: AIDocumentVerification = {
      status: aiResult.status,
      confidence: aiResult.confidence,
      detectedType: aiResult.detectedType,
      extractedData: aiResult.extractedData,
      issues: aiResult.issues,
      summary: aiResult.summary,
      recommendation: aiResult.recommendation,
      reason: aiResult.reason,
      adversarialCheckPassed: aiResult.adversarialCheckPassed,
      modelName: aiResult.modelName,
      modelVersion: aiResult.modelVersion,
      reviewedAt: aiResult.reviewedAt || new Date().toISOString(),
    };

    // Update document in Firestore with AI metadata
    const updatedUploads = uploads.map(doc => {
      if (
        (doc.id && doc.id === requirementIdentifier) ||
        (doc.requirementId && doc.requirementId === requirementIdentifier) ||
        doc.fileUrl === requirementIdentifier ||
        doc.requirementLabel === requirementIdentifier
      ) {
        return {
          ...doc,
          aiVerification,
        };
      }
      return doc;
    });

    await db.collection('orders').doc(orderId).update({
      documentUploads: updatedUploads,
      updatedAt: new Date().toISOString(),
    });

    if (orderData.originalOrderId) {
      // Mirror to the partner-owned order WITHOUT the internal AI audit payload.
      await db.collection('orders').doc(orderData.originalOrderId).update({
        documentUploads: stripInternalAiData(updatedUploads),
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: `Document verified. Recommendation: ${aiResult.recommendation.toUpperCase()} (${aiResult.confidence}% confidence)`,
      aiVerification,
    };
  } catch (error: any) {
    console.error('Error running AI document verification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 1-Click Human Confirmation of AI Document Recommendation.
 */
export async function confirmDocumentAiRecommendation(
  orderId: string,
  requirementIdentifier: string,
  performer: any
) {
  try {
    const db = getAdminDb();
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);

    const orderData = orderDoc.data() as Order;
    const uploads: DocumentUpload[] = orderData.documentUploads || [];

    const targetDoc = uploads.find(d =>
      (d.id && d.id === requirementIdentifier) ||
      (d.requirementId && d.requirementId === requirementIdentifier) ||
      d.fileUrl === requirementIdentifier ||
      d.requirementLabel === requirementIdentifier
    );

    if (!targetDoc || !targetDoc.aiVerification) {
      throw new Error('No AI recommendation found for this document.');
    }

    const recommendation = targetDoc.aiVerification.recommendation;
    const status: 'approved' | 'rejected' = recommendation === 'approve' ? 'approved' : 'rejected';
    const reason = recommendation === 'reject'
      ? (targetDoc.aiVerification.reason || 'Rejected based on AI verification.')
      : undefined;

    return await reviewOrderDocumentAtomic(
      orderId,
      requirementIdentifier,
      status,
      performer,
      reason,
      targetDoc.aiVerification
    );
  } catch (error: any) {
    console.error('Error confirming AI recommendation:', error);
    return { success: false, error: error.message };
  }
}

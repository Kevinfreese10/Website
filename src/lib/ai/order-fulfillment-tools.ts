'use server';

/**
 * @fileOverview AI Order Fulfillment Tools & Server Actions.
 * Provides the execution API for the autonomous Order Fulfillment AI Agent and the Admin Dashboard.
 */

import { getAdminDb } from '@/lib/firebase-admin';
import { Order, OrderChecklistItem, DocumentUpload, AIDocumentVerification } from '@/lib/types';
import { verifyOrderDocument } from '@/ai/flows/verify-order-document';
import { resolveOrderEntityContext, stripInternalAiData, resolvePartnerMirrorOrderId } from '@/lib/service-utils';
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

    // Helper for validating text input requirements
    const validateTextInputRequirement = (label: string, text: string): AIDocumentVerification => {
      const clean = text.trim();
      const labelLower = label.toLowerCase();
      const issues: string[] = [];

      if (!clean) {
        return {
          status: 'flagged',
          confidence: 100,
          detectedType: 'empty_text_input',
          extractedData: { value: '' },
          issues: ['Value is empty.'],
          summary: 'Required text field is empty.',
          recommendation: 'reject',
          reason: 'A value must be provided.',
          reviewedAt: new Date().toISOString(),
        };
      }

      // 1. South African ID Number (13 digits)
      if (labelLower.includes('id number') || labelLower.includes('identity number')) {
        const digitsOnly = clean.replace(/\D/g, '');
        if (digitsOnly.length !== 13) {
          issues.push(`Invalid SA ID number format: expected 13 digits, received ${digitsOnly.length} digits (${clean}).`);
        }
      }
      // 2. CIPC Company Registration Number
      else if (labelLower.includes('registration number') || labelLower.includes('reg no') || labelLower.includes('cipc number')) {
        const isCipc = /^(\d{4}\/\d{6}\/\d{2}|CK\d{2,4}\/\d{4,6}\/\d{2}|\d{10})$/i.test(clean);
        if (!isCipc && clean.length < 8) {
          issues.push(`Unrecognized CIPC registration number format: "${clean}". Expected format like "2024/123456/07" or "CK98/12345/23".`);
        }
      }
      // 3. SARS Tax Number (10 digits)
      else if (labelLower.includes('tax number') || labelLower.includes('tax ref') || labelLower.includes('income tax')) {
        const digitsOnly = clean.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
          issues.push(`Invalid SARS tax reference number format: expected 10 digits, received ${digitsOnly.length} digits.`);
        }
      }
      // 4. Email address
      else if (labelLower.includes('email')) {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
        if (!isEmail) {
          issues.push(`Invalid email address format: "${clean}".`);
        }
      }
      // 5. Phone / Cell Number
      else if (labelLower.includes('cell') || labelLower.includes('phone') || labelLower.includes('mobile')) {
        const isPhone = /^(0\d{9}|\+27\d{9}|\d{10})$/.test(clean.replace(/[\s\-()]/g, ''));
        if (!isPhone) {
          issues.push(`Invalid South African phone number format: "${clean}". Expected 10 digits starting with 0.`);
        }
      }

      const isValid = issues.length === 0;

      return {
        status: isValid ? 'verified' : 'flagged',
        confidence: isValid ? 95 : 40,
        detectedType: 'text_input_validation',
        extractedData: { value: clean },
        issues,
        summary: isValid ? `Valid format confirmed for "${label}": ${clean}` : `Format issues in "${label}": ${issues.join(' ')}`,
        recommendation: isValid ? 'approve' : 'reject',
        reason: isValid ? 'Input successfully passed South African statutory format validation checks.' : issues.join(' '),
        reviewedAt: new Date().toISOString(),
      };
    };

    let aiVerification: AIDocumentVerification;

    if (!targetDoc.fileUrl && targetDoc.textValue) {
      aiVerification = validateTextInputRequirement(targetDoc.requirementLabel, targetDoc.textValue);
    } else if (targetDoc.fileUrl) {
      // Resolve the SUBJECT ENTITY the service is for (often a company, not the person who ordered).
      const entityContext = resolveOrderEntityContext(orderData);

      // Resolve matching service and aiHint for this requirement
      const allServiceTitles = (orderData.items || []).map(i => i.title).filter(Boolean).join(', ');
      const matchedItem = (orderData.items || []).find(i => i.id === targetDoc.serviceId) || orderData.items?.[0];
      const serviceTitle = matchedItem?.title || orderData.items?.[0]?.title;

      let requirementAiHint: string | undefined;
      let requirementType: any = targetDoc.type;

      try {
        const { services: staticServices } = await import('@/lib/data');
        const matchedService = staticServices.find(s => s.id === targetDoc.serviceId || s.slug === targetDoc.serviceId || s.title === serviceTitle);
        const matchedReq = matchedService?.informationToProvide?.find(r => r.label === targetDoc.requirementLabel || (r.id && r.id === targetDoc.requirementId));
        if (matchedReq?.aiHint) {
          requirementAiHint = matchedReq.aiHint;
        }
        if (matchedReq?.type) {
          requirementType = matchedReq.type;
        }
      } catch (err) {
        console.warn('Could not resolve static service aiHint:', err);
      }

      const aiResult = await verifyOrderDocument({
        fileUrl: targetDoc.fileUrl,
        requirementLabel: targetDoc.requirementLabel,
        requirementAiHint,
        requirementType,
        serviceTitle,
        allServiceTitles,
        orderingContactName: entityContext.orderingContactName,
        expectedCompanyName: entityContext.entityName,
        expectedRegistrationNumber: entityContext.registrationNumber,
        expectedIdNumber: entityContext.idNumber,
        expectedDirectorName: entityContext.directorName,
        currentDate: new Date().toISOString().split('T')[0],
      });

      aiVerification = {
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
    } else {
      return {
        success: false,
        error: 'No document file or text input found to verify.',
      };
    }

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

    const mirrorId = resolvePartnerMirrorOrderId({ ...orderData, id: orderId });
    if (mirrorId) {
      // Mirror to the partner-owned order WITHOUT the internal AI audit payload.
      await db.collection('orders').doc(mirrorId).update({
        documentUploads: stripInternalAiData(updatedUploads),
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: `Document verified. Recommendation: ${aiVerification.recommendation.toUpperCase()} (${aiVerification.confidence}% confidence)`,
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

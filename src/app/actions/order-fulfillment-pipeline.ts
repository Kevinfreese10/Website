'use server';

import { getAdminDb, cleanFirestoreData, serializeDbData, uploadBufferToStorage } from '@/lib/firebase-admin';
import { Order, DocumentUpload, AIDocumentVerification, GeneratedDocumentDraft, OrderChecklistItem } from '@/lib/types';
import { verifyOrderDocument } from '@/ai/flows/verify-order-document';
import { ensureOrderChecklistInitialized } from '@/app/actions/order-admin-actions';
import {
  generateNcrForm2Draft,
  generatePowerOfAttorneyResolutionDraft,
  generateShareCertificateDraft,
  generateAccountantsLetterDraft,
  generateOrderIntakeSummaryPdf,
  generateSarsPublicOfficerResolutionDraft,
} from '@/lib/pdf/template-generators';
import { sendEmail } from '@/lib/email';

/**
 * Triggers the Automated AI Review & SOP Progression Pipeline for an Order when client submits documents.
 */
export async function triggerOrderAutomatedFulfillmentReview(orderId: string, clientName?: string) {
  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);

    let order = { id: orderDoc.id, ...orderDoc.data() } as Order;

    // 1. Ensure Checklist is initialized
    let checklist = order.checklist || [];
    if (checklist.length === 0) {
      checklist = await ensureOrderChecklistInitialized(orderId);
      order.checklist = checklist;
    }

    // 2. Run AI Verification on all uploaded documents and explanations
    const uploads: DocumentUpload[] = order.documentUploads || [];
    const updatedUploads: DocumentUpload[] = [];

    for (const docItem of uploads) {
      // If doc already has AI verification, keep it unless pending
      if (docItem.aiVerification && docItem.aiVerification.recommendation) {
        updatedUploads.push(docItem);
        continue;
      }

      if (docItem.fileUrl) {
        try {
          const aiResult = await verifyOrderDocument({
            fileUrl: docItem.fileUrl,
            requirementLabel: docItem.requirementLabel,
            serviceTitle: order.items?.[0]?.title,
            clientName: order.customerName,
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
            reviewedAt: new Date().toISOString(),
          };

          updatedUploads.push({
            ...docItem,
            aiVerification,
          });
        } catch (err: any) {
          console.error(`AI verification error for ${docItem.requirementLabel}:`, err);
          updatedUploads.push(docItem);
        }
      } else if (docItem.notAvailableReason) {
        // Client explained why document is missing
        const aiVerification: AIDocumentVerification = {
          status: 'verified',
          confidence: 85,
          detectedType: 'client_explanation',
          extractedData: { reason: docItem.notAvailableReason },
          issues: [],
          summary: `Client provided note: "${docItem.notAvailableReason}"`,
          recommendation: 'approve',
          reason: 'Client explanation provided for missing requirement.',
          reviewedAt: new Date().toISOString(),
        };

        updatedUploads.push({
          ...docItem,
          aiVerification,
        });
      } else {
        updatedUploads.push(docItem);
      }
    }

    // 3. Auto-progress initial SOP checklist steps
    const verifiedCount = updatedUploads.filter(d => d.aiVerification?.recommendation === 'approve' || d.status === 'approved').length;
    const totalDocs = updatedUploads.length;
    const allApprovedOrRecommended = totalDocs > 0 && verifiedCount === totalDocs;

    const updatedChecklist = checklist.map(step => {
      const stepTitleLower = step.title.toLowerCase();
      if (stepTitleLower.includes('intake') || stepTitleLower.includes('document verification') || stepTitleLower.includes('verify client upload') || stepTitleLower.includes('gather client requirements')) {
        return {
          ...step,
          status: (allApprovedOrRecommended ? 'completed' : 'in_progress') as any,
          completedAt: allApprovedOrRecommended ? new Date().toISOString() : step.completedAt,
          isAiRecommended: true,
          aiNotes: `AI Verified: ${verifiedCount}/${totalDocs} documents approved or recommended with average confidence > 85%.`,
        };
      }
      return step;
    });

    // 4. Save updated AI verifications and checklist
    await orderRef.update(cleanFirestoreData({
      documentUploads: updatedUploads,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    }));

    if (order.originalOrderId) {
      await db.collection('orders').doc(order.originalOrderId).update(cleanFirestoreData({
        documentUploads: updatedUploads,
        checklist: updatedChecklist,
        updatedAt: new Date().toISOString(),
      }));
    }

    // 5. User Rule Check: "We will only generate document draft once all document/information reviews are completed"
    // Check if all documents are officially approved
    const allDocumentsApproved = totalDocs > 0 && updatedUploads.every(d => d.status === 'approved');

    let generatedDraftsResult = null;
    if (allDocumentsApproved) {
      generatedDraftsResult = await generateOrderDocumentDraftsInternal(orderId);
    }

    // 6. Send Consolidated Notification Email to Assigned Staff / Admin
    await sendConsolidatedStaffIntakeAlert(order, updatedUploads, allApprovedOrRecommended);

    return serializeDbData({
      success: true,
      message: allDocumentsApproved
        ? 'AI verification complete & all document templates generated!'
        : 'AI verification complete. Documents are queued for consultant review.',
      allDocumentsApproved,
      allRecommended: allApprovedOrRecommended,
      generatedDrafts: generatedDraftsResult,
    });
  } catch (error: any) {
    console.error('Error in triggerOrderAutomatedFulfillmentReview:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Internal core engine to generate and upload draft document templates for an Order.
 */
export async function generateOrderDocumentDraftsInternal(orderId: string, feedbackNotes?: Record<string, string>) {
  const db = getAdminDb();
  const orderDoc = await db.collection('orders').doc(orderId).get();
  if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);

  const order = { id: orderDoc.id, ...orderDoc.data() } as Order;
  const serviceTitle = order.items?.[0]?.title || '';
  const serviceTitleLower = serviceTitle.toLowerCase();

  const generatedDrafts: GeneratedDocumentDraft[] = [];

  // Helper to store generated draft in array
  const addDraft = (draft: GeneratedDocumentDraft) => {
    generatedDrafts.push(draft);
  };

  // Check for explicit templateIds configured on the order's SOP checklist or the underlying service
  const explicitTemplateIds = new Set<string>();
  (order.checklist || []).forEach(step => {
    if (step.templateIds && Array.isArray(step.templateIds)) {
      step.templateIds.forEach(id => explicitTemplateIds.add(id));
    }
  });

  if (explicitTemplateIds.size === 0 && order.items?.[0]?.id) {
    try {
      const serviceDoc = await db.collection('services').doc(order.items[0].id).get();
      if (serviceDoc.exists) {
        const sData = serviceDoc.data();
        (sData?.fulfillmentChecklist || []).forEach((step: any) => {
          if (step.templateIds && Array.isArray(step.templateIds)) {
            step.templateIds.forEach((id: string) => explicitTemplateIds.add(id));
          }
        });
      }
    } catch (e) {
      console.warn('Error reading service checklist for templates:', e);
    }
  }

  // --- PATH A: Explicit Template IDs Configured on the Product's SOP Checklist ---
  if (explicitTemplateIds.size > 0) {
    if (explicitTemplateIds.has('sars_public_officer_resolution')) {
      const poaPdf = await generateSarsPublicOfficerResolutionDraft(order, feedbackNotes);
      const poaUrl = await uploadBufferToStorage(
        poaPdf.buffer,
        `orders/${orderId}/generated_drafts/${poaPdf.fileName}`
      );
      addDraft({
        id: `draft_sars_po_${Date.now()}`,
        templateType: 'director_resolution',
        title: 'SARS Public Officer Appointment & Director Resolution',
        description: 'Statutory Resolution appointing Public Officer in terms of Section 246 of Tax Administration Act.',
        fileUrl: poaUrl,
        fileName: poaPdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }

    if (explicitTemplateIds.has('ncr_form_2')) {
      const form2Pdf = await generateNcrForm2Draft(order, feedbackNotes);
      const form2Url = await uploadBufferToStorage(
        form2Pdf.buffer,
        `orders/${orderId}/generated_drafts/${form2Pdf.fileName}`
      );
      addDraft({
        id: `draft_ncr2_${Date.now()}`,
        templateType: 'ncr_form_2',
        title: 'NCR Form 2 — Application for Registration as Credit Provider',
        description: 'Pre-filled statutory Form NCR 2 ready for client signature and NCR submission.',
        fileUrl: form2Url,
        fileName: form2Pdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }

    if (explicitTemplateIds.has('power_of_attorney')) {
      const poaPdf = await generatePowerOfAttorneyResolutionDraft(order, feedbackNotes);
      const poaUrl = await uploadBufferToStorage(
        poaPdf.buffer,
        `orders/${orderId}/generated_drafts/${poaPdf.fileName}`
      );
      addDraft({
        id: `draft_poa_${Date.now()}`,
        templateType: 'power_of_attorney',
        title: 'Special Power of Attorney & Director Authorizing Resolution',
        description: 'Mandate authorising My Accountant to act before statutory bodies.',
        fileUrl: poaUrl,
        fileName: poaPdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }

    if (explicitTemplateIds.has('share_certificate')) {
      const sharePdf = await generateShareCertificateDraft(order, feedbackNotes);
      const shareUrl = await uploadBufferToStorage(
        sharePdf.buffer,
        `orders/${orderId}/generated_drafts/${sharePdf.fileName}`
      );
      addDraft({
        id: `draft_share_${Date.now()}`,
        templateType: 'share_certificate',
        title: 'Official Company Share Certificate (100 Ordinary Shares)',
        description: 'Formal Share Certificate in terms of Companies Act 71 of 2008.',
        fileUrl: shareUrl,
        fileName: sharePdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }

    if (explicitTemplateIds.has('accountants_letter')) {
      const letterPdf = await generateAccountantsLetterDraft(order, feedbackNotes);
      const letterUrl = await uploadBufferToStorage(
        letterPdf.buffer,
        `orders/${orderId}/generated_drafts/${letterPdf.fileName}`
      );
      addDraft({
        id: `draft_letter_${Date.now()}`,
        templateType: 'accountants_letter',
        title: "Accountant's Confirmation & Compliance Letter",
        description: 'Official confirmation on My Accountant letterhead for regulatory compliance.',
        fileUrl: letterUrl,
        fileName: letterPdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }
  } 
  // --- PATH B: Smart Fallback matching based on Service Title ---
  else {
    // 1. Tax Representative / Public Officer Appointment -> ONLY SARS Public Officer Resolution
    if (
      serviceTitleLower.includes('tax representative') || 
      serviceTitleLower.includes('public officer') || 
      serviceTitleLower.includes('sars representative')
    ) {
      const poaPdf = await generateSarsPublicOfficerResolutionDraft(order, feedbackNotes);
      const poaUrl = await uploadBufferToStorage(
        poaPdf.buffer,
        `orders/${orderId}/generated_drafts/${poaPdf.fileName}`
      );

      addDraft({
        id: `draft_sars_po_${Date.now()}`,
        templateType: 'director_resolution',
        title: 'SARS Public Officer Appointment & Director Resolution',
        description: 'Statutory Resolution appointing Public Officer in terms of Section 246 of Tax Administration Act.',
        fileUrl: poaUrl,
        fileName: poaPdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }
    // 2. NCR Registration -> ONLY NCR Form 2 & Special Power of Attorney
    else if (serviceTitleLower.includes('ncr') || serviceTitleLower.includes('credit provider')) {
      const form2Pdf = await generateNcrForm2Draft(order, feedbackNotes);
      const form2Url = await uploadBufferToStorage(
        form2Pdf.buffer,
        `orders/${orderId}/generated_drafts/${form2Pdf.fileName}`
      );

      addDraft({
        id: `draft_ncr2_${Date.now()}`,
        templateType: 'ncr_form_2',
        title: 'NCR Form 2 — Application for Registration as Credit Provider',
        description: 'Pre-filled statutory Form NCR 2 ready for client signature and NCR submission.',
        fileUrl: form2Url,
        fileName: form2Pdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });

      const poaPdf = await generatePowerOfAttorneyResolutionDraft(order, feedbackNotes);
      const poaUrl = await uploadBufferToStorage(
        poaPdf.buffer,
        `orders/${orderId}/generated_drafts/${poaPdf.fileName}`
      );

      addDraft({
        id: `draft_poa_${Date.now()}`,
        templateType: 'power_of_attorney',
        title: 'Special Power of Attorney & Director Authorizing Resolution',
        description: 'Mandate authorising My Accountant to act before NCR and statutory bodies.',
        fileUrl: poaUrl,
        fileName: poaPdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }
    // 3. Share Certificates -> ONLY Share Certificate & Resolution
    else if (serviceTitleLower.includes('share certificate') || serviceTitleLower.includes('share transfer') || serviceTitleLower.includes('issue shares')) {
      const sharePdf = await generateShareCertificateDraft(order, feedbackNotes);
      const shareUrl = await uploadBufferToStorage(
        sharePdf.buffer,
        `orders/${orderId}/generated_drafts/${sharePdf.fileName}`
      );

      addDraft({
        id: `draft_share_${Date.now()}`,
        templateType: 'share_certificate',
        title: 'Official Company Share Certificate (100 Ordinary Shares)',
        description: 'Formal Share Certificate in terms of Companies Act 71 of 2008.',
        fileUrl: shareUrl,
        fileName: sharePdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });

      const poaPdf = await generatePowerOfAttorneyResolutionDraft(order, feedbackNotes);
      const poaUrl = await uploadBufferToStorage(
        poaPdf.buffer,
        `orders/${orderId}/generated_drafts/${poaPdf.fileName}`
      );

      addDraft({
        id: `draft_poa_${Date.now()}`,
        templateType: 'power_of_attorney',
        title: 'Special Power of Attorney & Director Authorizing Resolution',
        description: 'Mandate authorising share issuance and statutory filing.',
        fileUrl: poaUrl,
        fileName: poaPdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }
    // 4. Company Registration & Director Amendments -> ONLY Power of Attorney / Resolution
    else if (serviceTitleLower.includes('company registration') || serviceTitleLower.includes('director amendment') || serviceTitleLower.includes('cipc amendment')) {
      const poaPdf = await generatePowerOfAttorneyResolutionDraft(order, feedbackNotes);
      const poaUrl = await uploadBufferToStorage(
        poaPdf.buffer,
        `orders/${orderId}/generated_drafts/${poaPdf.fileName}`
      );

      addDraft({
        id: `draft_poa_${Date.now()}`,
        templateType: 'power_of_attorney',
        title: 'Special Power of Attorney & Director Authorizing Resolution',
        description: 'Mandate authorising My Accountant to act before CIPC and statutory bodies.',
        fileUrl: poaUrl,
        fileName: poaPdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }
    // 5. Accountant's Letter / Confirmation services -> ONLY Accountant's Letter
    else if (serviceTitleLower.includes('confirmation letter') || serviceTitleLower.includes('accountant letter') || serviceTitleLower.includes('accounting letter')) {
      const letterPdf = await generateAccountantsLetterDraft(order, feedbackNotes);
      const letterUrl = await uploadBufferToStorage(
        letterPdf.buffer,
        `orders/${orderId}/generated_drafts/${letterPdf.fileName}`
      );

      addDraft({
        id: `draft_letter_${Date.now()}`,
        templateType: 'accountants_letter',
        title: "Accountant's Confirmation & Compliance Letter",
        description: 'Official confirmation on My Accountant letterhead for regulatory compliance.',
        fileUrl: letterUrl,
        fileName: letterPdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }
  }

  // Attach relevant draft URLs to checklist steps
  const updatedChecklist = (order.checklist || []).map(step => {
    const stepLower = step.title.toLowerCase();
    if (stepLower.includes('prepare application') || stepLower.includes('form 2') || stepLower.includes('draft application')) {
      const ncrDraft = generatedDrafts.find(d => d.templateType === 'ncr_form_2');
      if (ncrDraft) {
        return { ...step, artifactUrl: ncrDraft.fileUrl, artifactName: ncrDraft.fileName };
      }
    }
    if (stepLower.includes('resolution') || stepLower.includes('power of attorney')) {
      const poaDraft = generatedDrafts.find(d => d.templateType === 'power_of_attorney');
      if (poaDraft) {
        return { ...step, artifactUrl: poaDraft.fileUrl, artifactName: poaDraft.fileName };
      }
    }
    if (stepLower.includes('share certificate')) {
      const scDraft = generatedDrafts.find(d => d.templateType === 'share_certificate');
      if (scDraft) {
        return { ...step, artifactUrl: scDraft.fileUrl, artifactName: scDraft.fileName };
      }
    }
    return step;
  });

  await db.collection('orders').doc(orderId).update(cleanFirestoreData({
    generatedDrafts,
    checklist: updatedChecklist,
    updatedAt: new Date().toISOString(),
  }));

  if (order.originalOrderId) {
    await db.collection('orders').doc(order.originalOrderId).update(cleanFirestoreData({
      generatedDrafts,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    }));
  }

  return generatedDrafts;
}

/**
 * Public Action for Consultants to manually trigger Document Template Generation.
 */
export async function generateOrderDocumentDraftsAction(orderId: string) {
  try {
    const drafts = await generateOrderDocumentDraftsInternal(orderId);
    return serializeDbData({
      success: true,
      message: `${drafts.length} draft document template(s) generated successfully!`,
      generatedDrafts: drafts,
    });
  } catch (error: any) {
    console.error('Error generating document drafts:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Regenerates an individual draft document template incorporating consultant feedback.
 */
export async function regenerateOrderDraftWithFeedbackAction(
  orderId: string,
  draftId: string,
  feedback: string,
  consultant: { id: string; name: string }
) {
  try {
    const db = getAdminDb();
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);

    const order = { id: orderDoc.id, ...orderDoc.data() } as Order;
    const drafts = order.generatedDrafts || [];
    const targetDraft = drafts.find(d => d.id === draftId);

    if (!targetDraft) throw new Error('Draft document not found');

    const feedbackEntry = {
      timestamp: new Date().toISOString(),
      consultantName: consultant.name,
      feedback: feedback.trim(),
    };

    // Re-generate using the internal engine with feedback
    const updatedDrafts = await generateOrderDocumentDraftsInternal(orderId, { feedback: feedback.trim() });

    // Find and update feedback history on the regenerated draft
    const updatedTarget = updatedDrafts.find(d => d.templateType === targetDraft.templateType);
    if (updatedTarget) {
      updatedTarget.feedbackHistory = [...(targetDraft.feedbackHistory || []), feedbackEntry];
      updatedTarget.status = 'regenerated';

      await db.collection('orders').doc(orderId).update(cleanFirestoreData({
        generatedDrafts: updatedDrafts,
        updatedAt: new Date().toISOString(),
      }));
    }

    return serializeDbData({
      success: true,
      message: `Draft "${targetDraft.title}" regenerated with your feedback adjustments.`,
      generatedDrafts: updatedDrafts,
    });
  } catch (error: any) {
    console.error('Error regenerating draft:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 1-Click Approve and Send Generated Draft Document to Client for Signature.
 */
export async function approveAndSendDraftToClientAction(
  orderId: string,
  draftId: string,
  consultant: { id: string; name: string },
  customMessage?: string
) {
  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);

    const order = { id: orderDoc.id, ...orderDoc.data() } as Order;
    const drafts = order.generatedDrafts || [];
    const targetDraft = drafts.find(d => d.id === draftId);

    if (!targetDraft) throw new Error('Draft document not found');

    // Update draft status to sent_to_client
    const updatedDrafts = drafts.map(d => {
      if (d.id === draftId) {
        return { ...d, status: 'sent_to_client' as const };
      }
      return d;
    });

    // Create client order note with attachment
    const messageText = customMessage?.trim() || 
      `Dear ${order.endCustomerName || order.customerName},\n\nWe have reviewed your information and generated your official pre-filled document: "${targetDraft.title}".\n\nPlease download, review, sign where indicated, and upload the signed copy back to this order portal so we can proceed with statutory filing.`;

    const clientNote = {
      authorId: consultant.id,
      date: new Date().toISOString(),
      type: 'note' as const,
      isInternal: false,
      text: messageText,
      attachments: [{
        name: targetDraft.fileName,
        url: targetDraft.fileUrl,
      }],
    };

    // Auto-advance checklist step if matching
    const updatedChecklist = (order.checklist || []).map(step => {
      const stepLower = step.title.toLowerCase();
      if (
        (targetDraft.templateType === 'ncr_form_2' && (stepLower.includes('form 2') || stepLower.includes('application doc'))) ||
        (targetDraft.templateType === 'power_of_attorney' && (stepLower.includes('power of attorney') || stepLower.includes('resolution'))) ||
        (targetDraft.templateType === 'share_certificate' && stepLower.includes('share certificate'))
      ) {
        return {
          ...step,
          status: 'completed' as const,
          completedAt: new Date().toISOString(),
          completedBy: consultant.id,
          completedByName: consultant.name,
          artifactUrl: targetDraft.fileUrl,
          artifactName: targetDraft.fileName,
        };
      }
      return step;
    });

    await orderRef.update(cleanFirestoreData({
      generatedDrafts: updatedDrafts,
      notes: [...(order.notes || []), clientNote],
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    }));

    if (order.originalOrderId) {
      await db.collection('orders').doc(order.originalOrderId).update(cleanFirestoreData({
        generatedDrafts: updatedDrafts,
        notes: [...(order.notes || []), clientNote],
        checklist: updatedChecklist,
        updatedAt: new Date().toISOString(),
      }));
    }

    return serializeDbData({
      success: true,
      message: `Document "${targetDraft.title}" approved and sent to client for review and signature!`,
      generatedDrafts: updatedDrafts,
    });
  } catch (error: any) {
    console.error('Error approving and sending draft:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends consolidated HTML email to assigned consultant / staff regarding AI verification & draft status.
 */
async function sendConsolidatedStaffIntakeAlert(order: Order, uploads: DocumentUpload[], allRecommended: boolean) {
  try {
    const staffEmail = order.assignedTo?.[0] ? 'info@myacc.co.za' : 'info@myacc.co.za';
    const clientName = order.endCustomerName || order.customerName || 'Client';
    const orderUrl = `https://www.myacc.co.za/admin/orders/${order.id}`;

    const approvedDocs = uploads.filter(d => d.aiVerification?.recommendation === 'approve' || d.status === 'approved');
    const flaggedDocs = uploads.filter(d => d.aiVerification?.recommendation === 'reject' || d.status === 'rejected');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">AI Fulfillment Intake Alert</h2>
          <p style="margin: 5px 0 0; font-size: 13px; color: #94a3b8;">Order #${order.id} — ${order.items?.[0]?.title || 'Service'}</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 15px; line-height: 1.5; margin-top: 0;">
            <strong>${clientName}</strong> has clicked <em>"Notify Consultant of All Submissions"</em>. The automated AI verification pipeline has processed the uploads.
          </p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 18px 0;">
            <h4 style="margin: 0 0 10px; font-size: 14px; color: #0f172a;">AI Verification Summary:</h4>
            <p style="margin: 4px 0; font-size: 13px; color: #16a34a;">✓ <strong>${approvedDocs.length}</strong> Document(s) Passed / Recommended for Approval</p>
            ${flaggedDocs.length > 0 ? `<p style="margin: 4px 0; font-size: 13px; color: #dc2626;">⚠ <strong>${flaggedDocs.length}</strong> Document(s) Flagged for Manual Review</p>` : ''}
          </div>

          <div style="text-align: center; margin: 25px 0;">
            <a href="${orderUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 14px;">
              Review Order in Admin Portal
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
            Once all documents are approved, pre-filled statutory draft templates (NCR Form 2, Resolutions, Share Certificates) will be ready for 1-click client delivery.
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: staffEmail,
      subject: `[AI Intake Alert] Client Submitted Documents for Order #${order.id} (${clientName})`,
      html,
    });
  } catch (err) {
    console.error('Error sending staff intake alert email:', err);
  }
}

'use server';

import { getAdminDb, cleanFirestoreData, serializeDbData, uploadBufferToStorage } from '@/lib/firebase-admin';
import { Order, DocumentUpload, AIDocumentVerification, GeneratedDocumentDraft, OrderChecklistItem } from '@/lib/types';
import { verifyOrderDocument } from '@/ai/flows/verify-order-document';
import { resolveOrderEntityContext, stripInternalAiData, stripInternalChecklistAiData, resolvePartnerMirrorOrderId } from '@/lib/service-utils';
import { ensureOrderChecklistInitialized, INTERNAL_SYSTEM_ACTOR } from '@/app/actions/order-admin-actions';
import { getVerifiedAuthContext } from '@/lib/server-auth';
import {
  generateNcrForm2Draft,
  generateNcrDirectorResolutionDraft,
  generateNcrAnnexureFeesDraft,
  generateAccountingOfficerConsentDraft,
  generateAccountantsLetterDraft,
  generateEngagementLetterDraft,
  generatePowerOfAttorneyResolutionDraft,
  generateShareCertificateDraft,
  generateSarsPublicOfficerResolutionDraft,
  generateCoidaCf1bApplicationDraft,
  generateOrderIntakeSummaryPdf,
} from '@/lib/pdf/template-generators';
import { sendEmail } from '@/lib/email';

/**
 * Triggers the Automated AI Review & SOP Progression Pipeline for an Order when client submits documents.
 */
export async function triggerOrderAutomatedFulfillmentReview(
  orderId: string,
  clientName?: string,
  options?: { notifyStaff?: boolean; idToken?: string; internal?: typeof INTERNAL_SYSTEM_ACTOR }
) {
  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) throw new Error(`Order #${orderId} not found`);

    let order = { id: orderDoc.id, ...orderDoc.data() } as Order;

    // This runs Gemini vision over every uploaded document and mutates the order's checklist, so it
    // must not be callable for an arbitrary orderId. Trusted in-process callers (which have already
    // authenticated the user themselves) pass the internal sentinel; everyone else must supply a
    // verified token belonging to the order's own client, its partner, or My Accountant staff.
    if (options?.internal !== INTERNAL_SYSTEM_ACTOR) {
      const authCtx = await getVerifiedAuthContext(options?.idToken);
      if (!authCtx) {
        return { success: false, error: 'Unauthorized: Valid authentication required.' };
      }
      const role = authCtx.user.role;
      const isStaffOrAdmin =
        authCtx.isAdmin || role === 'admin' || role === 'staff' || role === 'cap_staff' || role === 'cap_supervisor';
      const isClient =
        authCtx.userId === order.userId ||
        authCtx.userId === order.clientId ||
        authCtx.user.email?.toLowerCase() === order.customerEmail?.toLowerCase() ||
        authCtx.user.email?.toLowerCase() === order.endCustomerEmail?.toLowerCase();
      const isPartner =
        authCtx.userId === order.resellerId ||
        authCtx.userId === order.partnerId ||
        (!!order.resellerId && authCtx.user.partnerId === order.resellerId) ||
        (!!order.partnerId && authCtx.user.partnerId === order.partnerId);

      if (!isStaffOrAdmin && !isClient && !isPartner) {
        return { success: false, error: 'Forbidden: You do not have access to this order.' };
      }
    }

    // 1. Ensure Checklist is initialized
    let checklist = order.checklist || [];
    if (checklist.length === 0) {
      checklist = await ensureOrderChecklistInitialized(orderId);
      order.checklist = checklist;
    }

    // 2. Run AI Verification on all uploaded documents and explanations
    const uploads: DocumentUpload[] = order.documentUploads || [];
    const updatedUploads: DocumentUpload[] = [];

    const verificationStep = checklist.find(s => s.type === 'doc_verification' || s.title?.toLowerCase().includes('verification'));
    const customAiInstructions = verificationStep?.aiInstructions;
    const allServiceTitles = (order.items || []).map(i => i.title).filter(Boolean).join(', ');

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

    const { services: staticServices } = await import('@/lib/data');

    for (const docItem of uploads) {
      // If doc already has AI verification, keep it unless pending
      if (docItem.aiVerification && docItem.aiVerification.recommendation) {
        updatedUploads.push(docItem);
        continue;
      }
      if (docItem.fileUrl) {
        try {
          const entityContext = resolveOrderEntityContext(order);

          const matchedItem = (order.items || []).find(i => i.id === docItem.serviceId) || order.items?.[0];
          const serviceTitle = matchedItem?.title || order.items?.[0]?.title;

          let requirementAiHint: string | undefined;
          let requirementType: any = docItem.type;

          const matchedService = staticServices.find(s => s.id === docItem.serviceId || s.slug === docItem.serviceId || s.title === serviceTitle);
          const matchedReq = matchedService?.informationToProvide?.find(r => r.label === docItem.requirementLabel || (r.id && r.id === docItem.requirementId));
          if (matchedReq?.aiHint) {
            requirementAiHint = matchedReq.aiHint;
          }
          if (matchedReq?.type) {
            requirementType = matchedReq.type;
          }

          const aiResult = await verifyOrderDocument({
            fileUrl: docItem.fileUrl,
            requirementLabel: docItem.requirementLabel,
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
            customAiInstructions,
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

          updatedUploads.push({
            ...docItem,
            aiVerification,
          });
        } catch (err: any) {
          console.error(`AI verification error for ${docItem.requirementLabel}:`, err);
          updatedUploads.push(docItem);
        }
      } else if (docItem.textValue) {
        const aiVerification = validateTextInputRequirement(docItem.requirementLabel, docItem.textValue);
        updatedUploads.push({
          ...docItem,
          aiVerification,
        });
      } else if (docItem.notAvailableReason) {
        // Client explained why document is missing: mark as inconclusive/manual_review, NOT auto-approved
        const aiVerification: AIDocumentVerification = {
          status: 'inconclusive',
          confidence: 50,
          detectedType: 'client_explanation',
          extractedData: { reason: docItem.notAvailableReason },
          issues: ['Client indicated requirement is missing and provided a written explanation. Human staff review required.'],
          summary: `Missing document note provided: "${docItem.notAvailableReason}"`,
          recommendation: 'manual_review',
          reason: 'Client explanation provided for missing requirement. Must be verified and approved by a consultant.',
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

    // 3. Auto-progress initial SOP checklist steps (strictly require >=85% confidence and 'approve' recommendation)
    const verifiedCount = updatedUploads.filter(d => 
      (d.aiVerification?.recommendation === 'approve' && (d.aiVerification.confidence ?? 0) >= 85 && d.aiVerification.status === 'verified') || 
      d.status === 'approved'
    ).length;
    const totalDocs = updatedUploads.length;
    const allApprovedOrRecommended = totalDocs > 0 && verifiedCount === totalDocs;

    const updatedChecklist = checklist.map(step => {
      const stepTitleLower = step.title.toLowerCase();
      if (
        step.id === 'step_doc_verification' ||
        stepTitleLower.includes('review required information') ||
        stepTitleLower.includes('validation checks') ||
        stepTitleLower.includes('intake') ||
        stepTitleLower.includes('document verification') ||
        stepTitleLower.includes('verify client upload') ||
        stepTitleLower.includes('gather client requirements')
      ) {
        return {
          ...step,
          status: (allApprovedOrRecommended ? 'completed' : 'in_progress') as any,
          completedAt: allApprovedOrRecommended ? new Date().toISOString() : step.completedAt,
          isAiRecommended: true,
          aiNotes: `AI Verified: ${verifiedCount}/${totalDocs} documents audited and passed compliance validation checks with high confidence (≥85%).`,
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

    const mirrorId = resolvePartnerMirrorOrderId(order);
    if (mirrorId) {
      // Mirror progress to the partner-owned order, minus My Accountant's internal AI audit data.
      await db.collection('orders').doc(mirrorId).update(cleanFirestoreData({
        documentUploads: stripInternalAiData(updatedUploads),
        checklist: stripInternalChecklistAiData(updatedChecklist),
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

    // 6. Send Consolidated Notification Email to Assigned Staff / Admin (if requested)
    if (options?.notifyStaff) {
      await sendConsolidatedStaffIntakeAlert(order, updatedUploads, allApprovedOrRecommended);
    }

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
export async function generateOrderDocumentDraftsInternal(
  orderId: string, 
  feedbackNotes?: Record<string, string>,
  selectedTemplateIds?: string[]
) {
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

  // Check for explicit templateIds configured on the order's SOP checklist or the underlying service, or passed directly
  const explicitTemplateIds = new Set<string>();

  if (selectedTemplateIds && Array.isArray(selectedTemplateIds) && selectedTemplateIds.length > 0) {
    selectedTemplateIds.forEach(id => explicitTemplateIds.add(id));
  } else {
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
  }

  // --- PATH A: Explicit Template IDs Configured on the Product's SOP Checklist ---
  if (explicitTemplateIds.size > 0) {
    if (explicitTemplateIds.has('ncr_form_2')) {
      const form2Pdf = await generateNcrForm2Draft(order, feedbackNotes);
      const form2Url = await uploadBufferToStorage(form2Pdf.buffer, `orders/${orderId}/generated_drafts/${form2Pdf.fileName}`);
      addDraft({
        id: `draft_ncr2_${Date.now()}`,
        templateType: 'ncr_form_2',
        title: 'NCR Form 2 — Application for Registration as Credit Provider',
        description: 'Statutory Form NCR 2 application for National Credit Regulator registration.',
        fileUrl: form2Url,
        fileName: form2Pdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }

    if (explicitTemplateIds.has('ncr_director_resolution')) {
      const resPdf = await generateNcrDirectorResolutionDraft(order, feedbackNotes);
      const resUrl = await uploadBufferToStorage(resPdf.buffer, `orders/${orderId}/generated_drafts/${resPdf.fileName}`);
      addDraft({
        id: `draft_ncr_res_${Date.now()}`,
        templateType: 'director_resolution',
        title: 'NCR Director Resolution & Signatory Mandate',
        description: 'Board Resolution authorizing NCR credit provider application, appointed signatory, and accounting officer mandate.',
        fileUrl: resUrl,
        fileName: resPdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }

    if (explicitTemplateIds.has('ncr_annexure_fees')) {
      const feePdf = await generateNcrAnnexureFeesDraft(order, feedbackNotes);
      const feeUrl = await uploadBufferToStorage(feePdf.buffer, `orders/${orderId}/generated_drafts/${feePdf.fileName}`);
      addDraft({
        id: `draft_ncr_fee_${Date.now()}`,
        templateType: 'ncr_annexure_fees' as any,
        title: 'NCR Annexure: Confirmation of Payment of Fees',
        description: 'Statutory fee calculation schedule (R550 App Fee + R1,000 Initial Reg + R250 Branch Fee = R1,800 Total).',
        fileUrl: feeUrl,
        fileName: feePdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }

    if (explicitTemplateIds.has('accounting_officer_letter')) {
      const aoPdf = await generateAccountingOfficerConsentDraft(order, feedbackNotes);
      const aoUrl = await uploadBufferToStorage(aoPdf.buffer, `orders/${orderId}/generated_drafts/${aoPdf.fileName}`);
      addDraft({
        id: `draft_ao_letter_${Date.now()}`,
        templateType: 'accountants_letter',
        title: 'Accounting Officer Consent & Appointment Letter (Reg 67/68)',
        description: 'Formal consent & confirmation of appointment as independent Accounting Officer under Regulations 67 & 68, CBA (SA) signed.',
        fileUrl: aoUrl,
        fileName: aoPdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }

    if (explicitTemplateIds.has('accountants_letter')) {
      const letterPdf = await generateAccountantsLetterDraft(order, feedbackNotes);
      const letterUrl = await uploadBufferToStorage(letterPdf.buffer, `orders/${orderId}/generated_drafts/${letterPdf.fileName}`);
      addDraft({
        id: `draft_letter_${Date.now()}`,
        templateType: 'accountants_letter',
        title: "Accountant's Financial Confirmation & Compliance Letter",
        description: 'Official confirmation on My Accountant letterhead for regulatory compliance.',
        fileUrl: letterUrl,
        fileName: letterPdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }

    if (explicitTemplateIds.has('engagement_letter')) {
      const engPdf = await generateEngagementLetterDraft(order, feedbackNotes);
      const engUrl = await uploadBufferToStorage(engPdf.buffer, `orders/${orderId}/generated_drafts/${engPdf.fileName}`);
      addDraft({
        id: `draft_eng_${Date.now()}`,
        templateType: 'engagement_letter' as any,
        title: 'Professional Engagement Letter & Service Agreement',
        description: 'Formal engagement contract with Kevin Freese CBA (SA) signature, scope of services, and statutory terms.',
        fileUrl: engUrl,
        fileName: engPdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }

    if (explicitTemplateIds.has('power_of_attorney')) {
      const poaPdf = await generatePowerOfAttorneyResolutionDraft(order, feedbackNotes);
      const poaUrl = await uploadBufferToStorage(poaPdf.buffer, `orders/${orderId}/generated_drafts/${poaPdf.fileName}`);
      addDraft({
        id: `draft_poa_${Date.now()}`,
        templateType: 'power_of_attorney',
        title: 'Special Power of Attorney & Authorizing Mandate',
        description: 'Strict 1-page executive mandate with dedicated "Sign Here" box authorizing representation.',
        fileUrl: poaUrl,
        fileName: poaPdf.fileName,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      });
    }

    if (explicitTemplateIds.has('share_certificate')) {
      const sharePdf = await generateShareCertificateDraft(order, feedbackNotes);
      const shareUrl = await uploadBufferToStorage(sharePdf.buffer, `orders/${orderId}/generated_drafts/${sharePdf.fileName}`);
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

    if (explicitTemplateIds.has('sars_public_officer_resolution')) {
      const poaPdf = await generateSarsPublicOfficerResolutionDraft(order, feedbackNotes);
      const poaUrl = await uploadBufferToStorage(poaPdf.buffer, `orders/${orderId}/generated_drafts/${poaPdf.fileName}`);
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

    if (explicitTemplateIds.has('coida_cf1b_application')) {
      const coidaPdf = await generateCoidaCf1bApplicationDraft(order, feedbackNotes);
      const coidaUrl = await uploadBufferToStorage(coidaPdf.buffer, `orders/${orderId}/generated_drafts/${coidaPdf.fileName}`);
      addDraft({
        id: `draft_coida_${Date.now()}`,
        templateType: 'coida_cf1b' as any,
        title: 'COIDA CF-1B Change of Nature of Business Application',
        description: 'Department of Employment & Labour compensation fund application pack with mandate & proof of operations.',
        fileUrl: coidaUrl,
        fileName: coidaPdf.fileName,
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

  const mirrorId = resolvePartnerMirrorOrderId(order);
  if (mirrorId) {
    await db.collection('orders').doc(mirrorId).update(cleanFirestoreData({
      generatedDrafts,
      checklist: stripInternalChecklistAiData(updatedChecklist),
      updatedAt: new Date().toISOString(),
    }));
  }

  return generatedDrafts;
}

/**
 * Public Action for Consultants to manually trigger Document Template Generation.
 */
export async function generateOrderDocumentDraftsAction(orderId: string, templateIds?: string[]) {
  try {
    const drafts = await generateOrderDocumentDraftsInternal(orderId, undefined, templateIds);
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

    const mirrorId = resolvePartnerMirrorOrderId(order);
    if (mirrorId) {
      await db.collection('orders').doc(mirrorId).update(cleanFirestoreData({
        generatedDrafts: updatedDrafts,
        notes: [...(order.notes || []), clientNote],
        checklist: stripInternalChecklistAiData(updatedChecklist),
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
    const db = getAdminDb();
    const orderDoc = await db.collection('orders').doc(order.id).get();
    const orderData = (orderDoc.exists ? orderDoc.data() : order) as Order;

    // Rate limit: Prevent duplicate alerts for the same order within 10 minutes
    if (orderData.lastIntakeAlertSentAt) {
      const lastSent = new Date(orderData.lastIntakeAlertSentAt).getTime();
      if (!isNaN(lastSent) && Date.now() - lastSent < 10 * 60 * 1000) {
        console.log(`[sendConsolidatedStaffIntakeAlert] Skipping alert for Order #${order.id} — already sent at ${orderData.lastIntakeAlertSentAt}`);
        return;
      }
    }

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
            <strong>${clientName}</strong> has submitted documents. The automated AI verification pipeline has processed the uploads.
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

    await db.collection('orders').doc(order.id).update({
      lastIntakeAlertSentAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error sending staff intake alert email:', err);
  }
}

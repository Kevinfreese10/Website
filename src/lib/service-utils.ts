import { Service, FulfillmentStep, Order } from './types';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);

/**
 * Default standard 3-step fulfillment checklist for services without a customized checklist.
 */
export const DEFAULT_FULFILLMENT_CHECKLIST: FulfillmentStep[] = [
  {
    id: 'step_doc_verification',
    title: '1. Review Required Information & AI Validation Checks',
    description: 'Audit and verify all submitted client information and uploads against statutory compliance standards (KYC/FICA certification, CIPC director confirmation, SARS Tax Compliance Status). Mark items as approved or rejected with specific comments before progressing.',
    aiInstructions: 'Perform automated OCR & validation checks on all client uploads and text inputs. Verify that mobile numbers (10 digits starting with 0), email addresses, 13-digit SA ID numbers, and CIPC enterprise numbers match statutory formats. Check that certifications are valid (< 3 months). Mark approved/rejected in Firestore and queue drafts.',
    type: 'doc_verification',
    estimatedDays: 1,
  },
  {
    id: 'step_document_drafting',
    title: '2. Prepare Draft Documents from Templates',
    description: 'Generate pre-filled statutory drafts, resolutions, and application forms from verified client information and attach for consultant review.',
    aiInstructions: 'Only trigger document generation once all client KYC/information items are marked approved. Use My Accountant Navy & Gold templates, strict 1-page constraints, and official practice credentials (Kevin Freese CBAP SA #3561).',
    type: 'document_drafting',
    estimatedDays: 1,
    templateIds: [],
  },
  {
    id: 'step_execution_filing',
    title: '3. Statutory Lodgement & Service Execution',
    description: 'Execute compliance filings, calculations, or statutory registrations with authorities (e.g. CIPC, NCR, SARS, Labour).',
    aiInstructions: 'Compile final verified application dossier, ensure all mandated director signatures are captured, and submit via regulatory gateway or official channel. Log submission reference numbers.',
    type: 'external_filing',
    estimatedDays: 2,
  },
  {
    id: 'step_final_signoff',
    title: '4. Final Review & Document Dispatch',
    description: 'Quality audit results, generate output certificates/reports, and post note with downloadable files in Communication History.',
    aiInstructions: 'Post deliverables, confirmation letters, and client updates exclusively through Order Communication History. Never send direct external emails without portal audit trail.',
    type: 'signoff',
    estimatedDays: 1,
  },
];

/**
 * Returns the fulfillment checklist for a service, falling back to the standard 3-step checklist if none defined.
 */
export function getServiceChecklist(service?: Partial<Service> | null): FulfillmentStep[] {
  if (service?.fulfillmentChecklist && Array.isArray(service.fulfillmentChecklist) && service.fulfillmentChecklist.length > 0) {
    return service.fulfillmentChecklist;
  }
  return DEFAULT_FULFILLMENT_CHECKLIST;
}

/**
 * Resolves the SUBJECT ENTITY of an order — i.e. the company/person the service is actually
 * being performed for — as distinct from the ordering contact who placed and paid for it.
 *
 * These are frequently different: an individual (e.g. a director) commonly orders an NCR or CIPC
 * registration on behalf of a company. Supporting documents (bank confirmation letters, CIPC
 * certificates, tax clearances) will correctly be in the ENTITY's name, not the orderer's.
 *
 * Critically, this deliberately does NOT fall back to the ordering contact's name when the entity
 * cannot be determined. Returning the orderer as the "expected entity" is what caused documents
 * legitimately held in the company's name to be reported as name mismatches. When the entity is
 * genuinely unknown, callers should omit the expectation entirely and route to human review rather
 * than assert a mismatch that isn't real.
 */
export function resolveOrderEntityContext(order: Order): {
  orderingContactName: string;
  entityName?: string;
  registrationNumber?: string;
  idNumber?: string;
  directorName?: string;
  isEntityResolved: boolean;
} {
  const uploads = order.documentUploads || [];

  const textFor = (...keywords: string[]): string | undefined => {
    const match = uploads.find(u => {
      const label = (u.requirementLabel || '').toLowerCase();
      return keywords.some(k => label.includes(k)) && !!u.textValue?.trim();
    });
    return match?.textValue?.trim() || undefined;
  };

  // Entities extracted by prior AI verifications of other documents on the same order.
  let aiEntity: string | undefined;
  let aiReg: string | undefined;
  let aiId: string | undefined;
  let aiDirector: string | undefined;
  for (const u of uploads) {
    const ext = (u as any).aiVerification?.extractedData;
    if (!ext) continue;
    aiEntity = aiEntity || ext.companyName || ext.enterpriseName || ext.registeredName;
    aiReg = aiReg || ext.registrationNumber || ext.regNumber;
    aiId = aiId || ext.idNumber || ext.directors?.[0]?.idNumber;
    aiDirector = aiDirector || ext.directorName || ext.director || ext.directors?.[0]?.name;
  }

  const orderAny = order as any;

  const entityName =
    textFor('company name', 'entity name', 'registered name', 'business name', 'trading name') ||
    orderAny.companyName ||
    orderAny.clientEntityName ||
    orderAny.businessName ||
    aiEntity ||
    undefined;

  const registrationNumber =
    textFor('registration number', 'reg no', 'cipc', 'enterprise number') ||
    orderAny.companyRegistrationNumber ||
    orderAny.registrationNumber ||
    aiReg ||
    undefined;

  const idNumber =
    textFor('id number', 'identity number', 'id/passport') ||
    orderAny.idNumber ||
    orderAny.directorIdNumber ||
    aiId ||
    undefined;

  const directorName =
    textFor('director name', 'applicant name', 'representative name', 'public officer') ||
    orderAny.directorName ||
    aiDirector ||
    undefined;

  return {
    orderingContactName: order.endCustomerName || order.customerName || '',
    entityName,
    registrationNumber,
    idNumber,
    directorName,
    isEntityResolved: !!entityName,
  };
}

/**
 * Returns the id of the linked PARTNER MIRROR order that this order's changes should be synced to,
 * or null when there isn't one.
 *
 * `originalOrderId` has historically carried two incompatible meanings:
 *   1. "the linked partner/MA twin of this order" — changes SHOULD be mirrored across, and
 *   2. "the parent order that required me" (prerequisite child orders) — changes MUST NOT be
 *      mirrored, because the parent is a completely different order for a different service.
 *
 * Meaning (2) now uses `parentOrderId`, but historical documents still carry it in
 * `originalOrderId`, so this also screens those out defensively. Getting this wrong is destructive:
 * mirroring a prerequisite child onto its parent overwrites the parent's documents, checklist and
 * status, and marks it Completed.
 */
export function resolvePartnerMirrorOrderId(order: any): string | null {
  if (!order) return null;

  // Explicitly a prerequisite child — never mirror.
  if (order.isPrerequisiteOrder === true || order.parentOrderId) return null;

  const linkedId = order.originalOrderId;
  if (!linkedId || linkedId === order.id) return null;

  // A genuine partner mirror always belongs to a partner-linked or outsourced order. A prerequisite
  // child created before `parentOrderId` existed generally won't be, so this screens out most
  // legacy cases without blocking real mirrors.
  const looksLikePartnerMirror = Boolean(order.resellerId || order.partnerId || order.isOutsourced);
  if (!looksLikePartnerMirror) return null;

  return linkedId as string;
}

/**
 * Strips My Accountant's internal AI audit data from document uploads before they are mirrored onto
 * a partner-owned order document.
 *
 * Partner-linked orders are synced via `originalOrderId`. Because Firestore rules cannot filter
 * individual fields, anything written to the partner's order record is fully readable by that
 * partner — so the AI verification payload (confidence scores, extracted client data, model
 * details, internal auditor reasoning) must never be written there in the first place. Partners
 * keep what they legitimately need: the document itself and its approval outcome.
 */
export function stripInternalAiData<T extends { aiVerification?: any }>(uploads: T[] = []): T[] {
  return uploads.map(upload => {
    const { aiVerification, ...clientSafe } = upload as any;
    return clientSafe as T;
  });
}

/**
 * Strips internal AI annotations from checklist steps before mirroring to a partner order.
 * Progress (status/titles/timestamps) is retained so a partner can still see how far along an
 * outsourced order is; the AI reasoning behind that progress is not.
 */
export function stripInternalChecklistAiData<T extends Record<string, any>>(checklist: T[] = []): T[] {
  return checklist.map(step => {
    const { aiNotes, isAiRecommended, ...clientSafe } = step as any;
    return clientSafe as T;
  });
}

/**
 * Normalizes informationToProvide array by ensuring every item has a stable unique ID.
 */
export function normalizeRequirementsWithIds(items: any[] = []): { id: string; label: string; type?: 'text' | 'pdf' | 'excel' | 'image' | 'any'; helpText?: string; isConditional?: boolean; conditionalQuestion?: string; isRequired?: boolean; aiHint?: string }[] {
  return items.map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: `req_${nanoid()}`,
        label: item,
        type: 'pdf',
        isRequired: true,
      };
    }
    return {
      ...item,
      id: item.id || `req_${nanoid()}`,
      label: item.label || '',
      type: item.type || 'pdf',
      isRequired: item.isRequired !== false,
      aiHint: item.aiHint,
    };
  });
}

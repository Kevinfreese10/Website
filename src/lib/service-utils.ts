import { Service, FulfillmentStep, Order, ServiceRequirement, OrderChecklistItem } from './types';
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
 * True only when a service has its own (non-default) checklist AND Kevin has stamped it approved.
 * The AI order agent must never act on a service where this is false (plan §2 principle 3).
 */
export function isPlaybookApproved(service?: Partial<Service> | null): boolean {
  if (!service) return false;
  const hasOwnChecklist = Array.isArray(service.fulfillmentChecklist) && service.fulfillmentChecklist.length > 0;
  const approval = service.playbookApproval;
  return hasOwnChecklist && !!approval && !!approval.approvedAt && !!approval.approvedBy;
}

/** The agent-relevant subset of a FulfillmentStep frozen onto each order checklist item at checkout. */
export function pickStepConfig(step: FulfillmentStep): OrderChecklistItem['stepConfig'] {
  const cfg: NonNullable<OrderChecklistItem['stepConfig']> = {};
  const keys = ['owner','doneCriteria','requirementIds','emailTo','emailSubjectTemplate','expectedReply','portalId','portalProcedure','submitMode','followUpAfterDays','deliverArtefacts','estimatedDays'] as const;
  for (const k of keys) {
    const v = (step as any)[k];
    if (v !== undefined && v !== null) (cfg as any)[k] = v;
  }
  return Object.keys(cfg).length ? cfg : undefined;
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
/**
 * Determines whether a string looks like a human person's name rather than a phone number, email, or noise.
 */
export function isLikelyPersonName(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  const s = val.trim();
  if (s.length < 2 || s.length > 80) return false;
  if (s.includes('@') || s.includes('http:') || s.includes('https:')) return false;
  // If it is purely digits, phone symbols (+, -, (, ), /, digits), or punctuation
  const digitsAndPunct = s.replace(/[\d\s\+\-\(\)\/\.\,]/g, '');
  if (digitsAndPunct.length === 0) return false;
  // Must contain letters
  if (!/[a-zA-Z]/.test(s)) return false;
  return true;
}

export function resolveOrderEntityContext(order: Order): {
  orderingContactName: string;
  entityName?: string;
  registrationNumber?: string;
  idNumber?: string;
  directorName?: string;
  isEntityResolved: boolean;
} {
  const uploads = order.documentUploads || [];

  const textFor = (
    options: { exclude?: string[]; validate?: (v: string) => boolean },
    ...keywords: string[]
  ): string | undefined => {
    const match = uploads.find(u => {
      const label = (u.requirementLabel || '').toLowerCase();
      if (options.exclude?.some(ex => label.includes(ex))) return false;
      const matched = keywords.some(k => label.includes(k));
      if (!matched) return false;
      const val = u.textValue?.trim();
      if (!val) return false;
      if (options.validate && !options.validate(val)) return false;
      return true;
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
    const facts = ext.facts || ext;
    if (facts.names && Array.isArray(facts.names)) {
      if (!aiEntity) {
        const comp = facts.names.find((n: any) => n.role === 'company' || n.role === 'entity' || n.role === 'account_holder');
        if (comp && comp.name) aiEntity = comp.name;
      }
      if (!aiDirector) {
        const dir = facts.names.find((n: any) => n.role === 'director' || n.role === 'individual' || n.role === 'applicant');
        if (dir && dir.name && isLikelyPersonName(dir.name)) aiDirector = dir.name;
      }
    }
    if (facts.identifiers && Array.isArray(facts.identifiers)) {
      if (!aiReg) {
        const reg = facts.identifiers.find((i: any) => i.type === 'cipc_reg');
        if (reg && reg.value) aiReg = reg.value;
      }
      if (!aiId) {
        const id = facts.identifiers.find((i: any) => i.type === 'sa_id' || i.type === 'passport');
        if (id && id.value) aiId = id.value;
      }
    }
    aiEntity = aiEntity || ext.companyName || ext.enterpriseName || ext.registeredName;
    aiReg = aiReg || ext.registrationNumber || ext.regNumber;
    aiId = aiId || ext.idNumber || ext.directors?.[0]?.idNumber;
    aiDirector = (aiDirector && isLikelyPersonName(aiDirector)) ? aiDirector : (ext.directorName || ext.director || ext.directors?.[0]?.name);
    if (aiDirector && !isLikelyPersonName(aiDirector)) aiDirector = undefined;
  }

  const orderAny = order as any;

  const entityName =
    textFor({ exclude: ['email', 'phone', 'director name', 'contact person'] }, 'company name', 'entity name', 'registered name', 'business name', 'trading name') ||
    orderAny.companyName ||
    orderAny.clientEntityName ||
    orderAny.businessName ||
    aiEntity ||
    undefined;

  const registrationNumber =
    textFor({}, 'registration number', 'reg no', 'cipc', 'enterprise number') ||
    orderAny.companyRegistrationNumber ||
    orderAny.registrationNumber ||
    aiReg ||
    undefined;

  const idNumber =
    textFor({}, 'id number', 'identity number', 'id/passport') ||
    orderAny.idNumber ||
    orderAny.directorIdNumber ||
    aiId ||
    undefined;

  const rawDirector =
    textFor({
      exclude: ['phone', 'cell', 'tel', 'number', 'email', 'address', 'province', 'premises', 'shares', 'percentage', 'fee', 'amount', 'language'],
      validate: isLikelyPersonName
    }, 'director name', 'applicant name', 'representative name', 'public officer') ||
    orderAny.directorName ||
    aiDirector ||
    undefined;

  const directorName = (rawDirector && isLikelyPersonName(rawDirector)) ? rawDirector : undefined;

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
    // mechanicalCheck facts and encrypted credential values are internal too (plan §6.8, §9 risks).
    const { aiVerification, mechanicalCheck, ...clientSafe } = upload as any;
    if (clientSafe.isEncrypted) clientSafe.textValue = '••••••••';
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
export function normalizeRequirementsWithIds(items: any[] = []): (ServiceRequirement & { id: string })[] {
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

/**
 * Formats an Order's communication history and notes into a clean, chronological transcript
 * suitable for ingestion by AI audit flows and template generators.
 */
export function formatOrderCommunicationHistory(order: Order): string {
  const notes = order.notes || [];
  if (notes.length === 0) return '';

  return notes
    .map(n => {
      const rawDate = (n as any).createdAt || n.date;
      const dateStr = rawDate
        ? (typeof rawDate?.toDate === 'function' ? rawDate.toDate().toISOString().replace('T', ' ').slice(0, 16) : String(rawDate).replace('T', ' ').slice(0, 16))
        : 'Recent';
      const isClient = (n as any).isClientNote || n.authorId === order.userId || n.authorId === 'client';
      const role = isClient ? 'CLIENT' : n.isInternal ? 'INTERNAL STAFF NOTE' : 'STAFF / CONSULTANT';
      const authorName = (n as any).authorName || (n as any).authorEmail || (isClient ? (order.customerName || 'Client') : 'Staff Consultant');
      const author = `${authorName} (${role})`;
      let text = `[${dateStr}] [${author}]${n.subject ? ` Subject: ${n.subject}\n` : ''}: ${n.text || ''}`;
      if (n.attachments && n.attachments.length > 0) {
        const attNames = n.attachments.map(a => `${a.name} (${a.url})`).join(', ');
        text += `\n  (Attached Files: ${attNames})`;
      } else if (n.attachmentUrl) {
        text += `\n  (Attached File: ${n.attachmentName || 'Attachment'} - ${n.attachmentUrl})`;
      }
      return text;
    })
    .join('\n\n');
}

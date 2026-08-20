import { Service, FulfillmentStep } from './types';
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
 * Normalizes informationToProvide array by ensuring every item has a stable unique ID.
 */
export function normalizeRequirementsWithIds(items: any[] = []): { id: string; label: string; type?: 'text' | 'pdf' | 'excel' | 'image' | 'any'; helpText?: string; isConditional?: boolean; conditionalQuestion?: string; isRequired?: boolean }[] {
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
    };
  });
}

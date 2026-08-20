import { Service, FulfillmentStep } from './types';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);

/**
 * Default standard 3-step fulfillment checklist for services without a customized checklist.
 */
export const DEFAULT_FULFILLMENT_CHECKLIST: FulfillmentStep[] = [
  {
    id: 'step_doc_verification',
    title: '1. Document Verification & KYC',
    description: 'Verify all required client documents and identity details.',
    type: 'doc_verification',
    estimatedDays: 1,
  },
  {
    id: 'step_execution_filing',
    title: '2. Service Execution & Compliance Filing',
    description: 'Execute compliance filings, calculations, or statutory registrations with authorities (e.g. CIPC / SARS).',
    type: 'external_filing',
    estimatedDays: 3,
  },
  {
    id: 'step_final_signoff',
    title: '3. Final Review & Document Dispatch',
    description: 'Quality audit results, generate output certificates/reports, and dispatch to client.',
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

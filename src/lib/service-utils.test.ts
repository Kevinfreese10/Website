import { describe, it, expect } from 'vitest';
import {
  resolveOrderEntityContext,
  resolvePartnerMirrorOrderId,
  stripInternalAiData,
  stripInternalChecklistAiData,
  isPlaybookApproved,
  pickStepConfig,
} from './service-utils';

/**
 * These guard three defects that each caused real, visible damage:
 *
 *  1. AI document verification compared uploads against the ORDERING CONTACT rather than the
 *     entity the service is for, so a bank letter correctly held in the company's name was
 *     reported to staff as a critical mismatch (observed on order #10135).
 *  2. `originalOrderId` carried two incompatible meanings, so completing a small prerequisite
 *     order overwrote its parent's documents, checklist and status, and marked it Completed.
 *  3. My Accountant's internal AI audit data was being copied onto partner-owned order records.
 */

describe('resolveOrderEntityContext', () => {
  const baseOrder: any = {
    id: 'ORD-1',
    customerName: 'Peturnia Mavundlha',
    customerEmail: 'p@example.co.za',
    documentUploads: [],
  };

  it('does NOT fall back to the ordering contact when the entity is unknown', () => {
    // The original bug: an unresolved entity defaulted to the orderer's personal name, which the
    // AI then treated as the expected account holder — producing false mismatches.
    const ctx = resolveOrderEntityContext(baseOrder);
    expect(ctx.entityName).toBeUndefined();
    expect(ctx.isEntityResolved).toBe(false);
    expect(ctx.orderingContactName).toBe('Peturnia Mavundlha');
  });

  it('reads the entity from a submitted "Registered Company Name" value', () => {
    const ctx = resolveOrderEntityContext({
      ...baseOrder,
      documentUploads: [
        { requirementLabel: 'Registered Company Name', textValue: 'FIRST BLOOM FINANCE', type: 'text' },
      ],
    });
    expect(ctx.entityName).toBe('FIRST BLOOM FINANCE');
    expect(ctx.isEntityResolved).toBe(true);
    // The ordering contact must remain distinct from the subject entity.
    expect(ctx.orderingContactName).toBe('Peturnia Mavundlha');
  });

  it('falls back to an entity extracted by a previous AI verification', () => {
    const ctx = resolveOrderEntityContext({
      ...baseOrder,
      documentUploads: [
        {
          requirementLabel: 'CIPC Registration Certificate',
          fileUrl: 'https://example/doc.pdf',
          aiVerification: { extractedData: { companyName: 'FIRST BLOOM FINANCE (PTY) LTD' } },
        },
      ],
    });
    expect(ctx.entityName).toBe('FIRST BLOOM FINANCE (PTY) LTD');
  });

  it('picks up the registration number from a submitted value', () => {
    const ctx = resolveOrderEntityContext({
      ...baseOrder,
      documentUploads: [
        { requirementLabel: 'CIPC Registration Number', textValue: '2021/123456/07', type: 'text' },
      ],
    });
    expect(ctx.registrationNumber).toBe('2021/123456/07');
  });
});

describe('resolvePartnerMirrorOrderId', () => {
  it('returns null for a prerequisite child so it can never overwrite its parent', () => {
    // This is the data-destruction guard.
    expect(resolvePartnerMirrorOrderId({
      id: 'ORD-CHILD',
      parentOrderId: 'ORD-PARENT',
      isPrerequisiteOrder: true,
      resellerId: 'partner-1',
    })).toBeNull();
  });

  it('returns null for a legacy prerequisite child identified only by parentOrderId', () => {
    expect(resolvePartnerMirrorOrderId({
      id: 'ORD-CHILD',
      parentOrderId: 'ORD-PARENT',
      originalOrderId: 'ORD-PARENT',
      resellerId: 'partner-1',
    })).toBeNull();
  });

  it('returns the linked id for a genuine partner mirror', () => {
    expect(resolvePartnerMirrorOrderId({
      id: 'ORD-MA',
      originalOrderId: 'ORD-PARTNER',
      resellerId: 'partner-1',
      isOutsourced: true,
    })).toBe('ORD-PARTNER');
  });

  it('returns null when there is no partner relationship at all', () => {
    expect(resolvePartnerMirrorOrderId({ id: 'ORD-1', originalOrderId: 'ORD-2' })).toBeNull();
  });

  it('never mirrors an order onto itself', () => {
    expect(resolvePartnerMirrorOrderId({
      id: 'ORD-1',
      originalOrderId: 'ORD-1',
      resellerId: 'p',
    })).toBeNull();
  });

  it('handles a null/undefined order without throwing', () => {
    expect(resolvePartnerMirrorOrderId(null)).toBeNull();
    expect(resolvePartnerMirrorOrderId(undefined)).toBeNull();
  });
});

describe('stripInternalAiData', () => {
  it('removes the AI verification payload but keeps the document itself', () => {
    const [doc] = stripInternalAiData([
      {
        requirementLabel: 'Certified ID',
        fileUrl: 'https://example/id.pdf',
        status: 'approved',
        aiVerification: { confidence: 97, recommendation: 'approve', extractedData: { idNumber: '900101...' } },
      } as any,
    ]);
    expect(doc.fileUrl).toBe('https://example/id.pdf');
    expect(doc.status).toBe('approved');
    expect((doc as any).aiVerification).toBeUndefined();
  });

  it('is safe on an empty or omitted list', () => {
    expect(stripInternalAiData([])).toEqual([]);
    expect(stripInternalAiData()).toEqual([]);
  });
});

describe('stripInternalChecklistAiData', () => {
  it('keeps progress but removes internal AI annotations', () => {
    const [step] = stripInternalChecklistAiData([
      { id: 's1', title: 'Document Verification', status: 'completed', isAiRecommended: true, aiNotes: 'AI Verified: 3/3' } as any,
    ]);
    expect(step.status).toBe('completed');
    expect(step.title).toBe('Document Verification');
    expect((step as any).aiNotes).toBeUndefined();
    expect((step as any).isAiRecommended).toBeUndefined();
  });
});

describe('isPlaybookApproved / pickStepConfig (AI order agent Phase 0)', () => {
  const step: any = { id: 's1', title: 'Submit', type: 'portal_filing', portalId: 'cipc', portalProcedure: 'cipc.fileCoR39', submitMode: 'stage', estimatedDays: 2, aiInstructions: 'x' };

  it('is false for a service with no checklist even if an approval stamp exists', () => {
    expect(isPlaybookApproved({ fulfillmentChecklist: [], playbookApproval: { approvedBy: 'u', approvedAt: '2026-08-24T00:00:00Z', version: 1 } } as any)).toBe(false);
  });

  it('is false for a checklist without an approval stamp', () => {
    expect(isPlaybookApproved({ fulfillmentChecklist: [step] } as any)).toBe(false);
    expect(isPlaybookApproved({ fulfillmentChecklist: [step], playbookApproval: null } as any)).toBe(false);
  });

  it('is true only when both a checklist and a complete approval stamp exist', () => {
    expect(isPlaybookApproved({ fulfillmentChecklist: [step], playbookApproval: { approvedBy: 'u', approvedAt: '2026-08-24T00:00:00Z', version: 1 } } as any)).toBe(true);
  });

  it('pickStepConfig keeps only agent channel fields and drops prose', () => {
    const cfg = pickStepConfig(step);
    expect(cfg).toEqual({ portalId: 'cipc', portalProcedure: 'cipc.fileCoR39', submitMode: 'stage', estimatedDays: 2 });
    expect((cfg as any).aiInstructions).toBeUndefined();
    expect(pickStepConfig({ id: 'a', title: 'b', type: 'manual' })).toBeUndefined();
  });
});

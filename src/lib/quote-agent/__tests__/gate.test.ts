import { describe, expect, it } from 'vitest';
import { decideAction, isValidClientRecipient } from '../gate';
import type { GateInput } from '../types';

const ok: GateInput = {
  mode: 'live', category: 'catalog_quote', confidence: 0.95, originType: 'WEBSITE_CONTACT_FORM', isThreadReply: false,
  recipient: 'client@example.co.za', requestedServiceCount: 2, unmatchedRequests: 0, unknownSlugs: 0, warnings: 0,
  total: 4_500, recentAutoQuotesToRecipient: 0, contentProblems: [],
};

describe('decideAction: strict catalog auto-send (decision 4)', () => {
  it('auto-sends a clean catalog quote', () => {
    expect(decideAction(ok).action).toBe('auto_send');
  });

  it.each<[string, Partial<GateInput>]>([
    ['draft-only mode', { mode: 'draft-only' }],
    ['paused mode', { mode: 'paused' }],
    ['Kevin forward', { originType: 'FORWARD_FROM_KEVIN' }],
    ['thread reply', { isThreadReply: true }],
    ['no recipient', { recipient: null }],
    ['practice inbox recipient', { recipient: 'info@myacc.co.za' }],
    ['Kevin as recipient', { recipient: 'kev@thinkestry.co.za' }],
    ['low confidence', { confidence: 0.84 }],
    ['zero services', { requestedServiceCount: 0 }],
    ['four services', { requestedServiceCount: 4 }],
    ['unmatched request', { unmatchedRequests: 1 }],
    ['unknown slug', { unknownSlugs: 1 }],
    ['price warning', { warnings: 1 }],
    ['zero total', { total: 0 }],
    ['total over R10,000', { total: 10_000.01 }],
    ['5 auto quotes already today', { recentAutoQuotesToRecipient: 5 }],
    ['content problem', { contentProblems: ['AI-written text contains a price or amount.'] }],
  ])('sends %s to review', (_label, patch) => {
    const d = decideAction({ ...ok, ...patch });
    expect(d.action).toBe('draft_for_review');
    expect(d.reasons.length).toBeGreaterThan(0);
  });

  it('allows exactly the limits: 3 services, R10,000, 0.85 confidence, 4 prior quotes', () => {
    expect(decideAction({ ...ok, requestedServiceCount: 3, total: 10_000, confidence: 0.85, recentAutoQuotesToRecipient: 4 }).action).toBe('auto_send');
  });

  it('has no daily cap: volume from different senders is never limited', () => {
    expect(decideAction({ ...ok, recentAutoQuotesToRecipient: 0 }).action).toBe('auto_send');
  });

  it('lists every failed rule', () => {
    const d = decideAction({ ...ok, confidence: 0.1, total: 50_000, warnings: 2 });
    expect(d.reasons).toHaveLength(3);
  });
});

describe('decideAction: other categories never auto-send', () => {
  it.each(['retainer', 'tax_debt', 'custom_scope', 'out_of_scope', 'kevin_forward', 'quote_acceptance', 'quote_question', 'general_enquiry'] as const)(
    '%s needs review', category => {
      expect(decideAction({ ...ok, category }).action).toBe('draft_for_review');
    });
  it.each(['regulator', 'order_update', 'system_notice'] as const)('%s is alert-only', category => {
    expect(decideAction({ ...ok, category }).action).toBe('notify_only');
  });
  it('spam is ignored', () => {
    expect(decideAction({ ...ok, category: 'spam' }).action).toBe('ignore');
  });
});

describe('isValidClientRecipient', () => {
  it('rejects practice inboxes, Kevin and junk', () => {
    for (const a of ['info@myacc.co.za', 'AI@myacc.co.za', 'no_reply@myacc.co.za', 'kev@thinkestry.co.za', 'not-an-email', '', null]) {
      expect(isValidClientRecipient(a as any)).toBe(false);
    }
    expect(isValidClientRecipient('jane@acme.co.za')).toBe(true);
  });
});

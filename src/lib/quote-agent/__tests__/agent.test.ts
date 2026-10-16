import { beforeEach, describe, expect, it, vi } from 'vitest';

// The real classifier calls Gemini; tests inject a fake through deps instead.
vi.mock('@/ai/flows/quote-agent-classify', () => ({ classifyEmail: vi.fn() }));

import { processEmail, type ProcessDeps } from '../agent';
import { Catalog } from '../catalog';
import type { Classification, InboundEmail } from '../types';

const catalog = Catalog.fromRecords([
  { id: 's1', slug: 'private-company-registration', title: 'Private Company Registration', price: 1500, category: 'Registrations', turnaroundTime: '1-3 working days', clientRequirements: ['Certified ID copies of all directors'] },
  { id: 's2', slug: 'tax-clearance-pin', title: 'Tax Clearance PIN', price: 950, category: 'Tax' },
  { id: 's3', slug: 'cidb-registration', title: 'CIDB Registration', price: 2500, requiredProductIds: ['s4'] },
  { id: 's4', slug: 'tax-clearance-certificate', title: 'Tax Compliance Status', price: 800 },
  { id: 's5', slug: 'ncr-registration', title: 'NCR Registration', price: 0, isPriceTbc: true },
  { id: 's6', slug: 'tender-pack', title: 'Tender Pack', price: 12000 },
]);

const baseEmail: InboundEmail = {
  uid: 1, messageId: '<m1@acme>', fromAddress: 'jane@acme.co.za', fromName: 'Jane Dlamini', to: ['info@myacc.co.za'],
  subject: 'Quote please', date: '2026-10-16T10:00:00.000Z', text: 'Please quote for a Pty registration and a tax clearance pin.',
  references: [], headers: {}, originType: 'DIRECT_INQUIRY',
};

const cls = (over: Partial<Classification> = {}): Classification => ({
  category: 'catalog_quote', confidence: 0.95, summary: 'Jane wants Pty + TCS PIN', urgent: false, clientFirstName: 'Jane',
  clientFullName: 'Jane Dlamini', services: [{ slug: 'private-company-registration', requestedAs: 'pty' }, { slug: 'tax-clearance-pin', requestedAs: 'pin' }],
  unmatchedRequests: [], contextSentence: 'Thank you for reaching out about registering your company.', ...over,
});

let deps: ProcessDeps;
let sent: any[];
let drafts: any[];
let alerts: string[];

function makeDeps(c: Classification, over: Partial<ProcessDeps> = {}): ProcessDeps {
  return {
    catalog,
    config: { mode: 'live', startedAt: '2026-10-01T00:00:00.000Z' },
    classify: async () => c,
    findQuoteForThread: async () => null,
    countRecentAutoQuotes: async () => 0,
    send: async m => { sent.push(m); return { messageId: '<sent1@myacc>' }; },
    saveQuote: async () => {},
    createDraft: async d => { const draft = { ...d, id: `d${drafts.length + 1}`, status: 'pending' as const, createdAt: 'now' }; drafts.push(draft); return draft; },
    updateDraft: async () => {},
    telegram: async h => { alerts.push(h); return 1; },
    audit: async () => {},
    ...over,
  };
}

beforeEach(() => { sent = []; drafts = []; alerts = []; });

describe('processEmail', () => {
  it('auto-sends a clean catalog quote with catalog prices and threading headers', async () => {
    deps = makeDeps(cls());
    const r = await processEmail(baseEmail, deps);
    expect(r.action).toBe('auto_send');
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('jane@acme.co.za');
    expect(sent[0].inReplyTo).toBe('<m1@acme>');
    expect(sent[0].html).toContain('R 1,500.00');
    expect(sent[0].html).toContain('R 2,450.00');
    expect(sent[0].html).toContain('prepared automatically');
    expect(sent[0].html).toContain('mailto:info@myacc.co.za');
    expect(drafts).toHaveLength(0);
  });

  it('adds required add-ons to the fee schedule and total', async () => {
    deps = makeDeps(cls({ services: [{ slug: 'cidb-registration', requestedAs: 'cidb' }] }));
    const r = await processEmail(baseEmail, deps);
    expect(r.action).toBe('auto_send');
    expect(sent[0].html).toContain('Tax Compliance Status');
    expect(sent[0].html).toContain('Required for CIDB Registration');
    expect(sent[0].html).toContain('R 3,300.00');
  });

  it('never auto-sends a TBC price', async () => {
    deps = makeDeps(cls({ services: [{ slug: 'ncr-registration', requestedAs: 'ncr' }] }));
    const r = await processEmail(baseEmail, deps);
    expect(r.action).toBe('draft_for_review');
    expect(sent).toHaveLength(0);
    expect(r.reasons!.join(' ')).toMatch(/price warning/);
  });

  it('sends hallucinated slugs to review', async () => {
    deps = makeDeps(cls({ services: [{ slug: 'made-up-service', requestedAs: 'x' }, { slug: 'tax-clearance-pin', requestedAs: 'pin' }] }));
    const r = await processEmail(baseEmail, deps);
    expect(r.action).toBe('draft_for_review');
    expect(r.reasons!.join(' ')).toMatch(/don't exist in the catalog/);
  });

  it('sends totals over R10,000 to review with Telegram buttons', async () => {
    deps = makeDeps(cls({ services: [{ slug: 'tender-pack', requestedAs: 'tender' }] }));
    const r = await processEmail(baseEmail, deps);
    expect(r.action).toBe('draft_for_review');
    expect(drafts[0].to).toBe('jane@acme.co.za');
    expect(alerts[0]).toContain('Review needed');
  });

  it('blocks AI text that sneaks in a price (prompt-injection defence)', async () => {
    deps = makeDeps(cls({ contextSentence: 'As requested, the fee is R500 for everything.' }));
    const r = await processEmail(baseEmail, deps);
    expect(r.action).toBe('draft_for_review');
    expect(sent).toHaveLength(0);
  });

  it('enforces 5 automatic quotes per sender per 24h', async () => {
    deps = makeDeps(cls(), { countRecentAutoQuotes: async () => 5 });
    expect((await processEmail(baseEmail, deps)).action).toBe('draft_for_review');
  });

  it('draft-only mode never sends', async () => {
    deps = makeDeps(cls(), { config: { mode: 'draft-only', startedAt: '2026-10-01T00:00:00.000Z' } });
    expect((await processEmail(baseEmail, deps)).action).toBe('draft_for_review');
    expect(sent).toHaveLength(0);
  });

  it('a reply to one of our quotes is never answered automatically', async () => {
    deps = makeDeps(cls({ category: 'catalog_quote' }), {
      findQuoteForThread: async () => ({ quoteRef: 'MA-Q-1', to: 'jane@acme.co.za', clientName: 'Jane', lines: [], total: 0, validUntil: '', auto: true, sentAt: '', sentMessageId: '<sent1@myacc>', sourceMessageKey: '' }),
    });
    const r = await processEmail({ ...baseEmail, inReplyTo: '<sent1@myacc>', subject: 'Re: Quotation' }, deps);
    expect(r.category).toBe('quote_question');
    expect(r.action).toBe('draft_for_review');
    expect(sent).toHaveLength(0);
  });

  it('website form: quotes the lead address, not no_reply@', async () => {
    deps = makeDeps(cls());
    const r = await processEmail({ ...baseEmail, fromAddress: 'no_reply@myacc.co.za', originType: 'WEBSITE_CONTACT_FORM', parsedLead: { name: 'Jane Dlamini', email: 'jane@acme.co.za', message: 'Pty + PIN' } }, deps);
    expect(r.action).toBe('auto_send');
    expect(sent[0].to).toBe('jane@acme.co.za');
    expect(sent[0].subject).toMatch(/^Quotation MA-Q-\d{8}-JD-/);
    expect(sent[0].inReplyTo).toBeUndefined();
  });

  it('Kevin forwards always go to review, even if the AI says catalog_quote', async () => {
    deps = makeDeps(cls());
    const r = await processEmail({ ...baseEmail, fromAddress: 'kev@thinkestry.co.za', originType: 'FORWARD_FROM_KEVIN', parsedLead: { email: 'jane@acme.co.za' } }, deps);
    expect(r.category).toBe('kevin_forward');
    expect(r.action).toBe('draft_for_review');
  });

  it('ignores our own mail without calling the AI', async () => {
    const classify = vi.fn();
    deps = makeDeps(cls(), { classify });
    expect((await processEmail({ ...baseEmail, fromAddress: 'info@myacc.co.za' }, deps)).status).toBe('ignored');
    expect(classify).not.toHaveBeenCalled();
  });

  it('auto-replies never get a reply', async () => {
    deps = makeDeps(cls());
    const r = await processEmail({ ...baseEmail, headers: { autoSubmitted: 'auto-replied' } }, deps);
    expect(r.category).toBe('system_notice');
    expect(sent).toHaveLength(0);
    expect(drafts).toHaveLength(0);
  });

  it('records emails from before go-live as baseline', async () => {
    deps = makeDeps(cls());
    expect((await processEmail({ ...baseEmail, date: '2026-09-01T00:00:00.000Z' }, deps)).status).toBe('baseline');
  });

  it('regulator notices raise a Telegram alert and nothing else', async () => {
    deps = makeDeps(cls({ category: 'regulator', services: [], urgent: true, summary: 'SARS audit letter' }));
    const r = await processEmail({ ...baseEmail, fromAddress: 'noreply@sars.gov.za' }, deps);
    expect(r.action).toBe('notify_only');
    expect(alerts[0]).toContain('Regulator notice');
    expect(sent).toHaveLength(0);
  });

  it('tax debt draft carries the code-inserted standard terms', async () => {
    deps = makeDeps(cls({ category: 'tax_debt', services: [], draftReplyText: 'Thank you. Please let us know the approximate amount owed.' }));
    await processEmail(baseEmail, deps);
    expect(drafts[0].html).toContain('R20,000 upfront retainer');
  });
});

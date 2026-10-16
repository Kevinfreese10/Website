/** Shared types for the cloud quote agent that owns info@myacc.co.za. */

export type AgentMode = 'live' | 'draft-only' | 'paused';

/**
 * Every email in info@ lands in exactly one category. The first seven mirror the quote-generator
 * routing table. The rest exist because the agent now owns the whole inbox (decision 1).
 */
export const EMAIL_CATEGORIES = [
  'catalog_quote',     // standard fixed-price catalog request: the only category that can auto-send
  'retainer',          // monthly accounting/bookkeeping/payroll: scoping questionnaire, review
  'tax_debt',          // SARS debt compromise/relief: review
  'custom_scope',      // complex or not in the catalog: review
  'out_of_scope',      // criminal/civil/debt collection/lending: polite decline, review
  'kevin_forward',     // forwarded by Kevin: draft back to Kevin, never to the client
  'quote_acceptance',  // "PROCEED" on one of our quotes: urgent alert plus next-steps draft
  'quote_question',    // a question in a quote thread: drafted answer for review
  'order_update',      // portal or client message about an existing order
  'regulator',         // SARS / CIPC / NCR / CIDB / DEL / COIDA and similar authorities
  'general_enquiry',   // a real person asking something that isn't a quote
  'system_notice',     // receipts, platform notifications, newsletters
  'spam',              // cold sales, SEO, phishing
] as const;
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];

/** A parsed inbound email, before classification. */
export interface InboundEmail {
  uid: number;
  messageId: string;
  fromAddress: string;
  fromName: string;
  replyTo?: string;
  to: string[];
  subject: string;
  date: string;
  text: string;
  inReplyTo?: string;
  references: string[];
  /** Raw header values used by the loop and authentication filters. */
  headers: {
    autoSubmitted?: string;
    precedence?: string;
    listId?: string;
    listUnsubscribe?: string;
    returnPath?: string;
    authenticationResults?: string;
    xAutoResponseSuppress?: string;
  };
  originType: 'FORWARD_FROM_KEVIN' | 'WEBSITE_CONTACT_FORM' | 'DIRECT_INQUIRY';
  senderVerified?: boolean;
  kevinInstructions?: string;
  parsedLead?: { name?: string; email?: string; phone?: string; message?: string };
}

/** What Gemini returns. Prices are never part of it; they only come from Firestore. */
export interface Classification {
  category: EmailCategory;
  confidence: number;
  summary: string;
  urgent: boolean;
  clientFirstName: string;
  clientFullName?: string;
  companyName?: string;
  /** Catalog slugs Gemini picked from the provided catalog list (validated by code afterwards). */
  services: Array<{ slug: string; requestedAs: string }>;
  /** Things the client asked for that have no catalog match. Any entry blocks auto-send. */
  unmatchedRequests: string[];
  /** One or two plain sentences for the greeting. Must not contain prices. */
  contextSentence: string;
  /** Plain-text draft body for review/decline/acknowledgement categories. */
  draftReplyText?: string;
}

/** A catalog service resolved from Firestore. */
export interface CatalogService {
  id: string;
  slug: string;
  title: string;
  price: number;
  url: string;
  category?: string;
  turnaroundTime?: string;
  shortDescription?: string;
  priceValidUntil?: string;
  whatsIncluded: string[];
  clientRequirements: string[];
  prerequisites: string[];
  requiredServices: Array<{ id: string; title: string; price: number; slug: string }>;
  warnings: string[];
}

export interface QuoteLine {
  slug: string;
  title: string;
  price: number;
  url: string;
  turnaround: string;
  /** True when this line was added because another service requires it. */
  requiredBy?: string;
}

export interface ResolvedQuote {
  lines: QuoteLine[];
  requested: CatalogService[];
  /** Slugs Gemini returned that don't exist in the catalog. */
  unknownSlugs: string[];
  /** Warnings from any line (TBC, R0, expired, unavailable...). */
  warnings: string[];
  total: number;
  validUntil: string;
  clientRequirements: string[];
}

export type AgentAction = 'auto_send' | 'draft_for_review' | 'notify_only' | 'ignore';

export interface GateInput {
  mode: AgentMode;
  category: EmailCategory;
  confidence: number;
  originType: InboundEmail['originType'];
  /** True if the email replies to an existing thread (In-Reply-To/References or a linked quote). */
  isThreadReply: boolean;
  recipient: string | null;
  requestedServiceCount: number;
  unmatchedRequests: number;
  unknownSlugs: number;
  warnings: number;
  total: number;
  recentAutoQuotesToRecipient: number;
  /** Problems found in the rendered email (prices in AI text, WhatsApp, placeholders...). */
  contentProblems: string[];
}

export interface GateDecision {
  action: AgentAction;
  reasons: string[];
}

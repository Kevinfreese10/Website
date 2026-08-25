/**
 * DOCUMENT adapter — types (AI-ORDER-AGENT-PLAN.md §6.3).
 *
 * A template is a pure function from explicit FIELDS to a PDF. Templates never look up order
 * data themselves and never invent a value: every statutory field is either supplied in
 * `fields`, a firm constant, or reported as missing. Kevin's signature is applied only when
 * `signed === true`, which only the approval path ever sets.
 */

import type { z } from 'zod';

export type TemplateCategory = 'letter' | 'resolution' | 'certificate' | 'statutory_form' | 'affidavit' | 'internal';

export type SignaturePolicy =
  | 'kevin'            // My Accountant signs (accountant's letter, appointment letter)
  | 'client'           // client/director signs (resolutions, POA, instruction letter)
  | 'client_commissioner' // client signs before a Commissioner of Oaths (affidavit)
  | 'none';

export type RenderOptions = {
  /** Apply Kevin's signature image. Only the approval path sets this. */
  signed: boolean;
  /** ISO date used for "Date:" lines. Defaults to today. */
  date?: string;
};

export type RenderResult = {
  buffer: Buffer;
  fileName: string;
  /** Non-fatal things Kevin should know (e.g. "postal address assumed same as physical"). */
  warnings: string[];
  pageCount: number;
};

export type TemplateDefinition<F = Record<string, any>> = {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  signature: SignaturePolicy;
  /** zod schema for `fields`; required keys are the statutory minimum. */
  schema: z.ZodType<F, any, any>;
  /** Human labels for fields, used in the "missing" hand-off sheet. */
  fieldLabels: Record<string, string>;
  /** Which template file under public/templates this fills, if any. */
  sourceFile?: string;
  /** Renders the document. Must throw MissingFieldsError (not substitute) when required data is absent. */
  render: (fields: F, options: RenderOptions) => Promise<RenderResult>;
  /**
   * Best-effort pre-fill from the order (entity, questionnaire answers, extracted facts).
   * Returns only what it can justify; leaves the rest undefined so the agent can list it as missing.
   */
  suggestFields?: (ctx: OrderDocumentContext) => Partial<F>;
};

/** What a renderer may draw on to pre-fill fields. Built by context.ts from the order. */
export type OrderDocumentContext = {
  orderId: string;
  orderNumber: string;
  serviceTitle: string;
  entity: {
    entityName?: string;
    registrationNumber?: string;
    idNumber?: string;
    directorName?: string;
    orderingContactName?: string;
    address?: string;
    taxNumber?: string;
    email?: string;
    phone?: string;
  };
  /** Questionnaire answers keyed by lower-cased requirement label. Encrypted values are omitted. */
  answers: Record<string, string>;
  /** Facts extracted by Layer 2, keyed by upload id. */
  facts: Record<string, any>;
  today: string;
};

export class MissingFieldsError extends Error {
  constructor(public templateId: string, public missing: string[]) {
    super(`Cannot draft ${templateId}: missing ${missing.join(', ')}`);
    this.name = 'MissingFieldsError';
  }
}

/** Stored in orders/{id}.generatedDrafts[] (compatible with the legacy GeneratedDocumentDraft shape). */
export type DraftRecord = {
  id: string;
  templateId: string;
  /** Legacy alias of templateId kept for the existing GeneratedDocumentDraft consumers. */
  templateType: string;
  title: string;
  fileUrl: string;
  fileName: string;
  generatedAt: string;
  status: 'draft' | 'approved' | 'sent_to_client' | 'regenerated';
  /** The exact fields used, so approval re-renders deterministically with the signature. */
  fields: Record<string, any>;
  warnings: string[];
  approvedAt?: string;
  approvedBy?: string;
  signedFileUrl?: string;
};

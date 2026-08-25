/**
 * The shape of what Layer 2 (AI extraction) is allowed to say about a document.
 *
 * Facts only. There is deliberately no "approved", "valid" or "recommendation" field here —
 * that decision belongs to the rules engine (rules.ts), which is plain, testable code.
 * See AI-ORDER-AGENT-PLAN.md §4.1 / §6.2.
 *
 * Kept free of Genkit imports so the rules engine and its tests never load the AI runtime.
 */

import { z } from 'zod';
import type { DocumentKind } from '@/lib/types';

export const DOCUMENT_KINDS = [
  'sa_id', 'passport', 'proof_of_address', 'cor14_3', 'cor39', 'moi',
  'bank_confirmation', 'bank_statement', 'tcs_pin', 'sars_notice_of_registration',
  'afs', 'management_accounts', 'trial_balance', 'payslip', 'irp5', 'it3',
  'medical_aid_cert', 'ra_cert', 'logbook', 'invoice', 'receipt',
  'share_certificate', 'resolution', 'power_of_attorney', 'letterhead',
  'criminal_clearance', 'letter_of_good_standing', 'coida_registration',
  'cidb_certificate', 'completion_certificate', 'letter_of_award', 'photo', 'other',
] as const satisfies readonly DocumentKind[];

export const ExtractedNameSchema = z.object({
  name: z.string().describe('The name exactly as printed, without titles.'),
  role: z.enum(['account_holder', 'company', 'director', 'individual', 'shareholder', 'employer', 'employee', 'other']).describe('What the document says this name is.'),
});

export const ExtractedIdentifierSchema = z.object({
  type: z.enum(['sa_id', 'passport', 'cipc_reg', 'income_tax_ref', 'vat', 'paye', 'uif', 'coida', 'account_number', 'tcs_pin', 'other']),
  value: z.string(),
});

export const ExtractedDateSchema = z.object({
  purpose: z.enum(['issued', 'certified', 'signed', 'statement_period_start', 'statement_period_end', 'expiry', 'financial_year_end', 'other']),
  date: z.string().describe('YYYY-MM-DD. If only month/year is printed use the 1st.'),
});

export const ExtractedDocumentFactsSchema = z.object({
  documentKind: z.enum(DOCUMENT_KINDS).describe('The single best-matching kind from the fixed list. Use "other" when none fit.'),
  kindConfidence: z.number().min(0).max(100).describe('How sure you are about documentKind, 0-100.'),
  legible: z.boolean().describe('False if significant parts cannot be read.'),
  pageCount: z.number().int().optional(),
  issuer: z.string().optional().describe('Who issued it: bank name, CIPC, SARS, Department of Labour, municipality, SAPS, etc.'),
  names: z.array(ExtractedNameSchema).default([]),
  identifiers: z.array(ExtractedIdentifierSchema).default([]),
  dates: z.array(ExtractedDateSchema).default([]),
  addressText: z.string().optional().describe('The main address printed on the document, if any.'),
  hasStamp: z.boolean().default(false).describe('An ink/bank/official stamp is visible.'),
  hasSignature: z.boolean().default(false),
  hasCertificationStamp: z.boolean().default(false).describe('A Commissioner of Oaths / SAPS "certified true copy" stamp is visible.'),
  hasDigitalVerificationReference: z.boolean().default(false).describe('A verification reference number, QR code or "verify at" URL is printed (banks, SARS, CIPC).'),
  observations: z.array(z.string()).default([]).describe('Neutral observations only, e.g. "second page is a photocopy", "date partially obscured". Never a judgement of validity.'),
});

export type ExtractedDocumentFacts = z.infer<typeof ExtractedDocumentFactsSchema>;
export type ExtractedName = z.infer<typeof ExtractedNameSchema>;

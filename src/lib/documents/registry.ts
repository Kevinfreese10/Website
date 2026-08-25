/**
 * Template registry for the DOCUMENT adapter (AI-ORDER-AGENT-PLAN.md §6.3).
 * Template ids are the vocabulary used by playbook `templateIds`.
 */
import type { TemplateDefinition } from './types';
import { accountantsLetter } from './renderers/accountants-letter';
import { powerOfAttorney } from './renderers/power-of-attorney';
import { directorResolution } from './renderers/director-resolution';
import { shareCertificate } from './renderers/share-certificate';
import { beeAffidavit } from './renderers/bee-affidavit';
import { ncrForm2 } from './renderers/ncr-form-2';
import { ncrFeeAnnexure } from './renderers/ncr-fee-annexure';
import { accountingOfficerAppointment } from './renderers/accounting-officer-appointment';
import { coidaCf1b } from './renderers/coida-cf1b';
import { instructionLetter } from './renderers/instruction-letter';
import { deregistrationRequestLetter } from './renderers/deregistration-request-letter';
import { remissionMotivationLetter } from './renderers/remission-motivation-letter';
import { engagementLetter } from './renderers/engagement-letter';
import { handoffSheet } from './renderers/handoff-sheet';

const ALL: TemplateDefinition<any>[] = [
  accountantsLetter,
  powerOfAttorney,
  directorResolution,
  shareCertificate,
  beeAffidavit,
  ncrForm2,
  ncrFeeAnnexure,
  accountingOfficerAppointment,
  coidaCf1b,
  instructionLetter,
  deregistrationRequestLetter,
  remissionMotivationLetter,
  engagementLetter,
  handoffSheet,
];

export const TEMPLATES: Record<string, TemplateDefinition<any>> = Object.fromEntries(ALL.map(t => [t.id, t]));

/** Aliases used by seeds / legacy data → canonical ids. */
const ALIASES: Record<string, string> = {
  shareholder_resolution: 'director_resolution',
  special_resolution: 'director_resolution',
  securities_register: 'share_certificate',
  tax_rep_cover_letter: 'accountants_letter',
  cover_letter: 'accountants_letter',
  intake_summary: 'handoff_sheet',
  consent_to_act: 'accounting_officer_appointment',
  resignation_letter: 'instruction_letter',
};

export function getTemplate(id: string): TemplateDefinition<any> | undefined {
  return TEMPLATES[id] || TEMPLATES[ALIASES[id]];
}

export function listTemplates() {
  return ALL.map(t => ({ id: t.id, title: t.title, description: t.description, category: t.category, signature: t.signature, sourceFile: t.sourceFile }));
}

/** Template ids the registry cannot render yet (accounting packs come from the AI Accountant module in Phase 7). */
export const UNSUPPORTED_TEMPLATE_IDS = new Set(['afs_pack', 'management_accounts_pack', 'tax_computation', 'vat_computation', 'payroll_computation']);

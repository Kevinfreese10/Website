/**
 * Which portal procedures the worker can drive, and what each needs. Shared vocabulary between
 * the playbooks (`portalProcedure`), the orchestrator, and worker/portal-runner/src/drivers.
 *
 * Adding a procedure = implement it in the worker driver AND list it here. Anything not listed
 * falls back to a hand-off sheet, so the order still moves.
 */

export type PortalProcedureSpec = {
  id: string;                 // e.g. 'efiling.submitReturn:VAT201'
  portalId: string;
  title: string;
  /** Input keys the driver expects; values are pulled from the order by buildPortalInput(). */
  inputs: { key: string; label: string; required: boolean; from: 'entity' | 'answer' | 'literal'; hint?: string }[];
  /** Credential requirement labels (matched by substring, case-insensitive) that must exist as isSecret uploads. */
  credentials: string[];
  /** Whether this procedure may ever be promoted to auto-submit (plan §8). */
  promotable: boolean;
  usesOtp: boolean;
};

const EFILING_CREDS = ['efiling username', 'efiling login username', 'efiling login details - username', 'efiling password', 'efiling login password', 'efiling login details - password'];
const CIPC_CREDS: string[] = []; // firm login from worker env (CIPC_CUSTOMER_CODE / CIPC_PASSWORD)

export const PORTAL_PROCEDURES: PortalProcedureSpec[] = [
  { id: 'efiling.smokeLogin', portalId: 'efiling', title: 'eFiling login check (health)', inputs: [], credentials: [], promotable: false, usesOtp: true },
  { id: 'efiling.submitReturn:VAT201', portalId: 'efiling', title: 'Submit nil VAT201', inputs: [{ key: 'taxPeriod', label: 'Tax period (e.g. 2026/07)', required: true, from: 'answer', hint: 'period' }, { key: 'entityName', label: 'Taxpayer name', required: true, from: 'entity' }], credentials: EFILING_CREDS, promotable: true, usesOtp: true },
  { id: 'efiling.submitReturn:EMP201', portalId: 'efiling', title: 'Submit nil EMP201', inputs: [{ key: 'taxPeriod', label: 'Tax period', required: true, from: 'answer', hint: 'period' }, { key: 'entityName', label: 'Employer name', required: true, from: 'entity' }], credentials: EFILING_CREDS, promotable: true, usesOtp: true },
  { id: 'efiling.submitReturn:IRP6', portalId: 'efiling', title: 'Submit nil IRP6', inputs: [{ key: 'taxPeriod', label: 'Provisional period (e.g. 2027/01)', required: true, from: 'answer', hint: 'period' }, { key: 'entityName', label: 'Taxpayer name', required: true, from: 'entity' }], credentials: EFILING_CREDS, promotable: true, usesOtp: true },
  { id: 'efiling.submitReturn:ITR14', portalId: 'efiling', title: 'Submit nil ITR14 (dormant)', inputs: [{ key: 'taxYear', label: 'Year of assessment', required: true, from: 'answer', hint: 'year' }, { key: 'entityName', label: 'Company name', required: true, from: 'entity' }], credentials: EFILING_CREDS, promotable: false, usesOtp: true },
  { id: 'efiling.requestTCS', portalId: 'efiling', title: 'Request Tax Compliance Status PIN', inputs: [{ key: 'purpose', label: 'Purpose (good_standing | tender)', required: true, from: 'answer', hint: 'reason' }, { key: 'entityName', label: 'Taxpayer name', required: true, from: 'entity' }], credentials: EFILING_CREDS, promotable: true, usesOtp: true },
  { id: 'efiling.verifyTcsPin', portalId: 'efiling', title: 'Verify a TCS PIN', inputs: [{ key: 'tcsPin', label: 'TCS PIN', required: true, from: 'answer', hint: 'pin' }, { key: 'taxNumber', label: 'Tax reference', required: true, from: 'entity' }], credentials: [], promotable: true, usesOtp: false },
  { id: 'cipc.smokeLogin', portalId: 'cipc', title: 'CIPC login check (health)', inputs: [], credentials: CIPC_CREDS, promotable: false, usesOtp: false },
  { id: 'cipc.fileAnnualReturn', portalId: 'cipc', title: 'File annual return', inputs: [{ key: 'registrationNumber', label: 'Enterprise number', required: true, from: 'entity' }, { key: 'turnoverByYear', label: 'Turnover per outstanding year', required: true, from: 'answer', hint: 'turnover' }], credentials: CIPC_CREDS, promotable: true, usesOtp: false },
  { id: 'cipc.fileCoR39', portalId: 'cipc', title: 'Director amendment (CoR39)', inputs: [{ key: 'registrationNumber', label: 'Enterprise number', required: true, from: 'entity' }, { key: 'changes', label: 'Director changes', required: true, from: 'answer', hint: 'director' }], credentials: CIPC_CREDS, promotable: false, usesOtp: false },
  { id: 'cipc.changeAddress', portalId: 'cipc', title: 'Change registered address (CoR21.1)', inputs: [{ key: 'registrationNumber', label: 'Enterprise number', required: true, from: 'entity' }, { key: 'newAddress', label: 'New address', required: true, from: 'answer', hint: 'address' }], credentials: CIPC_CREDS, promotable: false, usesOtp: false },
  { id: 'cipc.reserveName', portalId: 'cipc', title: 'Name reservation (CoR9.1)', inputs: [{ key: 'names', label: 'Proposed names in order', required: true, from: 'answer', hint: 'preferred name' }], credentials: CIPC_CREDS, promotable: false, usesOtp: false },
];

export function findProcedure(id: string | undefined): PortalProcedureSpec | undefined {
  if (!id) return undefined;
  return PORTAL_PROCEDURES.find(p => p.id === id) || PORTAL_PROCEDURES.find(p => id.startsWith(p.id.split(':')[0]) && p.id.includes(':') && id.split(':')[1] === p.id.split(':')[1]);
}

/** Procedures that are never auto-submitted regardless of accept rate (plan §8). */
export function isPromotable(id: string): boolean {
  return !!findProcedure(id)?.promotable;
}

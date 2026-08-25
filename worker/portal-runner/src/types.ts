/**
 * Worker-side mirror of the app's PortalJob shape (src/lib/agent/types.ts). Kept in sync by hand;
 * the worker is a separate package with no path alias into the app.
 */
import type { Page, BrowserContext } from 'playwright';

export type PortalJobStatus = 'queued' | 'running' | 'otp_required' | 'staged' | 'submitting' | 'submitted' | 'handoff' | 'failed' | 'abandoned' | 'expired';

export type Shot = { label: string; url: string };

export type PortalJob = {
  id: string;
  orderId: string;
  orderNumber: string;
  serviceId: string;
  stepId: string;
  portalId: string;
  procedure: string;
  mode: 'stage' | 'auto';
  input: Record<string, any>;
  credentials: { label: string; encryptedValue: string }[];
  status: PortalJobStatus;
  createdAt: string;
  createdBy: string;
  claimedAt?: string;
  claimedBy?: string;
  heartbeatAt?: string;
  otpRequest?: { requestedAt: string; sentTo?: string; expiresAt: string };
  otpResponse?: { code: string; providedAt: string; providedBy: string };
  staged?: { at: string; screenshots: Shot[]; reviewSheet: { label: string; value: string }[]; expiresAt: string };
  decision?: { action: 'submit' | 'abandon'; at: string; by: string };
  result?: { reference?: string; confirmationUrl?: string; screenshots: Shot[]; notes: string[] };
  handoff?: { reason: string; sheet: { label: string; value: string }[]; screenshots: Shot[] };
  error?: string;
  log: { at: string; message: string }[];
};

/** Everything a procedure may use. Nothing else touches Firestore or the browser directly. */
export type ProcedureContext = {
  job: PortalJob;
  page: Page;
  context: BrowserContext;
  /** Decrypted credentials by (lower-cased) label substring, plus firm env creds. */
  credential: (labelSubstring: string) => string | undefined;
  log: (message: string) => Promise<void>;
  screenshot: (label: string) => Promise<Shot>;
  /** Pause for an OTP. Resolves with the code or throws OtpTimeoutError. */
  requestOtp: (sentTo?: string) => Promise<string>;
  /**
   * Park at the review screen. Resolves 'submit' or 'abandon'. In mode 'auto' resolves 'submit'
   * immediately (only reachable through promotion).
   */
  stage: (reviewSheet: { label: string; value: string }[], screenshots: Shot[]) => Promise<'submit' | 'abandon'>;
  /** Give up cleanly with the prepared sheet: the job becomes `handoff`. */
  handoff: (reason: string, sheet?: { label: string; value: string }[]) => never;
};

export type ProcedureResult = { reference?: string; confirmationUrl?: string; notes?: string[] };

export type Procedure = (ctx: ProcedureContext, input: Record<string, any>) => Promise<ProcedureResult>;

export type PortalDriver = {
  id: string;
  /** Lower-case substrings identifying this driver's credential labels. */
  credentialLabels: { username: string[]; password: string[] };
  /** Ensures a logged-in session; may call ctx.requestOtp. */
  login: (ctx: ProcedureContext) => Promise<void>;
  procedures: Record<string, Procedure>;
};

export class HandoffError extends Error {
  constructor(public reason: string, public sheet: { label: string; value: string }[] = []) { super(reason); this.name = 'HandoffError'; }
}
export class OtpTimeoutError extends Error { constructor() { super('OTP not provided in time'); this.name = 'OtpTimeoutError'; } }
export class AbandonedError extends Error { constructor() { super('Abandoned by reviewer'); this.name = 'AbandonedError'; } }
export class StageTimeoutError extends Error { constructor() { super('No decision on staged job in time'); this.name = 'StageTimeoutError'; } }

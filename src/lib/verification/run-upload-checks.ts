/**
 * Server-side glue between a client upload and the Layer 1 mechanical checks.
 * Fetches file bytes (bounded), runs the pure checks, encrypts secret text values.
 *
 * Kept separate from mechanical.ts so that module stays pure and unit-testable.
 */

import type { DocumentUpload, Order, ServiceRequirement } from '@/lib/types';
import { encrypt } from '@/lib/encryption';
import {
  MAX_UPLOAD_BYTES,
  checkTextValue,
  clientMessageFor,
  duplicateIssue,
  inspectFile,
  summarize,
  type MechanicalCheckResult,
  type MechanicalFacts,
  type MechanicalIssue,
} from './mechanical';

const FETCH_TIMEOUT_MS = 15_000;

/** Locate the requirement definition for an upload from the order's frozen service snapshots. */
export function findRequirement(order: Pick<Order, 'serviceSnapshots'>, serviceId: string, requirementId?: string, requirementLabel?: string): (ServiceRequirement & { id: string }) | undefined {
  const snaps = order.serviceSnapshots || [];
  const label = (requirementLabel || '').trim().toLowerCase();
  const inService = snaps.filter(s => !serviceId || s.serviceId === serviceId).flatMap(s => s.requirements || []);
  const pool = inService.length ? inService : snaps.flatMap(s => s.requirements || []);
  return pool.find(r => (requirementId && r.id === requirementId)) || pool.find(r => (r.label || '').trim().toLowerCase() === label);
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const len = Number(res.headers.get('content-length') || 0);
    if (len > MAX_UPLOAD_BYTES * 2) throw new Error('too large to inspect');
    const ab = await res.arrayBuffer();
    return new Uint8Array(ab);
  } finally {
    clearTimeout(timer);
  }
}

/** sha256 → requirement label, for every other file already on the order. */
export function collectExistingHashes(uploads: DocumentUpload[], excludeUploadId?: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const u of uploads) {
    if (excludeUploadId && u.id === excludeUploadId) continue;
    const label = u.requirementLabel || 'another requirement';
    const facts = u.mechanicalCheck?.facts;
    if (facts?.sha256) m.set(facts.sha256, label);
    for (const f of facts?.files || []) if (f.sha256) m.set(f.sha256, label);
  }
  return m;
}

export type UploadCheckOutcome = {
  /** The upload, possibly with textValue encrypted and mechanicalCheck attached. */
  upload: DocumentUpload;
  /** Client-safe one-liner, or null when nothing needs saying. */
  feedback: string | null;
};

/**
 * Runs Layer 1 on a freshly built upload item. Never throws — a fetch failure becomes a warning
 * so the client's submission is still recorded.
 */
export async function runUploadChecks(
  upload: DocumentUpload,
  requirement: ServiceRequirement | undefined,
  existingHashes: Map<string, string>,
): Promise<UploadCheckOutcome> {
  const issues: MechanicalIssue[] = [];
  let facts: MechanicalFacts = {};
  let next: DocumentUpload = { ...upload };

  if (upload.type === 'text') {
    const value = upload.textValue || '';
    const r = checkTextValue({ label: upload.requirementLabel, documentKind: requirement?.documentKind, isSecret: requirement?.isSecret }, value);
    issues.push(...r.issues);
    facts = r.facts;
    if (requirement?.isSecret && value.trim()) {
      try {
        next = { ...next, textValue: encrypt(value), isEncrypted: true };
      } catch (e) {
        // ENCRYPTION_KEY missing in this environment: keep plaintext but say so loudly in logs.
        console.error('[runUploadChecks] could not encrypt secret requirement value:', (e as Error).message);
      }
    }
  } else if (upload.type === 'file') {
    const files = (upload.files && upload.files.length ? upload.files : upload.fileUrl ? [{ fileUrl: upload.fileUrl, fileName: upload.fileName || 'document' }] : []) as { fileUrl: string; fileName?: string }[];
    facts.files = [];
    for (const f of files) {
      const name = f.fileName || 'document';
      try {
        const bytes = await fetchBytes(f.fileUrl);
        const r = inspectFile(bytes, name, requirement?.type || 'any');
        issues.push(...r.issues);
        const dup = duplicateIssue(r.facts.sha256, existingHashes, name);
        if (dup) issues.push(dup);
        if (r.facts.sha256) existingHashes.set(r.facts.sha256, upload.requirementLabel); // catch duplicates within the same submission
        facts.files.push({ fileName: name, sha256: r.facts.sha256, byteLength: r.facts.byteLength, detectedType: r.facts.detectedType, pdfPageCount: r.facts.pdfPageCount });
        if (!facts.sha256) { facts.sha256 = r.facts.sha256; facts.byteLength = r.facts.byteLength; facts.detectedType = r.facts.detectedType; facts.pdfPageCount = r.facts.pdfPageCount; facts.pdfEncrypted = r.facts.pdfEncrypted; }
      } catch (e) {
        issues.push({ code: 'FILE_FETCH_FAILED', severity: 'warn', message: `We couldn't open ${name} to check it automatically; a team member will review it.` });
        console.warn('[runUploadChecks] fetch failed for', f.fileUrl, (e as Error).message);
      }
    }
  }

  const result: MechanicalCheckResult = summarize(issues, facts);
  next = { ...next, mechanicalCheck: result };
  return { upload: next, feedback: clientMessageFor(result) };
}

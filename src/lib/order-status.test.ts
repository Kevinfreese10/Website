import { describe, it, expect } from 'vitest';
import { getStatusVariant } from './order-status';

/**
 * This function was copy-pasted into eight files, and one copy had drifted — the admin
 * order-detail page had lost its 'Outsourced' case, so the same order showed a grey badge there
 * and a blue one on every other screen. These tests pin the mapping now that there is one
 * definition.
 */
describe('getStatusVariant', () => {
  it('maps each known status to its intended variant', () => {
    expect(getStatusVariant('Completed')).toBe('success');
    expect(getStatusVariant('Processing')).toBe('info');
    expect(getStatusVariant('Pending Payment')).toBe('warning');
    expect(getStatusVariant('Under Review')).toBe('review');
    expect(getStatusVariant('Cancelled')).toBe('destructive');
  });

  it('treats Outsourced as Processing — the case that had drifted', () => {
    expect(getStatusVariant('Outsourced')).toBe('info');
    expect(getStatusVariant('Outsourced')).toBe(getStatusVariant('Processing'));
  });

  it('groups every waiting-on-the-client status together', () => {
    expect(getStatusVariant('Waiting on Customer')).toBe('waiting');
    expect(getStatusVariant('Waiting for Information')).toBe('waiting');
    expect(getStatusVariant('Waiting on Client')).toBe('waiting');
  });

  it('falls back to secondary for an unknown or legacy status rather than throwing', () => {
    expect(getStatusVariant('Some Legacy Status')).toBe('secondary');
    expect(getStatusVariant('')).toBe('secondary');
  });
});

/**
 * Smart Slug Fallback Matcher
 * Resolves unknown, reordered, or slightly mistyped product slugs to live service slugs,
 * or falls back to /products with search pre-filled (avoiding soft-404 penalty on root).
 */

export interface SlugCandidate {
  slug: string;
  title?: string;
}

const STOP_WORDS = new Set([
  'and', 'for', 'the', 'of', 'in', 'to', 'a', 'an', 'at', 'by',
  'services', 'service', 'filing', 'submission', 'package', 'application',
  'only', 'draft', 'sign', 'off'
]);

export function tokenizeSlug(slug: string): string[] {
  return slug
    .toLowerCase()
    .replace(/--+/g, '-')
    .split(/[-_]+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w));
}

export function findBestSlugMatch(
  targetSlug: string,
  candidates: SlugCandidate[],
  minConfidence = 0.5
): string | null {
  const targetTokens = tokenizeSlug(targetSlug);
  if (targetTokens.length === 0) return null;

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const candidateTokens = tokenizeSlug(candidate.slug);
    if (candidateTokens.length === 0) continue;

    const intersection = targetTokens.filter(t => candidateTokens.includes(t));
    if (intersection.length === 0) continue;

    // High-priority statutory identifiers that strongly indicate the exact filing
    const hasStatutoryId = intersection.some(t =>
      /^(itr14|itr12|irp6|vat201|emp201|emp501|ncr|coida|cidb|uif|cipc|psira|bbbee|bee|nhbrc|ncca)$/i.test(t)
    );

    const overlapRatio = intersection.length / Math.min(targetTokens.length, candidateTokens.length);
    const score = hasStatutoryId ? overlapRatio + 0.3 : overlapRatio;

    if (score > bestScore && score >= minConfidence) {
      bestScore = score;
      bestMatch = candidate.slug;
    }
  }

  return bestMatch;
}

export function buildFallbackRedirectUrl(
  slug: string,
  candidates: SlugCandidate[]
): string {
  const match = findBestSlugMatch(slug, candidates);
  if (match) {
    return `/products/${match}`;
  }
  const cleanSearch = slug
    .toLowerCase()
    .replace(/--+/g, '-')
    .split(/[-_]+/)
    .filter(Boolean)
    .join(' ');
  return `/products?search=${encodeURIComponent(cleanSearch)}`;
}

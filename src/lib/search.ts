/**
 * Lightweight fuzzy search helpers used across the catalogue. They provide
 * typo tolerance and Hindi/English term matching without depending on a
 * search backend.
 */

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "for",
  "in",
  "to",
  "kg",
  "mm",
]);

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  return normalizeSearchText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  let current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
    }
    [previous, current] = [current, previous];
  }

  return previous[b.length];
}

/** Returns a 0..1 similarity score for two tokens (1 = identical). */
export function tokenSimilarity(a: string, b: string): number {
  const x = normalizeSearchText(a);
  const y = normalizeSearchText(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const distance = levenshtein(x, y);
  const maxLen = Math.max(x.length, y.length);
  return 1 - distance / maxLen;
}

/**
 * Fuzzy contains check: true if any query token fuzzy-matches any haystack
 * token above the threshold.
 */
export function fuzzyIncludes(haystack: string, query: string, threshold = 0.72): boolean {
  const haystackTokens = tokenize(haystack);
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return true;
  if (haystackTokens.length === 0) return false;

  return queryTokens.every((qToken) => {
    // Exact substring counts as a match.
    if (haystack.toLowerCase().includes(qToken)) return true;
    return haystackTokens.some((hToken) => tokenSimilarity(qToken, hToken) >= threshold);
  });
}

/** Score a product haystack against a query (higher = better). */
export function searchScore(haystack: string, query: string): number {
  const qTokens = tokenize(query);
  const hTokens = tokenize(haystack);
  if (qTokens.length === 0) return 0;

  let score = 0;
  for (const qToken of qTokens) {
    let best = 0;
    for (const hToken of hTokens) {
      if (hToken === qToken) best = Math.max(best, 1);
      else if (hToken.startsWith(qToken) || qToken.startsWith(hToken)) best = Math.max(best, 0.9);
      else best = Math.max(best, tokenSimilarity(qToken, hToken));
    }
    // substring bonus
    if (haystack.toLowerCase().includes(qToken)) best = Math.max(best, 0.95);
    score += best;
  }
  return score / qTokens.length;
}

/** Given a query with no results, suggest close terms from a candidate list. */
export function suggestTerms(query: string, candidates: string[], limit = 5): string[] {
  const q = normalizeSearchText(query);
  if (!q) return [];
  const scored = candidates
    .map((candidate) => ({ candidate, score: tokenSimilarity(q, normalizeSearchText(candidate)) }))
    .filter((entry) => entry.score >= 0.5 && entry.score < 1)
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of scored) {
    if (seen.has(entry.candidate)) continue;
    seen.add(entry.candidate);
    result.push(entry.candidate);
    if (result.length >= limit) break;
  }
  return result;
}
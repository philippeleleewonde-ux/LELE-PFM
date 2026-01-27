// ============================================
// STRING SIMILARITY - Levenshtein Distance & Similarity Algorithms
// ============================================

/**
 * Calculate Levenshtein distance between two strings
 * Time complexity: O(m*n) where m, n are string lengths
 * Space complexity: O(m*n) - can be optimized to O(min(m,n))
 *
 * @param str1 First string
 * @param str2 Second string
 * @returns Number of edits (insertions, deletions, substitutions) needed
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create 2D matrix
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix using dynamic programming
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 * 1.0 = identical, 0.0 = completely different
 *
 * Formula: 1 - (distance / max_length)
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 && str2.length === 0) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);

  return 1 - distance / maxLength;
}

/**
 * Normalize string for comparison
 * - Convert to lowercase
 * - Remove accents/diacritics
 * - Remove extra whitespace
 * - Trim
 */
export function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/['']/g, "'")            // Normalize quotes
    .replace(/\s+/g, ' ')             // Collapse whitespace
    .trim();
}

/**
 * Calculate normalized similarity (with preprocessing)
 * This is the recommended function for comparing business line names
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeForComparison(str1);
  const normalized2 = normalizeForComparison(str2);

  return levenshteinSimilarity(normalized1, normalized2);
}

/**
 * Jaro-Winkler similarity (alternative algorithm, better for short strings)
 * Returns value between 0 and 1 (1 = identical)
 */
export function jaroWinklerSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  // Jaro distance calculation
  const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  const str1Matches = new Array(str1.length).fill(false);
  const str2Matches = new Array(str2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Identify matches
  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, str2.length);

    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / str1.length +
     matches / str2.length +
     (matches - transpositions / 2) / matches) / 3;

  // Winkler modification (prefix bonus)
  const prefixLength = Math.min(4, Math.min(str1.length, str2.length));
  let prefix = 0;
  for (let i = 0; i < prefixLength; i++) {
    if (str1[i] === str2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Find best match from array of candidates
 * Returns the candidate with highest similarity score above threshold
 */
export function findBestMatch(
  target: string,
  candidates: string[],
  threshold: number = 0.8
): { match: string; similarity: number } | null {
  let bestMatch: string | null = null;
  let bestSimilarity = 0;

  for (const candidate of candidates) {
    const similarity = calculateSimilarity(target, candidate);

    if (similarity > bestSimilarity && similarity >= threshold) {
      bestSimilarity = similarity;
      bestMatch = candidate;
    }
  }

  return bestMatch
    ? { match: bestMatch, similarity: bestSimilarity }
    : null;
}

/**
 * Group similar strings together
 * Returns array of groups, each containing similar strings
 */
export function groupSimilarStrings(
  strings: string[],
  threshold: number = 0.85
): string[][] {
  const groups: string[][] = [];
  const processed = new Set<string>();

  for (const str of strings) {
    if (processed.has(str)) continue;

    const group = [str];
    processed.add(str);

    for (const other of strings) {
      if (processed.has(other)) continue;

      const similarity = calculateSimilarity(str, other);
      if (similarity >= threshold) {
        group.push(other);
        processed.add(other);
      }
    }

    groups.push(group);
  }

  return groups;
}

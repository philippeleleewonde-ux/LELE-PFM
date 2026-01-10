// ============================================
// YEAR DETECTOR - Extract years from data
// ============================================

/**
 * Extract year from various formats
 * Supports: 2024, "2024", "FY2024", "Année 2024", etc.
 */
export function extractYear(value: any): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  // If already a number in valid range
  if (typeof value === 'number') {
    if (isValidYear(value)) {
      return value;
    }
    return null;
  }

  // Convert to string and try to extract year
  const str = String(value).trim();

  // Try to find 4-digit year pattern
  const yearPattern = /\b(20\d{2}|19\d{2})\b/;
  const match = str.match(yearPattern);

  if (match) {
    const year = parseInt(match[1], 10);
    if (isValidYear(year)) {
      return year;
    }
  }

  return null;
}

/**
 * Check if year is valid (between 1900 and current year + 10)
 */
export function isValidYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return year >= 1900 && year <= currentYear + 10;
}

/**
 * Check if year is in the target range (N-5 to N-1)
 */
export function isInTargetRange(year: number): boolean {
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 5; // N-5
  const maxYear = currentYear - 1; // N-1

  return year >= minYear && year <= maxYear;
}

/**
 * Get the target year range
 */
export function getTargetYearRange(): { min: number; max: number; years: number[] } {
  const currentYear = new Date().getFullYear();
  const min = currentYear - 5; // N-5
  const max = currentYear - 1; // N-1

  const years: number[] = [];
  for (let y = max; y >= min; y--) {
    years.push(y);
  }

  return { min, max, years };
}

/**
 * Format year for display (e.g., "2024" or "FY 2024")
 */
export function formatYear(year: number, format: 'simple' | 'fiscal' = 'simple'): string {
  if (format === 'fiscal') {
    return `FY ${year}`;
  }
  return year.toString();
}

/**
 * Get year label (N-1, N-2, etc.)
 */
export function getYearLabel(year: number): string {
  const currentYear = new Date().getFullYear();
  const diff = currentYear - year;

  if (diff === 0) return 'N';
  if (diff === 1) return 'N-1';
  if (diff === 2) return 'N-2';
  if (diff === 3) return 'N-3';
  if (diff === 4) return 'N-4';
  if (diff === 5) return 'N-5';

  return `N-${diff}`;
}

/**
 * Batch extract years from multiple values
 */
export function extractYears(values: any[]): number[] {
  return values
    .map(extractYear)
    .filter((year): year is number => year !== null);
}

/**
 * Find years in target range from array of values
 */
export function findTargetYears(values: any[]): number[] {
  return extractYears(values).filter(isInTargetRange);
}

// ============================================
// KEYWORD MATCHER - Fuzzy Search Engine
// ============================================

import Fuse from 'fuse.js';
import { KEYWORD_DATABASE, FinancialCategory } from '../types';

/**
 * Match result with confidence score
 */
export interface KeywordMatch {
  category: FinancialCategory;
  keyword: string;
  confidence: number; // 0-1
  matchedText: string;
}

/**
 * Normalize text for better matching
 * - Remove accents
 * - Lowercase
 * - Trim whitespace
 * - Normalize quotes
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/['']/g, '\'') // Normalize quotes
    .trim();
}

/**
 * Create Fuse.js instance for fuzzy matching
 */
function createFuseInstance(keywords: readonly string[], threshold: number = 0.3) {
  return new Fuse(
    keywords.map(k => ({ keyword: k })),
    {
      keys: ['keyword'],
      threshold, // 0 = exact match, 1 = match anything
      ignoreLocation: true, // Don't care where in string the match is
      includeScore: true,
      minMatchCharLength: 2,
      shouldSort: true,
      useExtendedSearch: false,
      // Custom function to normalize text before matching
      getFn: (obj, path) => {
        const value = Fuse.config.getFn(obj, path);
        if (typeof value === 'string') {
          return normalizeText(value);
        }
        return value;
      }
    }
  );
}

/**
 * Generic function to match text against a specific category's keywords
 */
function matchCategory(
  text: string,
  category: FinancialCategory,
  keywords: readonly string[],
  threshold: number = 0.3
): KeywordMatch | null {
  const normalizedText = normalizeText(text);
  const fuse = createFuseInstance(keywords, threshold);

  const results = fuse.search(normalizedText);

  if (results.length > 0 && results[0].score !== undefined) {
    const bestMatch = results[0];
    return {
      category,
      keyword: bestMatch.item.keyword,
      confidence: 1 - bestMatch.score, // Fuse returns lower score = better match
      matchedText: text
    };
  }

  return null;
}

/**
 * Main matcher function - tries ALL categories and returns the best match
 * Now supports 10 categories: revenue, expenses, credit_risk, market_risk, liquidity_risk,
 * operational_risk, solvency_risk, underwriting_risk, hr_indicators, organizational_risk
 */
export function matchKeyword(text: string, threshold: number = 0.3): KeywordMatch | null {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return null;
  }

  // Try to match against ALL categories
  const allMatches: KeywordMatch[] = [
    matchCategory(text, 'revenue', KEYWORD_DATABASE.revenue, threshold),
    matchCategory(text, 'expenses', KEYWORD_DATABASE.expenses, threshold),
    matchCategory(text, 'credit_risk', KEYWORD_DATABASE.credit_risk, threshold),
    matchCategory(text, 'market_risk', KEYWORD_DATABASE.market_risk, threshold),
    matchCategory(text, 'liquidity_risk', KEYWORD_DATABASE.liquidity_risk, threshold),
    matchCategory(text, 'operational_risk', KEYWORD_DATABASE.operational_risk, threshold),
    matchCategory(text, 'solvency_risk', KEYWORD_DATABASE.solvency_risk, threshold),
    matchCategory(text, 'underwriting_risk', KEYWORD_DATABASE.underwriting_risk, threshold),
    matchCategory(text, 'hr_indicators', KEYWORD_DATABASE.hr_indicators, threshold),
    matchCategory(text, 'organizational_risk', KEYWORD_DATABASE.organizational_risk, threshold)
  ].filter((match): match is KeywordMatch => match !== null);

  // Return the match with highest confidence
  if (allMatches.length === 0) {
    return null;
  }

  // Sort by confidence (descending) and return the best
  allMatches.sort((a, b) => b.confidence - a.confidence);
  return allMatches[0];
}

/**
 * Batch match multiple texts
 */
export function matchKeywords(texts: string[], threshold: number = 0.3): KeywordMatch[] {
  return texts
    .map(text => matchKeyword(text, threshold))
    .filter((match): match is KeywordMatch => match !== null);
}

/**
 * Test if text contains any financial keyword
 */
export function containsFinancialKeyword(text: string, threshold: number = 0.3): boolean {
  return matchKeyword(text, threshold) !== null;
}

/**
 * Get all possible keywords for a category
 */
export function getKeywordsForCategory(category: FinancialCategory): readonly string[] {
  return KEYWORD_DATABASE[category];
}

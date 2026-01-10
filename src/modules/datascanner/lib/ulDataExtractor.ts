/**
 * UL Data Extractor - Unexpected Loss Multi-Year Analysis
 *
 * This module extracts and aggregates Unexpected Loss (UL) amounts over 5 years
 * from regulatory banking reports (Pillar 3, URD, ICAAP).
 *
 * Key Features:
 * - Extract UL amounts from Pillar 3 Disclosure reports
 * - Distinguish UL from EL (Expected Loss)
 * - Break down by risk type (Credit, Market, Operational)
 * - Multi-year aggregation (N to N-4)
 * - Multiple cumulative methods (average, max, sum, trend)
 * - Validation and coherence checks
 *
 * Phase: 2.8 (UL Data Extraction)
 * Date: 2025-11-23
 * Skill: Elite SaaS Developer
 */

/**
 * Document types that may contain UL data
 */
export enum ULDocumentType {
  PILLAR3 = 'Pillar 3 Disclosure',
  URD = 'URD (Universal Registration Document)',
  ICAAP = 'ICAAP Report',
  INVESTOR_PRESENTATION = 'Investor Presentation',
  UNKNOWN = 'Unknown'
}

/**
 * Risk types for UL breakdown
 */
export enum RiskType {
  CREDIT = 'Credit Risk',
  MARKET = 'Market Risk',
  OPERATIONAL = 'Operational Risk',
  OTHER = 'Other Risks'
}

/**
 * UL extraction result for a single year
 */
export interface ULExtractionResult {
  // Document classification
  documentType: ULDocumentType;
  fiscalYear: number;              // 2024, 2023, etc.
  fiscalYearLabel: string;         // 'N', 'N-1', 'N-2', 'N-3', 'N-4'
  closingDate?: Date;              // Fiscal year closing date

  // UL amounts by risk type (in millions €)
  ulByRiskType: {
    credit: number;
    market: number;
    operational: number;
    other: number;
    total: number;
  };

  // Currency
  currency: string;                // 'EUR', 'USD', etc.

  // Extraction metadata
  source: string;                  // "Pilier 3 2024, page 45"
  pageNumber?: number;
  extractionMethod: 'direct_text' | 'table_aggregation' | 'calculated';
  confidence: number;              // 0-1

  // Validation
  isCoherent: boolean;             // Sum of risk types = total
  coherenceDeviation?: number;     // Deviation percentage if not coherent
  rwaAssociated?: number;          // Risk-Weighted Assets (for cross-check)
  validationMessages: string[];
}

/**
 * 5-year UL summary with all aggregation methods
 */
export interface UL5YearSummary {
  // Time period
  startYear: number;               // N-4 (e.g., 2020)
  endYear: number;                 // N (e.g., 2024)
  currentYear: number;             // Reference year for N-X labels
  yearsWithData: number;           // 1-5
  missingYears: number[];
  completeness: number;            // 0-1 (yearsWithData / 5)

  // Annual data
  yearlyUL: {
    [year: number]: ULExtractionResult;
  };

  // Aggregated metrics
  metrics: {
    // ✅ Average (RECOMMENDED)
    averageUL: number;
    medianUL: number;

    // ✅ Min/Max (RELEVANT)
    minUL: { year: number; yearLabel: string; amount: number };
    maxUL: { year: number; yearLabel: string; amount: number };

    // ✅ Evolution (ANALYTICAL)
    absoluteVariation: number;     // UL_N - UL_N-4
    relativeVariation: number;     // %
    cagr: number;                  // Compound Annual Growth Rate (%)

    // ⚠️ Arithmetic Sum (ECONOMICALLY IRRELEVANT - with warning)
    arithmeticSum: number;
    arithmeticSumWarning: string;

    // Volatility
    standardDeviation: number;
    coefficientOfVariation: number; // CV = std / mean

    // Trend
    trend: 'Increasing' | 'Decreasing' | 'Stable';
  };

  // Risk breakdown (average over 5 years)
  averageRiskBreakdown: {
    credit: { amount: number; percentage: number };
    market: { amount: number; percentage: number };
    operational: { amount: number; percentage: number };
    other: { amount: number; percentage: number };
  };

  // Data quality
  dataQuality: {
    avgConfidence: number;
    yearsWithHighConfidence: number; // confidence >= 0.8
    hasCoherenceIssues: boolean;
    temporalAnomalies: string[];     // Year-to-year variations > 30%
    validationStatus: 'valid' | 'warning' | 'error';
  };
}

/**
 * Configuration for UL extraction
 */
export interface ULExtractionConfig {
  /**
   * Current fiscal year (for N-X labels)
   * Default: current year
   */
  currentYear?: number;

  /**
   * Minimum confidence threshold
   * Default: 0.6
   */
  confidenceThreshold?: number;

  /**
   * Enable validation checks
   * Default: true
   */
  enableValidation?: boolean;

  /**
   * Expected UL range (millions €) for plausibility check
   * Default: { min: 50, max: 50000 }
   */
  plausibilityRange?: {
    min: number;
    max: number;
  };

  /**
   * Maximum acceptable year-to-year variation (%)
   * Default: 30
   */
  maxYearVariation?: number;

  /**
   * Currency to normalize to
   * Default: 'EUR'
   */
  targetCurrency?: string;

  /**
   * Verbose logging
   * Default: false
   */
  verbose?: boolean;

  /**
   * Language priority for pattern matching
   * Default: ['fr', 'en']
   */
  languages?: string[];
}

const DEFAULT_UL_CONFIG: ULExtractionConfig = {
  currentYear: new Date().getFullYear(),
  confidenceThreshold: 0.6,
  enableValidation: true,
  plausibilityRange: { min: 50, max: 50000 },
  maxYearVariation: 30,
  targetCurrency: 'EUR',
  verbose: false,
  languages: ['fr', 'en']
};

/**
 * French patterns for UL extraction
 */
const FR_PATTERNS = {
  // UL direct mentions
  unexpected_loss: [
    /(?:unexpected\s+loss|UL)\s*(?:totale?)?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€|millions?|milliards?)/gi,
    /pertes?\s+inattendues?\s*(?:totales?)?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€|millions?|milliards?)/gi,
    /UL\s+totale?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
    /montant\s+(?:d[''])?UL\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi
  ],

  // Economic Capital (proxy for UL)
  economic_capital: [
    /capital\s+économique\s*(?:total)?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€|millions?|milliards?)/gi,
    /capital\s+de\s+risque\s+alloué\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
    /VaR\s+économique\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
    /economic\s+capital\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi
  ],

  // Risk types
  risk_types: {
    credit: [
      /(?:risque\s+de\s+)?crédit\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /UL\s+crédit\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /credit\s+risk\s+UL\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi
    ],
    market: [
      /(?:risque\s+de\s+)?marché\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /UL\s+marché\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /market\s+risk\s+UL\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi
    ],
    operational: [
      /(?:risque\s+)?opérationnel\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /UL\s+opérationnel\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /operational\s+risk\s+UL\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi
    ]
  },

  // Exclusion patterns (to avoid EL confusion)
  exclusions: [
    /expected\s+loss/gi,
    /pertes?\s+attendues?/gi,
    /provisions?\s+pour\s+pertes?/gi,
    /\bEL\s*:/gi,
    /coût\s+du\s+risque/gi
  ]
};

/**
 * English patterns for UL extraction
 */
const EN_PATTERNS = {
  unexpected_loss: [
    /total\s+unexpected\s+loss\s*:?\s*([0-9\s,.]+)\s*([€$£])?\s*([MB]|millions?|billions?)/gi,
    /UL\s+total\s*:?\s*([0-9\s,.]+)\s*([€$£])?\s*([MB]|millions?|billions?)/gi,
    /unexpected\s+loss\s+amount\s*:?\s*([0-9\s,.]+)\s*([€$£])?\s*([MB])/gi
  ],

  economic_capital: [
    /economic\s+capital\s*:?\s*([0-9\s,.]+)\s*([€$£])?\s*([MB]|millions?|billions?)/gi,
    /economic\s+VaR\s*:?\s*([0-9\s,.]+)\s*([€$£])?\s*([MB])/gi,
    /capital[-\s]at[-\s]risk\s*:?\s*([0-9\s,.]+)\s*([€$£])?\s*([MB])/gi,
    /risk\s+capital\s*:?\s*([0-9\s,.]+)\s*([€$£])?\s*([MB])/gi
  ],

  risk_types: {
    credit: [
      /credit\s+risk\s+UL\s*:?\s*([0-9\s,.]+)\s*([€$£])?\s*([MB])/gi,
      /UL\s+credit\s*:?\s*([0-9\s,.]+)\s*([€$£])?\s*([MB])/gi
    ],
    market: [
      /market\s+risk\s+UL\s*:?\s*([0-9\s,.]+)\s*([€$£])?\s*([MB])/gi,
      /UL\s+market\s*:?\s*([0-9\s,.]+)\s*([€$£])?\s*([MB])/gi
    ],
    operational: [
      /operational\s+risk\s+UL\s*:?\s*([0-9\s,.]+)\s*([€$£])?\s*([MB])/gi,
      /UL\s+operational\s*:?\s*([0-9\s,.]+)\s*([€$£])?\s*([MB])/gi
    ]
  },

  exclusions: [
    /expected\s+loss/gi,
    /provisions?\s+for\s+losses?/gi,
    /\bEL\s*:/gi,
    /cost\s+of\s+risk/gi
  ]
};

/**
 * Document type detection patterns
 */
const DOCUMENT_TYPE_PATTERNS = {
  [ULDocumentType.PILLAR3]: [
    /pillar\s+3/gi,
    /pilier\s+3/gi,
    /disclosure\s+report/gi,
    /capital\s+requirements?\s+disclosure/gi,
    /exigences?\s+en\s+fonds\s+propres/gi,
    /regulatory\s+disclosure/gi
  ],

  [ULDocumentType.URD]: [
    /document\s+d'enregistrement\s+universel/gi,
    /URD/g,
    /universal\s+registration\s+document/gi,
    /annual\s+financial\s+report/gi
  ],

  [ULDocumentType.ICAAP]: [
    /ICAAP/g,
    /internal\s+capital\s+adequacy\s+assessment/gi,
    /adéquation\s+des\s+fonds\s+propres\s+internes/gi,
    /capital\s+adequacy/gi
  ],

  [ULDocumentType.INVESTOR_PRESENTATION]: [
    /investor\s+presentation/gi,
    /présentation\s+(?:aux\s+)?investisseurs/gi,
    /capital\s+management/gi,
    /risk\s+profile/gi,
    /financial\s+highlights/gi
  ]
};

/**
 * Parse number from various formats
 */
function parseAmount(value: string, unit: string): number {
  // Remove spaces and handle both comma and period as decimal separator
  const cleaned = value.replace(/\s/g, '').replace(/,/g, '');
  let amount = parseFloat(cleaned);

  if (isNaN(amount)) return 0;

  // Convert to millions €
  const unitLower = unit.toLowerCase();
  if (unitLower.includes('mds') || unitLower.includes('bn') || unitLower.includes('b€') || unitLower.includes('milliard')) {
    amount *= 1000; // Billions to millions
  } else if (unitLower.includes('k€') || unitLower.includes('thousand')) {
    amount /= 1000; // Thousands to millions
  }

  return amount;
}

/**
 * Calculate year label (N, N-1, N-2, etc.)
 */
function getYearLabel(year: number, currentYear: number): string {
  const diff = currentYear - year;
  if (diff === 0) return 'N';
  if (diff === 1) return 'N-1';
  if (diff === 2) return 'N-2';
  if (diff === 3) return 'N-3';
  if (diff === 4) return 'N-4';
  if (diff > 4) return `N-${diff}`;
  return `N+${Math.abs(diff)}`;
}

/**
 * Detect document type from text
 */
export function detectULDocumentType(text: string): {
  type: ULDocumentType;
  confidence: number;
} {
  const scores: { type: ULDocumentType; score: number }[] = [];

  for (const [type, patterns] of Object.entries(DOCUMENT_TYPE_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length;
      }
    }
    if (score > 0) {
      scores.push({ type: type as ULDocumentType, score });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0) {
    return { type: ULDocumentType.UNKNOWN, confidence: 0 };
  }

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const confidence = scores[0].score / totalScore;

  return { type: scores[0].type, confidence };
}

/**
 * Extract fiscal year from text context
 */
function extractFiscalYear(text: string, matchIndex: number, currentYear: number): number {
  // Look for year indicators in surrounding text (±300 chars)
  const contextStart = Math.max(0, matchIndex - 300);
  const contextEnd = Math.min(text.length, matchIndex + 300);
  const context = text.substring(contextStart, contextEnd);

  // Check for explicit year (2022, 2023, 2024, etc.)
  const yearMatch = context.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    // Only accept recent years (within last 10 years)
    if (year >= currentYear - 10 && year <= currentYear) {
      return year;
    }
  }

  // Check for N-X labels
  if (/N-1|année\s+précédente|previous\s+year|prior\s+year/i.test(context)) {
    return currentYear - 1;
  }
  if (/N-2|(?:il\s+y\s+a\s+)?2\s+ans|2\s+years\s+ago/i.test(context)) {
    return currentYear - 2;
  }
  if (/N-3|(?:il\s+y\s+a\s+)?3\s+ans|3\s+years\s+ago/i.test(context)) {
    return currentYear - 3;
  }
  if (/N-4|(?:il\s+y\s+a\s+)?4\s+ans|4\s+years\s+ago/i.test(context)) {
    return currentYear - 4;
  }

  // Default to current year - 1 (most common in reports published in year N)
  return currentYear - 1;
}

/**
 * Check if text contains EL (Expected Loss) to avoid confusion
 */
function isExpectedLoss(text: string, matchIndex: number): boolean {
  const contextStart = Math.max(0, matchIndex - 100);
  const contextEnd = Math.min(text.length, matchIndex + 100);
  const context = text.substring(contextStart, contextEnd);

  const exclusionPatterns = [...FR_PATTERNS.exclusions, ...EN_PATTERNS.exclusions];

  for (const pattern of exclusionPatterns) {
    if (pattern.test(context)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract UL data from text
 */
export function extractULFromText(
  text: string,
  config: ULExtractionConfig = DEFAULT_UL_CONFIG
): ULExtractionResult | null {
  const finalConfig = { ...DEFAULT_UL_CONFIG, ...config };
  const currentYear = finalConfig.currentYear!;

  if (finalConfig.verbose) {
    }

  // Detect document type
  const docType = detectULDocumentType(text);

  const ulData: Partial<ULExtractionResult> = {
    documentType: docType.type,
    ulByRiskType: {
      credit: 0,
      market: 0,
      operational: 0,
      other: 0,
      total: 0
    },
    currency: 'EUR',
    validationMessages: []
  };

  // Select patterns based on language priority
  const patternSets = finalConfig.languages!.map(lang => {
    if (lang === 'fr') return { lang: 'fr', patterns: FR_PATTERNS };
    if (lang === 'en') return { lang: 'en', patterns: EN_PATTERNS };
    return null;
  }).filter(Boolean) as { lang: string; patterns: typeof FR_PATTERNS }[];

  let totalFound = false;
  let fiscalYear = currentYear - 1; // Default

  // Extract total UL
  for (const { patterns } of patternSets) {
    for (const pattern of [...patterns.unexpected_loss, ...patterns.economic_capital]) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        // Skip if it's actually EL
        if (isExpectedLoss(text, match.index)) continue;

        const amount = parseAmount(match[1], match[2]);
        if (amount > 0) {
          ulData.ulByRiskType!.total = amount;
          ulData.source = match[0];
          ulData.extractionMethod = 'direct_text';
          ulData.confidence = 0.9;
          fiscalYear = extractFiscalYear(text, match.index, currentYear);
          totalFound = true;
          break;
        }
      }
      if (totalFound) break;
    }
    if (totalFound) break;
  }

  // Extract by risk type
  for (const { patterns } of patternSets) {
    for (const [riskType, riskPatterns] of Object.entries(patterns.risk_types)) {
      for (const pattern of riskPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          if (isExpectedLoss(text, match.index)) continue;

          const amount = parseAmount(match[1], match[2]);
          if (amount > 0) {
            ulData.ulByRiskType![riskType as keyof typeof ulData.ulByRiskType] = amount;
          }
        }
      }
    }
  }

  // If no total found but risk types found, calculate total
  if (!totalFound && (ulData.ulByRiskType!.credit > 0 || ulData.ulByRiskType!.market > 0 || ulData.ulByRiskType!.operational > 0)) {
    ulData.ulByRiskType!.total =
      ulData.ulByRiskType!.credit +
      ulData.ulByRiskType!.market +
      ulData.ulByRiskType!.operational +
      ulData.ulByRiskType!.other;
    ulData.extractionMethod = 'table_aggregation';
    ulData.confidence = 0.85;
  }

  // If nothing found, return null
  if (ulData.ulByRiskType!.total === 0) {
    return null;
  }

  // Complete the result
  ulData.fiscalYear = fiscalYear;
  ulData.fiscalYearLabel = getYearLabel(fiscalYear, currentYear);

  // Validate coherence
  const sum = ulData.ulByRiskType!.credit + ulData.ulByRiskType!.market + ulData.ulByRiskType!.operational + ulData.ulByRiskType!.other;
  const tolerance = ulData.ulByRiskType!.total * 0.02; // 2% tolerance
  ulData.isCoherent = Math.abs(sum - ulData.ulByRiskType!.total) <= tolerance;

  if (!ulData.isCoherent && sum > 0) {
    ulData.coherenceDeviation = Math.abs(sum - ulData.ulByRiskType!.total) / ulData.ulByRiskType!.total;
    ulData.validationMessages!.push(
      `⚠️ Incohérence interne: somme des risques (${sum.toFixed(0)}M€) ≠ total (${ulData.ulByRiskType!.total.toFixed(0)}M€)`
    );
  }

  // Plausibility check
  if (finalConfig.enableValidation) {
    const { min, max } = finalConfig.plausibilityRange!;
    if (ulData.ulByRiskType!.total < min || ulData.ulByRiskType!.total > max) {
      ulData.validationMessages!.push(
        `⚠️ Montant hors plage attendue (${min}-${max}M€): ${ulData.ulByRiskType!.total.toFixed(0)}M€`
      );
    }
  }

  if (finalConfig.verbose) {
    }M€ (${ulData.fiscalYearLabel})`);
  }

  return ulData as ULExtractionResult;
}

/**
 * Aggregate UL data over 5 years
 */
export function aggregate5YearUL(
  yearlyResults: ULExtractionResult[],
  config: ULExtractionConfig = DEFAULT_UL_CONFIG
): UL5YearSummary {
  const finalConfig = { ...DEFAULT_UL_CONFIG, ...config };
  const currentYear = finalConfig.currentYear!;

  // Sort by year descending
  const sorted = [...yearlyResults].sort((a, b) => b.fiscalYear - a.fiscalYear);

  // Build yearlyUL map
  const yearlyUL: { [year: number]: ULExtractionResult } = {};
  sorted.forEach(result => {
    yearlyUL[result.fiscalYear] = result;
  });

  // Determine range
  const years = sorted.map(r => r.fiscalYear);
  const startYear = Math.min(...years);
  const endYear = Math.max(...years);

  // Find missing years in range
  const expectedYears = Array.from({ length: 5 }, (_, i) => currentYear - i).filter(y => y >= startYear && y <= endYear);
  const missingYears = expectedYears.filter(y => !years.includes(y));

  // Calculate metrics
  const ulAmounts = sorted.map(r => r.ulByRiskType.total);

  const sum = ulAmounts.reduce((a, b) => a + b, 0);
  const avg = sum / ulAmounts.length;
  const sortedAmounts = [...ulAmounts].sort((a, b) => a - b);
  const median = sortedAmounts.length % 2 === 0
    ? (sortedAmounts[sortedAmounts.length / 2 - 1] + sortedAmounts[sortedAmounts.length / 2]) / 2
    : sortedAmounts[Math.floor(sortedAmounts.length / 2)];

  const minResult = sorted.reduce((min, r) => r.ulByRiskType.total < min.ulByRiskType.total ? r : min);
  const maxResult = sorted.reduce((max, r) => r.ulByRiskType.total > max.ulByRiskType.total ? r : max);

  // Evolution (oldest to newest)
  const oldestYear = sorted[sorted.length - 1];
  const newestYear = sorted[0];
  const absoluteVariation = newestYear.ulByRiskType.total - oldestYear.ulByRiskType.total;
  const relativeVariation = (absoluteVariation / oldestYear.ulByRiskType.total) * 100;

  // CAGR
  const numYears = newestYear.fiscalYear - oldestYear.fiscalYear;
  const cagr = numYears > 0
    ? (Math.pow(newestYear.ulByRiskType.total / oldestYear.ulByRiskType.total, 1 / numYears) - 1) * 100
    : 0;

  // Standard deviation
  const variance = ulAmounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / ulAmounts.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / avg) * 100;

  // Trend
  let trend: 'Increasing' | 'Decreasing' | 'Stable' = 'Stable';
  if (relativeVariation > 5) trend = 'Increasing';
  else if (relativeVariation < -5) trend = 'Decreasing';

  // Average risk breakdown
  const avgCredit = sorted.reduce((sum, r) => sum + r.ulByRiskType.credit, 0) / sorted.length;
  const avgMarket = sorted.reduce((sum, r) => sum + r.ulByRiskType.market, 0) / sorted.length;
  const avgOps = sorted.reduce((sum, r) => sum + r.ulByRiskType.operational, 0) / sorted.length;
  const avgOther = sorted.reduce((sum, r) => sum + r.ulByRiskType.other, 0) / sorted.length;
  const avgTotal = avgCredit + avgMarket + avgOps + avgOther;

  // Data quality
  const avgConfidence = sorted.reduce((sum, r) => sum + r.confidence, 0) / sorted.length;
  const highConfidence = sorted.filter(r => r.confidence >= 0.8).length;
  const hasCoherenceIssues = sorted.some(r => !r.isCoherent);

  // Temporal anomalies
  const temporalAnomalies: string[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const variation = Math.abs((current.ulByRiskType.total / next.ulByRiskType.total) - 1) * 100;

    if (variation > finalConfig.maxYearVariation!) {
      temporalAnomalies.push(
        `⚠️ Variation anormale ${next.fiscalYear} → ${current.fiscalYear}: ${variation.toFixed(1)}%`
      );
    }
  }

  const validationStatus: 'valid' | 'warning' | 'error' =
    hasCoherenceIssues || temporalAnomalies.length > 0 ? 'warning' :
    avgConfidence < 0.6 ? 'error' : 'valid';

  return {
    startYear,
    endYear,
    currentYear,
    yearsWithData: sorted.length,
    missingYears,
    completeness: sorted.length / 5,
    yearlyUL,
    metrics: {
      averageUL: avg,
      medianUL: median,
      minUL: {
        year: minResult.fiscalYear,
        yearLabel: minResult.fiscalYearLabel,
        amount: minResult.ulByRiskType.total
      },
      maxUL: {
        year: maxResult.fiscalYear,
        yearLabel: maxResult.fiscalYearLabel,
        amount: maxResult.ulByRiskType.total
      },
      absoluteVariation,
      relativeVariation,
      cagr,
      arithmeticSum: sum,
      arithmeticSumWarning: '⚠️ La somme arithmétique des UL n\'a pas de sens économique (UL = mesure de risque instantanée)',
      standardDeviation: stdDev,
      coefficientOfVariation: cv,
      trend
    },
    averageRiskBreakdown: {
      credit: { amount: avgCredit, percentage: avgTotal > 0 ? (avgCredit / avgTotal) * 100 : 0 },
      market: { amount: avgMarket, percentage: avgTotal > 0 ? (avgMarket / avgTotal) * 100 : 0 },
      operational: { amount: avgOps, percentage: avgTotal > 0 ? (avgOps / avgTotal) * 100 : 0 },
      other: { amount: avgOther, percentage: avgTotal > 0 ? (avgOther / avgTotal) * 100 : 0 }
    },
    dataQuality: {
      avgConfidence,
      yearsWithHighConfidence: highConfidence,
      hasCoherenceIssues,
      temporalAnomalies,
      validationStatus
    }
  };
}

/**
 * Format 5-year summary as text
 */
export function formatUL5YearSummary(summary: UL5YearSummary): string {
  const lines: string[] = [];

  lines.push('\n╔════════════════════════════════════════════════════════════╗');
  lines.push('║  SYNTHÈSE UNEXPECTED LOSS SUR 5 ANS                       ║');
  lines.push('╠════════════════════════════════════════════════════════════╣');
  lines.push(`║  Période : ${summary.startYear} - ${summary.endYear} (${summary.yearsWithData}/5 années)              ║`);
  lines.push('║                                                            ║');
  lines.push('║  📊 MÉTRIQUES CENTRALES                                    ║');
  lines.push(`║  • UL Moyenne    : ${summary.metrics.averageUL.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} M€`.padEnd(60) + '║');
  lines.push(`║  • UL Médiane    : ${summary.metrics.medianUL.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} M€`.padEnd(60) + '║');
  lines.push(`║  • Écart-type    : ${summary.metrics.standardDeviation.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} M€ (CV: ${summary.metrics.coefficientOfVariation.toFixed(1)}%)`.padEnd(60) + '║');
  lines.push('║                                                            ║');
  lines.push('║  📈 BORNES D\'EXPOSITION                                    ║');
  lines.push(`║  • UL Minimale   : ${summary.metrics.minUL.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} M€ (${summary.metrics.minUL.year})`.padEnd(60) + '║');
  lines.push(`║  • UL Maximale   : ${summary.metrics.maxUL.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} M€ (${summary.metrics.maxUL.year})`.padEnd(60) + '║');
  lines.push('║                                                            ║');
  lines.push('║  🔄 ÉVOLUTION                                              ║');
  lines.push(`║  • Variation     : ${summary.metrics.absoluteVariation >= 0 ? '+' : ''}${summary.metrics.absoluteVariation.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} M€ (${summary.metrics.relativeVariation >= 0 ? '+' : ''}${summary.metrics.relativeVariation.toFixed(1)}%)`.padEnd(60) + '║');
  lines.push(`║  • TCAM          : ${summary.metrics.cagr >= 0 ? '+' : ''}${summary.metrics.cagr.toFixed(1)}% par an`.padEnd(60) + '║');
  lines.push(`║  • Tendance      : ${summary.metrics.trend}`.padEnd(60) + '║');
  lines.push('║                                                            ║');
  lines.push('║  ⚠️  SOMME ARITHMÉTIQUE (non pertinente)                  ║');
  lines.push(`║     ${summary.metrics.arithmeticSum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} M€`.padEnd(60) + '║');
  lines.push('╚════════════════════════════════════════════════════════════╝');

  return lines.join('\n');
}

/**
 * Get recommended UL metric for questionnaire
 */
export function getRecommendedULMetric(summary: UL5YearSummary): {
  metric: 'average' | 'max' | 'evolution';
  value: number;
  label: string;
  rationale: string;
} {
  // For most banking use cases, average is recommended
  return {
    metric: 'average',
    value: summary.metrics.averageUL,
    label: `UL Moyenne ${summary.startYear}-${summary.endYear}`,
    rationale: 'Exposition moyenne au risque sur la période (métrique la plus pertinente économiquement)'
  };
}

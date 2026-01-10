/**
 * Settlement Risk / Market Risk - Payment & Transaction Processing Losses Extractor
 *
 * Phase 2.11: Extracts settlement and payment processing losses over 5 years
 *
 * CRITICAL DISTINCTION:
 * - Settlement Risk (Category 7 Basel II) = Operational Risk subcategory
 *   → Errors in processing payments, settling transactions, delivery failures
 * - Market Risk (traditional) = Price fluctuations (rates, FX, equities)
 *   → VaR, Stressed VaR, trading book losses
 *
 * This extractor focuses on SETTLEMENT RISK (Basel II Category 7):
 * "Execution, Delivery and Process Management"
 *
 * 5 Error Sub-Types:
 * 1. Transaction Entry Errors (Erreurs de saisie)
 * 2. Settlement-Delivery Failures (Échecs règlement-livraison)
 * 3. Payment Processing Errors (Erreurs traitement paiements)
 * 4. Counterparty Disputes (Litiges contreparties)
 * 5. Other Execution Errors (Autres erreurs exécution)
 *
 * Data Sources:
 * - Pillar 3 Disclosure - Operational Risk section (Category 7)
 * - Annual Reports - Notes on operational losses
 * - Risk Reports - Settlement risk disclosures
 *
 * Aggregation Method:
 * - 5-Year SUM (economically valid for loss flows)
 * - NOT averaging (these are actual losses, not capital measures)
 *
 * Skill: Elite SaaS Developer
 * Date: 2025-11-24
 *
 * @module settlementRiskExtractor
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration for settlement risk extraction
 */
export interface SettlementRiskConfig {
  currentYear: number;
  yearsToExtract: number;
  minConfidence: number;

  // Distinction: OpRisk Settlement vs Market Risk Settlement
  extractOpRiskSettlement: boolean;      // Category 7 Basel II (default: true)
  extractMarketRiskSettlement: boolean;  // Market risk settlement component (default: false)

  // Classification detail
  enableErrorTypeClassification: boolean;  // Extract 5 sub-categories

  // Validation
  enableCoherenceValidation: boolean;
  enableBenchmarking: boolean;
  bankSize: 'systemic' | 'large' | 'medium' | 'small';

  // Thresholds
  tolerancePercentage: number;     // For sum validation (default: 5%)
  minPlausibleLoss: number;        // Minimum plausible loss (M€)
  maxPlausibleLoss: number;        // Maximum plausible loss (M€)

  verbose: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_SETTLEMENT_CONFIG: Required<SettlementRiskConfig> = {
  currentYear: new Date().getFullYear() - 1,
  yearsToExtract: 5,
  minConfidence: 0.65,
  extractOpRiskSettlement: true,
  extractMarketRiskSettlement: false,
  enableErrorTypeClassification: true,
  enableCoherenceValidation: true,
  enableBenchmarking: true,
  bankSize: 'large',
  tolerancePercentage: 5,
  minPlausibleLoss: 0.5,
  maxPlausibleLoss: 200,
  verbose: true,
};

/**
 * Settlement risk data for a single year
 */
export interface SettlementRiskData {
  year: number;
  yearLabel: string;  // "N-1", "N-2", etc.

  // 5 error categories (M€) - FLOWS (cumulable)
  transactionEntryErrors: number;      // Erreurs de saisie
  settlementDeliveryFailures: number;  // Échecs règlement-livraison
  paymentProcessingErrors: number;     // Erreurs traitement paiements
  counterpartyDisputes: number;        // Litiges contreparties
  otherExecutionErrors: number;        // Autres erreurs exécution

  // Total Category 7 (Basel II)
  totalCategory7Losses: number;

  // Context (optional)
  totalOperationalRisk?: number;       // Total OpRisk losses for proportion
  transactionVolume?: number;          // Annual transaction volume
  proportionOfOpRisk?: number;         // % of total operational risk

  // Metadata
  confidence: number;
  source: string;
  documentType: 'Pillar3_OpRisk' | 'Pillar3_Market' | 'AnnualReport' | 'RiskReport';
}

/**
 * Error type rating based on severity
 */
export type ErrorTypeRating = 'Excellent' | 'Good' | 'Average' | 'Elevated' | 'High';

/**
 * Settlement risk rating based on average annual losses
 */
export type SettlementRiskRating = 'Excellent' | 'Good' | 'Average' | 'Elevated' | 'Very High';

/**
 * 5-year summary of settlement risk
 */
export interface Settlement5YearSummary {
  // Total cumulative losses (M€)
  totalLosses5Y: number;
  averageAnnual: number;

  // Cumulative by error type (M€)
  byErrorType: {
    transactionEntry: number;
    settlementDelivery: number;
    paymentProcessing: number;
    disputes: number;
    otherExecution: number;
  };

  // Distribution by error type (%)
  byErrorTypePercentage: {
    transactionEntry: number;
    settlementDelivery: number;
    paymentProcessing: number;
    disputes: number;
    otherExecution: number;
  };

  // Evolution analysis
  evolution: {
    absolute: number;           // Change from oldest to most recent year (M€)
    relative: number;           // Percentage change
    direction: 'improvement' | 'deterioration' | 'stable';
    trend: 'decreasing' | 'increasing' | 'stable';
  };

  // Volatility metrics
  volatility: {
    standardDeviation: number;
    coefficientOfVariation: number;  // CV% = (std / mean) * 100
  };

  // Peak year
  peakYear: {
    year: number;
    amount: number;
  };

  // Context
  averageProportionOfOpRisk?: number;  // Average % of operational risk (5-year)

  // Overall rating
  rating: SettlementRiskRating;
  benchmarkComparison: string;
}

/**
 * Validation results
 */
export interface ValidationResult {
  coherenceChecks: {
    sumEqualsTotal: boolean[];      // Sum of sub-categories = total for each year
    plausibilityChecks: string[];   // Plausibility warnings
    yearOverYearVariation: string[]; // Abnormal variations
  };
  opRiskProportion: {
    average: number;
    status: 'normal' | 'low' | 'high';
    message: string;
  };
  benchmarkAnalysis: {
    bankSize: 'systemic' | 'large' | 'medium' | 'small';
    sectorMedian: number;
    vsMedian: number;  // Percentage difference
    status: 'Excellent' | 'Good' | 'Average' | 'Concerning';
  };
  alerts: string[];
}

/**
 * Complete settlement risk extraction result
 */
export interface SettlementRiskResult {
  yearlyData: SettlementRiskData[];
  summary5Year: Settlement5YearSummary;
  yearsExtracted: number[];
  documentType: string;
  confidence: number;
  validation: ValidationResult;
}

// ============================================================================
// REGEX PATTERNS FOR EXTRACTION
// ============================================================================

/**
 * French patterns for settlement risk losses
 */
const SETTLEMENT_PATTERNS_FR = {
  // Category 7 overall
  category7: [
    /catégorie\s+7[:\s]+(?:exécution|livraison|traitement)[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
    /cat(?:\.|égorie)?\s+7[:\s]+(?:pertes?|losses?)[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
    /execution[,\s]+(?:delivery|livraison)\s+(?:and|et)\s+process[:\s]+([\d\s,.]+)\s*M€/gi,
  ],

  // Transaction entry errors
  entryErrors: [
    /erreurs?\s+de\s+saisie[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
    /erreurs?\s+(?:d')?entr[ée]e\s+(?:de\s+)?transactions?[:\s]+([\d\s,.]+)/gi,
    /erreurs?\s+(?:de\s+)?(?:saisie|input|data\s+entry)[:\s]+([\d\s,.]+)/gi,
    /keying\s+errors?[:\s]+([\d\s,.]+)/gi,
  ],

  // Settlement-delivery failures
  settlementFailures: [
    /échecs?\s+(?:de\s+)?règlement[-\s]?livraison[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
    /(?:défaut|échec)s?\s+(?:de\s+)?règlement[:\s]+([\d\s,.]+)/gi,
    /défaillances?\s+(?:de\s+)?livraison[:\s]+([\d\s,.]+)/gi,
    /settlement[-\s]?(?:delivery\s+)?failures?[:\s]+([\d\s,.]+)/gi,
    /failed\s+settlements?[:\s]+([\d\s,.]+)/gi,
    /(?:échecs?|failures?)\s+DvP[:\s]+([\d\s,.]+)/gi,  // Delivery vs Payment
  ],

  // Payment processing errors
  paymentErrors: [
    /erreurs?\s+(?:de\s+)?traitement\s+(?:de\s+)?paiements?[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
    /erreurs?\s+(?:sur\s+)?paiements?[:\s]+([\d\s,.]+)/gi,
    /payment\s+processing\s+errors?[:\s]+([\d\s,.]+)/gi,
    /erreurs?\s+(?:de\s+)?(?:virement|wire)[:\s]+([\d\s,.]+)/gi,
    /défaillances?\s+(?:de\s+)?paiement[:\s]+([\d\s,.]+)/gi,
  ],

  // Counterparty disputes
  disputes: [
    /litiges?\s+(?:avec\s+)?contreparties?[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
    /litiges?\s+(?:de\s+)?règlement[:\s]+([\d\s,.]+)/gi,
    /différends?\s+(?:avec\s+)?contreparties?[:\s]+([\d\s,.]+)/gi,
    /counterparty\s+disputes?[:\s]+([\d\s,.]+)/gi,
    /settlement\s+disputes?[:\s]+([\d\s,.]+)/gi,
  ],

  // Other execution errors
  otherExecution: [
    /autres?\s+(?:erreurs?\s+)?(?:d')?exécution[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
    /autres?\s+(?:erreurs?\s+)?livraison[:\s]+([\d\s,.]+)/gi,
    /autres?\s+(?:erreurs?\s+)?(?:de\s+)?traitement[:\s]+([\d\s,.]+)/gi,
    /other\s+execution\s+errors?[:\s]+([\d\s,.]+)/gi,
    /divers(?:es)?\s+(?:erreurs?\s+)?exécution[:\s]+([\d\s,.]+)/gi,
  ],
};

/**
 * English patterns for settlement risk losses
 */
const SETTLEMENT_PATTERNS_EN = {
  // Category 7 overall
  category7: [
    /category\s+7[:\s]+execution[,\s]+delivery[:\s]+([\d\s,.]+)\s*(\$|€|£)?M/gi,
    /execution[,\s]+delivery\s+and\s+process\s+management[:\s]+([\d\s,.]+)/gi,
    /cat(?:\.|egory)?\s+7[:\s]+losses?[:\s]+([\d\s,.]+)/gi,
  ],

  // Transaction entry errors
  entryErrors: [
    /transaction\s+entry\s+errors?[:\s]+([\d\s,.]+)\s*(\$|€|£)?M/gi,
    /data\s+entry\s+errors?[:\s]+([\d\s,.]+)/gi,
    /keying\s+errors?[:\s]+([\d\s,.]+)/gi,
    /input\s+errors?[:\s]+([\d\s,.]+)/gi,
  ],

  // Settlement-delivery failures
  settlementFailures: [
    /settlement\s+failures?[:\s]+([\d\s,.]+)\s*(\$|€|£)?M/gi,
    /failed\s+settlements?[:\s]+([\d\s,.]+)/gi,
    /delivery\s+failures?[:\s]+([\d\s,.]+)/gi,
    /failed\s+delivery[:\s]+([\d\s,.]+)/gi,
    /DvP\s+failures?[:\s]+([\d\s,.]+)/gi,
    /settlement[-\s]delivery\s+failures?[:\s]+([\d\s,.]+)/gi,
  ],

  // Payment processing errors
  paymentErrors: [
    /payment\s+processing\s+errors?[:\s]+([\d\s,.]+)\s*(\$|€|£)?M/gi,
    /payment\s+errors?[:\s]+([\d\s,.]+)/gi,
    /wire\s+(?:transfer\s+)?errors?[:\s]+([\d\s,.]+)/gi,
    /payment\s+failures?[:\s]+([\d\s,.]+)/gi,
  ],

  // Counterparty disputes
  disputes: [
    /counterparty\s+disputes?[:\s]+([\d\s,.]+)\s*(\$|€|£)?M/gi,
    /settlement\s+disputes?[:\s]+([\d\s,.]+)/gi,
    /client\s+disputes?[:\s]+([\d\s,.]+)/gi,
  ],

  // Other execution errors
  otherExecution: [
    /other\s+execution\s+errors?[:\s]+([\d\s,.]+)\s*(\$|€|£)?M/gi,
    /miscellaneous\s+execution[:\s]+([\d\s,.]+)/gi,
    /other\s+delivery\s+errors?[:\s]+([\d\s,.]+)/gi,
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse amount string to number
 */
function parseAmount(amountStr: string, unit: string = 'M€'): number {
  const cleanStr = amountStr.replace(/\s/g, '').replace(',', '.');
  let amount = parseFloat(cleanStr);

  if (isNaN(amount)) return 0;

  // Handle parentheses (negative numbers)
  if (amountStr.includes('(') && amountStr.includes(')')) {
    amount = -Math.abs(amount);
  }

  // Convert to millions of euros
  const lowerUnit = unit.toLowerCase();
  if (lowerUnit.includes('k') || lowerUnit.includes('milliers')) {
    amount = amount / 1000;  // Convert thousands to millions
  } else if (lowerUnit.includes('md') || lowerUnit.includes('milliard') || lowerUnit.includes('bn') || lowerUnit.includes('billion')) {
    amount = amount * 1000;  // Convert billions to millions
  }
  // Already in millions (M€, M$, etc.) - no conversion needed

  return amount;
}

/**
 * Extract amount from context using pattern array
 */
function extractAmountFromContext(context: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;  // Reset regex state
    const match = pattern.exec(context);

    if (match && match[1]) {
      const amountStr = match[1];
      const unit = match[2] || 'M€';
      const amount = parseAmount(amountStr, unit);

      if (amount > 0) {
        return amount;
      }
    }
  }

  return 0;
}

/**
 * Get year label (N-1, N-2, etc.)
 */
function getYearLabel(year: number, currentYear: number): string {
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
 * Determine document type from text
 */
function detectDocumentType(text: string): SettlementRiskData['documentType'] {
  const lowerText = text.toLowerCase();

  if (/pillar\s+3|pilier\s+3|third\s+pillar|troisième\s+pilier/i.test(lowerText)) {
    if (/operational\s+risk|risque\s+opérationnel|category\s+7|catégorie\s+7/i.test(lowerText)) {
      return 'Pillar3_OpRisk';
    } else if (/market\s+risk|risque\s+de\s+marché|trading\s+book/i.test(lowerText)) {
      return 'Pillar3_Market';
    }
  }

  if (/annual\s+report|rapport\s+annuel|financial\s+statements/i.test(lowerText)) {
    return 'AnnualReport';
  }

  return 'RiskReport';
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract settlement risk data for a single year
 */
function extractSettlementRiskForYear(
  text: string,
  year: number,
  yearLabel: string,
  config: Required<SettlementRiskConfig>
): SettlementRiskData | null {
  // Find all contexts mentioning this year
  const yearPattern = new RegExp(`\\b${year}\\b`, 'g');
  const matches = [];
  let match;

  while ((match = yearPattern.exec(text)) !== null) {
    const contextStart = Math.max(0, match.index - 600);
    const contextEnd = Math.min(text.length, match.index + 600);
    matches.push(text.substring(contextStart, contextEnd));
  }

  if (matches.length === 0) return null;

  const combinedContext = matches.join('\n\n');

  // Check if settlement/execution risk is mentioned
  const settlementMentioned = /settlement|règlement|execution|exécution|delivery|livraison|payment.*(?:error|erreur)|category\s+7|catégorie\s+7/i.test(combinedContext);

  if (!settlementMentioned) return null;

  // Extract by error type if classification is enabled
  let transactionEntryErrors = 0;
  let settlementDeliveryFailures = 0;
  let paymentProcessingErrors = 0;
  let counterpartyDisputes = 0;
  let otherExecutionErrors = 0;

  if (config.enableErrorTypeClassification) {
    transactionEntryErrors = extractAmountFromContext(combinedContext, [
      ...SETTLEMENT_PATTERNS_FR.entryErrors,
      ...SETTLEMENT_PATTERNS_EN.entryErrors
    ]);

    settlementDeliveryFailures = extractAmountFromContext(combinedContext, [
      ...SETTLEMENT_PATTERNS_FR.settlementFailures,
      ...SETTLEMENT_PATTERNS_EN.settlementFailures
    ]);

    paymentProcessingErrors = extractAmountFromContext(combinedContext, [
      ...SETTLEMENT_PATTERNS_FR.paymentErrors,
      ...SETTLEMENT_PATTERNS_EN.paymentErrors
    ]);

    counterpartyDisputes = extractAmountFromContext(combinedContext, [
      ...SETTLEMENT_PATTERNS_FR.disputes,
      ...SETTLEMENT_PATTERNS_EN.disputes
    ]);

    otherExecutionErrors = extractAmountFromContext(combinedContext, [
      ...SETTLEMENT_PATTERNS_FR.otherExecution,
      ...SETTLEMENT_PATTERNS_EN.otherExecution
    ]);
  }

  // Extract total Category 7
  let totalCategory7Losses = extractAmountFromContext(combinedContext, [
    ...SETTLEMENT_PATTERNS_FR.category7,
    ...SETTLEMENT_PATTERNS_EN.category7
  ]);

  // If total not found but sub-categories found, sum them
  if (totalCategory7Losses === 0 && config.enableErrorTypeClassification) {
    const calculatedTotal = transactionEntryErrors + settlementDeliveryFailures +
                          paymentProcessingErrors + counterpartyDisputes + otherExecutionErrors;

    if (calculatedTotal > 0) {
      totalCategory7Losses = calculatedTotal;
    }
  }

  // If still no data, return null
  if (totalCategory7Losses === 0) return null;

  // Calculate confidence based on data completeness
  let confidence = 0.5;

  if (totalCategory7Losses > 0) confidence += 0.2;
  if (config.enableErrorTypeClassification && transactionEntryErrors + settlementDeliveryFailures + paymentProcessingErrors > 0) {
    confidence += 0.2;
  }
  if (/category\s+7|catégorie\s+7|execution.*delivery/i.test(combinedContext)) {
    confidence += 0.1;
  }

  const documentType = detectDocumentType(text);

  return {
    year,
    yearLabel,
    transactionEntryErrors,
    settlementDeliveryFailures,
    paymentProcessingErrors,
    counterpartyDisputes,
    otherExecutionErrors,
    totalCategory7Losses,
    confidence: Math.min(confidence, 1),
    source: `Year ${year} context`,
    documentType,
  };
}

/**
 * Calculate 5-year summary statistics
 */
function calculate5YearSummary(
  yearlyData: SettlementRiskData[],
  config: Required<SettlementRiskConfig>
): Settlement5YearSummary {
  // Sort by year descending (most recent first)
  const sortedData = [...yearlyData].sort((a, b) => b.year - a.year);

  // Cumulative totals (M€)
  const totalLosses5Y = sortedData.reduce((sum, d) => sum + d.totalCategory7Losses, 0);
  const averageAnnual = totalLosses5Y / sortedData.length;

  // Cumulative by error type
  const byErrorType = {
    transactionEntry: sortedData.reduce((sum, d) => sum + d.transactionEntryErrors, 0),
    settlementDelivery: sortedData.reduce((sum, d) => sum + d.settlementDeliveryFailures, 0),
    paymentProcessing: sortedData.reduce((sum, d) => sum + d.paymentProcessingErrors, 0),
    disputes: sortedData.reduce((sum, d) => sum + d.counterpartyDisputes, 0),
    otherExecution: sortedData.reduce((sum, d) => sum + d.otherExecutionErrors, 0),
  };

  // Distribution percentages
  const byErrorTypePercentage = {
    transactionEntry: totalLosses5Y > 0 ? (byErrorType.transactionEntry / totalLosses5Y) * 100 : 0,
    settlementDelivery: totalLosses5Y > 0 ? (byErrorType.settlementDelivery / totalLosses5Y) * 100 : 0,
    paymentProcessing: totalLosses5Y > 0 ? (byErrorType.paymentProcessing / totalLosses5Y) * 100 : 0,
    disputes: totalLosses5Y > 0 ? (byErrorType.disputes / totalLosses5Y) * 100 : 0,
    otherExecution: totalLosses5Y > 0 ? (byErrorType.otherExecution / totalLosses5Y) * 100 : 0,
  };

  // Evolution (oldest year to most recent year)
  const oldestYear = sortedData[sortedData.length - 1];
  const mostRecentYear = sortedData[0];

  const absoluteChange = mostRecentYear.totalCategory7Losses - oldestYear.totalCategory7Losses;
  const relativeChange = oldestYear.totalCategory7Losses > 0
    ? ((mostRecentYear.totalCategory7Losses / oldestYear.totalCategory7Losses) - 1) * 100
    : 0;

  let direction: 'improvement' | 'deterioration' | 'stable';
  if (Math.abs(relativeChange) < 5) {
    direction = 'stable';
  } else if (relativeChange < 0) {
    direction = 'improvement';  // Losses decreased = improvement
  } else {
    direction = 'deterioration';  // Losses increased = deterioration
  }

  // Determine trend over multiple years
  let trend: 'decreasing' | 'increasing' | 'stable' = 'stable';
  if (sortedData.length >= 3) {
    let increases = 0;
    let decreases = 0;

    for (let i = 0; i < sortedData.length - 1; i++) {
      const current = sortedData[i].totalCategory7Losses;
      const previous = sortedData[i + 1].totalCategory7Losses;

      if (current > previous * 1.05) increases++;
      if (current < previous * 0.95) decreases++;
    }

    if (increases > decreases) trend = 'increasing';
    else if (decreases > increases) trend = 'decreasing';
  }

  const evolution = {
    absolute: absoluteChange,
    relative: relativeChange,
    direction,
    trend,
  };

  // Volatility
  const losses = sortedData.map(d => d.totalCategory7Losses);
  const mean = averageAnnual;
  const squaredDiffs = losses.map(l => Math.pow(l - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / losses.length;
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? (standardDeviation / mean) * 100 : 0;

  const volatility = {
    standardDeviation,
    coefficientOfVariation,
  };

  // Peak year
  const peakData = sortedData.reduce((max, d) =>
    d.totalCategory7Losses > max.totalCategory7Losses ? d : max
  );

  const peakYear = {
    year: peakData.year,
    amount: peakData.totalCategory7Losses,
  };

  // Average proportion of operational risk (if available)
  const proportions = sortedData
    .filter(d => d.proportionOfOpRisk !== undefined)
    .map(d => d.proportionOfOpRisk!);

  const averageProportionOfOpRisk = proportions.length > 0
    ? proportions.reduce((sum, p) => sum + p, 0) / proportions.length
    : undefined;

  // Rating based on average annual losses and bank size
  const rating = rateSettlementLosses(averageAnnual, config.bankSize);

  // Benchmark comparison
  const benchmark = config.enableBenchmarking
    ? benchmarkSettlementLosses(averageAnnual, config.bankSize)
    : null;

  const benchmarkComparison = benchmark
    ? `${benchmark.status} (${benchmark.vsMedian >= 0 ? '+' : ''}${benchmark.vsMedian.toFixed(1)}% vs sector median)`
    : 'Benchmark not available';

  return {
    totalLosses5Y,
    averageAnnual,
    byErrorType,
    byErrorTypePercentage,
    evolution,
    volatility,
    peakYear,
    averageProportionOfOpRisk,
    rating,
    benchmarkComparison,
  };
}

/**
 * Rate settlement losses based on average annual amount and bank size
 */
function rateSettlementLosses(
  averageAnnual: number,
  bankSize: 'systemic' | 'large' | 'medium' | 'small'
): SettlementRiskRating {
  // Rating thresholds by bank size (M€/year)
  const thresholds = {
    systemic: { excellent: 20, good: 45, average: 70, elevated: 100 },
    large: { excellent: 8, good: 18, average: 28, elevated: 40 },
    medium: { excellent: 3, good: 7, average: 11, elevated: 15 },
    small: { excellent: 0.5, good: 2, average: 3.5, elevated: 5 },
  };

  const t = thresholds[bankSize];

  if (averageAnnual < t.excellent) return 'Excellent';
  if (averageAnnual < t.good) return 'Good';
  if (averageAnnual < t.average) return 'Average';
  if (averageAnnual < t.elevated) return 'Elevated';
  return 'Very High';
}

/**
 * Benchmark against sector median
 */
function benchmarkSettlementLosses(
  averageAnnual: number,
  bankSize: 'systemic' | 'large' | 'medium' | 'small'
): { sectorMedian: number; vsMedian: number; status: string } {
  // Sector medians (M€/year) - typical values
  const benchmarks = {
    systemic: { min: 20, max: 100, median: 45 },
    large: { min: 8, max: 40, median: 18 },
    medium: { min: 3, max: 15, median: 7 },
    small: { min: 0.5, max: 5, median: 2 },
  };

  const bench = benchmarks[bankSize];
  const vsMedian = ((averageAnnual / bench.median) - 1) * 100;

  let status: string;
  if (averageAnnual < bench.min) {
    status = 'Excellent';
  } else if (averageAnnual <= bench.median) {
    status = 'Good';
  } else if (averageAnnual <= bench.max) {
    status = 'Average';
  } else {
    status = 'Concerning';
  }

  return {
    sectorMedian: bench.median,
    vsMedian,
    status,
  };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate settlement risk data quality
 */
function validateSettlementData(
  yearlyData: SettlementRiskData[],
  config: Required<SettlementRiskConfig>
): ValidationResult {
  const alerts: string[] = [];
  const sumEqualsTotal: boolean[] = [];
  const plausibilityChecks: string[] = [];
  const yearOverYearVariation: string[] = [];

  // 1. Coherence: Sum of sub-categories = total
  for (const data of yearlyData) {
    const calculatedTotal =
      data.transactionEntryErrors +
      data.settlementDeliveryFailures +
      data.paymentProcessingErrors +
      data.counterpartyDisputes +
      data.otherExecutionErrors;

    const tolerance = Math.max(
      config.minPlausibleLoss,
      data.totalCategory7Losses * (config.tolerancePercentage / 100)
    );

    const coherent = Math.abs(calculatedTotal - data.totalCategory7Losses) <= tolerance;
    sumEqualsTotal.push(coherent);

    if (!coherent && calculatedTotal > 0) {
      const message = `Year ${data.year}: Sum mismatch (${calculatedTotal.toFixed(1)} vs ${data.totalCategory7Losses.toFixed(1)} M€)`;
      alerts.push(`⚠️ ${message}`);
      plausibilityChecks.push(message);
    }
  }

  // 2. Plausibility of amounts
  for (const data of yearlyData) {
    if (data.totalCategory7Losses < config.minPlausibleLoss) {
      const message = `Year ${data.year}: Very low losses (${data.totalCategory7Losses.toFixed(1)} M€)`;
      alerts.push(`ℹ️ ${message}`);
      plausibilityChecks.push(message);
    }

    if (data.totalCategory7Losses > config.maxPlausibleLoss) {
      const message = `Year ${data.year}: Very high losses (${data.totalCategory7Losses.toFixed(1)} M€)`;
      alerts.push(`⚠️ ${message}`);
      plausibilityChecks.push(message);
    }
  }

  // 3. Year-over-year variation
  const sortedData = [...yearlyData].sort((a, b) => a.year - b.year);

  for (let i = 0; i < sortedData.length - 1; i++) {
    const current = sortedData[i];
    const next = sortedData[i + 1];

    if (current.totalCategory7Losses > 0) {
      const variation = ((next.totalCategory7Losses / current.totalCategory7Losses) - 1) * 100;

      if (Math.abs(variation) > 50) {
        const message = `${current.year} → ${next.year}: Large variation (${variation >= 0 ? '+' : ''}${variation.toFixed(1)}%)`;
        alerts.push(`⚠️ ${message}`);
        yearOverYearVariation.push(message);
      }
    }
  }

  // 4. Operational risk proportion (if available)
  const proportions = yearlyData
    .filter(d => d.proportionOfOpRisk !== undefined)
    .map(d => d.proportionOfOpRisk!);

  let opRiskProportion: ValidationResult['opRiskProportion'];

  if (proportions.length > 0) {
    const avgProportion = proportions.reduce((sum, p) => sum + p, 0) / proportions.length;

    let status: 'normal' | 'low' | 'high';
    let message: string;

    if (avgProportion < 3) {
      status = 'low';
      message = `Low proportion of OpRisk (${avgProportion.toFixed(1)}%) - Check data completeness`;
      alerts.push(`⚠️ ${message}`);
    } else if (avgProportion > 20) {
      status = 'high';
      message = `High proportion of OpRisk (${avgProportion.toFixed(1)}%) - Verify classification`;
      alerts.push(`⚠️ ${message}`);
    } else {
      status = 'normal';
      message = `Normal proportion of OpRisk (${avgProportion.toFixed(1)}%)`;
    }

    opRiskProportion = { average: avgProportion, status, message };
  } else {
    opRiskProportion = {
      average: 0,
      status: 'normal',
      message: 'OpRisk proportion data not available',
    };
  }

  // 5. Benchmark analysis
  const averageAnnual = yearlyData.reduce((sum, d) => sum + d.totalCategory7Losses, 0) / yearlyData.length;
  const benchmarkAnalysis = config.enableBenchmarking
    ? {
        bankSize: config.bankSize,
        ...benchmarkSettlementLosses(averageAnnual, config.bankSize),
      }
    : {
        bankSize: config.bankSize,
        sectorMedian: 0,
        vsMedian: 0,
        status: 'Good' as const,
      };

  return {
    coherenceChecks: {
      sumEqualsTotal,
      plausibilityChecks,
      yearOverYearVariation,
    },
    opRiskProportion,
    benchmarkAnalysis,
    alerts,
  };
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract settlement risk data from text over 5 years
 *
 * @param text - Document text (Pillar 3, Annual Report, etc.)
 * @param config - Extraction configuration
 * @returns Settlement risk result or null if no data found
 */
export function extractSettlementRisk(
  text: string,
  config: SettlementRiskConfig = DEFAULT_SETTLEMENT_CONFIG
): SettlementRiskResult | null {
  // Merge with defaults
  const cfg: Required<SettlementRiskConfig> = {
    ...DEFAULT_SETTLEMENT_CONFIG,
    ...config,
  };

  if (cfg.verbose) {
    // Debug removed;
  }

  const yearlyData: SettlementRiskData[] = [];
  const yearsExtracted: number[] = [];

  // Extract data for each year
  for (let i = 1; i <= cfg.yearsToExtract; i++) {
    const year = cfg.currentYear - i;
    const yearLabel = getYearLabel(year, cfg.currentYear);

    const yearData = extractSettlementRiskForYear(text, year, yearLabel, cfg);

    if (yearData && yearData.confidence >= cfg.minConfidence) {
      yearlyData.push(yearData);
      yearsExtracted.push(year);

      if (cfg.verbose) {
        : ${yearData.totalCategory7Losses.toFixed(1)} M€`);
      }
    }
  }

  if (yearlyData.length === 0) {
    if (cfg.verbose) {
      }
    return null;
  }

  // Calculate 5-year summary
  const summary5Year = calculate5YearSummary(yearlyData, cfg);

  // Validate data
  const validation = cfg.enableCoherenceValidation
    ? validateSettlementData(yearlyData, cfg)
    : {
        coherenceChecks: { sumEqualsTotal: [], plausibilityChecks: [], yearOverYearVariation: [] },
        opRiskProportion: { average: 0, status: 'normal' as const, message: '' },
        benchmarkAnalysis: { bankSize: cfg.bankSize, sectorMedian: 0, vsMedian: 0, status: 'Good' as const },
        alerts: [],
      };

  const documentType = detectDocumentType(text);
  const averageConfidence = yearlyData.reduce((sum, d) => sum + d.confidence, 0) / yearlyData.length;

  if (cfg.verbose) {
    }M`);
    }M`);
    }%)`);
    .toFixed(1)}%\n`);

    if (validation.alerts.length > 0) {
      }
  }

  return {
    yearlyData,
    summary5Year,
    yearsExtracted,
    documentType,
    confidence: averageConfidence,
    validation,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// All exports are already declared inline with their definitions:
// - extractSettlementRisk (main extraction function)
// - DEFAULT_SETTLEMENT_CONFIG
// - Types and interfaces exported at the top of the file

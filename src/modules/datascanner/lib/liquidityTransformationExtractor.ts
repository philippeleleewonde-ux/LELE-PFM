/**
 * Liquidity & Transformation Risk Extractor
 *
 * Phase 2.12: Extracts liquidity and transformation risk data over 5 years
 *
 * CRITICAL DISTINCTION:
 * - STOCK Metrics (LCR, NSFR, Buffer) → EVOLUTION analysis (NOT cumulative)
 * - FLOW Metrics (Exceptional costs) → CUMULATIVE (if applicable)
 *
 * Metrics Extracted:
 * 1. LCR (Liquidity Coverage Ratio) - regulatory ratio
 * 2. NSFR (Net Stable Funding Ratio) - regulatory ratio
 * 3. Liquidity Buffer (HQLA) - stock of liquid assets
 * 4. Maturity Gap (transformation risk) - structure analysis
 * 5. Exceptional Liquidity Costs - flows (if applicable)
 *
 * Documents Sources:
 * - Pillar 3 Disclosure - Liquidity section
 * - Annual Reports - ALM notes
 * - Risk Reports
 *
 * Aggregation Method:
 * - Ratios: AVERAGE + EVOLUTION (5-year)
 * - Buffer: EVOLUTION + Growth rate
 * - Gap: EVOLUTION + Structure analysis
 * - Costs: SUM (cumulative if applicable)
 *
 * Skill: Elite SaaS Developer
 * Date: 2025-11-24
 *
 * @module liquidityTransformationExtractor
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface LiquidityTransformationConfig {
  currentYear: number;
  yearsToExtract: number;
  minConfidence: number;

  enableLCRExtraction: boolean;
  enableNSFRExtraction: boolean;
  enableBufferExtraction: boolean;
  enableMaturityGapExtraction: boolean;
  enableCostsExtraction: boolean;

  enableValidation: boolean;
  enableBenchmarking: boolean;
  bankSize: 'systemic' | 'large' | 'medium' | 'small';

  verbose: boolean;
}

export const DEFAULT_LIQUIDITY_TRANSFORMATION_CONFIG: Required<LiquidityTransformationConfig> = {
  currentYear: new Date().getFullYear() - 1,
  yearsToExtract: 5,
  minConfidence: 0.65,
  enableLCRExtraction: true,
  enableNSFRExtraction: true,
  enableBufferExtraction: true,
  enableMaturityGapExtraction: true,
  enableCostsExtraction: true,
  enableValidation: true,
  enableBenchmarking: true,
  bankSize: 'large',
  verbose: true,
};

export interface LiquidityRiskData {
  year: number;
  yearLabel: string;
  lcr: number;
  nsfr: number;
  liquidityBuffer: number;
  totalHQLA?: number;
  netOutflows30d?: number;
  lcrCompliant: boolean;
  nsfrCompliant: boolean;
  confidence: number;
  source: string;
  documentType: 'Pillar3_Liquidity' | 'AnnualReport_ALM' | 'RiskReport';
}

export interface TransformationRiskData {
  year: number;
  yearLabel: string;
  maturityGap: {
    lessThan1Month: number;
    oneToThreeMonths: number;
    threeToTwelveMonths: number;
    oneToFiveYears: number;
    moreThanFiveYears: number;
  };
  shortTermGap: number;
  longTermGap: number;
  totalGap: number;
  confidence: number;
  source: string;
}

export interface LiquidityCostsData {
  year: number;
  yearLabel: string;
  emergencyRefinancingCost: number;
  forcedAssetSalesLosses: number;
  regulatoryPenalties: number;
  totalLiquidityCost: number;
  confidence: number;
  source: string;
}

export type LiquidityRating = 'Strong' | 'Adequate' | 'Moderate' | 'Weak';
export type TransformationRating = 'Low' | 'Moderate' | 'Elevated' | 'High';

export interface LiquidityTransformation5YearSummary {
  lcr: {
    initial: number;
    final: number;
    average: number;
    min: number;
    max: number;
    yearMin: number;
    evolution: number;
    alwaysCompliant: boolean;
    averageMargin: number;
  };
  nsfr: {
    initial: number;
    final: number;
    average: number;
    min: number;
    max: number;
    yearMin: number;
    evolution: number;
    alwaysCompliant: boolean;
    averageMargin: number;
  };
  liquidityBuffer: {
    initialBn: number;
    finalBn: number;
    averageBn: number;
    evolutionAbsolute: number;
    evolutionRelative: number;
    annualGrowthRate: number;
    peakYear: number;
    peakAmount: number;
  };
  transformation: {
    initialShortTermGap: number;
    finalShortTermGap: number;
    averageShortTermGap: number;
    gapEvolution: number;
    gapEvolutionPct: number;
    riskLevel: TransformationRating;
    riskEvolution: 'Improvement' | 'Deterioration' | 'Stable';
  };
  liquidityCosts: {
    applicable: boolean;
    totalCosts5Y: number;
    averageAnnual: number;
    yearsWithCosts: number[];
    peakYear: number | null;
    peakAmount: number;
  };
  liquidityRating: LiquidityRating;
  transformationRating: TransformationRating;
  overallStatus: string;
}

export interface LiquidityTransformationValidation {
  regulatoryCompliance: {
    lcrAlwaysAbove100: boolean;
    nsfrAlwaysAbove100: boolean;
    yearsNonCompliant: number[];
    complianceRate: number;
  };
  coherenceChecks: {
    lcrCalculationValid: boolean[];
    totalGapNearZero: boolean[];
    temporalConsistency: string[];
  };
  benchmarkAnalysis: {
    bankSize: string;
    lcrVsSector: { companyAverage: number; sectorBenchmark: number; difference: number; status: string };
    nsfrVsSector: { companyAverage: number; sectorBenchmark: number; difference: number; status: string };
  };
  alerts: string[];
}

export interface LiquidityTransformationResult {
  liquidityData: LiquidityRiskData[];
  transformationData: TransformationRiskData[];
  liquidityCosts: LiquidityCostsData[];
  summary5Year: LiquidityTransformation5YearSummary;
  yearsExtracted: number[];
  confidence: number;
  validation: LiquidityTransformationValidation;
}

// ============================================================================
// REGEX PATTERNS
// ============================================================================

const LCR_PATTERNS = [
  /LCR[:\s]+([\d\s,.]+)\s*%/gi,
  /Liquidity\s+Coverage\s+Ratio[:\s]+([\d\s,.]+)\s*%/gi,
  /ratio\s+de\s+(?:couverture\s+(?:de\s+)?)?liquidité[:\s]+([\d\s,.]+)\s*%/gi,
];

const NSFR_PATTERNS = [
  /NSFR[:\s]+([\d\s,.]+)\s*%/gi,
  /Net\s+Stable\s+Funding\s+Ratio[:\s]+([\d\s,.]+)\s*%/gi,
  /ratio\s+de\s+financement\s+stable\s+net[:\s]+([\d\s,.]+)\s*%/gi,
];

const LIQUIDITY_BUFFER_PATTERNS = [
  /réserve\s+de\s+liquidité[:\s]+([\d\s,.]+)\s*(Mds?€|milliards?)/gi,
  /HQLA[:\s]+([\d\s,.]+)\s*(Mds?€|milliards?|bn)/gi,
  /liquidity\s+(?:buffer|reserve)[:\s]+([\d\s,.]+)\s*(€?bn|billion)/gi,
  /actifs\s+liquides[:\s]+([\d\s,.]+)\s*(Mds?€)/gi,
];

// Maturity Gap Patterns (Assets - Liabilities by bucket)
const MATURITY_GAP_PATTERNS = {
  lessThan1Month: [
    /gap[:\s]+<\s*1\s*(?:month|mois|m)[:\s]+([\d\s,.+-]+)\s*(Mds?€|milliards?|bn)?/gi,
    /écart[:\s]+<\s*1\s*(?:month|mois|m)[:\s]+([\d\s,.+-]+)\s*(Mds?€)?/gi,
    /<\s*1\s*(?:month|mois|m)[:\s]+([\d\s,.+-]+)\s*(Mds?€)?/gi,
  ],
  oneToThreeMonths: [
    /gap[:\s]+1[-\s]3\s*(?:months|mois|m)[:\s]+([\d\s,.+-]+)\s*(Mds?€|milliards?|bn)?/gi,
    /écart[:\s]+1[-\s]3\s*(?:months|mois|m)[:\s]+([\d\s,.+-]+)\s*(Mds?€)?/gi,
    /1[-\s]3\s*(?:months|mois|m)[:\s]+([\d\s,.+-]+)\s*(Mds?€)?/gi,
  ],
  threeToTwelveMonths: [
    /gap[:\s]+3[-\s]12\s*(?:months|mois|m)[:\s]+([\d\s,.+-]+)\s*(Mds?€|milliards?|bn)?/gi,
    /écart[:\s]+3[-\s]12\s*(?:months|mois|m)[:\s]+([\d\s,.+-]+)\s*(Mds?€)?/gi,
    /3[-\s]12\s*(?:months|mois|m)[:\s]+([\d\s,.+-]+)\s*(Mds?€)?/gi,
  ],
  oneToFiveYears: [
    /gap[:\s]+1[-\s]5\s*(?:years?|ans?|y)[:\s]+([\d\s,.+-]+)\s*(Mds?€|milliards?|bn)?/gi,
    /écart[:\s]+1[-\s]5\s*(?:years?|ans?|y)[:\s]+([\d\s,.+-]+)\s*(Mds?€)?/gi,
    /1[-\s]5\s*(?:years?|ans?|y)[:\s]+([\d\s,.+-]+)\s*(Mds?€)?/gi,
  ],
  moreThanFiveYears: [
    /gap[:\s]+>\s*5\s*(?:years?|ans?|y)[:\s]+([\d\s,.+-]+)\s*(Mds?€|milliards?|bn)?/gi,
    /écart[:\s]+>\s*5\s*(?:years?|ans?|y)[:\s]+([\d\s,.+-]+)\s*(Mds?€)?/gi,
    />\s*5\s*(?:years?|ans?|y)[:\s]+([\d\s,.+-]+)\s*(Mds?€)?/gi,
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseAmount(amountStr: string, unit: string = 'M€'): number {
  const cleanStr = amountStr.replace(/\s/g, '').replace(',', '.');
  let amount = parseFloat(cleanStr);
  if (isNaN(amount)) return 0;
  if (amountStr.includes('(') && amountStr.includes(')')) amount = -Math.abs(amount);
  const lowerUnit = unit.toLowerCase();
  if (lowerUnit.includes('k') || lowerUnit.includes('milliers')) amount = amount / 1000;
  else if (lowerUnit.includes('md') || lowerUnit.includes('milliard') || lowerUnit.includes('bn') || lowerUnit.includes('billion')) amount = amount * 1000;
  return amount;
}

function extractAmountFromContext(context: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(context);
    if (match && match[1]) {
      const amountStr = match[1];
      const unit = match[2] || 'M€';
      const amount = parseAmount(amountStr, unit);
      if (amount > 0) return amount;
    }
  }
  return 0;
}

function extractRatioFromContext(context: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(context);
    if (match && match[1]) {
      const valueStr = match[1].replace(/\s/g, '').replace(',', '.');
      const value = parseFloat(valueStr);
      if (!isNaN(value) && value > 0) return value;
    }
  }
  return 0;
}

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

function detectDocumentType(text: string): LiquidityRiskData['documentType'] {
  const lowerText = text.toLowerCase();
  if (/pillar\s+3|pilier\s+3|liquidity\s+risk|risque\s+de\s+liquidité/i.test(lowerText)) {
    return 'Pillar3_Liquidity';
  }
  if (/alm|asset[-\s]liability|actif[-\s]passif/i.test(lowerText)) {
    return 'AnnualReport_ALM';
  }
  return 'RiskReport';
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

function extractLiquidityRiskForYear(
  text: string,
  year: number,
  yearLabel: string,
  config: Required<LiquidityTransformationConfig>
): LiquidityRiskData | null {
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
  if (!/LCR|NSFR|liquidity|liquidité/i.test(combinedContext)) return null;

  const lcr = extractRatioFromContext(combinedContext, LCR_PATTERNS);
  const nsfr = extractRatioFromContext(combinedContext, NSFR_PATTERNS);
  const liquidityBuffer = extractAmountFromContext(combinedContext, LIQUIDITY_BUFFER_PATTERNS);

  if (lcr === 0 && nsfr === 0 && liquidityBuffer === 0) return null;

  let confidence = 0.5;
  if (lcr > 0) confidence += 0.25;
  if (nsfr > 0) confidence += 0.25;
  if (liquidityBuffer > 0) confidence += 0.15;

  return {
    year,
    yearLabel,
    lcr,
    nsfr,
    liquidityBuffer,
    lcrCompliant: lcr >= 100,
    nsfrCompliant: nsfr >= 100,
    confidence: Math.min(confidence, 1),
    source: `Year ${year} context`,
    documentType: detectDocumentType(text),
  };
}

function extractTransformationRiskForYear(
  text: string,
  year: number,
  yearLabel: string,
  config: Required<LiquidityTransformationConfig>
): TransformationRiskData | null {
  const yearPattern = new RegExp(`\\b${year}\\b`, 'g');
  const yearMatches: number[] = [];
  let match;
  while ((match = yearPattern.exec(text)) !== null) {
    yearMatches.push(match.index);
  }

  if (yearMatches.length === 0) return null;

  // Extract maturity gap for each bucket
  const maturityGap = {
    lessThan1Month: 0,
    oneToThreeMonths: 0,
    threeToTwelveMonths: 0,
    oneToFiveYears: 0,
    moreThanFiveYears: 0,
  };

  let confidence = 0.3; // Base confidence for finding year
  let gapsFound = 0;

  // For each year occurrence, look in surrounding context
  for (const yearIdx of yearMatches) {
    const contextStart = Math.max(0, yearIdx - 500);
    const contextEnd = Math.min(text.length, yearIdx + 500);
    const context = text.substring(contextStart, contextEnd);

    // Extract each maturity bucket
    for (const [key, patterns] of Object.entries(MATURITY_GAP_PATTERNS)) {
      const value = extractAmountFromContext(context, patterns);
      if (value !== 0 && maturityGap[key as keyof typeof maturityGap] === 0) {
        maturityGap[key as keyof typeof maturityGap] = value;
        gapsFound++;
        confidence += 0.15;
      }
    }
  }

  if (gapsFound === 0) return null;

  // Calculate cumulative gaps
  const shortTermGap = maturityGap.lessThan1Month + maturityGap.oneToThreeMonths + maturityGap.threeToTwelveMonths;
  const longTermGap = maturityGap.oneToFiveYears + maturityGap.moreThanFiveYears;
  const totalGap = shortTermGap + longTermGap;

  // Bonus confidence if all buckets found
  if (gapsFound >= 4) confidence += 0.1;

  return {
    year,
    yearLabel,
    maturityGap,
    shortTermGap,
    longTermGap,
    totalGap,
    confidence: Math.min(confidence, 1),
    source: `Year ${year} ALM context`,
  };
}

function calculate5YearSummary(
  liquidityData: LiquidityRiskData[],
  transformationData: TransformationRiskData[],
  costsData: LiquidityCostsData[],
  config: Required<LiquidityTransformationConfig>
): LiquidityTransformation5YearSummary {
  const sortedLiq = [...liquidityData].sort((a, b) => b.year - a.year);
  const lcrValues = sortedLiq.map(d => d.lcr);
  const nsfrValues = sortedLiq.map(d => d.nsfr);

  const lcr = {
    initial: sortedLiq[sortedLiq.length - 1].lcr,
    final: sortedLiq[0].lcr,
    average: lcrValues.reduce((sum, v) => sum + v, 0) / lcrValues.length,
    min: Math.min(...lcrValues),
    max: Math.max(...lcrValues),
    yearMin: sortedLiq.find(d => d.lcr === Math.min(...lcrValues))!.year,
    evolution: sortedLiq[0].lcr - sortedLiq[sortedLiq.length - 1].lcr,
    alwaysCompliant: lcrValues.every(v => v >= 100),
    averageMargin: (lcrValues.reduce((sum, v) => sum + v, 0) / lcrValues.length) - 100,
  };

  const nsfr = {
    initial: sortedLiq[sortedLiq.length - 1].nsfr,
    final: sortedLiq[0].nsfr,
    average: nsfrValues.reduce((sum, v) => sum + v, 0) / nsfrValues.length,
    min: Math.min(...nsfrValues),
    max: Math.max(...nsfrValues),
    yearMin: sortedLiq.find(d => d.nsfr === Math.min(...nsfrValues))!.year,
    evolution: sortedLiq[0].nsfr - sortedLiq[sortedLiq.length - 1].nsfr,
    alwaysCompliant: nsfrValues.every(v => v >= 100),
    averageMargin: (nsfrValues.reduce((sum, v) => sum + v, 0) / nsfrValues.length) - 100,
  };

  const bufferValues = sortedLiq.map(d => d.liquidityBuffer / 1000);
  const initialBuf = bufferValues[bufferValues.length - 1];
  const finalBuf = bufferValues[0];

  const liquidityBuffer = {
    initialBn: initialBuf,
    finalBn: finalBuf,
    averageBn: bufferValues.reduce((sum, v) => sum + v, 0) / bufferValues.length,
    evolutionAbsolute: finalBuf - initialBuf,
    evolutionRelative: ((finalBuf / initialBuf) - 1) * 100,
    annualGrowthRate: (Math.pow(finalBuf / initialBuf, 1 / (bufferValues.length - 1)) - 1) * 100,
    peakYear: sortedLiq.find(d => d.liquidityBuffer === Math.max(...sortedLiq.map(x => x.liquidityBuffer)))!.year,
    peakAmount: Math.max(...sortedLiq.map(d => d.liquidityBuffer)) / 1000,
  };

  const sortedTrans = [...transformationData].sort((a, b) => b.year - a.year);
  const stGapValues = sortedTrans.map(d => d.shortTermGap);

  // Determine transformation risk level based on short-term gap
  let transformationRiskLevel: TransformationRating = 'Moderate';
  if (stGapValues.length > 0) {
    const avgGap = stGapValues.reduce((sum, v) => sum + v, 0) / stGapValues.length;
    const absAvgGap = Math.abs(avgGap);
    if (absAvgGap < 5) transformationRiskLevel = 'Low';
    else if (absAvgGap < 15) transformationRiskLevel = 'Moderate';
    else if (absAvgGap < 30) transformationRiskLevel = 'Elevated';
    else transformationRiskLevel = 'High';
  }

  const transformation = stGapValues.length > 0 ? {
    initialShortTermGap: stGapValues[stGapValues.length - 1],
    finalShortTermGap: stGapValues[0],
    averageShortTermGap: stGapValues.reduce((sum, v) => sum + v, 0) / stGapValues.length,
    gapEvolution: stGapValues[0] - stGapValues[stGapValues.length - 1],
    gapEvolutionPct: stGapValues[stGapValues.length - 1] !== 0 ? ((stGapValues[0] / stGapValues[stGapValues.length - 1]) - 1) * 100 : 0,
    riskLevel: transformationRiskLevel,
    riskEvolution: Math.abs(stGapValues[0]) < Math.abs(stGapValues[stGapValues.length - 1]) ? 'Improvement' as const : 'Deterioration' as const,
  } : {
    initialShortTermGap: 0,
    finalShortTermGap: 0,
    averageShortTermGap: 0,
    gapEvolution: 0,
    gapEvolutionPct: 0,
    riskLevel: 'Moderate' as TransformationRating,
    riskEvolution: 'Stable' as const,
  };

  const totalCosts = costsData.reduce((sum, d) => sum + d.totalLiquidityCost, 0);
  const liquidityCosts = {
    applicable: totalCosts > 0,
    totalCosts5Y: totalCosts,
    averageAnnual: totalCosts / (costsData.length || 1),
    yearsWithCosts: costsData.filter(d => d.totalLiquidityCost > 0).map(d => d.year),
    peakYear: totalCosts > 0 ? costsData.reduce((max, d) => d.totalLiquidityCost > max.totalLiquidityCost ? d : max).year : null,
    peakAmount: totalCosts > 0 ? Math.max(...costsData.map(d => d.totalLiquidityCost)) : 0,
  };

  const liquidityRating: LiquidityRating = lcr.average >= 150 && nsfr.average >= 120 ? 'Strong' : lcr.average >= 120 && nsfr.average >= 105 ? 'Adequate' : lcr.average >= 100 && nsfr.average >= 100 ? 'Moderate' : 'Weak';
  const overallStatus = `Liquidity: ${liquidityRating}, Transformation: ${transformation.riskLevel}`;

  return { lcr, nsfr, liquidityBuffer, transformation, liquidityCosts, liquidityRating, transformationRating: transformation.riskLevel, overallStatus };
}

function validateData(
  liquidityData: LiquidityRiskData[],
  transformationData: TransformationRiskData[],
  config: Required<LiquidityTransformationConfig>
): LiquidityTransformationValidation {
  const alerts: string[] = [];
  const yearsNonCompliant = liquidityData.filter(d => d.lcr < 100 || d.nsfr < 100).map(d => d.year);
  if (yearsNonCompliant.length > 0) alerts.push(`🔴 Non-compliant years: ${yearsNonCompliant.join(', ')}`);

  const averageLCR = liquidityData.reduce((sum, d) => sum + d.lcr, 0) / liquidityData.length;
  const averageNSFR = liquidityData.reduce((sum, d) => sum + d.nsfr, 0) / liquidityData.length;
  const benchmarks = { systemic: { lcr: 145, nsfr: 125 }, large: { lcr: 135, nsfr: 120 }, medium: { lcr: 130, nsfr: 115 }, small: { lcr: 125, nsfr: 110 } };
  const bench = benchmarks[config.bankSize];

  return {
    regulatoryCompliance: {
      lcrAlwaysAbove100: liquidityData.every(d => d.lcr >= 100),
      nsfrAlwaysAbove100: liquidityData.every(d => d.nsfr >= 100),
      yearsNonCompliant,
      complianceRate: ((liquidityData.length - yearsNonCompliant.length) / liquidityData.length) * 100,
    },
    coherenceChecks: { lcrCalculationValid: [], totalGapNearZero: [], temporalConsistency: [] },
    benchmarkAnalysis: {
      bankSize: config.bankSize,
      lcrVsSector: { companyAverage: averageLCR, sectorBenchmark: bench.lcr, difference: averageLCR - bench.lcr, status: averageLCR >= bench.lcr ? 'Above ✓' : 'Below ⚠️' },
      nsfrVsSector: { companyAverage: averageNSFR, sectorBenchmark: bench.nsfr, difference: averageNSFR - bench.nsfr, status: averageNSFR >= bench.nsfr ? 'Above ✓' : 'Below ⚠️' },
    },
    alerts,
  };
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

export function extractLiquidityTransformation(
  text: string,
  config: LiquidityTransformationConfig = DEFAULT_LIQUIDITY_TRANSFORMATION_CONFIG
): LiquidityTransformationResult | null {
  const cfg: Required<LiquidityTransformationConfig> = { ...DEFAULT_LIQUIDITY_TRANSFORMATION_CONFIG, ...config };
  if (cfg.verbose) ...');

  const liquidityData: LiquidityRiskData[] = [];
  const transformationData: TransformationRiskData[] = [];
  const costsData: LiquidityCostsData[] = [];
  const yearsExtracted: number[] = [];

  for (let i = 1; i <= cfg.yearsToExtract; i++) {
    const year = cfg.currentYear - i;
    const yearLabel = getYearLabel(year, cfg.currentYear);

    // Extract liquidity risk data
    const liqData = extractLiquidityRiskForYear(text, year, yearLabel, cfg);
    if (liqData && liqData.confidence >= cfg.minConfidence) {
      liquidityData.push(liqData);
      if (!yearsExtracted.includes(year)) yearsExtracted.push(year);
      if (cfg.verbose) }%, NSFR=${liqData.nsfr.toFixed(1)}%`);
    }

    // Extract transformation risk data (maturity gap)
    const transData = extractTransformationRiskForYear(text, year, yearLabel, cfg);
    if (transData && transData.confidence >= cfg.minConfidence) {
      transformationData.push(transData);
      if (!yearsExtracted.includes(year)) yearsExtracted.push(year);
      if (cfg.verbose) }Bn€`);
    }
  }

  if (liquidityData.length === 0) {
    if (cfg.verbose) return null;
  }

  const summary5Year = calculate5YearSummary(liquidityData, transformationData, costsData, cfg);
  const validation = cfg.enableValidation ? validateData(liquidityData, transformationData, cfg) : {
    regulatoryCompliance: { lcrAlwaysAbove100: true, nsfrAlwaysAbove100: true, yearsNonCompliant: [], complianceRate: 100 },
    coherenceChecks: { lcrCalculationValid: [], totalGapNearZero: [], temporalConsistency: [] },
    benchmarkAnalysis: { bankSize: cfg.bankSize, lcrVsSector: { companyAverage: 0, sectorBenchmark: 0, difference: 0, status: '' }, nsfrVsSector: { companyAverage: 0, sectorBenchmark: 0, difference: 0, status: '' } },
    alerts: [],
  };

  const averageConfidence = liquidityData.reduce((sum, d) => sum + d.confidence, 0) / liquidityData.length;
  if (cfg.verbose) {
    }% (${summary5Year.lcr.evolution >= 0 ? '+' : ''}${summary5Year.lcr.evolution.toFixed(1)} pts)`);
    }% (${summary5Year.nsfr.evolution >= 0 ? '+' : ''}${summary5Year.nsfr.evolution.toFixed(1)} pts)`);
    }Bn (${summary5Year.liquidityBuffer.evolutionRelative >= 0 ? '+' : ''}${summary5Year.liquidityBuffer.evolutionRelative.toFixed(1)}%)`);
    }%`);
    .toFixed(1)}%\n`);
  }

  return { liquidityData, transformationData, costsData, summary5Year, yearsExtracted, confidence: averageConfidence, validation };
}

/**
 * HR Metrics Extractor - Working Hours & Employee Metrics
 *
 * This module extracts HR-specific metrics from documents, particularly:
 * - Average working hours per employee (N-1, N-2)
 * - Total working hours
 * - FTE (Full-Time Equivalent) counts
 * - Overtime hours
 * - Absence days
 * - Training hours
 *
 * Supports extraction from:
 * - RSE reports (Rapport RSE / DPEF)
 * - Bilan Social
 * - Annual Reports (Rapport Annuel)
 * - URD (Document d'Enregistrement Universel)
 *
 * Phase: 2.7 (HR Metrics Detection)
 * Date: 2025-11-23
 * Skill: Elite SaaS Developer
 */

import { NamedEntity } from './types';

/**
 * Document types that may contain HR metrics
 */
export enum HRDocumentType {
  RSE_DPEF = 'RSE/DPEF',
  BILAN_SOCIAL = 'Bilan Social',
  ANNUAL_REPORT = 'Annual Report',
  URD = 'URD',
  UNKNOWN = 'Unknown'
}

/**
 * HR-specific entity types (extends NamedEntity)
 */
export enum HREntityType {
  WORKING_HOURS = 'WORKING_HOURS',           // Annual/monthly/weekly working hours
  TOTAL_HOURS = 'TOTAL_HOURS',               // Total company-wide hours
  FTE_COUNT = 'FTE_COUNT',                   // Full-Time Equivalent headcount
  OVERTIME_HOURS = 'OVERTIME_HOURS',         // Overtime/supplementary hours
  ABSENCE_DAYS = 'ABSENCE_DAYS',             // Sick leave, vacation, etc.
  TRAINING_HOURS = 'TRAINING_HOURS',         // Training/formation hours
  CONTRACT_TYPE = 'CONTRACT_TYPE',           // CDI, CDD, Interim, etc.
  WORKING_HOURS_AVERAGE = 'WORKING_HOURS_AVERAGE' // Direct average mention
}

/**
 * HR metric with metadata
 */
export interface HRMetric {
  type: HREntityType;
  value: number;
  unit: string;                              // 'hours', 'days', 'FTE', 'employees'
  year: number;                              // Fiscal year
  yearLabel: string;                         // 'N-1', 'N-2', etc.
  confidence: number;                        // 0-1
  source: string;                            // Original text snippet
  category?: string;                         // Employee category (if segmented)
  geography?: string;                        // Geographic segment
  contractType?: string;                     // CDI, CDD, etc.
  position?: { page?: number; line?: number };
}

/**
 * Calculated average working hours
 */
export interface AverageWorkingHours {
  year: number;
  yearLabel: string;
  averageHours: number;                      // Average hours per employee
  totalHours?: number;                       // Total company hours
  totalFTE?: number;                         // Total FTE
  calculationMethod: 'direct' | 'calculated'; // How it was obtained
  confidence: number;                        // 0-1
  isValid: boolean;                          // Passed validation checks
  validationMessages: string[];              // Warnings/errors
  segments?: {                               // Breakdown by segment
    category?: string;
    geography?: string;
    contractType?: string;
    averageHours: number;
    totalHours?: number;
    totalFTE?: number;
  }[];
}

/**
 * Complete HR metrics extraction result
 */
export interface HRMetricsResult {
  documentType: HRDocumentType;
  detectedTypes: HRDocumentType[];           // All detected types
  metrics: HRMetric[];
  averageWorkingHours: {
    [year: number]: AverageWorkingHours;
  };
  latestYear?: AverageWorkingHours;          // N-1 quick access
  availableYears: number[];
  extractionDate: string;
  dataQuality: {
    totalMetricsFound: number;
    metricsWithHighConfidence: number;       // >= 0.8
    yearsWithData: number;
    hasSegmentedData: boolean;
  };
}

/**
 * HR extraction configuration
 */
export interface HRExtractionConfig {
  /**
   * Current fiscal year (for N-1, N-2 calculation)
   * Default: current year
   */
  currentYear?: number;

  /**
   * Minimum confidence threshold for metrics
   * Default: 0.6
   */
  confidenceThreshold?: number;

  /**
   * Enable validation checks
   * Default: true
   */
  enableValidation?: boolean;

  /**
   * Expected working hours range (France: 1400-1900)
   * Default: { min: 1400, max: 1900 }
   */
  validationRange?: {
    min: number;
    max: number;
  };

  /**
   * Extract segmented data (by category, geography, etc.)
   * Default: true
   */
  extractSegments?: boolean;

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

const DEFAULT_HR_CONFIG: HRExtractionConfig = {
  currentYear: new Date().getFullYear(),
  confidenceThreshold: 0.6,
  enableValidation: true,
  validationRange: { min: 1400, max: 1900 },
  extractSegments: true,
  verbose: false,
  languages: ['fr', 'en']
};

/**
 * French patterns for HR metrics
 */
const FR_PATTERNS = {
  // Average working hours - direct mentions
  averageWorkingHours: [
    /(?:durée|temps|nombre)\s+(?:annuelle?|moyenne?)\s+(?:du\s+)?travail\s*:?\s*([0-9\s.,]+)\s*(?:heures?|h)/gi,
    /([0-9\s.,]+)\s*(?:heures?|h)\s+(?:par\s+an|annuelles?|\/\s*an)/gi,
    /moyenne\s+(?:des?\s+)?(?:heures?|temps)\s+(?:de\s+)?travail\s*:?\s*([0-9\s.,]+)/gi,
    /temps\s+de\s+travail\s+(?:moyen|effectif)\s*:?\s*([0-9\s.,]+)\s*(?:heures?|h)/gi,
    /([0-9\s.,]+)\s*(?:heures?|h)\s+travaillées?\s+en\s+moyenne/gi,
    /durée\s+légale\s*:?\s*([0-9\s.,]+)\s*(?:heures?|h)/gi,
    /([0-9\s.,]+)\s*(?:heures?|h)\s*\/\s*(?:salarié|employé|collaborateur)/gi
  ],

  // Total working hours
  totalHours: [
    /(?:nombre\s+)?total\s+(?:d[''])?(?:heures?|h)\s+(?:travaillées?|réalisées?)\s*:?\s*([0-9\s.,]+)/gi,
    /([0-9\s.,]+)\s*(?:heures?|h)\s+travaillées?\s+au\s+total/gi,
    /volume\s+(?:global\s+)?(?:d[''])?(?:heures?|h)\s*:?\s*([0-9\s.,]+)/gi,
    /total\s+(?:des?\s+)?heures?\s+rémunérées?\s*:?\s*([0-9\s.,]+)/gi
  ],

  // FTE / Effectif
  fte: [
    /(?:effectif|nombre)\s+(?:moyen\s+)?(?:en\s+)?(?:ETP|équivalent\s+temps\s+plein)\s*:?\s*([0-9\s.,]+)/gi,
    /([0-9\s.,]+)\s+(?:ETP|FTE|équivalents?\s+temps\s+plein)/gi,
    /effectif\s+(?:moyen|total)\s*:?\s*([0-9\s.,]+)/gi,
    /([0-9\s.,]+)\s+(?:salariés?|employés?|collaborateurs?)\s+(?:en\s+)?(?:ETP|équivalent)/gi
  ],

  // Overtime
  overtime: [
    /(?:heures?|h)\s+supplémentaires?\s*:?\s*([0-9\s.,]+)/gi,
    /([0-9\s.,]+)\s*(?:heures?|h)\s+sup/gi,
    /volume\s+(?:d[''])?(?:heures?|h)\s+supplémentaires?\s*:?\s*([0-9\s.,]+)/gi
  ],

  // Absences
  absences: [
    /(?:nombre\s+de\s+)?(?:jours?\s+d[''])?absences?\s*:?\s*([0-9\s.,]+)/gi,
    /([0-9\s.,]+)\s+jours?\s+d['']absences?/gi,
    /taux\s+d['']absentéisme\s*:?\s*([0-9\s.,]+)\s*%/gi
  ],

  // Training
  training: [
    /(?:heures?|h)\s+de\s+formation\s*:?\s*([0-9\s.,]+)/gi,
    /([0-9\s.,]+)\s*(?:heures?|h)\s+de\s+formation/gi,
    /volume\s+de\s+formation\s*:?\s*([0-9\s.,]+)/gi
  ],

  // Contract types
  contractTypes: [
    /CDI|contrat\s+(?:à\s+)?durée\s+indéterminée/gi,
    /CDD|contrat\s+(?:à\s+)?durée\s+déterminée/gi,
    /intérim(?:aire)?/gi,
    /apprenti(?:ssage)?/gi,
    /stage(?:aire)?/gi
  ],

  // Year indicators
  years: [
    /N-1|année\s+précédente|exercice\s+précédent/gi,
    /N-2|(?:il\s+y\s+a\s+)?2\s+ans/gi,
    /N-3|(?:il\s+y\s+a\s+)?3\s+ans/gi,
    /(\d{4})/g // Explicit year numbers
  ]
};

/**
 * English patterns for HR metrics
 */
const EN_PATTERNS = {
  averageWorkingHours: [
    /average\s+(?:annual\s+)?(?:working\s+)?(?:hours?|time)\s*:?\s*([0-9\s.,]+)/gi,
    /([0-9\s.,]+)\s*(?:hours?|hrs?)\s+(?:per\s+year|annually|\/\s*year)/gi,
    /working\s+time\s+average\s*:?\s*([0-9\s.,]+)\s*(?:hours?|hrs?)/gi,
    /([0-9\s.,]+)\s*(?:hours?|hrs?)\s*\/\s*employee/gi
  ],

  totalHours: [
    /total\s+(?:working\s+)?hours?\s+worked\s*:?\s*([0-9\s.,]+)/gi,
    /([0-9\s.,]+)\s+hours?\s+worked\s+in\s+total/gi,
    /total\s+labor\s+hours?\s*:?\s*([0-9\s.,]+)/gi
  ],

  fte: [
    /(?:average\s+)?(?:headcount|workforce)\s+(?:in\s+)?FTE\s*:?\s*([0-9\s.,]+)/gi,
    /([0-9\s.,]+)\s+FTE/gi,
    /full[‐-]time\s+equivalent\s*:?\s*([0-9\s.,]+)/gi
  ],

  overtime: [
    /overtime\s+hours?\s*:?\s*([0-9\s.,]+)/gi,
    /([0-9\s.,]+)\s+(?:hours?|hrs?)\s+(?:of\s+)?overtime/gi
  ],

  absences: [
    /absence\s+days?\s*:?\s*([0-9\s.,]+)/gi,
    /([0-9\s.,]+)\s+days?\s+(?:of\s+)?absence/gi,
    /absenteeism\s+rate\s*:?\s*([0-9\s.,]+)\s*%/gi
  ],

  training: [
    /training\s+hours?\s*:?\s*([0-9\s.,]+)/gi,
    /([0-9\s.,]+)\s+(?:hours?|hrs?)\s+(?:of\s+)?training/gi
  ],

  contractTypes: [
    /permanent\s+contract/gi,
    /fixed[‐-]term\s+contract/gi,
    /temporary\s+(?:worker|contract)/gi,
    /apprentice(?:ship)?/gi,
    /intern(?:ship)?/gi
  ],

  years: [
    /N-1|previous\s+year|prior\s+year/gi,
    /N-2|2\s+years\s+ago/gi,
    /N-3|3\s+years\s+ago/gi,
    /(\d{4})/g
  ]
};

/**
 * Document type detection patterns
 */
const DOCUMENT_TYPE_PATTERNS = {
  [HRDocumentType.RSE_DPEF]: [
    /rapport\s+(?:de\s+)?(?:responsabilité\s+)?(?:sociétale|sociale)\s+(?:de\s+)?(?:l[''])?entreprise/gi,
    /RSE/g,
    /DPEF/g,
    /déclaration\s+de\s+performance\s+extra[‐-]financière/gi,
    /CSR\s+report/gi,
    /corporate\s+social\s+responsibility/gi
  ],

  [HRDocumentType.BILAN_SOCIAL]: [
    /bilan\s+social/gi,
    /rapport\s+social/gi,
    /social\s+balance\s+sheet/gi
  ],

  [HRDocumentType.ANNUAL_REPORT]: [
    /rapport\s+annuel/gi,
    /annual\s+report/gi,
    /document\s+de\s+référence/gi,
    /rapport\s+de\s+gestion/gi
  ],

  [HRDocumentType.URD]: [
    /document\s+d['']enregistrement\s+universel/gi,
    /URD/g,
    /universal\s+registration\s+document/gi
  ]
};

/**
 * Parse number from French/English formatted string
 */
function parseNumber(value: string): number {
  // Remove spaces and handle both comma and period as decimal separator
  const cleaned = value.replace(/\s/g, '');

  // French format: 1 234,56 or 1.234,56
  if (cleaned.includes(',')) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  }

  // English format: 1,234.56 or 1234.56
  return parseFloat(cleaned.replace(/,/g, ''));
}

/**
 * Calculate year label (N-1, N-2, etc.)
 */
function getYearLabel(year: number, currentYear: number): string {
  const diff = currentYear - year;
  if (diff === 0) return 'N';
  if (diff === 1) return 'N-1';
  if (diff === 2) return 'N-2';
  if (diff === 3) return 'N-3';
  if (diff === 4) return 'N-4';
  if (diff === 5) return 'N-5';
  if (diff > 5) return `N-${diff}`;
  return `N+${Math.abs(diff)}`;
}

/**
 * Detect document type from text
 */
export function detectDocumentType(text: string): {
  primaryType: HRDocumentType;
  allDetected: HRDocumentType[];
  confidence: number;
} {
  const detected: { type: HRDocumentType; score: number }[] = [];

  for (const [type, patterns] of Object.entries(DOCUMENT_TYPE_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length;
      }
    }
    if (score > 0) {
      detected.push({ type: type as HRDocumentType, score });
    }
  }

  // Sort by score descending
  detected.sort((a, b) => b.score - a.score);

  if (detected.length === 0) {
    return {
      primaryType: HRDocumentType.UNKNOWN,
      allDetected: [],
      confidence: 0
    };
  }

  const totalScore = detected.reduce((sum, d) => sum + d.score, 0);
  const primaryConfidence = detected[0].score / totalScore;

  return {
    primaryType: detected[0].type,
    allDetected: detected.map(d => d.type),
    confidence: primaryConfidence
  };
}

/**
 * Extract year from text context
 */
function extractYearFromContext(
  text: string,
  matchIndex: number,
  currentYear: number
): number {
  // Look for year indicators in surrounding text (±200 chars)
  const contextStart = Math.max(0, matchIndex - 200);
  const contextEnd = Math.min(text.length, matchIndex + 200);
  const context = text.substring(contextStart, contextEnd);

  // Check for N-1, N-2, etc.
  if (/N-1|année\s+précédente|previous\s+year/i.test(context)) {
    return currentYear - 1;
  }
  if (/N-2|(?:il\s+y\s+a\s+)?2\s+ans|2\s+years\s+ago/i.test(context)) {
    return currentYear - 2;
  }
  if (/N-3|(?:il\s+y\s+a\s+)?3\s+ans|3\s+years\s+ago/i.test(context)) {
    return currentYear - 3;
  }

  // Check for explicit year (2022, 2023, etc.)
  const yearMatch = context.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    // Only accept recent years (within last 10 years)
    if (year >= currentYear - 10 && year <= currentYear) {
      return year;
    }
  }

  // Default to N-1 (most common case)
  return currentYear - 1;
}

/**
 * Extract HR metrics from text
 */
export function extractHRMetrics(
  text: string,
  config: HRExtractionConfig = DEFAULT_HR_CONFIG
): HRMetricsResult {
  const finalConfig = { ...DEFAULT_HR_CONFIG, ...config };
  const currentYear = finalConfig.currentYear!;

  if (finalConfig.verbose) {
    }

  // Detect document type
  const docTypeInfo = detectDocumentType(text);

  if (finalConfig.verbose) {
    .toFixed(1)}%)`);
  }

  const metrics: HRMetric[] = [];

  // Select patterns based on language priority
  const patternSets = finalConfig.languages!.map(lang => {
    if (lang === 'fr') return { lang: 'fr', patterns: FR_PATTERNS };
    if (lang === 'en') return { lang: 'en', patterns: EN_PATTERNS };
    return null;
  }).filter(Boolean) as { lang: string; patterns: typeof FR_PATTERNS }[];

  // Extract metrics using each pattern set
  for (const { lang, patterns } of patternSets) {
    // Average working hours (direct mentions)
    for (const pattern of patterns.averageWorkingHours) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const value = parseNumber(match[1]);
        const year = extractYearFromContext(text, match.index, currentYear);

        if (value > 0 && value < 10000) { // Sanity check
          metrics.push({
            type: HREntityType.WORKING_HOURS_AVERAGE,
            value,
            unit: 'hours',
            year,
            yearLabel: getYearLabel(year, currentYear),
            confidence: 0.9, // High confidence for direct mentions
            source: match[0],
            position: { line: text.substring(0, match.index).split('\n').length }
          });
        }
      }
    }

    // Total hours
    for (const pattern of patterns.totalHours) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const value = parseNumber(match[1]);
        const year = extractYearFromContext(text, match.index, currentYear);

        if (value > 0) {
          metrics.push({
            type: HREntityType.TOTAL_HOURS,
            value,
            unit: 'hours',
            year,
            yearLabel: getYearLabel(year, currentYear),
            confidence: 0.85,
            source: match[0],
            position: { line: text.substring(0, match.index).split('\n').length }
          });
        }
      }
    }

    // FTE
    for (const pattern of patterns.fte) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const value = parseNumber(match[1]);
        const year = extractYearFromContext(text, match.index, currentYear);

        if (value > 0) {
          metrics.push({
            type: HREntityType.FTE_COUNT,
            value,
            unit: 'FTE',
            year,
            yearLabel: getYearLabel(year, currentYear),
            confidence: 0.85,
            source: match[0],
            position: { line: text.substring(0, match.index).split('\n').length }
          });
        }
      }
    }

    // Overtime
    for (const pattern of patterns.overtime) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const value = parseNumber(match[1]);
        const year = extractYearFromContext(text, match.index, currentYear);

        if (value > 0) {
          metrics.push({
            type: HREntityType.OVERTIME_HOURS,
            value,
            unit: 'hours',
            year,
            yearLabel: getYearLabel(year, currentYear),
            confidence: 0.8,
            source: match[0],
            position: { line: text.substring(0, match.index).split('\n').length }
          });
        }
      }
    }

    // Training hours
    for (const pattern of patterns.training) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const value = parseNumber(match[1]);
        const year = extractYearFromContext(text, match.index, currentYear);

        if (value > 0) {
          metrics.push({
            type: HREntityType.TRAINING_HOURS,
            value,
            unit: 'hours',
            year,
            yearLabel: getYearLabel(year, currentYear),
            confidence: 0.8,
            source: match[0],
            position: { line: text.substring(0, match.index).split('\n').length }
          });
        }
      }
    }
  }

  // Filter by confidence threshold
  const filteredMetrics = metrics.filter(m => m.confidence >= finalConfig.confidenceThreshold!);

  if (finalConfig.verbose) {
    `);
  }

  // Calculate average working hours per year
  const averageWorkingHoursByYear: { [year: number]: AverageWorkingHours } = {};
  const years = new Set<number>();

  // Group metrics by year
  const metricsByYear = new Map<number, HRMetric[]>();
  for (const metric of filteredMetrics) {
    if (!metricsByYear.has(metric.year)) {
      metricsByYear.set(metric.year, []);
    }
    metricsByYear.get(metric.year)!.push(metric);
    years.add(metric.year);
  }

  // Calculate average for each year
  for (const year of Array.from(years)) {
    const yearMetrics = metricsByYear.get(year)!;

    // Strategy 1: Look for direct average mentions
    const directAverages = yearMetrics.filter(m => m.type === HREntityType.WORKING_HOURS_AVERAGE);

    if (directAverages.length > 0) {
      // Use the highest confidence direct mention
      const best = directAverages.sort((a, b) => b.confidence - a.confidence)[0];

      const result: AverageWorkingHours = {
        year,
        yearLabel: getYearLabel(year, currentYear),
        averageHours: best.value,
        calculationMethod: 'direct',
        confidence: best.confidence,
        isValid: true,
        validationMessages: []
      };

      // Validate range
      if (finalConfig.enableValidation) {
        const { min, max } = finalConfig.validationRange!;
        if (result.averageHours < min || result.averageHours > max) {
          result.isValid = false;
          result.validationMessages.push(
            `Average working hours (${result.averageHours}h) outside expected range (${min}-${max}h)`
          );
        }
      }

      averageWorkingHoursByYear[year] = result;
    } else {
      // Strategy 2: Calculate from total hours / FTE
      const totalHoursMetrics = yearMetrics.filter(m => m.type === HREntityType.TOTAL_HOURS);
      const fteMetrics = yearMetrics.filter(m => m.type === HREntityType.FTE_COUNT);

      if (totalHoursMetrics.length > 0 && fteMetrics.length > 0) {
        // Use highest confidence values
        const totalHours = totalHoursMetrics.sort((a, b) => b.confidence - a.confidence)[0];
        const fte = fteMetrics.sort((a, b) => b.confidence - a.confidence)[0];

        if (fte.value > 0) {
          const averageHours = totalHours.value / fte.value;
          const confidence = Math.min(totalHours.confidence, fte.confidence) * 0.9; // Slightly lower for calculated

          const result: AverageWorkingHours = {
            year,
            yearLabel: getYearLabel(year, currentYear),
            averageHours,
            totalHours: totalHours.value,
            totalFTE: fte.value,
            calculationMethod: 'calculated',
            confidence,
            isValid: true,
            validationMessages: []
          };

          // Validate range
          if (finalConfig.enableValidation) {
            const { min, max } = finalConfig.validationRange!;
            if (result.averageHours < min || result.averageHours > max) {
              result.isValid = false;
              result.validationMessages.push(
                `Calculated average (${result.averageHours.toFixed(0)}h) outside expected range (${min}-${max}h). Check source data.`
              );
            }
          }

          averageWorkingHoursByYear[year] = result;
        }
      }
    }
  }

  const availableYears = Array.from(years).sort((a, b) => b - a);
  const latestYear = availableYears.length > 0 ? averageWorkingHoursByYear[availableYears[0]] : undefined;

  const result: HRMetricsResult = {
    documentType: docTypeInfo.primaryType,
    detectedTypes: docTypeInfo.allDetected,
    metrics: filteredMetrics,
    averageWorkingHours: averageWorkingHoursByYear,
    latestYear,
    availableYears,
    extractionDate: new Date().toISOString(),
    dataQuality: {
      totalMetricsFound: filteredMetrics.length,
      metricsWithHighConfidence: filteredMetrics.filter(m => m.confidence >= 0.8).length,
      yearsWithData: availableYears.length,
      hasSegmentedData: false // Will be enhanced in future
    }
  };

  if (finalConfig.verbose) {
    }`);
    .length} years`);
  }

  return result;
}

/**
 * Format HR metrics as summary
 */
export function formatHRMetricsSummary(result: HRMetricsResult): string {
  const lines: string[] = [];

  lines.push('\n👥 HR METRICS EXTRACTION SUMMARY');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push(`Document Type: ${result.documentType}`);
  if (result.detectedTypes.length > 1) {
    lines.push(`Other detected types: ${result.detectedTypes.slice(1).join(', ')}`);
  }
  lines.push(`Extraction Date: ${result.extractionDate}`);
  lines.push('');

  lines.push('📊 Data Quality:');
  lines.push(`   - Total metrics found: ${result.dataQuality.totalMetricsFound}`);
  lines.push(`   - High confidence metrics: ${result.dataQuality.metricsWithHighConfidence}`);
  lines.push(`   - Years with data: ${result.dataQuality.yearsWithData}`);
  lines.push('');

  if (result.availableYears.length > 0) {
    lines.push('⏰ AVERAGE WORKING HOURS PER EMPLOYEE:');
    lines.push('─────────────────────────────────────────');

    for (const year of result.availableYears) {
      const data = result.averageWorkingHours[year];
      if (data) {
        const validIcon = data.isValid ? '✅' : '⚠️';
        lines.push(`\n${data.yearLabel} (${year}) ${validIcon}`);
        lines.push(`   Average: ${data.averageHours.toFixed(0)} hours/year`);
        lines.push(`   Method: ${data.calculationMethod === 'direct' ? 'Direct mention' : 'Calculated (Total hrs ÷ FTE)'}`);
        lines.push(`   Confidence: ${(data.confidence * 100).toFixed(1)}%`);

        if (data.totalHours && data.totalFTE) {
          lines.push(`   Total Hours: ${data.totalHours.toLocaleString()}`);
          lines.push(`   Total FTE: ${data.totalFTE.toLocaleString()}`);
        }

        if (data.validationMessages.length > 0) {
          lines.push(`   Warnings:`);
          data.validationMessages.forEach(msg => {
            lines.push(`      - ${msg}`);
          });
        }
      }
    }
  } else {
    lines.push('⚠️  No average working hours data found');
  }

  lines.push('\n═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

/**
 * Get questionnaire answer for average working hours
 */
export function getAverageWorkingHoursAnswer(
  result: HRMetricsResult,
  targetYear?: number
): {
  year: number;
  yearLabel: string;
  averageHours: number | null;
  confidence: number;
  isValid: boolean;
  method: 'direct' | 'calculated' | 'not_found';
} {
  const year = targetYear || (result.latestYear?.year ?? new Date().getFullYear() - 1);
  const data = result.averageWorkingHours[year];

  if (!data) {
    return {
      year,
      yearLabel: getYearLabel(year, new Date().getFullYear()),
      averageHours: null,
      confidence: 0,
      isValid: false,
      method: 'not_found'
    };
  }

  return {
    year: data.year,
    yearLabel: data.yearLabel,
    averageHours: data.averageHours,
    confidence: data.confidence,
    isValid: data.isValid,
    method: data.calculationMethod
  };
}

/**
 * Business Line Enricher - Yearly Metrics Breakdown
 *
 * This module enriches business lines with detailed metrics broken down by year.
 * It associates FinancialDataPoints with their respective BusinessLines and
 * organizes metrics by fiscal year (N-1, N-2, N-3, etc.).
 *
 * Key Features:
 * - Link FinancialDataPoints to BusinessLines using fuzzy matching
 * - Group metrics by year (2023 = N-1, 2022 = N-2, etc.)
 * - Calculate budget, revenue, expenses, headcount per year per line
 * - Support for multiple years (N-1 to N-5)
 * - Automatic year detection and classification
 *
 * Phase: 2.6 (Business Line Yearly Metrics)
 * Date: 2025-11-23
 * Skill: Elite SaaS Developer
 */

import { BusinessLine, FinancialDataPoint } from './types';
import { calculateSimilarity } from './stringSimilarity';

/**
 * Yearly metrics for a business line
 */
export interface YearlyMetrics {
  year: number;              // Fiscal year (e.g., 2023)
  yearLabel: string;         // Human-readable label (e.g., "N-1", "N-2")
  revenue: number;           // Total revenue for this year
  expenses: number;          // Total expenses for this year
  budget: number;            // Budget (typically revenue, or specified KPI)
  profit: number;            // Calculated: revenue - expenses
  headcount: number;         // Employee count for this year
  dataPointCount: number;    // Number of data points for this year
  categories: {              // Breakdown by category
    [category: string]: number;
  };
}

/**
 * Enriched business line with yearly metrics
 */
export interface EnrichedBusinessLine extends BusinessLine {
  /**
   * Metrics broken down by year
   */
  metricsByYear: YearlyMetrics[];

  /**
   * Quick access to specific years
   */
  yearlyData: {
    [year: number]: YearlyMetrics;
  };

  /**
   * Latest year metrics (N-1)
   */
  latestYear?: YearlyMetrics;

  /**
   * Years available (sorted desc: 2023, 2022, 2021...)
   */
  availableYears: number[];

  /**
   * Total across all years (legacy compatibility)
   */
  totals: {
    revenue: number;
    expenses: number;
    budget: number;
    profit: number;
    headcount: number;
  };
}

/**
 * Configuration for enrichment process
 */
export interface EnrichmentConfig {
  /**
   * Similarity threshold for matching data points to business lines (0-1)
   * Default: 0.6
   */
  similarityThreshold?: number;

  /**
   * Current fiscal year (for N-1, N-2 calculation)
   * Default: current year
   */
  currentYear?: number;

  /**
   * Which category to use as "budget"
   * Default: "Revenue"
   */
  budgetCategory?: string;

  /**
   * Verbose logging
   * Default: false
   */
  verbose?: boolean;

  /**
   * Include zero-value years
   * Default: false (only include years with data)
   */
  includeEmptyYears?: boolean;
}

const DEFAULT_ENRICHMENT_CONFIG: EnrichmentConfig = {
  similarityThreshold: 0.6,
  currentYear: new Date().getFullYear(),
  budgetCategory: 'Revenue',
  verbose: false,
  includeEmptyYears: false
};

/**
 * Calculate year label (N-1, N-2, etc.)
 */
function getYearLabel(year: number, currentYear: number): string {
  const diff = currentYear - year;
  if (diff === 0) return 'N (Current)';
  if (diff === 1) return 'N-1';
  if (diff === 2) return 'N-2';
  if (diff === 3) return 'N-3';
  if (diff === 4) return 'N-4';
  if (diff === 5) return 'N-5';
  if (diff > 5) return `N-${diff}`;
  return `N+${Math.abs(diff)}`;
}

/**
 * Match a data point to a business line using fuzzy matching
 */
function matchDataPointToBusinessLine(
  dataPoint: FinancialDataPoint,
  businessLines: BusinessLine[],
  threshold: number
): BusinessLine | null {
  // If data point already has businessLine field, use it for exact match
  if (dataPoint.businessLine) {
    const exactMatch = businessLines.find(bl =>
      bl.name.toLowerCase() === dataPoint.businessLine?.toLowerCase()
    );
    if (exactMatch) return exactMatch;
  }

  // Try fuzzy matching based on context or nearby text
  // This is a heuristic approach - could be improved with ML
  let bestMatch: BusinessLine | null = null;
  let bestScore = 0;

  for (const businessLine of businessLines) {
    // Calculate similarity between data point context and business line name
    const contextText = [
      dataPoint.businessLine || '',
      dataPoint.category || '',
      // Could add more context from original cell position
    ].join(' ').toLowerCase();

    const score = calculateSimilarity(contextText, businessLine.name.toLowerCase());

    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = businessLine;
    }
  }

  return bestMatch;
}

/**
 * Enrich business lines with yearly metrics
 *
 * This is the main function that associates financial data points with business lines
 * and organizes them by fiscal year.
 */
export function enrichBusinessLinesWithYearlyMetrics(
  businessLines: BusinessLine[],
  dataPoints: FinancialDataPoint[],
  config: EnrichmentConfig = DEFAULT_ENRICHMENT_CONFIG
): EnrichedBusinessLine[] {
  const finalConfig = { ...DEFAULT_ENRICHMENT_CONFIG, ...config };

  if (finalConfig.verbose) {
    }

  const enrichedLines: EnrichedBusinessLine[] = [];

  for (const businessLine of businessLines) {
    // Find all data points for this business line
    const lineDataPoints: FinancialDataPoint[] = [];

    // Strategy 1: Exact match on businessLine field
    const exactMatches = dataPoints.filter(dp =>
      dp.businessLine?.toLowerCase() === businessLine.name.toLowerCase()
    );
    lineDataPoints.push(...exactMatches);

    // Strategy 2: Fuzzy match if no exact matches
    if (exactMatches.length === 0 && finalConfig.similarityThreshold) {
      for (const dp of dataPoints) {
        if (!dp.businessLine) continue; // Skip if no business line context

        const score = calculateSimilarity(
          dp.businessLine.toLowerCase(),
          businessLine.name.toLowerCase()
        );

        if (score >= finalConfig.similarityThreshold) {
          lineDataPoints.push(dp);
        }
      }
    }

    // Strategy 3: If still no matches, try to infer from rawData
    // (This would require analyzing the original table structure)

    if (finalConfig.verbose && lineDataPoints.length > 0) {
      }

    // Group data points by year
    const yearGroups = new Map<number, FinancialDataPoint[]>();

    lineDataPoints.forEach(dp => {
      if (!yearGroups.has(dp.year)) {
        yearGroups.set(dp.year, []);
      }
      yearGroups.get(dp.year)!.push(dp);
    });

    // Calculate metrics for each year
    const metricsByYear: YearlyMetrics[] = [];
    const yearlyData: { [year: number]: YearlyMetrics } = {};

    // Get all years (sorted descending)
    const years = Array.from(yearGroups.keys()).sort((a, b) => b - a);

    for (const year of years) {
      const yearDataPoints = yearGroups.get(year)!;

      // Aggregate by category
      const categoryTotals: { [category: string]: number } = {};
      let revenue = 0;
      let expenses = 0;
      let budget = 0;
      let headcount = 0;

      yearDataPoints.forEach(dp => {
        const category = dp.category;
        const amount = dp.amount;

        // Add to category totals
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;

        // Special handling for key metrics
        if (category.toLowerCase().includes('revenue') ||
            category.toLowerCase().includes('sales') ||
            category.toLowerCase().includes('turnover') ||
            category.toLowerCase().includes('chiffre')) {
          revenue += amount;
        }

        if (category.toLowerCase().includes('expense') ||
            category.toLowerCase().includes('cost') ||
            category.toLowerCase().includes('charge') ||
            category.toLowerCase().includes('dépense')) {
          expenses += amount;
        }

        if (category.toLowerCase().includes('headcount') ||
            category.toLowerCase().includes('employee') ||
            category.toLowerCase().includes('effectif') ||
            category.toLowerCase().includes('fte')) {
          headcount = Math.max(headcount, amount); // Take max, not sum
        }

        // Budget = configured category (default: revenue)
        if (category.toLowerCase().includes(finalConfig.budgetCategory!.toLowerCase())) {
          budget += amount;
        }
      });

      // If no explicit budget category found, use revenue
      if (budget === 0 && revenue > 0) {
        budget = revenue;
      }

      const yearMetrics: YearlyMetrics = {
        year,
        yearLabel: getYearLabel(year, finalConfig.currentYear!),
        revenue,
        expenses,
        budget,
        profit: revenue - expenses,
        headcount,
        dataPointCount: yearDataPoints.length,
        categories: categoryTotals
      };

      metricsByYear.push(yearMetrics);
      yearlyData[year] = yearMetrics;
    }

    // Sort by year descending (latest first)
    metricsByYear.sort((a, b) => b.year - a.year);

    // Calculate totals
    const totals = {
      revenue: metricsByYear.reduce((sum, m) => sum + m.revenue, 0),
      expenses: metricsByYear.reduce((sum, m) => sum + m.expenses, 0),
      budget: metricsByYear.reduce((sum, m) => sum + m.budget, 0),
      profit: metricsByYear.reduce((sum, m) => sum + m.profit, 0),
      headcount: metricsByYear.length > 0 ? metricsByYear[0].headcount : 0 // Latest year
    };

    const enriched: EnrichedBusinessLine = {
      ...businessLine,
      metricsByYear,
      yearlyData,
      latestYear: metricsByYear.length > 0 ? metricsByYear[0] : undefined,
      availableYears: years,
      totals
    };

    enrichedLines.push(enriched);
  }

  if (finalConfig.verbose) {
    const totalYears = enrichedLines.reduce((sum, line) => sum + line.availableYears.length, 0);
    }

  return enrichedLines;
}

/**
 * Get metrics for a specific year across all business lines
 */
export function getMetricsForYear(
  enrichedLines: EnrichedBusinessLine[],
  year: number
): {
  businessLine: string;
  metrics: YearlyMetrics;
}[] {
  return enrichedLines
    .filter(line => line.yearlyData[year])
    .map(line => ({
      businessLine: line.name,
      metrics: line.yearlyData[year]
    }));
}

/**
 * Get N-1 metrics for all business lines
 */
export function getN1Metrics(
  enrichedLines: EnrichedBusinessLine[],
  currentYear?: number
): {
  businessLine: string;
  metrics: YearlyMetrics;
}[] {
  const year = (currentYear || new Date().getFullYear()) - 1;
  return getMetricsForYear(enrichedLines, year);
}

/**
 * Format enriched business lines as a summary table
 */
export function formatEnrichedBusinessLinesSummary(
  enrichedLines: EnrichedBusinessLine[],
  targetYear?: number
): string {
  const lines: string[] = [];

  lines.push('\n📊 ENRICHED BUSINESS LINES - YEARLY METRICS');
  lines.push('═══════════════════════════════════════════════════════════════');

  const currentYear = new Date().getFullYear();
  const displayYear = targetYear || currentYear - 1; // Default to N-1
  const yearLabel = getYearLabel(displayYear, currentYear);

  lines.push(`Target Year: ${displayYear} (${yearLabel})`);
  lines.push(`Total Business Lines: ${enrichedLines.length}`);
  lines.push('');

  enrichedLines.forEach((line, index) => {
    const yearMetrics = line.yearlyData[displayYear];

    lines.push(`\n${index + 1}. ${line.name}`);
    lines.push(`${'─'.repeat(60)}`);

    if (yearMetrics) {
      lines.push(`   Revenue (${yearLabel}): ${yearMetrics.revenue.toLocaleString('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}`);
      lines.push(`   Expenses (${yearLabel}): ${yearMetrics.expenses.toLocaleString('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}`);
      lines.push(`   Budget (${yearLabel}): ${yearMetrics.budget.toLocaleString('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}`);
      lines.push(`   Profit (${yearLabel}): ${yearMetrics.profit.toLocaleString('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}`);
      lines.push(`   Headcount (${yearLabel}): ${yearMetrics.headcount}`);
      lines.push(`   Data Points: ${yearMetrics.dataPointCount}`);
    } else {
      lines.push(`   ⚠️  No data for ${yearLabel}`);
    }

    // Show available years
    if (line.availableYears.length > 0) {
      const yearLabels = line.availableYears
        .map(y => `${y} (${getYearLabel(y, currentYear)})`)
        .join(', ');
      lines.push(`   Available Years: ${yearLabels}`);
    }
  });

  lines.push('\n═══════════════════════════════════════════════════════════════');
  lines.push('');

  return lines.join('\n');
}

/**
 * Export business lines to structured format for questionnaire
 *
 * This function formats the data to answer the specific questions:
 * - What is the name of business line N?
 * - What is the headcount of business line N?
 * - What is the N-1 budget for business line N?
 */
export function exportForQuestionnaire(
  enrichedLines: EnrichedBusinessLine[],
  currentYear?: number
): {
  lineNumber: number;
  name: string;
  headcount: number;
  budgetN1: number;
  revenueN1: number;
  expensesN1: number;
}[] {
  const year = (currentYear || new Date().getFullYear()) - 1; // N-1

  return enrichedLines.map((line, index) => {
    const n1Metrics = line.yearlyData[year];

    return {
      lineNumber: index + 1,
      name: line.name,
      headcount: n1Metrics?.headcount || 0,
      budgetN1: n1Metrics?.budget || 0,
      revenueN1: n1Metrics?.revenue || 0,
      expensesN1: n1Metrics?.expenses || 0
    };
  });
}

/**
 * Get specific answers for the questionnaire format
 */
export function getQuestionnaireAnswers(
  enrichedLines: EnrichedBusinessLine[],
  currentYear?: number
): string {
  const data = exportForQuestionnaire(enrichedLines, currentYear);
  const lines: string[] = [];

  lines.push('\n📋 QUESTIONNAIRE ANSWERS - BUSINESS LINES');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  data.forEach(item => {
    lines.push(`LIGNE D'ACTIVITÉ ${item.lineNumber}`);
    lines.push(`─────────────────────────────────────────`);
    lines.push(`Nom: ${item.name}`);
    lines.push(`Effectif: ${item.headcount}`);
    lines.push(`Budget N-1: ${item.budgetN1.toLocaleString('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}`);
    lines.push(`Revenus N-1: ${item.revenueN1.toLocaleString('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}`);
    lines.push(`Dépenses N-1: ${item.expensesN1.toLocaleString('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}`);
    lines.push('');
  });

  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

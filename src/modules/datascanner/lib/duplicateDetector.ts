// ============================================
// DUPLICATE DETECTOR - Find duplicate business lines
// ============================================

import { BusinessLine } from '../types';
import { calculateSimilarity, normalizeForComparison } from './stringSimilarity';

/**
 * Duplicate candidate with similarity score
 */
export interface DuplicateCandidate {
  businessLine: BusinessLine;
  similarity: number;
  matchType: 'name' | 'metrics' | 'both';
  reasons: string[];
}

/**
 * Duplicate group containing original and potential duplicates
 */
export interface DuplicateGroup {
  original: BusinessLine;
  duplicates: DuplicateCandidate[];
  confidence: number; // Overall confidence that these are duplicates (0-1)
}

/**
 * Complete duplicate detection report
 */
export interface DuplicateReport {
  groups: DuplicateGroup[];
  totalDuplicates: number;
  uniqueBusinessLines: number;
  timestamp: Date;
}

/**
 * Configuration for duplicate detection
 */
export interface DuplicateDetectionConfig {
  nameSimilarityThreshold: number;  // 0-1, default 0.85
  metricsTolerancePercent: number;  // Tolerance for numeric comparison, default 5%
  requireBothNameAndMetrics: boolean; // If true, requires both name AND metrics match
}

const DEFAULT_CONFIG: DuplicateDetectionConfig = {
  nameSimilarityThreshold: 0.85,
  metricsTolerancePercent: 5,
  requireBothNameAndMetrics: false
};

/**
 * Check if two numbers are approximately equal within tolerance
 */
function numbersApproximatelyEqual(
  num1: number | undefined,
  num2: number | undefined,
  tolerancePercent: number
): boolean {
  if (num1 === undefined || num2 === undefined) return false;
  if (num1 === num2) return true;

  const tolerance = Math.abs(num1) * (tolerancePercent / 100);
  return Math.abs(num1 - num2) <= tolerance;
}

/**
 * Calculate metrics similarity between two business lines
 * Returns 0-1 score based on how many metrics match
 */
function calculateMetricsSimilarity(
  bl1: BusinessLine,
  bl2: BusinessLine,
  tolerancePercent: number
): { similarity: number; matchingMetrics: string[] } {
  const metricsToCompare = ['headcount', 'budgetN1', 'revenue', 'expenses'];
  let matchCount = 0;
  let totalComparisons = 0;
  const matchingMetrics: string[] = [];

  for (const metric of metricsToCompare) {
    const val1 = bl1.metrics[metric];
    const val2 = bl2.metrics[metric];

    // Only compare if both have the metric
    if (val1 !== undefined && val2 !== undefined) {
      totalComparisons++;

      if (numbersApproximatelyEqual(val1, val2, tolerancePercent)) {
        matchCount++;
        matchingMetrics.push(metric);
      }
    }
  }

  const similarity = totalComparisons > 0 ? matchCount / totalComparisons : 0;

  return { similarity, matchingMetrics };
}

/**
 * Detect if two business lines are duplicates
 */
function areDuplicates(
  bl1: BusinessLine,
  bl2: BusinessLine,
  config: DuplicateDetectionConfig
): DuplicateCandidate | null {
  const reasons: string[] = [];

  // 1. Check name similarity
  const nameSimilarity = calculateSimilarity(bl1.name, bl2.name);
  const nameMatch = nameSimilarity >= config.nameSimilarityThreshold;

  if (nameMatch) {
    reasons.push(`Name similarity: ${(nameSimilarity * 100).toFixed(1)}%`);
  }

  // 2. Check metrics similarity
  const { similarity: metricsSimilarity, matchingMetrics } = calculateMetricsSimilarity(
    bl1,
    bl2,
    config.metricsTolerancePercent
  );
  const metricsMatch = metricsSimilarity >= 0.75; // At least 75% of metrics match

  if (metricsMatch && matchingMetrics.length > 0) {
    reasons.push(
      `Matching metrics (${matchingMetrics.length}): ${matchingMetrics.join(', ')}`
    );
  }

  // 3. Determine if duplicate based on config
  let isDuplicate = false;
  let matchType: 'name' | 'metrics' | 'both' = 'name';

  if (config.requireBothNameAndMetrics) {
    isDuplicate = nameMatch && metricsMatch;
    if (isDuplicate) matchType = 'both';
  } else {
    isDuplicate = nameMatch || metricsMatch;
    if (nameMatch && metricsMatch) matchType = 'both';
    else if (nameMatch) matchType = 'name';
    else if (metricsMatch) matchType = 'metrics';
  }

  if (!isDuplicate) return null;

  // Calculate overall similarity
  const overallSimilarity = (nameSimilarity + metricsSimilarity) / 2;

  return {
    businessLine: bl2,
    similarity: overallSimilarity,
    matchType,
    reasons
  };
}

/**
 * Main duplicate detection function
 * Finds all duplicate business lines in the provided array
 */
export function detectDuplicates(
  businessLines: BusinessLine[],
  config: Partial<DuplicateDetectionConfig> = {}
): DuplicateReport {
  const fullConfig: DuplicateDetectionConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };

  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < businessLines.length; i++) {
    const original = businessLines[i];

    if (processed.has(original.id)) continue;

    const duplicates: DuplicateCandidate[] = [];

    // Compare with all subsequent business lines
    for (let j = i + 1; j < businessLines.length; j++) {
      const candidate = businessLines[j];

      if (processed.has(candidate.id)) continue;

      const duplicateMatch = areDuplicates(original, candidate, fullConfig);

      if (duplicateMatch) {
        duplicates.push(duplicateMatch);
        processed.add(candidate.id);
      }
    }

    if (duplicates.length > 0) {
      // Calculate group confidence (average of all duplicate similarities)
      const avgSimilarity =
        duplicates.reduce((sum, d) => sum + d.similarity, 0) / duplicates.length;

      groups.push({
        original,
        duplicates,
        confidence: avgSimilarity
      });

      processed.add(original.id);

      duplicates.forEach((dup, idx) => {
        .toFixed(1)}% similar)`);
        dup.reasons.forEach(reason => );
      });
    }
  }

  const totalDuplicates = groups.reduce((sum, g) => sum + g.duplicates.length, 0);
  const uniqueBusinessLines = businessLines.length - totalDuplicates;

  return {
    groups,
    totalDuplicates,
    uniqueBusinessLines,
    timestamp: new Date()
  };
}

/**
 * Get deduplicated list of business lines (removes duplicates, keeps originals)
 */
export function getDeduplicatedBusinessLines(
  businessLines: BusinessLine[],
  config: Partial<DuplicateDetectionConfig> = {}
): BusinessLine[] {
  const report = detectDuplicates(businessLines, config);

  // Create set of duplicate IDs
  const duplicateIds = new Set<string>();
  report.groups.forEach(group => {
    group.duplicates.forEach(dup => {
      duplicateIds.add(dup.businessLine.id);
    });
  });

  // Filter out duplicates
  return businessLines.filter(bl => !duplicateIds.has(bl.id));
}

/**
 * Merge duplicate business lines (combines metrics from duplicates)
 * Strategy: Keep original, but average metrics if duplicates have different values
 */
export function mergeDuplicates(
  original: BusinessLine,
  duplicates: DuplicateCandidate[]
): BusinessLine {
  const allBusinessLines = [original, ...duplicates.map(d => d.businessLine)];

  // Merge metrics by averaging
  const mergedMetrics: BusinessLine['metrics'] = { ...original.metrics };

  const metricsToMerge = ['headcount', 'budgetN1', 'revenue', 'expenses'];

  metricsToMerge.forEach(metricKey => {
    const values = allBusinessLines
      .map(bl => bl.metrics[metricKey])
      .filter((v): v is number => v !== undefined);

    if (values.length > 1) {
      // Average the values
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      mergedMetrics[metricKey] = Math.round(avg);
    }
  });

  return {
    ...original,
    metrics: mergedMetrics,
    confidence: Math.max(original.confidence, 0.95) // Increase confidence after merge
  };
}

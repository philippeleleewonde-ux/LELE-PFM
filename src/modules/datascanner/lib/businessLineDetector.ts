// ============================================
// BUSINESS LINE DETECTOR
// Detects structured tables with business lines and associated metrics
// Maximum 8 business lines per file
// ============================================

import Fuse from 'fuse.js';
import { BusinessLine, BUSINESS_LINE_KEYWORDS } from '../types';
import { extractYear } from './yearDetector';

/**
 * Column detection result
 */
interface DetectedColumn {
  index: number;
  type: 'name' | 'headcount' | 'budget' | 'revenue' | 'expenses';
  confidence: number;
  matchedKeyword: string;
  year?: number; // Year extracted from column header (e.g., "Revenue 2024" → 2024)
}

/**
 * Normalize text for matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '\'')
    .trim();
}

/**
 * Create Fuse.js instance for fuzzy column header matching
 */
function createColumnMatcher(keywords: readonly string[], threshold: number = 0.3) {
  return new Fuse(
    keywords.map(k => ({ keyword: k })),
    {
      keys: ['keyword'],
      threshold,
      ignoreLocation: true,
      includeScore: true,
      minMatchCharLength: 2,
      shouldSort: true,
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
 * Detect column type from header text
 * Also extracts year if present (e.g., "Revenue 2024" → year: 2024)
 */
function detectColumnType(headerText: string, threshold: number = 0.3): DetectedColumn | null {
  const normalized = normalizeText(headerText);

  // Try to extract year from header
  const year = extractYear(headerText);

  // Try to match name column
  const nameFuse = createColumnMatcher(BUSINESS_LINE_KEYWORDS.nameColumns, threshold);
  const nameResults = nameFuse.search(normalized);
  if (nameResults.length > 0 && nameResults[0].score !== undefined) {
    return {
      index: -1, // Will be set later
      type: 'name',
      confidence: 1 - nameResults[0].score,
      matchedKeyword: nameResults[0].item.keyword,
      year
    };
  }

  // Try to match headcount column
  const headcountFuse = createColumnMatcher(BUSINESS_LINE_KEYWORDS.headcountColumns, threshold);
  const headcountResults = headcountFuse.search(normalized);
  if (headcountResults.length > 0 && headcountResults[0].score !== undefined) {
    return {
      index: -1,
      type: 'headcount',
      confidence: 1 - headcountResults[0].score,
      matchedKeyword: headcountResults[0].item.keyword,
      year
    };
  }

  // Try to match budget column
  const budgetFuse = createColumnMatcher(BUSINESS_LINE_KEYWORDS.budgetColumns, threshold);
  const budgetResults = budgetFuse.search(normalized);
  if (budgetResults.length > 0 && budgetResults[0].score !== undefined) {
    return {
      index: -1,
      type: 'budget',
      confidence: 1 - budgetResults[0].score,
      matchedKeyword: budgetResults[0].item.keyword,
      year
    };
  }

  // Check for revenue/expenses keywords (reuse existing keywords)
  if (normalized.includes('revenue') || normalized.includes('revenus') ||
      normalized.includes('chiffre') || normalized.includes('ca') ||
      normalized.includes('ventes') || normalized.includes('sales')) {
    return {
      index: -1,
      type: 'revenue',
      confidence: 0.8,
      matchedKeyword: headerText,
      year
    };
  }

  if (normalized.includes('charges') || normalized.includes('depenses') ||
      normalized.includes('expenses') || normalized.includes('costs') ||
      normalized.includes('cout')) {
    return {
      index: -1,
      type: 'expenses',
      confidence: 0.8,
      matchedKeyword: headerText,
      year
    };
  }

  return null;
}

/**
 * Extract number from cell value
 */
function extractNumber(value: any): number | null {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    // Remove spaces, commas, and currency symbols
    const cleaned = value
      .replace(/\s/g, '')
      .replace(/,/g, '')
      .replace(/€/g, '')
      .replace(/\$/g, '')
      .replace(/£/g, '');

    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Main function to detect business lines from Excel sheet data
 * @param sheetData - Raw sheet data as 2D array
 * @param sheetName - Optional sheet name for traceability
 * @param maxBusinessLines - Maximum number of business lines to extract (default: 8)
 * @returns Array of detected business lines
 */
export function detectBusinessLines(
  sheetData: any[][],
  sheetName?: string,
  maxBusinessLines: number = 8
): BusinessLine[] {
  const businessLines: BusinessLine[] = [];
  const MAX_BUSINESS_LINES = maxBusinessLines;

  if (!sheetData || sheetData.length < 2) {
    return businessLines;
  }

  // Step 1: Find header row (search first 15 rows for better coverage)
  let headerRowIndex = -1;
  const detectedColumns: Map<number, DetectedColumn> = new Map();
  const MAX_HEADER_SEARCH_ROWS = 15;

  for (let rowIdx = 0; rowIdx < Math.min(MAX_HEADER_SEARCH_ROWS, sheetData.length); rowIdx++) {
    const row = sheetData[rowIdx];
    const columnsFound: DetectedColumn[] = [];

    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cellValue = row[colIdx];
      if (!cellValue || typeof cellValue !== 'string') continue;

      const detected = detectColumnType(cellValue, 0.4);
      if (detected) {
        detected.index = colIdx;
        columnsFound.push(detected);
      }
    }

    // We need at least a name column + 1 metric column
    const hasNameColumn = columnsFound.some(c => c.type === 'name');
    const hasMetricColumn = columnsFound.some(c =>
      c.type === 'headcount' || c.type === 'budget' ||
      c.type === 'revenue' || c.type === 'expenses'
    );

    if (hasNameColumn && hasMetricColumn) {
      headerRowIndex = rowIdx;
      columnsFound.forEach(col => detectedColumns.set(col.index, col));
      break;
    }
  }

  if (headerRowIndex === -1) {
    return businessLines;
  }

  // Step 2: Find name column index
  const nameColumn = Array.from(detectedColumns.values()).find(c => c.type === 'name');
  if (!nameColumn) {
    return businessLines;
  }

  // Step 3: Extract business lines from data rows
  const dataStartRow = headerRowIndex + 1;
  let extractedCount = 0;

  for (let rowIdx = dataStartRow; rowIdx < sheetData.length && extractedCount < MAX_BUSINESS_LINES; rowIdx++) {
    const row = sheetData[rowIdx];

    // Get business line name
    const nameValue = row[nameColumn.index];
    if (!nameValue || typeof nameValue !== 'string' || nameValue.trim().length === 0) {
      continue; // Skip empty rows
    }

    const businessLineName = nameValue.trim();

    // Skip if it looks like a total/subtotal row
    const nameLower = businessLineName.toLowerCase();
    if (nameLower.includes('total') || nameLower.includes('somme') ||
        nameLower.includes('sous-total') || nameLower.includes('subtotal')) {
      continue;
    }

    // Extract metrics from other columns
    const metrics: BusinessLine['metrics'] = {};
    const yearlyData: { [year: number]: any } = {};
    let hasAtLeastOneMetric = false;

    detectedColumns.forEach((colInfo, colIdx) => {
      if (colInfo.type === 'name') return;

      const cellValue = row[colIdx];
      const numValue = extractNumber(cellValue);

      if (numValue !== null && numValue > 0) {
        hasAtLeastOneMetric = true;

        // If column has a year, store in yearlyData
        if (colInfo.year) {
          if (!yearlyData[colInfo.year]) {
            yearlyData[colInfo.year] = {};
          }

          if (colInfo.type === 'headcount') {
            yearlyData[colInfo.year].headcount = numValue;
          } else if (colInfo.type === 'budget') {
            yearlyData[colInfo.year].budget = numValue;
          } else if (colInfo.type === 'revenue') {
            yearlyData[colInfo.year].revenue = numValue;
          } else if (colInfo.type === 'expenses') {
            yearlyData[colInfo.year].expenses = numValue;
          }
        } else {
          // No year specified, use as primary metrics
          if (colInfo.type === 'headcount') {
            metrics.headcount = numValue;
          } else if (colInfo.type === 'budget') {
            metrics.budgetN1 = numValue;
          } else if (colInfo.type === 'revenue') {
            metrics.revenue = numValue;
          } else if (colInfo.type === 'expenses') {
            metrics.expenses = numValue;
          }
        }
      }
    });

    // Only add if we have at least one valid metric
    if (!hasAtLeastOneMetric) {
      continue;
    }

    // Detect year from row data or use N-1
    const currentYear = new Date().getFullYear();
    let detectedYear = currentYear - 1; // Default to N-1

    // Try to find year in the row
    for (const cellValue of row) {
      if (typeof cellValue === 'string' || typeof cellValue === 'number') {
        const year = extractYear(String(cellValue));
        if (year) {
          detectedYear = year;
          break;
        }
      }
    }

    // Calculate average confidence
    const avgConfidence = Array.from(detectedColumns.values())
      .filter(c => c.type !== 'name')
      .reduce((sum, c) => sum + c.confidence, 0) /
      (detectedColumns.size - 1);

    const businessLine: BusinessLine = {
      id: `bl-${sheetName || 'sheet'}-${rowIdx}-${Date.now()}`,
      name: businessLineName,
      metrics,
      yearlyData: Object.keys(yearlyData).length > 0 ? yearlyData : undefined,
      year: detectedYear,
      confidence: Math.min(avgConfidence, 0.95), // Cap at 95%
      position: {
        row: rowIdx,
        col: nameColumn.index
      },
      sheetName
    };

    businessLines.push(businessLine);
    extractedCount++;

    }

  `);
  return businessLines;
}

/**
 * Detect business lines from multiple sheets
 * @param sheets - Array of sheet objects with name and data
 * @param maxBusinessLines - Maximum total business lines across all sheets (default: 8)
 * @returns Array of detected business lines (up to maxBusinessLines)
 */
export function detectBusinessLinesFromMultipleSheets(
  sheets: Array<{ name: string; data: any[][] }>,
  maxBusinessLines: number = 8
): BusinessLine[] {
  const MAX_BUSINESS_LINES = maxBusinessLines;
  const allBusinessLines: BusinessLine[] = [];

  for (const sheet of sheets) {
    if (allBusinessLines.length >= MAX_BUSINESS_LINES) {
      break;
    }

    const remaining = MAX_BUSINESS_LINES - allBusinessLines.length;
    const linesFromSheet = detectBusinessLines(sheet.data, sheet.name, remaining);

    // Take only what we need to reach the limit
    const linesToAdd = linesFromSheet.slice(0, remaining);
    allBusinessLines.push(...linesToAdd);

    if (linesToAdd.length > 0) {
      }
  }

  return allBusinessLines;
}

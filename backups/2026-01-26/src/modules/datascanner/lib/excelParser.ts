// ============================================
// EXCEL PARSER - Universal Multi-Mode Scanning Algorithm
// ============================================

import * as XLSX from 'xlsx';
import { matchKeyword } from './keywordMatcher';
import { extractYear, isInTargetRange } from './yearDetector';
import { detectBusinessLinesFromMultipleSheets } from './businessLineDetector';
import { parseCSVFile } from './csvParser';
import { validateBusinessLines, validateFinancialDataPoints, ValidationReport } from './dataValidator';
import { detectDuplicates, DuplicateReport } from './duplicateDetector';
// ⚠️ TEMPORARILY DISABLED: llmClassifier causes "superclass is not a constructor" error (classifier.js:30)
// import { classifyMultipleBusinessLines, LLMConfig } from './llmClassifier';
// import { BusinessLineClassification } from './classificationTypes';
type LLMConfig = any; // Temporary type placeholder
type BusinessLineClassification = any; // Temporary type placeholder
// ⚠️ TEMPORARILY DISABLED: pdfParser causes "superclass is not a constructor" error
// import { parsePDFAdvanced, tableToArray, PDFParseConfig, PDFParseResult } from './pdfParser';
type PDFParseConfig = any; // Temporary type placeholder
type PDFParseResult = any; // Temporary type placeholder
import { extractEntities, NamedEntity, NERConfig, TextPreprocessor } from './nerExtractor';
import { aggregateBusinessLines, AggregationConfig, AggregationResult } from './businessLineAggregator';
import { enrichBusinessLinesWithYearlyMetrics, EnrichmentConfig, EnrichedBusinessLine } from './businessLineEnricher';
import { extractHRMetrics, HRExtractionConfig, HRMetricsResult } from './hrMetricsExtractor';
import { extractULFromText, aggregate5YearUL, ULExtractionConfig, ULExtractionResult, UL5YearSummary } from './ulDataExtractor';
import { extractOpRiskLossFromText, OpRiskConfig, OpRiskLossResult } from './opRiskLossExtractor';
import { extractCreditCounterpartyRisk, CreditRiskConfig, CreditCounterpartyRiskResult } from './creditCounterpartyExtractor';
import { extractSettlementRisk, SettlementRiskConfig, SettlementRiskResult } from './settlementRiskExtractor';
import { extractLiquidityTransformation, LiquidityTransformationConfig, LiquidityTransformationResult } from './liquidityTransformationExtractor';
import { extractOrganizationalRisk, OrganizationalRiskConfig, OrganizationalRiskResult } from './organizationalRiskExtractor';
import { extractHealthInsuranceRisk, HealthInsuranceRiskConfig, HealthInsuranceRiskResult } from './healthInsuranceRiskExtractor';
import {
  CellData,
  FinancialDataPoint,
  BusinessLine,
  ScanDirection,
  ScanConfig,
  DEFAULT_SCAN_CONFIG
} from '../types';

// Scanning mode types
type ScanMode = 'table' | 'transposed' | 'scattered' | 'proximity';

interface ScanModeResult {
  mode: ScanMode;
  dataPoints: FinancialDataPoint[];
  confidence: number; // Overall confidence in this mode's results
}

/**
 * Parse Excel file to cell data matrix (single sheet)
 */
export async function parseExcelFile(file: File): Promise<CellData[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });

        // Use first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to matrix
        const matrix = sheetToMatrix(worksheet);
        resolve(matrix);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Parse ALL sheets from Excel file
 */
export async function parseExcelFileAllSheets(file: File): Promise<Map<string, CellData[][]>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const allSheets = new Map<string, CellData[][]>();

        : ${workbook.SheetNames.join(', ')}`);

        // Parse each sheet
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const matrix = sheetToMatrix(worksheet);
          allSheets.set(sheetName, matrix);
          }

        resolve(allSheets);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Convert XLSX worksheet to cell data matrix
 */
function sheetToMatrix(worksheet: XLSX.WorkSheet): CellData[][] {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const matrix: CellData[][] = [];

  for (let row = range.s.r; row <= range.e.r; row++) {
    const rowData: CellData[] = [];

    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];

      if (!cell) {
        rowData.push({
          row,
          col,
          value: '',
          type: 'empty'
        });
        continue;
      }

      let cellType: CellData['type'] = 'empty';
      let cellValue: string | number = '';

      if (cell.t === 'n') {
        cellType = 'number';
        cellValue = cell.v;
      } else if (cell.t === 's') {
        cellType = 'string';
        cellValue = cell.v;
      } else if (cell.t === 'd') {
        cellType = 'date';
        cellValue = cell.w || cell.v;
      } else {
        cellValue = cell.v || '';
      }

      rowData.push({
        row,
        col,
        value: cellValue,
        type: cellType
      });
    }

    matrix.push(rowData);
  }

  return matrix;
}

/**
 * Search in a specific direction from a cell
 */
function searchDirection(
  matrix: CellData[][],
  startRow: number,
  startCol: number,
  direction: ScanDirection,
  maxDistance: number
): CellData[] {
  const results: CellData[] = [];

  for (let i = 1; i <= maxDistance; i++) {
    let targetRow = startRow;
    let targetCol = startCol;

    switch (direction) {
      case 'right':
        targetCol += i;
        break;
      case 'left':
        targetCol -= i;
        break;
      case 'top':
        targetRow -= i;
        break;
      case 'bottom':
        targetRow += i;
        break;
    }

    // Check bounds
    if (
      targetRow < 0 ||
      targetRow >= matrix.length ||
      targetCol < 0 ||
      targetCol >= matrix[0].length
    ) {
      break;
    }

    const cell = matrix[targetRow][targetCol];
    if (cell && cell.type !== 'empty') {
      results.push(cell);
    }
  }

  return results;
}

/**
 * Extract number from cell value
 */
function extractNumber(value: string | number): number | null {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  // Remove common formatting: spaces, currency symbols, commas
  const cleaned = value
    .replace(/[€$£¥\s]/g, '')
    .replace(/,/g, '.');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * MODE 1: TABLE MODE (headers + data rows)
 * Optimized for Excel files with:
 * - Headers in first row (keywords)
 * - Years in first column
 * - Data in rows below headers
 */
function scanTableMode(
  matrix: CellData[][],
  config: ScanConfig
): ScanModeResult {
  const dataPoints: FinancialDataPoint[] = [];
  const headers: Map<number, { keyword: string; category: string; confidence: number }> = new Map();

  // Step 1: Find all financial keyword headers (usually in first few rows)
  for (let row = 0; row < Math.min(5, matrix.length); row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      const cell = matrix[row][col];
      if (cell.type === 'string' && cell.value) {
        const keywordMatch = matchKeyword(String(cell.value), config.fuzzyThreshold);
        if (keywordMatch) {
          headers.set(col, {
            keyword: keywordMatch.keyword,
            category: keywordMatch.category,
            confidence: keywordMatch.confidence
          });
          }
      }
    }
  }

  if (headers.size === 0) {
    return { mode: 'table', dataPoints: [], confidence: 0 };
  }

  // Step 2: Scan each row for year + amounts
  for (let row = 1; row < matrix.length; row++) {
    let yearInRow: number | null = null;

    for (let col = 0; col < Math.min(3, matrix[row].length); col++) {
      const year = extractYear(matrix[row][col].value);
      if (year && isInTargetRange(year)) {
        yearInRow = year;
        break;
      }
    }

    if (!yearInRow) continue;

    headers.forEach((headerInfo, col) => {
      if (col >= matrix[row].length) return;

      const cell = matrix[row][col];
      const amount = extractNumber(cell.value);

      if (amount !== null && amount > 0) {
        dataPoints.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category: headerInfo.category as any,
          keyword: headerInfo.keyword,
          amount,
          year: yearInRow,
          confidence: headerInfo.confidence,
          position: { row, col },
          validated: false,
          manuallyEdited: false
        });

        }
    });
  }

  // Calculate confidence based on data completeness
  const confidence = dataPoints.length > 0 ? 0.9 : 0;

  return { mode: 'table', dataPoints, confidence };
}

/**
 * MODE 2: TRANSPOSED TABLE MODE (keywords in first column, years in first row)
 * Optimized for Excel files with:
 * - Keywords in first column
 * - Years in first row
 * - Data in columns
 */
function scanTransposedMode(
  matrix: CellData[][],
  config: ScanConfig
): ScanModeResult {
  const dataPoints: FinancialDataPoint[] = [];
  const keywordRows: Map<number, { keyword: string; category: string; confidence: number }> = new Map();

  // Step 1: Find keywords in first few columns (usually first column)
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < Math.min(3, matrix[row].length); col++) {
      const cell = matrix[row][col];
      if (cell.type === 'string' && cell.value) {
        const keywordMatch = matchKeyword(String(cell.value), config.fuzzyThreshold);
        if (keywordMatch) {
          keywordRows.set(row, {
            keyword: keywordMatch.keyword,
            category: keywordMatch.category,
            confidence: keywordMatch.confidence
          });
          }
      }
    }
  }

  if (keywordRows.size === 0) {
    return { mode: 'transposed', dataPoints: [], confidence: 0 };
  }

  // Step 2: Find years in first few rows (usually first row)
  const yearColumns: Map<number, number> = new Map();

  for (let row = 0; row < Math.min(5, matrix.length); row++) {
    for (let col = 1; col < matrix[row].length; col++) {
      const year = extractYear(matrix[row][col].value);
      if (year && isInTargetRange(year)) {
        yearColumns.set(col, year);
        }
    }
  }

  if (yearColumns.size === 0) {
    return { mode: 'transposed', dataPoints: [], confidence: 0 };
  }

  // Step 3: Extract amounts from intersections
  keywordRows.forEach((keywordInfo, row) => {
    yearColumns.forEach((year, col) => {
      if (row >= matrix.length || col >= matrix[row].length) return;

      const cell = matrix[row][col];
      const amount = extractNumber(cell.value);

      if (amount !== null && amount > 0) {
        dataPoints.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category: keywordInfo.category as any,
          keyword: keywordInfo.keyword,
          amount,
          year,
          confidence: keywordInfo.confidence,
          position: { row, col },
          validated: false,
          manuallyEdited: false
        });

        }
    });
  });

  const confidence = dataPoints.length > 0 ? 0.85 : 0;

  return { mode: 'transposed', dataPoints, confidence };
}

/**
 * MODE 3: SCATTERED MODE (keywords and data not in structured grid)
 * Uses intelligent proximity search with context awareness
 */
function scanScatteredMode(
  matrix: CellData[][],
  config: ScanConfig
): ScanModeResult {
  const dataPoints: FinancialDataPoint[] = [];
  const processedCells = new Set<string>();

  // Find all keyword locations
  const keywordLocations: Array<{ row: number; col: number; keyword: string; category: string; confidence: number }> = [];

  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      const cell = matrix[row][col];
      if (cell.type === 'string' && cell.value) {
        const keywordMatch = matchKeyword(String(cell.value), config.fuzzyThreshold);
        if (keywordMatch) {
          keywordLocations.push({
            row,
            col,
            keyword: keywordMatch.keyword,
            category: keywordMatch.category,
            confidence: keywordMatch.confidence
          });
        }
      }
    }
  }

  // For each keyword, search in expanding radius
  for (const keywordLoc of keywordLocations) {
    const nearbyYears: Array<{ year: number; distance: number; row: number; col: number }> = [];
    const nearbyAmounts: Array<{ amount: number; distance: number; row: number; col: number }> = [];

    // Search in expanding spiral pattern
    for (let radius = 1; radius <= 20; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue; // Only check perimeter

          const targetRow = keywordLoc.row + dr;
          const targetCol = keywordLoc.col + dc;

          if (targetRow < 0 || targetRow >= matrix.length || targetCol < 0 || targetCol >= matrix[0].length) {
            continue;
          }

          const cell = matrix[targetRow][targetCol];
          const distance = Math.abs(dr) + Math.abs(dc);

          // Check for year
          const year = extractYear(cell.value);
          if (year && isInTargetRange(year)) {
            nearbyYears.push({ year, distance, row: targetRow, col: targetCol });
          }

          // Check for amount
          const amount = extractNumber(cell.value);
          if (amount !== null && amount > 0) {
            nearbyAmounts.push({ amount, distance, row: targetRow, col: targetCol });
          }
        }
      }
    }

    // Pair closest years with closest amounts
    for (const yearData of nearbyYears) {
      for (const amountData of nearbyAmounts) {
        // Prefer pairs that are close to each other
        const pairDistance = Math.abs(yearData.row - amountData.row) + Math.abs(yearData.col - amountData.col);

        if (pairDistance <= 5) { // Only pair if year and amount are close to each other
          const dataPointKey = `${keywordLoc.category}-${yearData.year}-${amountData.amount}`;

          if (!processedCells.has(dataPointKey)) {
            processedCells.add(dataPointKey);

            // Confidence decreases with distance
            const distanceConfidence = Math.max(0.5, 1 - (yearData.distance + amountData.distance) / 40);
            const finalConfidence = keywordLoc.confidence * distanceConfidence;

            dataPoints.push({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              category: keywordLoc.category as any,
              keyword: keywordLoc.keyword,
              amount: amountData.amount,
              year: yearData.year,
              confidence: finalConfidence,
              position: { row: keywordLoc.row, col: keywordLoc.col },
              validated: false,
              manuallyEdited: false
            });

            .toFixed(1)}%)`);
          }
        }
      }
    }
  }

  const confidence = dataPoints.length > 0 ? 0.7 : 0;

  return { mode: 'scattered', dataPoints, confidence };
}

/**
 * MODE 4: PROXIMITY MODE (classic 4-directional search - most flexible but lowest confidence)
 */
function scanProximityMode(
  matrix: CellData[][],
  config: ScanConfig
): ScanModeResult {
  const dataPoints: FinancialDataPoint[] = [];
  const processedCells = new Set<string>();

  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      const cell = matrix[row][col];

      if (cell.type === 'empty' || !cell.value) continue;

      const keywordMatch = matchKeyword(String(cell.value), config.fuzzyThreshold);
      if (!keywordMatch) continue;

      const surroundingCells: CellData[] = [];

      for (const direction of config.searchDirections) {
        const cells = searchDirection(matrix, row, col, direction, config.maxSearchDistance);
        surroundingCells.push(...cells);
      }

      const years: number[] = [];
      const amounts: number[] = [];

      for (const surroundingCell of surroundingCells) {
        const year = extractYear(surroundingCell.value);
        if (year && isInTargetRange(year)) {
          years.push(year);
        }

        const amount = extractNumber(surroundingCell.value);
        if (amount !== null && amount > 0) {
          amounts.push(amount);
        }
      }

      for (const year of years) {
        for (const amount of amounts) {
          const dataPointKey = `${keywordMatch.category}-${year}-${amount}`;

          if (!processedCells.has(dataPointKey)) {
            processedCells.add(dataPointKey);

            dataPoints.push({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              category: keywordMatch.category,
              keyword: keywordMatch.keyword,
              amount,
              year,
              confidence: keywordMatch.confidence * 0.6, // Lower confidence for proximity mode
              position: { row, col },
              validated: false,
              manuallyEdited: false
            });
          }
        }
      }
    }
  }

  const confidence = dataPoints.length > 0 ? 0.6 : 0;

  return { mode: 'proximity', dataPoints, confidence };
}

/**
 * UNIVERSAL MULTI-MODE SCANNER
 * Automatically tries all scanning modes and returns the best results
 */
export function scanExcelForFinancialData(
  matrix: CellData[][],
  config: ScanConfig = DEFAULT_SCAN_CONFIG
): FinancialDataPoint[] {
  // Run ALL scanning modes in parallel
  const allResults: ScanModeResult[] = [
    scanTableMode(matrix, config),
    scanTransposedMode(matrix, config),
    scanScatteredMode(matrix, config),
    scanProximityMode(matrix, config)
  ];

  // Log results from each mode
  allResults.forEach(result => {
    } ${result.mode.toUpperCase()}: ${result.dataPoints.length} points (confidence: ${(result.confidence * 100).toFixed(1)}%)`);
  });

  // Strategy 1: If any high-confidence mode found data, use it
  const highConfidenceResults = allResults.filter(r => r.confidence >= 0.8 && r.dataPoints.length > 0);

  if (highConfidenceResults.length > 0) {
    // Sort by confidence and take the best
    highConfidenceResults.sort((a, b) => b.confidence - a.confidence);
    const best = highConfidenceResults[0];
    } mode (highest confidence: ${(best.confidence * 100).toFixed(1)}%)`);
    return best.dataPoints;
  }

  // Strategy 2: Combine results from all modes that found something
  const validResults = allResults.filter(r => r.dataPoints.length > 0);

  if (validResults.length > 0) {
    ...`);

    // Merge and deduplicate data points
    const mergedDataPoints = new Map<string, FinancialDataPoint>();

    validResults.forEach(result => {
      result.dataPoints.forEach(dp => {
        const key = `${dp.category}-${dp.year}-${dp.amount}-${dp.keyword}`;

        // Keep the one with higher confidence
        if (!mergedDataPoints.has(key) || mergedDataPoints.get(key)!.confidence < dp.confidence) {
          mergedDataPoints.set(key, dp);
        }
      });
    });

    const finalDataPoints = Array.from(mergedDataPoints.values());
    return finalDataPoints;
  }

  // Strategy 3: No data found
  ');
  return [];
}

/**
 * Helper function to get emoji icon for each mode
 */
function getModeIcon(mode: ScanMode): string {
  switch (mode) {
    case 'table': return '📊';
    case 'transposed': return '🔄';
    case 'scattered': return '🔍';
    case 'proximity': return '📍';
    default: return '❓';
  }
}

/**
 * Main function: parse Excel file and extract financial data from ALL sheets
 */
export async function extractFinancialDataFromExcel(
  file: File,
  config: ScanConfig = DEFAULT_SCAN_CONFIG
): Promise<FinancialDataPoint[]> {
  try {
    // Parse ALL sheets
    const allSheets = await parseExcelFileAllSheets(file);
    const allDataPoints: FinancialDataPoint[] = [];

    // Scan each sheet
    let sheetIndex = 0;
    for (const [sheetName, matrix] of allSheets.entries()) {
      sheetIndex++;
      }`);
      }`);

      const sheetDataPoints = scanExcelForFinancialData(matrix, config);

      // Add sheet name to each data point for traceability
      sheetDataPoints.forEach(dp => {
        (dp as any).sheetName = sheetName;
      });

      allDataPoints.push(...sheetDataPoints);

      }

    }`);
    `);
    }\n`);

    return allDataPoints;
  } catch (error) {
    console.error('Error extracting financial data from Excel:', error);
    throw error;
  }
}

/**
 * Universal file parser: Handles Excel (.xlsx, .xls), CSV (.csv), and PDF (.pdf) files
 * Returns sheets as Map (CSV/PDF files are treated as single/multi sheet)
 */
async function parseUniversalFile(file: File, pdfConfig?: Partial<PDFParseConfig>): Promise<Map<string, CellData[][]>> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (fileExtension === 'csv') {
    const matrix = await parseCSVFile(file);
    const sheets = new Map<string, CellData[][]>();
    sheets.set('CSV Data', matrix);
    return sheets;
  } else if (fileExtension === 'pdf') {
    // ⚠️ TEMPORARILY DISABLED: PDF parsing causes "superclass is not a constructor" error
    throw new Error('PDF parsing is temporarily disabled due to technical issues. Please use Excel files (.xlsx) for now.');

    /* DISABLED CODE:
    const pdfResult = await parsePDFAdvanced(file, pdfConfig);
    const sheets = new Map<string, CellData[][]>();

    // Convert PDF tables to CellData format
    if (pdfResult.tables.length > 0) {
      pdfResult.tables.forEach((table, index) => {
        const rawData = tableToArray(table);
        const cellMatrix: CellData[][] = rawData.map(row =>
          row.map(cellValue => ({
            value: cellValue,
            type: typeof cellValue === 'number' ? 'number' : 'string'
          }))
        );
        sheets.set(`PDF Table ${index + 1} (Page ${table.pageNumber})`, cellMatrix);
      });
    } else {
      // No tables found, create simple text-based sheet
      const textMatrix: CellData[][] = [];
      const lineGroups = new Map<number, string[]>();

      // Group text by approximate line (Y position)
      pdfResult.textItems.forEach(item => {
        const lineKey = Math.round(item.y / 10);
        if (!lineGroups.has(lineKey)) {
          lineGroups.set(lineKey, []);
        }
        lineGroups.get(lineKey)!.push(item.text);
      });

      // Convert to matrix
      Array.from(lineGroups.values())
        .forEach(lineTexts => {
          textMatrix.push(lineTexts.map(text => ({ value: text, type: 'string' })));
        });

      sheets.set('PDF Content', textMatrix);
    }

    return sheets;
    */
  } else {
    // Excel file (.xlsx, .xls)
    return parseExcelFileAllSheets(file);
  }
}

/**
 * Enhanced function: Extract BOTH financial data points AND business lines
 * Supports Excel (.xlsx, .xls), CSV (.csv), and PDF (.pdf) files
 * Returns comprehensive results with business line detection (max 8 lines) and validation
 *
 * Phase 2.4: Now includes Named Entity Recognition (NER)
 * Phase 2.5: Now includes Business Line Aggregation (unlimited detection + 8 macro categories)
 * Phase 2.6: Now includes Business Line Yearly Metrics (N-1, N-2, etc.)
 * Phase 2.7: Now includes HR Metrics Extraction (average working hours, FTE, etc.)
 * Phase 2.8: Now includes UL Data Extraction (Unexpected Loss over 5 years)
 * Phase 2.9: Now includes Operational Risk Loss Data Extraction (Basel II, QIS 2 format)
 * Phase 2.10: Now includes Credit Counterparty Risk Extraction (Cost of Risk, NPL, Geographic, IFRS 9)
 * Phase 2.11: Now includes Settlement Risk Extraction (Payment/Transaction Processing Losses, Category 7)
 */
export async function extractFinancialDataAndBusinessLines(
  file: File,
  config: ScanConfig = DEFAULT_SCAN_CONFIG,
  llmConfig?: Partial<LLMConfig>,
  pdfConfig?: Partial<PDFParseConfig>,
  nerConfig?: Partial<NERConfig>,
  aggregationConfig?: Partial<AggregationConfig>,
  enrichmentConfig?: Partial<EnrichmentConfig>,
  hrConfig?: Partial<HRExtractionConfig>,
  ulConfig?: Partial<ULExtractionConfig>,
  opRiskConfig?: Partial<OpRiskConfig>,
  creditRiskConfig?: Partial<CreditRiskConfig>,
  settlementRiskConfig?: Partial<SettlementRiskConfig>,
  liquidityTransformationConfig?: Partial<LiquidityTransformationConfig>,
  organizationalRiskConfig?: Partial<OrganizationalRiskConfig>,
  healthInsuranceRiskConfig?: Partial<HealthInsuranceRiskConfig>
): Promise<{
  dataPoints: FinancialDataPoint[];
  businessLines: BusinessLine[];
  validation?: ValidationReport;
  duplicates?: DuplicateReport;
  classifications?: BusinessLineClassification[];
  pdfMetadata?: PDFParseResult; // Available only for PDF files
  entities?: NamedEntity[]; // Phase 2.4: Named entities extracted
  aggregation?: AggregationResult; // Phase 2.5: Business line aggregation (unlimited + 8 categories)
  enrichedBusinessLines?: EnrichedBusinessLine[]; // Phase 2.6: Yearly metrics breakdown
  hrMetrics?: HRMetricsResult; // Phase 2.7: HR metrics (average working hours, FTE, etc.)
  ulData?: ULExtractionResult; // Phase 2.8: UL data extraction (single document)
  ul5YearSummary?: UL5YearSummary; // Phase 2.8: UL 5-year aggregation (if multiple documents)
  opRiskLoss?: OpRiskLossResult; // Phase 2.9: Operational Risk Loss Data (Basel II)
  creditRisk?: CreditCounterpartyRiskResult; // Phase 2.10: Credit Counterparty Risk (Cost of Risk, NPL, Geographic)
  settlementRisk?: SettlementRiskResult; // Phase 2.11: Settlement Risk (Payment/Transaction Processing Losses)
  liquidityTransformation?: LiquidityTransformationResult; // Phase 2.12: Liquidity & Transformation Risk (LCR, NSFR, Maturity Gap)
  organizationalRisk?: OrganizationalRiskResult; // Phase 2.13: Organizational Risk (Workforce, Equipment, Environment)
  healthInsuranceRisk?: HealthInsuranceRiskResult; // Phase 2.14: Health & Insurance Risk (Combined Ratio, Solvency, Technical Performance)
}> {
  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileType = fileExtension === 'csv' ? 'CSV' : fileExtension === 'pdf' ? 'PDF' : 'Excel';

    ...`);

    // Parse ALL sheets (or single CSV sheet, or PDF tables)
    const allSheets = await parseUniversalFile(file, pdfConfig);
    const allDataPoints: FinancialDataPoint[] = [];

    // Prepare sheets data for business line detection
    const sheetsForBusinessLines: Array<{ name: string; data: any[][] }> = [];

    // Scan each sheet for financial data
    let sheetIndex = 0;
    for (const [sheetName, matrix] of allSheets.entries()) {
      sheetIndex++;
      }`);
      }`);

      const sheetDataPoints = scanExcelForFinancialData(matrix, config);

      // Add sheet name to each data point for traceability
      sheetDataPoints.forEach(dp => {
        (dp as any).sheetName = sheetName;
      });

      allDataPoints.push(...sheetDataPoints);

      // Prepare sheet data for business line detection
      // Convert CellData[][] to any[][] (raw values)
      const rawData = matrix.map(row => row.map(cell => cell.value));
      sheetsForBusinessLines.push({ name: sheetName, data: rawData });
    }

    }`);
    `);
    }\n`);

    // Detect business lines across all sheets (max 8)
    const businessLines = detectBusinessLinesFromMultipleSheets(sheetsForBusinessLines);
    \n`);

    // Detect duplicates
    let duplicateReport: DuplicateReport | undefined;

    if (businessLines.length > 1) {
      duplicateReport = detectDuplicates(businessLines, {
        nameSimilarityThreshold: 0.85,
        metricsTolerancePercent: 5,
        requireBothNameAndMetrics: false
      });
    }

    // Classify business lines using LLM (optional)
    let classifications: BusinessLineClassification[] | undefined;

    if (llmConfig && businessLines.length > 0) {
      // ⚠️ TEMPORARILY DISABLED: classifyMultipleBusinessLines causes "superclass is not a constructor" error
      classifications = undefined;

      /* DISABLED CODE:
      try {
        classifications = await classifyMultipleBusinessLines(
          businessLines,
          {
            companyName: file.name.split('.')[0], // Use filename as company context
          },
          llmConfig
        );
        } catch (error) {
        classifications = undefined;
      }
      */
    }

    // Validate data coherence
    let validationReport: ValidationReport | undefined;

    if (businessLines.length > 0 || allDataPoints.length > 0) {
      const blValidation = businessLines.length > 0 ? validateBusinessLines(businessLines) : null;
      const dpValidationResults = allDataPoints.length > 0 ? validateFinancialDataPoints(allDataPoints) : [];

      // Combine validation results
      if (blValidation) {
        validationReport = blValidation;
        // Add data point validation results to the report
        validationReport.warnings.push(...dpValidationResults.filter(r => r.severity === 'warning'));
        validationReport.errors.push(...dpValidationResults.filter(r => r.severity === 'error'));
        validationReport.info.push(...dpValidationResults.filter(r => r.severity === 'info'));
        validationReport.overallValid = validationReport.errors.length === 0;
      }
    }

    // Phase 2.4: Named Entity Recognition (optional)
    let entities: NamedEntity[] | undefined;

    if (nerConfig && allSheets.size > 0) {
      try {
        // Extract text from all sheets
        const allText: string[] = [];

        for (const [sheetName, matrix] of allSheets.entries()) {
          const sheetText = matrix
            .map(row => row.map(cell => String(cell.value || '')).join(' '))
            .join('\n');
          allText.push(sheetText);
        }

        const combinedText = allText.join('\n\n');

        // Preprocess text
        const preprocessedText = TextPreprocessor.normalizeWhitespace(combinedText);

        // Extract entities
        entities = extractEntities(preprocessedText, nerConfig);

        // Log entity summary
        const entityTypes = new Map<string, number>();
        entities.forEach(e => {
          entityTypes.set(e.type, (entityTypes.get(e.type) || 0) + 1);
        });

        entityTypes.forEach((count, type) => {
          });
      } catch (error) {
        entities = undefined;
      }
    }

    // Phase 2.5: Business Line Aggregation (optional)
    // If enabled, detect UNLIMITED business lines and aggregate into 8 macro categories
    let aggregation: AggregationResult | undefined;

    if (aggregationConfig) {
      try {
        // Re-detect business lines WITHOUT the 8-line limit
        const allBusinessLinesDetected = detectBusinessLinesFromMultipleSheets(
          sheetsForBusinessLines,
          999 // Effectively unlimited (instead of default 8)
        );

        `);

        // Aggregate into 8 macro categories
        aggregation = await aggregateBusinessLines(
          allBusinessLinesDetected,
          {
            ...aggregationConfig,
            llmConfig: llmConfig // Pass LLM config for intelligent classification
          },
          entities // Pass NER entities if available for semantic analysis
        );

        } catch (error) {
        aggregation = undefined;
      }
    }

    // Phase 2.6: Business Line Yearly Metrics Enrichment (optional)
    // If enabled, enrich business lines with metrics broken down by year (N-1, N-2, etc.)
    let enrichedBusinessLines: EnrichedBusinessLine[] | undefined;

    if (enrichmentConfig && businessLines.length > 0 && allDataPoints.length > 0) {
      try {
        enrichedBusinessLines = enrichBusinessLinesWithYearlyMetrics(
          businessLines,
          allDataPoints,
          enrichmentConfig
        );

        // Log summary
        const linesWithData = enrichedBusinessLines.filter(line => line.availableYears.length > 0);
        const totalYears = enrichedBusinessLines.reduce((sum, line) => sum + line.availableYears.length, 0);
        } catch (error) {
        enrichedBusinessLines = undefined;
      }
    }

    // Phase 2.7: HR Metrics Extraction (optional)
    // If enabled, extract HR-specific metrics like average working hours per employee
    let hrMetrics: HRMetricsResult | undefined;

    if (hrConfig && allSheets.size > 0) {
      try {
        // Extract text from all sheets
        const allText: string[] = [];

        for (const [sheetName, matrix] of allSheets.entries()) {
          const sheetText = matrix
            .map(row => row.map(cell => String(cell.value || '')).join(' '))
            .join('\n');
          allText.push(sheetText);
        }

        const combinedText = allText.join('\n\n');

        // Extract HR metrics
        hrMetrics = extractHRMetrics(combinedText, hrConfig);

        }`);

        if (hrMetrics.latestYear) {
          const n1 = hrMetrics.latestYear;
          : ${n1.averageHours.toFixed(0)}h/year`);
          } else {
          }
      } catch (error) {
        hrMetrics = undefined;
      }
    }

    // Phase 2.8: UL Data Extraction (optional)
    // If enabled, extract Unexpected Loss (UL) amounts from regulatory reports
    let ulData: ULExtractionResult | undefined;

    if (ulConfig && allSheets.size > 0) {
      try {
        // Extract text from all sheets
        const allText: string[] = [];

        for (const [sheetName, matrix] of allSheets.entries()) {
          const sheetText = matrix
            .map(row => row.map(cell => String(cell.value || '')).join(' '))
            .join('\n');
          allText.push(sheetText);
        }

        const combinedText = allText.join('\n\n');

        // Extract UL data
        ulData = extractULFromText(combinedText, ulConfig);

        if (ulData) {
          `);
          }M€`);
          }M€`);
          }M€`);
          }M€`);
          .toFixed(1)}%\n`);
        } else {
          }
      } catch (error) {
        ulData = undefined;
      }
    }

    // Phase 2.9: Operational Risk Loss Data Extraction (optional)
    // If enabled, extract OpRisk loss data following Basel II classification
    let opRiskLoss: OpRiskLossResult | undefined;

    if (opRiskConfig && allSheets.size > 0) {
      // Debug removed;
      try {
        // Extract text from all sheets
        const allText: string[] = [];

        for (const [sheetName, matrix] of allSheets.entries()) {
          const sheetText = matrix
            .map(row => row.map(cell => String(cell.value || '')).join(' '))
            .join('\n');
          allText.push(sheetText);
        }

        const combinedText = allText.join('\n\n');

        // Extract OpRisk loss data
        opRiskLoss = extractOpRiskLossFromText(combinedText, opRiskConfig);

        if (opRiskLoss) {
          }`);
          }M`);
          }M`);
          }M`);
          }%`);
          }%)`);
          }%)`);
          .toFixed(1)}%\n`);
        } else {
          }
      } catch (error) {
        opRiskLoss = undefined;
      }
    }

    // Phase 2.10: Credit Counterparty Risk Extraction (optional)
    // If enabled, extract credit/counterparty risk data (Cost of Risk, NPL, Geographic, IFRS 9)
    let creditRisk: CreditCounterpartyRiskResult | undefined;

    if (creditRiskConfig && allSheets.size > 0) {
      try {
        // Extract text from all sheets
        const allText: string[] = [];

        for (const [sheetName, matrix] of allSheets.entries()) {
          const sheetText = matrix
            .map(row => row.map(cell => String(cell.value || '')).join(' '))
            .join('\n');
          allText.push(sheetText);
        }

        const combinedText = allText.join('\n\n');

        // Extract credit risk data
        creditRisk = extractCreditCounterpartyRisk(combinedText, creditRiskConfig);

        if (creditRisk) {
          }`);
          : €${creditRisk.summary5Year.costOfRisk.totalCostOfRiskNet.toLocaleString()}M`);
          }M`);
          if (creditRisk.summary5Year.costOfRisk.averageBps > 0) {
            } bp`);
          }
          }%`);
          }%)`);
          .toFixed(1)}%\n`);
        } else {
          }
      } catch (error) {
        creditRisk = undefined;
      }
    }

    // Phase 2.11: Settlement Risk Extraction (optional)
    // If enabled, extract settlement/payment processing losses (Basel II Category 7)
    let settlementRisk: SettlementRiskResult | undefined;
    let liquidityTransformation: LiquidityTransformationResult | undefined;

    if (settlementRiskConfig && allSheets.size > 0) {
      // Debug removed;
      try {
        // Extract text from all sheets
        const allText: string[] = [];

        for (const [sheetName, matrix] of allSheets.entries()) {
          const sheetText = matrix
            .map(row => row.map(cell => String(cell.value || '')).join(' '))
            .join('\n');
          allText.push(sheetText);
        }

        const combinedText = allText.join('\n\n');

        // Extract settlement risk data
        settlementRisk = extractSettlementRisk(combinedText, settlementRiskConfig);

        if (settlementRisk) {
          }`);
          : €${settlementRisk.summary5Year.totalLosses5Y.toFixed(1)}M`);
          }M`);

          // Top error type
          const errorTypes = [
            { name: 'Settlement-Delivery', amount: settlementRisk.summary5Year.byErrorType.settlementDelivery },
            { name: 'Transaction Entry', amount: settlementRisk.summary5Year.byErrorType.transactionEntry },
            { name: 'Payment Processing', amount: settlementRisk.summary5Year.byErrorType.paymentProcessing },
            { name: 'Disputes', amount: settlementRisk.summary5Year.byErrorType.disputes },
            { name: 'Other Execution', amount: settlementRisk.summary5Year.byErrorType.otherExecution },
          ].sort((a, b) => b.amount - a.amount);

          if (errorTypes[0].amount > 0) {
            }M, ${settlementRisk.summary5Year.byErrorTypePercentage[errorTypes[0].name.toLowerCase().replace(/[- ]/g, '') as keyof typeof settlementRisk.summary5Year.byErrorTypePercentage].toFixed(1)}%)`);
          }

          }%)`);
          .toFixed(1)}%`);

          if (settlementRisk.validation.alerts.length > 0) {
            }
          } else {
          }
      } catch (error) {
        settlementRisk = undefined;
      }
    }

    // Phase 2.12: Liquidity & Transformation Risk Extraction (optional)
    // If enabled, extract LCR, NSFR, Liquidity Buffer, and Maturity Gap data
    if (liquidityTransformationConfig && allSheets.size > 0) {
      // Debug removed;
      try {
        // Extract text from all sheets
        const allText: string[] = [];

        for (const [sheetName, matrix] of allSheets.entries()) {
          const sheetText = matrix
            .map(row => row.map(cell => String(cell.value || '')).join(' '))
            .join('\n');
          allText.push(sheetText);
        }

        const combinedText = allText.join('\n\n');

        // Extract liquidity & transformation risk data
        liquidityTransformation = extractLiquidityTransformation(combinedText, liquidityTransformationConfig);

        if (liquidityTransformation) {
          }`);
          }%`);
          }%`);
          }Bn`);
          } pts`);
          } pts`);
          }%`);
          }%`);
          .toFixed(1)}%`);

          if (liquidityTransformation.validation.alerts.length > 0) {
            liquidityTransformation.validation.alerts.slice(0, 3).forEach(alert => {
              });
          }
          } else {
          }
      } catch (error) {
        liquidityTransformation = undefined;
      }
    }

    // Phase 2.13: Organizational Risk Extraction (optional)
    // If enabled, extract Workforce, Equipment, and Environment risk data
    let organizationalRisk: OrganizationalRiskResult | undefined;
    if (organizationalRiskConfig && allSheets.size > 0) {
      // Debug removed;
      try {
        // Extract text from all sheets
        const allText: string[] = [];

        for (const [sheetName, matrix] of allSheets.entries()) {
          const sheetText = matrix
            .map(row => row.map(cell => String(cell.value || '')).join(' '))
            .join('\n');
          allText.push(sheetText);
        }

        const combinedText = allText.join('\n\n');

        // Extract organizational risk data
        organizationalRisk = extractOrganizationalRisk(combinedText, organizationalRiskConfig);

        if (organizationalRisk) {
          }`);
          }M`);
          }M`);
          }M (${organizationalRisk.summary5Year.workforce.percentOfTotal.toFixed(1)}%)`);
          }M (${organizationalRisk.summary5Year.equipment.percentOfTotal.toFixed(1)}%)`);
          }M (${organizationalRisk.summary5Year.environment.percentOfTotal.toFixed(1)}%)`);
          }M)`);
          }%)`);
          .toFixed(1)}%`);

          if (organizationalRisk.summary5Year.topCosts.length > 0) {
            :`);
            organizationalRisk.summary5Year.topCosts.slice(0, 3).forEach((cost, idx) => {
              : €${cost.amount.toFixed(1)}M`);
            });
          }

          if (organizationalRisk.validation.alerts.length > 0) {
            organizationalRisk.validation.alerts.slice(0, 3).forEach(alert => {
              });
          }
          } else {
          }
      } catch (error) {
        organizationalRisk = undefined;
      }
    }

    // Phase 2.14: Health & Insurance Risk Extraction (optional)
    // If enabled, extract insurance/health risk data (auto-detects entity type: insurer/bank/employer)
    let healthInsuranceRisk: HealthInsuranceRiskResult | undefined;
    if (healthInsuranceRiskConfig && allSheets.size > 0) {
      // Debug removed;
      try {
        // Extract text from all sheets
        const allText: string[] = [];

        for (const [sheetName, matrix] of allSheets.entries()) {
          const sheetText = matrix
            .map(row => row.map(cell => String(cell.value || '')).join(' '))
            .join('\n');
          allText.push(sheetText);
        }

        const combinedText = allText.join('\n\n');

        // Extract health & insurance risk data (auto-detects type)
        healthInsuranceRisk = extractHealthInsuranceRisk(combinedText, healthInsuranceRiskConfig);

        if (healthInsuranceRisk) {
          .toFixed(1)}%)`);
          }`);

          // Type-specific output
          if (healthInsuranceRisk.entityType === 'insurance_company' && healthInsuranceRisk.insuranceCompanyData) {
            const summary = healthInsuranceRisk.insuranceCompanyData.summary5Year;
            }% ${summary.technicalPerformance.avgCombinedRatio < 100 ? '✓ (Profitable)' : '⚠️ (Loss)'}`);
            }M`);
            }% ${summary.solvency.alwaysCompliant ? '✓ (Compliant)' : '⚠️ (Non-compliant)'}`);
            }M (${summary.provisions.evolutionPercent >= 0 ? '+' : ''}${summary.provisions.evolutionPercent.toFixed(1)}%)`);
            }M (${summary.maliBoni.interpretation})`);
            if (healthInsuranceRisk.validation.alerts.length > 0) {
              healthInsuranceRisk.validation.alerts.slice(0, 3).forEach(alert => {
                });
            }
          } else if (healthInsuranceRisk.entityType === 'bank_with_insurance' && healthInsuranceRisk.bankInsuranceData) {
            const summary = healthInsuranceRisk.bankInsuranceData.summary5Year;
            }M`);
            }M`);
            }%`);
            }M (${summary.losses.yearsWithLosses} years)`);
            }% (${summary.nbiContribution.evolution})`);
            } else if (healthInsuranceRisk.entityType === 'employer' && healthInsuranceRisk.employerHealthData) {
            const summary = healthInsuranceRisk.employerHealthData.summary5Year;
            }M`);
            }M`);
            }%`);
            }M (${summary.retirementProvisions.evolutionPercent >= 0 ? '+' : ''}${summary.retirementProvisions.evolutionPercent.toFixed(1)}%)`);
            }

          .toFixed(1)}%`);
          } else {
          \n`);
        }
      } catch (error) {
        healthInsuranceRisk = undefined;
      }
    }

    return {
      dataPoints: allDataPoints,
      businessLines,
      validation: validationReport,
      duplicates: duplicateReport,
      classifications,
      entities,
      aggregation,
      enrichedBusinessLines,
      hrMetrics,
      ulData,
      opRiskLoss,
      creditRisk,
      settlementRisk,
      liquidityTransformation,
      organizationalRisk,
      healthInsuranceRisk
    };
  } catch (error) {
    console.error('Error extracting data from file:', error);
    throw error;
  }
}

/**
 * Utility: Get preview of Excel file (first 10 rows)
 */
export async function getExcelPreview(file: File): Promise<CellData[][]> {
  const matrix = await parseExcelFile(file);
  return matrix.slice(0, 10);
}

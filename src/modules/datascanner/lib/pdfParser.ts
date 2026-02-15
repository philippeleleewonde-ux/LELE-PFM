// ============================================
// PDF PARSER - Advanced Layout Analysis & OCR
// ============================================
//
// Phase 2.3 Features:
// - Layout analysis with PDF.js
// - OCR for scanned PDFs (Tesseract.js)
// - Intelligent table extraction
// - Multi-page processing (no limit)
// - Bounding box detection
// ============================================

import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions, version } from 'pdfjs-dist';
import type { PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api';
import { createWorker } from 'tesseract.js';
import type { Word as TesseractWord } from 'tesseract.js';
import { matchKeyword } from './keywordMatcher';
import { extractYear, isInTargetRange } from './yearDetector';
import {
  FinancialDataPoint,
  ScanConfig,
  DEFAULT_SCAN_CONFIG
} from '../types';

// Configure PDF.js worker (import GlobalWorkerOptions separately to avoid constructor issues)
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
}

/**
 * Advanced PDF parsing configuration
 */
export interface PDFParseConfig extends ScanConfig {
  /** Enable OCR for scanned PDFs */
  enableOCR?: boolean;
  /** OCR language(s) */
  ocrLanguage?: string;
  /** Minimum OCR confidence (0-100) */
  ocrConfidenceThreshold?: number;
  /** Enable table detection */
  enableTableDetection?: boolean;
  /** Extract images */
  extractImages?: boolean;
  /** Page range (null = all pages) */
  pageRange?: { start: number; end: number } | null;
  /** Verbose logging */
  verbose?: boolean;
}

const DEFAULT_PDF_PARSE_CONFIG: PDFParseConfig = {
  ...DEFAULT_SCAN_CONFIG,
  enableOCR: true,
  ocrLanguage: 'eng+fra',
  ocrConfidenceThreshold: 60,
  enableTableDetection: true,
  extractImages: false,
  pageRange: null,
  verbose: false
};

/**
 * Represents positioned text item from PDF
 */
export interface PDFTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  confidence?: number; // OCR only
  fontName?: string;
  fontSize?: number;
}

/**
 * Detected table structure
 */
export interface PDFTable {
  pageNumber: number;
  rows: PDFTableRow[];
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
}

export interface PDFTableRow {
  cells: PDFTableCell[];
  y: number;
}

export interface PDFTableCell {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  colIndex: number;
}

/**
 * Complete PDF parsing result
 */
export interface PDFParseResult {
  textItems: PDFTextItem[];
  tables: PDFTable[];
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creationDate?: Date;
  };
  isScanned: boolean;
}

/**
 * Check if PDF is scanned (has minimal text layer)
 */
async function isPDFScanned(pdf: PDFDocumentProxy, samplePages: number = 3): Promise<boolean> {
  const numPages = Math.min(pdf.numPages, samplePages);
  let totalTextLength = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    totalTextLength += textContent.items.reduce((sum: number, item: TextItem) => sum + (item.str?.length || 0), 0);
  }

  // Average < 50 chars/page = likely scanned
  return (totalTextLength / numPages) < 50;
}

/**
 * Extract text with positioning (advanced mode with layout analysis)
 */
async function extractTextWithPositions(
  pdf: PDFDocumentProxy,
  config: PDFParseConfig
): Promise<PDFTextItem[]> {
  const textItems: PDFTextItem[] = [];
  const startPage = config.pageRange?.start || 1;
  const endPage = config.pageRange?.end || pdf.numPages;

  if (config.verbose) {
    }

  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    textContent.items.forEach((item: TextItem) => {
      if (item.str && item.str.trim().length > 0) {
        const transform = item.transform;
        const x = transform[4];
        const y = viewport.height - transform[5]; // PDF y-axis is bottom-up

        textItems.push({
          text: item.str.trim(),
          x,
          y,
          width: item.width || 0,
          height: item.height || 0,
          pageNumber: pageNum,
          fontName: item.fontName,
          fontSize: Math.abs(transform[0])
        });
      }
    });

    if (config.verbose && textContent.items.length > 0) {
      }
  }

  return textItems;
}

/**
 * Perform OCR on scanned PDF using Tesseract.js
 */
async function performOCR(
  pdf: PDFDocumentProxy,
  config: PDFParseConfig
): Promise<PDFTextItem[]> {
  const textItems: PDFTextItem[] = [];
  const startPage = config.pageRange?.start || 1;
  const endPage = config.pageRange?.end || pdf.numPages;

  ...`);

  const worker = await createWorker(config.ocrLanguage || 'eng+fra');

  try {
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR

      // Render page to canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Perform OCR
      const { data } = await worker.recognize(canvas);

      }%`);

      // Extract words with positions
      data.words.forEach((word: TesseractWord) => {
        if (word.confidence >= (config.ocrConfidenceThreshold || 60)) {
          const bbox = word.bbox;
          textItems.push({
            text: word.text,
            x: bbox.x0 / 2,
            y: bbox.y0 / 2,
            width: (bbox.x1 - bbox.x0) / 2,
            height: (bbox.y1 - bbox.y0) / 2,
            pageNumber: pageNum,
            confidence: word.confidence
          });
        }
      });
    }
  } finally {
    await worker.terminate();
  }

  return textItems;
}

/**
 * Detect tables using layout analysis
 */
function detectTables(textItems: PDFTextItem[]): PDFTable[] {
  const tables: PDFTable[] = [];
  const pageGroups = new Map<number, PDFTextItem[]>();

  // Group by page
  textItems.forEach(item => {
    if (!pageGroups.has(item.pageNumber)) {
      pageGroups.set(item.pageNumber, []);
    }
    pageGroups.get(item.pageNumber)!.push(item);
  });

  // Analyze each page
  pageGroups.forEach((items, pageNum) => {
    const detectedTables = detectTablesOnPage(items, pageNum);
    tables.push(...detectedTables);
  });

  return tables;
}

/**
 * Detect tables on a single page
 */
function detectTablesOnPage(items: PDFTextItem[], pageNumber: number): PDFTable[] {
  if (items.length === 0) return [];

  // Sort by Y then X
  const sortedItems = [...items].sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) < 5) return a.x - b.x;
    return yDiff;
  });

  // Cluster into rows
  const rows: PDFTextItem[][] = [];
  let currentRow: PDFTextItem[] = [];
  let lastY = sortedItems[0]?.y || 0;

  sortedItems.forEach(item => {
    if (Math.abs(item.y - lastY) < 10) {
      currentRow.push(item);
    } else {
      if (currentRow.length > 0) rows.push(currentRow);
      currentRow = [item];
      lastY = item.y;
    }
  });
  if (currentRow.length > 0) rows.push(currentRow);

  // Find table regions
  const tables: PDFTable[] = [];
  let tableRows: PDFTextItem[][] = [];
  let lastColumnCount = 0;

  rows.forEach(row => {
    const columnCount = row.length;
    if (columnCount >= 2 && Math.abs(columnCount - lastColumnCount) <= 1) {
      tableRows.push(row);
    } else {
      if (tableRows.length >= 3) {
        tables.push(buildTableFromRows(tableRows, pageNumber));
      }
      tableRows = columnCount >= 2 ? [row] : [];
    }
    lastColumnCount = columnCount;
  });

  if (tableRows.length >= 3) {
    tables.push(buildTableFromRows(tableRows, pageNumber));
  }

  return tables;
}

/**
 * Build table structure from rows
 */
function buildTableFromRows(rowItems: PDFTextItem[][], pageNumber: number): PDFTable {
  const allXPositions = new Set<number>();
  rowItems.forEach(row => row.forEach(item => allXPositions.add(Math.round(item.x))));
  const columnPositions = Array.from(allXPositions).sort((a, b) => a - b);

  const tableRows: PDFTableRow[] = rowItems.map(rowItems => {
    const cells: PDFTableCell[] = rowItems.map(item => {
      const colIndex = columnPositions.findIndex(pos => Math.abs(pos - item.x) < 20);
      return {
        text: item.text,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        colIndex: colIndex >= 0 ? colIndex : 0
      };
    });
    cells.sort((a, b) => a.colIndex - b.colIndex);
    return { cells, y: rowItems[0]?.y || 0 };
  });

  const allX = rowItems.flat().map(item => item.x);
  const allY = rowItems.flat().map(item => item.y);
  const allWidths = rowItems.flat().map(item => item.x + item.width);
  const allHeights = rowItems.flat().map(item => item.y + item.height);

  const boundingBox = {
    x: Math.min(...allX),
    y: Math.min(...allY),
    width: Math.max(...allWidths) - Math.min(...allX),
    height: Math.max(...allHeights) - Math.min(...allY)
  };

  const confidence = calculateTableConfidence(tableRows);

  return { pageNumber, rows: tableRows, boundingBox, confidence };
}

/**
 * Calculate table confidence based on alignment
 */
function calculateTableConfidence(rows: PDFTableRow[]): number {
  if (rows.length < 2) return 0;

  const columnCounts = rows.map(row => row.cells.length);
  const avgColumns = columnCounts.reduce((sum, count) => sum + count, 0) / columnCounts.length;
  const columnVariance = columnCounts.reduce((sum, count) => sum + Math.pow(count - avgColumns, 2), 0) / columnCounts.length;

  const alignmentScore = Math.max(0, 100 - (columnVariance * 20));
  const structureScore = (rows.length >= 3 && avgColumns >= 2) ? 100 : 50;

  return (alignmentScore + structureScore) / 2;
}

/**
 * Convert table to 2D array (Excel-compatible format)
 */
export function tableToArray(table: PDFTable): string[][] {
  const maxCols = Math.max(...table.rows.map(row =>
    row.cells.length > 0 ? Math.max(...row.cells.map(c => c.colIndex)) + 1 : 0
  ));

  const result: string[][] = [];
  table.rows.forEach(row => {
    const rowArray: string[] = new Array(maxCols).fill('');
    row.cells.forEach(cell => {
      if (cell.colIndex < maxCols) {
        rowArray[cell.colIndex] = cell.text;
      }
    });
    result.push(rowArray);
  });

  return result;
}

/**
 * Main advanced PDF parsing function
 */
export async function parsePDFAdvanced(
  file: File,
  config: Partial<PDFParseConfig> = {}
): Promise<PDFParseResult> {
  const finalConfig: PDFParseConfig = { ...DEFAULT_PDF_PARSE_CONFIG, ...config };

  .toFixed(1)} KB)`);

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  // Extract metadata
  const metadata = await pdf.getMetadata();
  const pdfMetadata = {
    title: metadata.info?.Title,
    author: metadata.info?.Author,
    subject: metadata.info?.Subject,
    creationDate: metadata.info?.CreationDate ? new Date(metadata.info.CreationDate) : undefined
  };

  // Check if scanned
  const isScanned = await isPDFScanned(pdf);
  ' : 'Digital (text layer available)'}`);

  let textItems: PDFTextItem[] = [];

  // Extract text (with or without OCR)
  if (isScanned && finalConfig.enableOCR) {
    textItems = await performOCR(pdf, finalConfig);
    } else {
    textItems = await extractTextWithPositions(pdf, finalConfig);
    }

  // Detect tables
  let tables: PDFTable[] = [];
  if (finalConfig.enableTableDetection && textItems.length > 0) {
    tables = detectTables(textItems);
    if (finalConfig.verbose && tables.length > 0) {
      tables.forEach((table, index) => {
        }%`);
      });
    }
  }

  return {
    textItems,
    tables,
    pageCount: pdf.numPages,
    metadata: pdfMetadata,
    isScanned
  };
}

/**
 * Extract text content from ALL pages of PDF file (legacy function)
 * NO LIMIT on number of pages - scans entire document
 */
export async function extractTextFromPDF(file: File): Promise<Map<number, string>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

        - scanning ALL pages...`);

        const textByPage = new Map<number, string>();

        // Extract text from EVERY page (no limit)
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          const pageText = textContent.items
            .map((item: TextItem) => item.str)
            .join(' ');

          textByPage.set(pageNum, pageText);
          }

        resolve(textByPage);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse text to extract financial data with page number tracking
 * Uses regex patterns to find keyword-amount-year combinations
 */
function parseTextForFinancialData(
  pageNum: number,
  text: string,
  config: ScanConfig = DEFAULT_SCAN_CONFIG
): FinancialDataPoint[] {
  const dataPoints: FinancialDataPoint[] = [];

  // Split text into lines
  const lines = text.split(/\n|\r\n/);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    // Check if line contains financial keyword
    const keywordMatch = matchKeyword(line, config.fuzzyThreshold);
    if (!keywordMatch) {
      continue;
    }

    // Found keyword! Now search current line and nearby lines for amounts and years
    const searchLines = [
      line,
      lines[lineIndex - 1] || '',
      lines[lineIndex + 1] || '',
      lines[lineIndex - 2] || '',
      lines[lineIndex + 2] || ''
    ];

    const years: number[] = [];
    const amounts: number[] = [];

    for (const searchLine of searchLines) {
      // Extract years
      const yearMatches = searchLine.match(/\b(20\d{2}|19\d{2})\b/g);
      if (yearMatches) {
        for (const yearStr of yearMatches) {
          const year = parseInt(yearStr, 10);
          if (isInTargetRange(year)) {
            years.push(year);
          }
        }
      }

      // Extract amounts (numbers with optional currency symbols and formatting)
      const amountMatches = searchLine.match(/[€$£¥]?\s*(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)/g);
      if (amountMatches) {
        for (const amountStr of amountMatches) {
          const cleaned = amountStr
            .replace(/[€$£¥\s]/g, '')
            .replace(/,/g, '');

          const amount = parseFloat(cleaned);
          if (!isNaN(amount) && amount > 1000) { // Only amounts > 1000 to avoid small numbers
            amounts.push(amount);
          }
        }
      }
    }

    // Create data points by pairing years with amounts
    for (const year of years) {
      for (const amount of amounts) {
        dataPoints.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category: keywordMatch.category,
          keyword: keywordMatch.keyword,
          amount,
          year,
          confidence: keywordMatch.confidence * 0.75, // Slightly lower confidence for PDF
          position: { row: lineIndex, col: 0 },
          sheetName: `Page ${pageNum}`, // Store page number for traceability
          validated: false,
          manuallyEdited: false
        });

        }
    }
  }

  return dataPoints;
}

/**
 * Main function: extract financial data from ALL pages of PDF
 * NO LIMIT on number of pages - scans entire document
 */
export async function extractFinancialDataFromPDF(
  file: File,
  config: ScanConfig = DEFAULT_SCAN_CONFIG
): Promise<FinancialDataPoint[]> {
  try {
    const textByPage = await extractTextFromPDF(file);
    const allDataPoints: FinancialDataPoint[] = [];

    // Process EVERY page (no limit)
    let pageIndex = 0;
    for (const [pageNum, pageText] of textByPage.entries()) {
      pageIndex++;
      }`);
      }`);

      const pageDataPoints = parseTextForFinancialData(pageNum, pageText, config);
      allDataPoints.push(...pageDataPoints);

      }

    }`);
    `);
    }\n`);

    // Remove duplicates based on category-year-amount combination
    const uniqueDataPoints = deduplicateDataPoints(allDataPoints);

    return uniqueDataPoints;
  } catch (error) {
    console.error('Error extracting financial data from PDF:', error);
    throw error;
  }
}

/**
 * Remove duplicate data points
 */
function deduplicateDataPoints(dataPoints: FinancialDataPoint[]): FinancialDataPoint[] {
  const seen = new Set<string>();
  const unique: FinancialDataPoint[] = [];

  for (const dp of dataPoints) {
    const key = `${dp.category}-${dp.year}-${dp.amount}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(dp);
    }
  }

  return unique;
}

/**
 * Get preview of PDF file (first page text)
 */
export async function getPDFPreview(file: File): Promise<string> {
  const textByPage = await extractTextFromPDF(file);
  return textByPage.get(1) || '';
}

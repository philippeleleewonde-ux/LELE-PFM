// ============================================
// CSV PARSER - Parse CSV files to matrix format
// ============================================

import { CellData } from '../types';

/**
 * Parse CSV file to cell data matrix
 * CSV files are treated as single-sheet data
 */
export async function parseCSVFile(file: File): Promise<CellData[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          reject(new Error('Failed to read CSV file'));
          return;
        }

        // Split into lines
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }

        // Detect delimiter (comma, semicolon, tab)
        const delimiter = detectCSVDelimiter(lines[0]);

        // Parse CSV to matrix
        const matrix: CellData[][] = lines.map((line, rowIdx) => {
          const values = parseCSVLine(line, delimiter);

          return values.map((value, colIdx) => {
            // Determine cell type
            const trimmedValue = value.trim();
            let cellType: CellData['type'] = 'string';
            let cellValue: string | number = trimmedValue;

            if (trimmedValue.length === 0) {
              cellType = 'empty';
            } else {
              // Try to parse as number
              const numValue = parseFloat(trimmedValue.replace(/[,\s]/g, ''));
              if (!isNaN(numValue) && trimmedValue.match(/^-?\d+([,.\s]\d+)*(\.\d+)?$/)) {
                cellType = 'number';
                cellValue = numValue;
              }
            }

            return {
              row: rowIdx,
              col: colIdx,
              value: cellValue,
              type: cellType
            };
          });
        });

        resolve(matrix);
      } catch (error) {
        console.error('❌ CSV parsing error:', error);
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Detect CSV delimiter (comma, semicolon, tab, pipe)
 */
function detectCSVDelimiter(firstLine: string): string {
  const delimiters = [',', ';', '\t', '|'];
  let maxCount = 0;
  let detectedDelimiter = ',';

  delimiters.forEach(delimiter => {
    const count = firstLine.split(delimiter).length;
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  });

  const displayDelimiter = detectedDelimiter === '\t' ? '\\t (tab)' : `"${detectedDelimiter}"`;
  return detectedDelimiter;
}

/**
 * Parse a single CSV line handling quoted values
 * Supports RFC 4180 CSV format with quoted fields
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Handle escaped quotes ("")
      if (insideQuotes && line[i + 1] === '"') {
        currentValue += '"';
        i++; // Skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  // Add last value
  values.push(currentValue);

  // Remove surrounding quotes and trim
  return values.map(v => v.trim().replace(/^"|"$/g, ''));
}

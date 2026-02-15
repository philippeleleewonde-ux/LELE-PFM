// ============================================
// EXCEL PARSING UTILITIES - Shared across Zone 1, 2, 3 extractors
// Handles FR/EN number formats, accent-insensitive matching,
// merged cells, header detection, subtotal filtering
// ============================================

import * as XLSX from 'xlsx'

// -------------------------------------------
// Types
// -------------------------------------------

export interface CleanedSheetData {
  rows: Record<string, any>[]
  subtotalRows: Record<string, any>[]
  removedCount: number
  warnings: string[]
}

export interface DetectedDataRegion {
  headers: string[]
  dataRows: Record<string, any>[]
  headerRowIndex: number
  hasMergedCells: boolean
  warnings: string[]
}

interface ParseNumberOptions {
  allowPercentages?: boolean
}

interface CleanSheetOptions {
  /** Additional subtotal patterns to detect */
  extraSubtotalPatterns?: string[]
}

interface DetectDataRegionOptions {
  /** Additional header keywords to scan for */
  headerKeywords?: string[]
}

// -------------------------------------------
// 1. parseNumber
// -------------------------------------------

/**
 * Robust number parsing from Excel cell values.
 * Handles FR (1 234,56) and EN (1,234.56) formats, currency symbols,
 * K/M/Md multipliers, accounting parentheses, placeholders.
 */
export function parseNumber(value: any, options?: ParseNumberOptions): number {
  // Direct number
  if (typeof value === 'number') {
    if (isNaN(value)) return 0
    return value
  }

  // Null/undefined/empty
  if (value === null || value === undefined) return 0

  let str = String(value).trim()
  if (str === '') return 0

  // Placeholders
  if (/^[-–—]+$/.test(str) || /^n\/?a$/i.test(str)) return 0

  // Percentages: return 0 unless explicitly allowed
  if (str.endsWith('%')) {
    if (!options?.allowPercentages) return 0
    str = str.slice(0, -1).trim()
  }

  // Detect multiplier (must be checked before cleaning letters)
  let multiplier = 1
  // Md/md = milliards (billions) — must check before M
  if (/md/i.test(str)) {
    multiplier = 1e9
    str = str.replace(/md/gi, '')
  } else if (/m(?!d)/i.test(str)) {
    // M = millions (but not Md)
    multiplier = 1e6
    str = str.replace(/m/gi, '')
  }
  if (/k/i.test(str)) {
    multiplier = multiplier === 1 ? 1e3 : multiplier // don't override Md/M
    str = str.replace(/k/gi, '')
  }

  // Remove currency symbols and labels
  str = str.replace(/[€$]/g, '').replace(/EUR/gi, '').trim()

  // Detect negative: accounting parentheses (1,234) or leading minus
  let isNegative = false
  const parenMatch = str.match(/^\((.+)\)$/)
  if (parenMatch) {
    isNegative = true
    str = parenMatch[1].trim()
  } else if (str.startsWith('-')) {
    isNegative = true
    str = str.slice(1).trim()
  }

  // Remove non-breaking spaces and regular spaces (thousands separators in FR)
  str = str.replace(/[\s\u00A0]/g, '')

  // Determine decimal separator (FR vs EN vs continental)
  const hasComma = str.includes(',')
  const hasDot = str.includes('.')

  if (hasComma && hasDot) {
    // Both present: last separator = decimal
    const lastComma = str.lastIndexOf(',')
    const lastDot = str.lastIndexOf('.')
    if (lastComma > lastDot) {
      // FR/continental: 1.234,56
      str = str.replace(/\./g, '').replace(',', '.')
    } else {
      // EN: 1,234.56
      str = str.replace(/,/g, '')
    }
  } else if (hasComma && !hasDot) {
    // Only comma: check if thousands separator or decimal
    const afterComma = str.split(',')[1]
    if (afterComma && afterComma.length === 3 && /^\d{3}$/.test(afterComma)) {
      // Exactly 3 digits after comma = thousands separator (1,234 → 1234)
      str = str.replace(/,/g, '')
    } else {
      // Decimal comma (1,23 → 1.23)
      str = str.replace(',', '.')
    }
  }
  // Only dot or neither: standard parseFloat handles it

  const num = parseFloat(str)
  if (isNaN(num)) return 0

  return (isNegative ? -num : num) * multiplier
}

// -------------------------------------------
// 2. normalizeText
// -------------------------------------------

/**
 * Normalize text: trim, remove accents (NFD), collapse spaces, lowercase.
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

// -------------------------------------------
// 3. matchesKeywords
// -------------------------------------------

/**
 * Check if text matches any keyword (accent-insensitive, case-insensitive).
 */
export function matchesKeywords(text: string, keywords: string[]): boolean {
  const normalized = normalizeText(text)
  return keywords.some(kw => normalized.includes(normalizeText(kw)))
}

// -------------------------------------------
// 4. extractYear
// -------------------------------------------

/**
 * Extract a 4-digit year from a string or number.
 * Returns null if no valid year found.
 */
export function extractYear(value: any): number | null {
  if (value === null || value === undefined) return null

  if (typeof value === 'number') {
    if (value >= 1900 && value <= new Date().getFullYear() + 10) return value
    return null
  }

  const str = String(value).trim()
  const yearPattern = /\b(20\d{2}|19\d{2})\b/
  const match = str.match(yearPattern)

  if (match) {
    const year = parseInt(match[1], 10)
    if (year >= 1900 && year <= new Date().getFullYear() + 10) return year
  }

  return null
}

// -------------------------------------------
// 5. cleanSheetData
// -------------------------------------------

// Subtotal patterns (accent-insensitive via normalizeText)
const SUBTOTAL_PATTERNS = [
  'total', 'sous-total', 'sous total', 'sub-total', 'sub total',
  'grand total', 'dont:', 'dont :', 'of which', 'dont '
]

/**
 * Clean sheet data by removing subtotal and decorative rows.
 */
export function cleanSheetData(
  rows: Record<string, any>[],
  options?: CleanSheetOptions
): CleanedSheetData {
  const warnings: string[] = []
  const subtotalRows: Record<string, any>[] = []
  const cleanRows: Record<string, any>[] = []

  const patterns = [...SUBTOTAL_PATTERNS, ...(options?.extraSubtotalPatterns || [])]

  for (const row of rows) {
    const values = Object.values(row)

    // Skip decorative rows: all values empty or only separators
    const isDecorative = values.every(v => {
      const s = String(v).trim()
      return s === '' || /^[-=*]+$/.test(s)
    })
    if (isDecorative) continue

    // Check for subtotal rows: any text cell matches patterns or starts with =
    // Note: Object.values() sorts integer-like keys ('2024') before string keys,
    // so we must check ALL text values, not just the first one.
    const textValues = values
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)

    let isSubtotalRow = false
    for (const text of textValues) {
      // Lines starting with = (displayed formulas)
      if (text.trim().startsWith('=')) {
        isSubtotalRow = true
        break
      }
      // Check subtotal keyword patterns
      if (patterns.some(pattern => normalizeText(text).includes(normalizeText(pattern)))) {
        isSubtotalRow = true
        break
      }
    }
    if (isSubtotalRow) {
      subtotalRows.push(row)
      continue
    }

    cleanRows.push(row)
  }

  const removedCount = rows.length - cleanRows.length
  if (subtotalRows.length > 0) {
    warnings.push(`Filtered ${subtotalRows.length} subtotal/summary row(s)`)
  }
  if (removedCount - subtotalRows.length > 0) {
    warnings.push(`Removed ${removedCount - subtotalRows.length} decorative row(s)`)
  }

  return {
    rows: cleanRows,
    subtotalRows,
    removedCount,
    warnings
  }
}

// -------------------------------------------
// 6. detectDataRegion
// -------------------------------------------

// Default header keywords to detect the header row
const DEFAULT_HEADER_KEYWORDS = [
  'activite', 'activité', 'ca', 'chiffre', 'revenue', 'charges', 'expenses',
  'headcount', 'effectif', 'budget', 'risque', 'risk', 'description',
  'categorie', 'catégorie', 'libelle', 'libellé', 'label', 'montant',
  'amount', 'year', 'annee', 'année', 'period', 'période', 'ventes',
  'designation', 'désignation', 'intitule', 'intitulé', 'nom', 'name',
  'type', 'total', 'valeur', 'value'
]

/**
 * Detect the real data region in an Excel sheet.
 * Handles merged cells, offset headers (scans first 15 rows).
 */
export function detectDataRegion(
  sheet: XLSX.Sheet,
  options?: DetectDataRegionOptions
): DetectedDataRegion {
  const warnings: string[] = []
  let hasMergedCells = false

  // 1. Expand merged cells: copy source value to all covered cells
  const merges = sheet['!merges'] || []
  if (merges.length > 0) {
    hasMergedCells = true
    for (const merge of merges) {
      const sourceAddr = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c })
      const sourceCell = sheet[sourceAddr]
      if (!sourceCell) continue

      for (let r = merge.s.r; r <= merge.e.r; r++) {
        for (let c = merge.s.c; c <= merge.e.c; c++) {
          if (r === merge.s.r && c === merge.s.c) continue // skip source
          const addr = XLSX.utils.encode_cell({ r, c })
          sheet[addr] = { ...sourceCell }
        }
      }
    }
    if (merges.length > 0) {
      warnings.push(`Expanded ${merges.length} merged cell region(s)`)
    }
  }

  // 2. Read in raw mode (2D array, no header interpretation)
  const raw: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: ''
  })

  if (raw.length === 0) {
    return { headers: [], dataRows: [], headerRowIndex: 0, hasMergedCells, warnings }
  }

  // 3. Scan first 15 rows to find the header row
  const keywords = [
    ...DEFAULT_HEADER_KEYWORDS,
    ...(options?.headerKeywords || [])
  ]

  let bestHeaderIndex = 0
  let bestScore = 0

  const scanLimit = Math.min(15, raw.length)
  for (let i = 0; i < scanLimit; i++) {
    const row = raw[i]
    if (!row || !Array.isArray(row)) continue

    let score = 0
    for (const cell of row) {
      const cellText = normalizeText(String(cell))
      if (cellText === '') continue
      for (const kw of keywords) {
        if (cellText.includes(normalizeText(kw))) {
          score++
          break // count each cell only once
        }
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestHeaderIndex = i
    }
  }

  if (bestHeaderIndex > 0) {
    warnings.push(`Header detected at row ${bestHeaderIndex + 1} (skipped ${bestHeaderIndex} leading row(s))`)
  }

  // 4. Build headers from the detected header row
  const headerRow = raw[bestHeaderIndex] || []
  const headers: string[] = []
  const seenHeaders = new Map<string, number>()

  for (let c = 0; c < headerRow.length; c++) {
    let header = String(headerRow[c] || `Column_${c + 1}`).trim()
    if (header === '') header = `Column_${c + 1}`

    // Handle duplicate column names
    const count = seenHeaders.get(header) || 0
    if (count > 0) {
      header = `${header}_${count + 1}`
    }
    seenHeaders.set(header.replace(/_\d+$/, ''), count + 1)
    headers.push(header)
  }

  // 5. Build data rows as Record<string, any>
  const dataRows: Record<string, any>[] = []
  for (let i = bestHeaderIndex + 1; i < raw.length; i++) {
    const row = raw[i]
    if (!row || !Array.isArray(row)) continue

    // Skip completely empty rows
    const allEmpty = row.every(cell => String(cell).trim() === '')
    if (allEmpty) continue

    const record: Record<string, any> = {}
    for (let c = 0; c < headers.length; c++) {
      record[headers[c]] = c < row.length ? row[c] : ''
    }
    dataRows.push(record)
  }

  return {
    headers,
    dataRows,
    headerRowIndex: bestHeaderIndex,
    hasMergedCells,
    warnings
  }
}

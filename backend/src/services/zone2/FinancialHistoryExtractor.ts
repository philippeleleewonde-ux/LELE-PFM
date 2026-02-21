// ============================================
// ZONE 2 - FINANCIAL HISTORY EXTRACTOR
// Extrait heures annuelles + CA/Charges multi-années depuis Excel
// ============================================

import * as XLSX from 'xlsx'
import { parseNumber, matchesKeywords, extractYear, detectDataRegion, cleanSheetData } from '../../utils/excelParsing.ts'

// Keywords for revenue detection (FR + EN)
const REVENUE_KEYWORDS = [
  'chiffre d\'affaires', 'chiffre d affaires', 'ca', 'revenus', 'ventes',
  'produits', 'produits d\'exploitation', 'recettes', 'total des ventes',
  'revenue', 'revenues', 'sales', 'total sales', 'turnover', 'income',
  'gross revenue', 'total revenue', 'operating revenue', 'net revenue'
]

// Keywords for expenses detection (FR + EN)
const EXPENSES_KEYWORDS = [
  'charges', 'dépenses', 'depenses', 'coûts', 'couts', 'frais',
  'charges d\'exploitation', 'charges totales', 'total des charges',
  'expenses', 'costs', 'expenditure', 'operating expenses', 'total expenses',
  'total costs', 'opex', 'operational costs', 'cost of sales', 'COGS'
]

// Keywords for working hours detection
const HOURS_KEYWORDS = [
  'heures annuelles', 'heures travaillées', 'heures travaillees',
  'heures par personne', 'heures/personne', 'h/pers', 'h/an',
  'annual hours', 'working hours', 'hours per employee', 'hours per person',
  'durée annuelle', 'duree annuelle', 'temps de travail',
  'nombre d\'heures', 'nombre d heures', 'total heures'
]

interface ParsedWorkbook {
  workbook: XLSX.WorkBook
  filename: string
}

interface FinancialYear {
  year: number
  yearLabel: string
  sales: number
  spending: number
  confidence: number
}

interface Zone2ExtractionResult {
  annualHoursPerPerson: number
  hoursSource: 'extracted' | 'manual'
  financialYears: FinancialYear[]
  currency: string
  confidence: number
}

/**
 * Extract financial history from multiple workbooks
 */
export async function extractFinancialHistory(
  workbooks: ParsedWorkbook[]
): Promise<Zone2ExtractionResult> {
  console.log(`[Zone2] Processing ${workbooks.length} workbooks...`)

  const currentYear = new Date().getFullYear()
  let annualHoursPerPerson = 0
  let hoursSource: 'extracted' | 'manual' = 'manual'
  const yearlyData = new Map<number, { sales: number; spending: number; confidence: number }>()

  for (const { workbook, filename } of workbooks) {
    console.log(`[Zone2] Processing file: ${filename}`)

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]

      // Use detectDataRegion to handle merged cells and offset headers
      const region = detectDataRegion(sheet, {
        headerKeywords: [
          ...REVENUE_KEYWORDS, ...EXPENSES_KEYWORDS, ...HOURS_KEYWORDS
        ]
      })

      if (region.warnings.length > 0) {
        console.log(`  [Zone2] Sheet "${sheetName}": ${region.warnings.join(', ')}`)
      }

      // Clean subtotal rows
      const cleaned = cleanSheetData(region.dataRows)

      if (cleaned.warnings.length > 0) {
        console.log(`  [Zone2] Sheet "${sheetName}": ${cleaned.warnings.join(', ')}`)
      }

      const data = cleaned.rows
      if (data.length === 0) continue

      // Strategy 1: Detect years in column headers
      const headers = region.headers
      const yearColumns = new Map<number, string>()

      for (const header of headers) {
        const year = extractYear(header)
        if (year && year >= currentYear - 5 && year <= currentYear) {
          yearColumns.set(year, header)
        }
      }

      // Strategy 2: Scan rows for financial data
      for (const row of data) {
        // Check for hours per person
        for (const [key, value] of Object.entries(row)) {
          if (matchesKeywords(key, HOURS_KEYWORDS) || matchesKeywords(String(value), HOURS_KEYWORDS)) {
            // Look for a numeric value in the same row
            for (const val of Object.values(row)) {
              const num = parseNumber(val)
              if (num >= 100 && num <= 3000) { // Valid range for annual hours
                annualHoursPerPerson = num
                hoursSource = 'extracted'
              }
            }
          }
        }

        // Check for revenue/expenses rows
        // Note: Object.values() sorts integer-like keys ('2024') before string keys,
        // so we find the label column by using the first non-year header
        const labelHeader = headers.find(h => !extractYear(h))
        const rowLabel = String(labelHeader ? row[labelHeader] : Object.values(row)[0] || '').trim()
        const isRevenue = matchesKeywords(rowLabel, REVENUE_KEYWORDS)
        const isExpenses = matchesKeywords(rowLabel, EXPENSES_KEYWORDS)

        if (!isRevenue && !isExpenses) continue

        // If we have year columns, extract values per year
        if (yearColumns.size > 0) {
          for (const [year, colName] of yearColumns) {
            const value = parseNumber(row[colName])
            if (value > 0) {
              const existing = yearlyData.get(year) || { sales: 0, spending: 0, confidence: 0 }
              if (isRevenue) {
                existing.sales = value
                existing.confidence = Math.max(existing.confidence, 0.85)
              }
              if (isExpenses) {
                existing.spending = value
                existing.confidence = Math.max(existing.confidence, 0.85)
              }
              yearlyData.set(year, existing)
            }
          }
        } else {
          // Strategy 3: Look for numeric columns that could be year values
          for (const [key, value] of Object.entries(row)) {
            if (key === Object.keys(row)[0]) continue // Skip label column
            const num = parseNumber(value)
            if (num > 0) {
              const yearFromKey = extractYear(key)
              if (yearFromKey) {
                const existing = yearlyData.get(yearFromKey) || { sales: 0, spending: 0, confidence: 0 }
                if (isRevenue) existing.sales = num
                if (isExpenses) existing.spending = num
                existing.confidence = 0.7
                yearlyData.set(yearFromKey, existing)
              }
            }
          }
        }
      }
    }
  }

  // Convert to sorted array and label years
  const financialYears: FinancialYear[] = Array.from(yearlyData.entries())
    .filter(([year]) => year >= currentYear - 5 && year <= currentYear)
    .sort((a, b) => b[0] - a[0]) // Most recent first
    .slice(0, 5)
    .map(([year, data]) => ({
      year,
      yearLabel: `N-${currentYear - year}`,
      sales: data.sales,
      spending: data.spending,
      confidence: data.confidence
    }))

  // Calculate overall confidence
  const avgConfidence = financialYears.length > 0
    ? financialYears.reduce((sum, fy) => sum + fy.confidence, 0) / financialYears.length
    : 0

  console.log(`[Zone2] Extracted: ${financialYears.length} years, hours=${annualHoursPerPerson}`)

  return {
    annualHoursPerPerson,
    hoursSource,
    financialYears,
    currency: 'EUR',
    confidence: avgConfidence
  }
}

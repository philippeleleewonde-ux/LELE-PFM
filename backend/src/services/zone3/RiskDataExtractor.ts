// ============================================
// ZONE 3 - RISK DATA EXTRACTOR
// Orchestre les 7 extracteurs existants pour extraire les données de risque
// Les extracteurs sont côté frontend (src/modules/datascanner/lib/)
// Ce service backend convertit les workbooks en texte pour analyse côté client
// ============================================

import * as XLSX from 'xlsx'
import { parseNumber, matchesKeywords } from '../../utils/excelParsing.ts'

interface RiskCategoryValue {
  value: number
  confidence: number
}

interface Zone3ExtractionResult {
  totalUL: number
  yearsOfCollection: number
  riskCategories: {
    operationalRisk: RiskCategoryValue
    creditRisk: RiskCategoryValue
    marketRisk: RiskCategoryValue
    liquidityRisk: RiskCategoryValue
    reputationalRisk: RiskCategoryValue
    strategicRisk: RiskCategoryValue
  }
  confidence: number
}

// Risk-related keywords for detection
const UL_KEYWORDS = [
  'unexpected loss', 'UL', 'perte inattendue', 'perte non attendue',
  'capital requirement', 'exigence en capital', 'fonds propres'
]

const OP_RISK_KEYWORDS = [
  'operational risk', 'risque opérationnel', 'risque operationnel',
  'op risk', 'Basel II', 'Bâle II'
]

const CREDIT_RISK_KEYWORDS = [
  'credit risk', 'risque de crédit', 'risque de credit',
  'counterparty', 'contrepartie', 'EAD', 'PD', 'LGD'
]

const MARKET_RISK_KEYWORDS = [
  'market risk', 'risque de marché', 'risque de marche',
  'VaR', 'value at risk', 'settlement'
]

const LIQUIDITY_RISK_KEYWORDS = [
  'liquidity risk', 'risque de liquidité', 'risque de liquidite',
  'transformation', 'gap', 'maturity'
]

const REPUTATIONAL_RISK_KEYWORDS = [
  'reputational risk', 'risque de réputation', 'risque de reputation',
  'organizational', 'organisationnel', 'image', 'brand'
]

const STRATEGIC_RISK_KEYWORDS = [
  'strategic risk', 'risque stratégique', 'risque strategique',
  'insurance', 'assurance', 'health', 'santé'
]

/**
 * Convert workbook to text for analysis (tab-separated to avoid comma conflicts)
 */
function workbookToText(workbook: XLSX.WorkBook): string {
  const texts: string[] = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    texts.push(`--- Sheet: ${sheetName} ---`)
    texts.push(XLSX.utils.sheet_to_csv(sheet, { FS: '\t' }))
  }
  return texts.join('\n')
}

/**
 * Search for numeric values near risk keywords (accent-insensitive)
 */
function extractValueNearKeyword(text: string, keywords: string[]): { value: number; confidence: number } {
  const lines = text.split('\n')
  let bestValue = 0
  let bestConfidence = 0

  for (const line of lines) {
    const hasKeyword = matchesKeywords(line, keywords)

    if (hasKeyword) {
      // Split by tab and parse each cell
      const cells = line.split('\t')
      for (const cell of cells) {
        const num = parseNumber(cell.trim())
        if (num > 0 && num < 1e12) {
          if (num > bestValue) {
            bestValue = num
            bestConfidence = 0.7
          }
        }
      }
    }
  }

  return { value: bestValue, confidence: bestConfidence }
}

/**
 * Extract UL total and years of collection
 */
function extractULData(text: string): { totalUL: number; yearsOfCollection: number; confidence: number } {
  const result = extractValueNearKeyword(text, UL_KEYWORDS)

  // Try to detect years of collection
  let yearsOfCollection = 5 // Default
  const yearsMatch = text.match(/(\d+)\s*(ans?|years?)\s*(de\s*collect|of\s*collect|d['']historique)/i)
  if (yearsMatch) {
    yearsOfCollection = parseInt(yearsMatch[1], 10)
  }

  return {
    totalUL: result.value,
    yearsOfCollection,
    confidence: result.confidence
  }
}

/**
 * Extract risk data from multiple workbooks
 */
export async function extractRiskData(
  workbooks: Array<{ workbook: XLSX.WorkBook; filename: string }>
): Promise<Zone3ExtractionResult> {
  console.log(`[Zone3] Processing ${workbooks.length} workbooks for risk data...`)

  // Merge all text
  const allText = workbooks.map(wb => workbookToText(wb.workbook)).join('\n\n')

  // Extract UL data
  const ulData = extractULData(allText)

  // Extract each risk category
  const operationalRisk = extractValueNearKeyword(allText, OP_RISK_KEYWORDS)
  const creditRisk = extractValueNearKeyword(allText, CREDIT_RISK_KEYWORDS)
  const marketRisk = extractValueNearKeyword(allText, MARKET_RISK_KEYWORDS)
  const liquidityRisk = extractValueNearKeyword(allText, LIQUIDITY_RISK_KEYWORDS)
  const reputationalRisk = extractValueNearKeyword(allText, REPUTATIONAL_RISK_KEYWORDS)
  const strategicRisk = extractValueNearKeyword(allText, STRATEGIC_RISK_KEYWORDS)

  // Calculate overall confidence
  const allConfidences = [
    ulData.confidence,
    operationalRisk.confidence,
    creditRisk.confidence,
    marketRisk.confidence,
    liquidityRisk.confidence,
    reputationalRisk.confidence,
    strategicRisk.confidence
  ]
  const nonZeroConfidences = allConfidences.filter(c => c > 0)
  const avgConfidence = nonZeroConfidences.length > 0
    ? nonZeroConfidences.reduce((a, b) => a + b, 0) / nonZeroConfidences.length
    : 0

  console.log(`[Zone3] Extraction complete. UL=${ulData.totalUL}, confidence=${avgConfidence}`)

  return {
    totalUL: ulData.totalUL,
    yearsOfCollection: ulData.yearsOfCollection,
    riskCategories: {
      operationalRisk,
      creditRisk,
      marketRisk,
      liquidityRisk,
      reputationalRisk,
      strategicRisk
    },
    confidence: avgConfidence
  }
}

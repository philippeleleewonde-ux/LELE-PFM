// ============================================
// BUSINESS LINES EXTRACTOR - Zone 1 Extraction Service
// Extrait les business lines depuis fichiers Excel avec Gemini AI
// ============================================

import * as XLSX from 'xlsx'
import type { BusinessLine, ExtractionResult } from '../../types/datascanner.ts'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseNumber, matchesKeywords, detectDataRegion, cleanSheetData } from '../../utils/excelParsing.ts'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Keywords pour détecter les business lines
const BUSINESS_LINE_KEYWORDS = [
  'chiffre', 'affaires', 'ca', 'revenue', 'ventes',
  'production', 'prestations', 'services',
  'activité', 'business', 'line', 'secteur'
]

const REVENUE_KEYWORDS = ['ca', 'chiffre', 'revenue', 'ventes', 'produits']
const HEADCOUNT_KEYWORDS = ['effectif', 'headcount', 'fte', 'collaborateurs', 'salariés']
const TEAM_COUNT_KEYWORDS = ['equipe', 'équipe', 'team', 'teams', 'équipes', 'equipes', 'nombre d\'équipes', 'nb equipes', 'nb équipes']
const BUDGET_KEYWORDS = ['budget', 'dotation', 'enveloppe', 'allocation', 'budget alloué', 'budget annuel', 'montant budget']

interface ParsedWorkbook {
  workbook: XLSX.WorkBook
  filename: string
}

/**
 * Extrait les business lines depuis plusieurs fichiers Excel
 */
export async function extractBusinessLinesFromMultipleFiles(
  workbooks: ParsedWorkbook[],
  options: { useGemini?: boolean } = {}
): Promise<ExtractionResult> {
  console.log(`📊 [Extractor] Processing ${workbooks.length} workbooks...`)

  const allLines: BusinessLine[] = []

  for (const { workbook, filename } of workbooks) {
    console.log(`📄 [Extractor] Processing file: ${filename}`)
    const lines = extractLinesFromWorkbook(workbook)
    allLines.push(...lines)
  }

  console.log(`✅ [Extractor] Extracted ${allLines.length} raw business lines`)

  // Si on a beaucoup de lignes, utiliser Gemini pour regrouper
  const needsRegrouping = allLines.length > 8
  let finalLines = allLines

  if (options.useGemini && needsRegrouping) {
    console.log('🤖 [Extractor] Using Gemini AI for intelligent regrouping...')
    try {
      finalLines = await regroupWithGemini(allLines)
      console.log(`✅ [Extractor] Gemini regrouped to ${finalLines.length} lines`)
    } catch (error) {
      console.error('❌ [Extractor] Gemini failed, using raw extraction:', error)
    }
  }

  return {
    total_lines: finalLines.length,
    business_lines: finalLines,
    confidence: needsRegrouping ? 0.75 : 0.9,
    needs_regrouping: needsRegrouping,
    extraction_method: options.useGemini ? 'llm' : 'keyword'
  }
}

/**
 * Extrait les lignes d'un workbook Excel
 */
function extractLinesFromWorkbook(workbook: XLSX.WorkBook): BusinessLine[] {
  const lines: BusinessLine[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]

    // Use detectDataRegion to handle merged cells and offset headers
    const region = detectDataRegion(sheet, {
      headerKeywords: [
        ...BUSINESS_LINE_KEYWORDS, ...REVENUE_KEYWORDS,
        ...HEADCOUNT_KEYWORDS, ...TEAM_COUNT_KEYWORDS, ...BUDGET_KEYWORDS
      ]
    })

    // Clean subtotal and decorative rows
    const cleaned = cleanSheetData(region.dataRows)

    if (region.warnings.length > 0) {
      console.log(`  📋 [Extractor] Sheet "${sheetName}": ${region.warnings.join(', ')}`)
    }
    if (cleaned.warnings.length > 0) {
      console.log(`  🧹 [Extractor] Sheet "${sheetName}": ${cleaned.warnings.join(', ')}`)
    }

    console.log(`  📋 [Extractor] Sheet "${sheetName}": ${cleaned.rows.length} data rows (${cleaned.removedCount} removed)`)

    for (let i = 0; i < cleaned.rows.length; i++) {
      const row = cleaned.rows[i]
      const line = tryExtractBusinessLine(row, i)
      if (line) {
        lines.push(line)
      }
    }
  }

  return lines
}

/**
 * Tente d'extraire une business line d'une row Excel
 */
function tryExtractBusinessLine(row: Record<string, any>, rowIndex: number): BusinessLine | null {
  let lineName: string | null = null
  let revenueN = 0
  let revenueNMinus1 = 0
  let headcountN: number | undefined
  let teamCount: number | undefined
  let budgetN: number | undefined

  for (const [key, value] of Object.entries(row)) {
    const valueLower = String(value).toLowerCase()

    // Détection du nom de ligne (accent-insensitive)
    if (!lineName && (matchesKeywords(key, BUSINESS_LINE_KEYWORDS) || matchesKeywords(valueLower, BUSINESS_LINE_KEYWORDS))) {
      if (typeof value === 'string' && value.trim().length > 0) {
        lineName = value.trim()
      }
    }

    // Détection des revenues (accent-insensitive)
    if (matchesKeywords(key, REVENUE_KEYWORDS)) {
      const num = parseNumber(value)
      if (num > 0) {
        if (matchesKeywords(key, ['n-1', 'précédent', 'previous'])) {
          revenueNMinus1 = num
        } else {
          revenueN = num
        }
      }
    }

    // Détection headcount (accent-insensitive)
    if (matchesKeywords(key, HEADCOUNT_KEYWORDS)) {
      const num = parseNumber(value)
      if (num > 0) {
        headcountN = num
      }
    }

    // Détection team count (accent-insensitive)
    if (matchesKeywords(key, TEAM_COUNT_KEYWORDS)) {
      const num = parseNumber(value)
      if (num > 0) {
        teamCount = num
      }
    }

    // Détection budget (accent-insensitive)
    if (matchesKeywords(key, BUDGET_KEYWORDS)) {
      const num = parseNumber(value)
      if (num > 0) {
        budgetN = num
      }
    }
  }

  // Si on a trouvé un nom et au moins un revenue, c'est une business line valide
  if (lineName && (revenueN > 0 || revenueNMinus1 > 0)) {
    return {
      line_name: lineName,
      revenue_n: revenueN,
      revenue_n_minus_1: revenueNMinus1,
      headcount_n: headcountN,
      team_count: teamCount,
      budget_n: budgetN,
      evolution_percent: revenueNMinus1 > 0
        ? ((revenueN - revenueNMinus1) / revenueNMinus1) * 100
        : 0,
      confidence: 0.8
    }
  }

  return null
}

/**
 * Regroupe les business lines avec Gemini AI
 */
async function regroupWithGemini(lines: BusinessLine[]): Promise<BusinessLine[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `Tu es un expert comptable français. On a extrait ${lines.length} lignes d'activités d'un fichier Excel.
Certaines lignes sont probablement redondantes ou doivent être regroupées.

Voici les lignes:
${JSON.stringify(lines, null, 2)}

MISSION:
1. Identifie les lignes similaires ou redondantes
2. Regroupe-les de manière intelligente en maximum 8 catégories principales
3. Pour chaque regroupement, ADDITIONNE les revenues (revenue_n et revenue_n_minus_1)
4. Pour chaque regroupement, ADDITIONNE les headcounts si présents
5. Donne un nom clair et professionnel à chaque catégorie

RETOURNE UNIQUEMENT un JSON array valide sans commentaire:
[
  {
    "line_name": "Nom de la catégorie",
    "revenue_n": 123456,
    "revenue_n_minus_1": 112233,
    "headcount_n": 45,
    "evolution_percent": 10.5,
    "confidence": 0.85
  }
]`

  const result = await model.generateContent(prompt)
  const response = result.response.text()

  console.log('🤖 [Gemini] Raw response:', response.substring(0, 200) + '...')

  // Parser la réponse (retirer markdown code blocks si présents)
  let jsonText = response.trim()
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '')
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '')
  }

  const regrouped: BusinessLine[] = JSON.parse(jsonText)

  return regrouped
}

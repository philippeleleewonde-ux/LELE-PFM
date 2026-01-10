// ============================================
// ZONE 1 - BUSINESS LINES EXTRACTOR SERVICE
// Service backend pour extraction des lignes d'activités depuis documents
// ============================================

import { BusinessLine, Zone1Data, BusinessLineCategory } from '@/types/datascanner-v2'
import { detectBusinessLinesFromMultipleSheets } from '@/modules/datascanner/lib/businessLineDetector'
import { aggregateBusinessLines } from '@/modules/datascanner/lib/businessLineAggregator'
import type { WorkBook } from 'xlsx'

/**
 * Configuration pour l'extraction
 */
export interface ExtractionConfig {
  maxBusinessLines?: number
  enableAggregation?: boolean
  confidenceThreshold?: number
  year?: number
}

const DEFAULT_CONFIG: ExtractionConfig = {
  maxBusinessLines: 100, // Pas de limite pour extraction initiale
  enableAggregation: false, // Aggregation séparée
  confidenceThreshold: 0.5,
  year: new Date().getFullYear()
}

/**
 * Résultat de l'extraction
 */
export interface ExtractionResult {
  lines: BusinessLine[]
  totalDetected: number
  needsRegrouping: boolean // true si > 8 lignes
  metadata: {
    detectionMethod: 'keyword' | 'llm' | 'hybrid'
    confidence: number
    sourceFiles: string[]
  }
}

/**
 * Extrait les business lines depuis un workbook Excel
 */
export async function extractBusinessLinesFromExcel(
  workbook: WorkBook,
  filename: string,
  config: ExtractionConfig = {}
): Promise<ExtractionResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // Utiliser le détecteur existant (code legacy réutilisé)
  const detectedLines = await detectBusinessLinesFromMultipleSheets(
    workbook,
    {
      maxBusinessLines: finalConfig.maxBusinessLines!,
      targetYears: [finalConfig.year!],
      modes: ['table', 'transposed', 'scattered', 'proximity']
    }
  )

  // Filtrer par confidence
  const filteredLines = detectedLines.filter(
    line => (line.confidence || 0) >= finalConfig.confidenceThreshold!
  )

  // Déterminer si regroupement nécessaire
  const needsRegrouping = filteredLines.length > 8

  // Calculer confidence moyenne
  const avgConfidence = filteredLines.reduce((sum, line) => sum + (line.confidence || 0), 0) / filteredLines.length

  return {
    lines: filteredLines,
    totalDetected: filteredLines.length,
    needsRegrouping,
    metadata: {
      detectionMethod: 'keyword', // Pour l'instant, pas de LLM activé
      confidence: avgConfidence,
      sourceFiles: [filename]
    }
  }
}

/**
 * Extrait depuis plusieurs fichiers et fusionne les résultats
 */
export async function extractBusinessLinesFromMultipleFiles(
  files: Array<{ workbook: WorkBook; filename: string }>,
  config: ExtractionConfig = {}
): Promise<ExtractionResult> {
  const allResults = await Promise.all(
    files.map(file => extractBusinessLinesFromExcel(file.workbook, file.filename, config))
  )

  // Fusionner les résultats
  const allLines = allResults.flatMap(r => r.lines)

  // Dédupliquer par nom (case insensitive)
  const uniqueLines = deduplicateBusinessLines(allLines)

  const needsRegrouping = uniqueLines.length > 8
  const avgConfidence = uniqueLines.reduce((sum, line) => sum + (line.confidence || 0), 0) / uniqueLines.length

  return {
    lines: uniqueLines,
    totalDetected: uniqueLines.length,
    needsRegrouping,
    metadata: {
      detectionMethod: 'keyword',
      confidence: avgConfidence,
      sourceFiles: files.map(f => f.filename)
    }
  }
}

/**
 * Déduplique les business lines par nom
 */
function deduplicateBusinessLines(lines: BusinessLine[]): BusinessLine[] {
  const seen = new Map<string, BusinessLine>()

  for (const line of lines) {
    const normalizedName = line.name.toLowerCase().trim()

    if (!seen.has(normalizedName)) {
      seen.set(normalizedName, line)
    } else {
      // Si doublon, fusionner les métriques (prendre la moyenne)
      const existing = seen.get(normalizedName)!
      existing.metrics = {
        revenue: mergeMetric(existing.metrics.revenue, line.metrics.revenue),
        expenses: mergeMetric(existing.metrics.expenses, line.metrics.expenses),
        headcount: mergeMetric(existing.metrics.headcount, line.metrics.headcount),
        budget_n1: mergeMetric(existing.metrics.budget_n1, line.metrics.budget_n1)
      }
      // Prendre la confidence la plus élevée
      existing.confidence = Math.max(existing.confidence || 0, line.confidence || 0)
    }
  }

  return Array.from(seen.values())
}

/**
 * Fusionne deux valeurs métriques (moyenne si les deux existent)
 */
function mergeMetric(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined && b === undefined) return undefined
  if (a === undefined) return b
  if (b === undefined) return a
  return (a + b) / 2
}

/**
 * Convertit BusinessLine[] en Zone1Data (format API)
 */
export function toZone1Data(result: ExtractionResult): Zone1Data {
  return {
    business_lines: result.lines,
    total_lines: result.totalDetected,
    detection_method: result.metadata.detectionMethod
  }
}

/**
 * Valide que le nombre de lignes est exactement 8
 * (utilisé après regroupement ou saisie manuelle)
 */
export function validateExactly8Lines(lines: BusinessLine[]): {
  valid: boolean
  error?: string
} {
  if (lines.length !== 8) {
    return {
      valid: false,
      error: `Expected exactly 8 business lines, got ${lines.length}`
    }
  }

  // Vérifier que chaque ligne a un nom
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].name || lines[i].name.trim() === '') {
      return {
        valid: false,
        error: `Business line ${i + 1} has no name`
      }
    }
  }

  return { valid: true }
}

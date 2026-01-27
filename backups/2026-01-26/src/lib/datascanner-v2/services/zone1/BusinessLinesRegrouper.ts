// ============================================
// ZONE 1 - BUSINESS LINES REGROUPER SERVICE
// Service backend pour regroupement intelligent en 8 lignes avec LLM (GPT-4)
// ============================================

import { BusinessLine, BusinessLineCategory } from '@/types/datascanner-v2'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Configuration du regroupement
 */
export interface RegroupementConfig {
  targetCount?: number // Nombre de lignes cible (défaut: 8)
  useLLM?: boolean // Utiliser LLM pour regroupement intelligent
  llmProvider?: 'gemini' | 'openai' // Choisir le provider LLM (défaut: gemini)
  geminiApiKey?: string // Clé API Google Gemini
  openaiApiKey?: string // Clé API OpenAI (fallback)
  preserveMetrics?: boolean // Préserver les métriques financières
}

const DEFAULT_CONFIG: RegroupementConfig = {
  targetCount: 8,
  useLLM: true,
  llmProvider: 'gemini', // Gemini 1.5 Flash par défaut
  preserveMetrics: true
}

/**
 * Résultat du regroupement
 */
export interface RegroupementResult {
  groupedLines: BusinessLine[]
  mapping: RegroupementMapping
  method: 'llm' | 'keyword' | 'manual'
  confidence: number
}

/**
 * Mapping: ligne originale → ligne regroupée
 */
export interface RegroupementMapping {
  [originalLineName: string]: {
    groupedLineName: string
    groupedCategory: BusinessLineCategory
    reasoning?: string
  }
}

/**
 * Regroupe N lignes d'activités en 8 lignes intelligemment
 */
export async function regroupBusinessLines(
  lines: BusinessLine[],
  config: RegroupementConfig = {}
): Promise<RegroupementResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // Si déjà le bon nombre, pas besoin de regrouper
  if (lines.length === finalConfig.targetCount) {
    return {
      groupedLines: lines,
      mapping: createIdentityMapping(lines),
      method: 'manual',
      confidence: 1.0
    }
  }

  // Si LLM activé et clé API fournie
  if (finalConfig.useLLM) {
    // Priorité: Gemini → OpenAI → Keywords
    if (finalConfig.llmProvider === 'gemini' && finalConfig.geminiApiKey) {
      try {
        return await regroupWithGemini(lines, finalConfig)
      } catch (error) {
        console.error('[BusinessLinesRegrouper] Gemini regrouping failed, trying OpenAI fallback', error)
        // Fallback sur OpenAI si disponible
        if (finalConfig.openaiApiKey) {
          try {
            return await regroupWithOpenAI(lines, finalConfig)
          } catch (openaiError) {
            console.error('[BusinessLinesRegrouper] OpenAI fallback failed, using keywords', openaiError)
            return regroupByKeywords(lines, finalConfig)
          }
        }
        // Fallback sur keywords
        return regroupByKeywords(lines, finalConfig)
      }
    } else if (finalConfig.openaiApiKey) {
      try {
        return await regroupWithOpenAI(lines, finalConfig)
      } catch (error) {
        console.error('[BusinessLinesRegrouper] OpenAI regrouping failed, falling back to keyword-based', error)
        return regroupByKeywords(lines, finalConfig)
      }
    }
  }

  // Méthode basée sur keywords par défaut
  return regroupByKeywords(lines, finalConfig)
}

/**
 * Regroupement intelligent avec Gemini 1.5 Flash
 */
async function regroupWithGemini(
  lines: BusinessLine[],
  config: RegroupementConfig
): Promise<RegroupementResult> {
  const genAI = new GoogleGenerativeAI(config.geminiApiKey!)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash', // Gemini 2.5 Flash (dernière version stable)
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3 // Faible température pour cohérence
    }
  })

  // Construire le prompt (même que OpenAI)
  const prompt = buildLLMPrompt(lines, config.targetCount!)

  // Appel à Gemini
  const result = await model.generateContent(prompt)
  const responseText = result.response.text()

  if (!responseText) {
    throw new Error('Empty response from Gemini')
  }

  // Parser la réponse JSON
  const parsed = JSON.parse(responseText) as LLMRegroupementResponse

  // Convertir en format BusinessLine (même logique que OpenAI)
  return convertLLMResponseToResult(parsed, lines)
}

/**
 * Regroupement intelligent avec GPT-4 (fallback)
 */
async function regroupWithOpenAI(
  lines: BusinessLine[],
  config: RegroupementConfig
): Promise<RegroupementResult> {
  const openai = new OpenAI({
    apiKey: config.openaiApiKey
  })

  // Construire le prompt
  const prompt = buildLLMPrompt(lines, config.targetCount!)

  // Appel à GPT-4
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are an expert business analyst specializing in financial data categorization and business line classification.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3, // Faible température pour cohérence
    max_tokens: 2000
  })

  const result = response.choices[0].message.content
  if (!result) {
    throw new Error('Empty response from GPT-4')
  }

  // Parser la réponse JSON
  const parsed = JSON.parse(result) as LLMRegroupementResponse

  // Convertir en format BusinessLine (utilise fonction commune)
  return convertLLMResponseToResult(parsed, lines)
}

/**
 * Convertit la réponse LLM (Gemini ou OpenAI) en RegroupementResult
 */
function convertLLMResponseToResult(
  parsed: LLMRegroupementResponse,
  lines: BusinessLine[]
): RegroupementResult {
  // Convertir en format BusinessLine
  const groupedLines = parsed.grouped_lines.map(group => {
    // Calculer les métriques agrégées
    const originalLines = group.original_lines.map(name =>
      lines.find(l => l.name === name)
    ).filter(Boolean) as BusinessLine[]

    const aggregatedRevenue = originalLines.reduce((sum, l) => sum + (l.metrics.revenue || 0), 0)
    const aggregatedExpenses = originalLines.reduce((sum, l) => sum + (l.metrics.expenses || 0), 0)
    const aggregatedHeadcount = originalLines.reduce((sum, l) => sum + (l.metrics.headcount || 0), 0)

    return {
      name: group.name,
      category: group.category as BusinessLineCategory,
      year: lines[0].year, // Année de la première ligne
      metrics: {
        revenue: aggregatedRevenue,
        expenses: aggregatedExpenses,
        headcount: aggregatedHeadcount || undefined,
        budget_n1: undefined
      },
      confidence: 0.85 // Confidence LLM
    }
  })

  // Créer le mapping
  const mapping: RegroupementMapping = {}
  for (const group of parsed.grouped_lines) {
    for (const originalName of group.original_lines) {
      mapping[originalName] = {
        groupedLineName: group.name,
        groupedCategory: group.category as BusinessLineCategory,
        reasoning: group.reasoning
      }
    }
  }

  return {
    groupedLines,
    mapping,
    method: 'llm',
    confidence: 0.85
  }
}

/**
 * Construit le prompt pour LLM (Gemini ou GPT-4)
 */
function buildLLMPrompt(lines: BusinessLine[], targetCount: number): string {
  const linesDescription = lines.map((line, i) => {
    return `${i + 1}. "${line.name}"
   - Revenue: ${line.metrics.revenue?.toLocaleString('fr-FR') || 'N/A'} €
   - Expenses: ${line.metrics.expenses?.toLocaleString('fr-FR') || 'N/A'} €
   - Headcount: ${line.metrics.headcount || 'N/A'}`
  }).join('\n\n')

  return `You are tasked with intelligently regrouping ${lines.length} business lines into exactly ${targetCount} coherent categories.

Here are the ${lines.length} original business lines:

${linesDescription}

**Your Task:**
1. Analyze the semantic similarity between these business lines
2. Group them into exactly ${targetCount} coherent categories
3. Each category should represent a logical business unit
4. Preserve the financial metrics (sum revenue and expenses for each group)

**The 8 target categories are:**
1. Manufacturing & Production
2. Sales & Distribution
3. Services & Consulting
4. Technology & R&D
5. Financial Services
6. Administrative & Support
7. Marketing & Communication
8. Other Activities

**Output Format (JSON):**
{
  "grouped_lines": [
    {
      "name": "Category Name",
      "category": "Manufacturing & Production",
      "original_lines": ["Line 1", "Line 2"],
      "reasoning": "Brief explanation of why these lines were grouped together"
    },
    ...
  ]
}

Important:
- You MUST return exactly ${targetCount} grouped lines
- Each grouped line MUST have a "category" field matching one of the 8 target categories
- Each grouped line MUST list all "original_lines" that were merged into it
- Provide brief "reasoning" for each grouping decision

Return ONLY valid JSON, no additional text.`
}

/**
 * Regroupement basé sur keywords (fallback si pas de LLM)
 */
function regroupByKeywords(
  lines: BusinessLine[],
  config: RegroupementConfig
): RegroupementResult {
  // Debug removed

  // Catégoriser chaque ligne selon keywords
  const categorized = new Map<BusinessLineCategory, BusinessLine[]>()

  for (const line of lines) {
    const category = inferCategoryFromName(line.name)
    if (!categorized.has(category)) {
      categorized.set(category, [])
    }
    categorized.get(category)!.push(line)
  }

  // Créer 8 lignes regroupées
  const groupedLines: BusinessLine[] = []
  const mapping: RegroupementMapping = {}

  for (const [category, categoryLines] of categorized.entries()) {
    if (categoryLines.length === 0) continue

    // Agréger les métriques
    const totalRevenue = categoryLines.reduce((sum, l) => sum + (l.metrics.revenue || 0), 0)
    const totalExpenses = categoryLines.reduce((sum, l) => sum + (l.metrics.expenses || 0), 0)
    const totalHeadcount = categoryLines.reduce((sum, l) => sum + (l.metrics.headcount || 0), 0)

    groupedLines.push({
      name: category,
      category: category,
      year: lines[0].year,
      metrics: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        headcount: totalHeadcount || undefined
      },
      confidence: 0.7 // Confidence keyword-based
    })

    // Mapping
    for (const originalLine of categoryLines) {
      mapping[originalLine.name] = {
        groupedLineName: category,
        groupedCategory: category
      }
    }
  }

  // S'assurer d'avoir exactement 8 lignes (ajouter vides si besoin)
  const allCategories = Object.values(BusinessLineCategory)
  for (const cat of allCategories) {
    if (!groupedLines.some(l => l.category === cat)) {
      groupedLines.push({
        name: cat,
        category: cat,
        year: lines[0].year,
        metrics: {
          revenue: 0,
          expenses: 0
        },
        confidence: 0.5
      })
    }
  }

  return {
    groupedLines: groupedLines.slice(0, 8),
    mapping,
    method: 'keyword',
    confidence: 0.7
  }
}

/**
 * Infère la catégorie depuis le nom de la ligne (par keywords)
 */
function inferCategoryFromName(name: string): BusinessLineCategory {
  const lowerName = name.toLowerCase()

  if (/production|manufacture|fabri|usine/.test(lowerName)) {
    return BusinessLineCategory.MANUFACTURING_PRODUCTION
  }
  if (/vente|distribut|commerc/.test(lowerName)) {
    return BusinessLineCategory.SALES_DISTRIBUTION
  }
  if (/service|conseil|prestation/.test(lowerName)) {
    return BusinessLineCategory.SERVICES_CONSULTING
  }
  if (/tech|digital|IT|informatique|R&D/.test(lowerName)) {
    return BusinessLineCategory.TECHNOLOGY_RND
  }
  if (/financ|banque|assurance/.test(lowerName)) {
    return BusinessLineCategory.FINANCIAL_SERVICES
  }
  if (/admin|RH|support|comptab/.test(lowerName)) {
    return BusinessLineCategory.ADMINISTRATIVE_SUPPORT
  }
  if (/marketing|communication|pub/.test(lowerName)) {
    return BusinessLineCategory.MARKETING_COMMUNICATION
  }

  return BusinessLineCategory.OTHER_ACTIVITIES
}

/**
 * Crée un mapping identité (si déjà 8 lignes)
 */
function createIdentityMapping(lines: BusinessLine[]): RegroupementMapping {
  const mapping: RegroupementMapping = {}
  for (const line of lines) {
    mapping[line.name] = {
      groupedLineName: line.name,
      groupedCategory: line.category
    }
  }
  return mapping
}

/**
 * Type de réponse attendue de GPT-4
 */
interface LLMRegroupementResponse {
  grouped_lines: Array<{
    name: string
    category: string
    original_lines: string[]
    reasoning: string
  }>
}

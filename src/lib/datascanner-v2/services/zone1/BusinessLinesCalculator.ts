// ============================================
// ZONE 1 - BUSINESS LINES CALCULATOR SERVICE
// Service backend pour CALCULER les 8 lignes d'activités depuis données comptables
// ============================================

import { BusinessLine, BusinessLineCategory } from '@/types/datascanner-v2'
import type { WorkBook } from 'xlsx'

/**
 * Données comptables brutes extraites des documents
 */
export interface AccountingData {
  categories: AccountingCategory[]
  totalRevenue: number
  totalExpenses: number
  year: number
}

export interface AccountingCategory {
  name: string
  code?: string // Code comptable (ex: "70", "60")
  revenue: number
  expenses: number
  description?: string
}

/**
 * Configuration pour le calcul
 */
export interface CalculationConfig {
  year?: number
  useDefaultMapping?: boolean // Utilise le mapping par défaut
  useLLM?: boolean // Utilise LLM pour classification intelligente
}

const DEFAULT_CONFIG: CalculationConfig = {
  year: new Date().getFullYear(),
  useDefaultMapping: true,
  useLLM: false // Désactivé par défaut (sera activé plus tard)
}

/**
 * Mapping par défaut : Codes comptables → Business Line Category
 * Basé sur le Plan Comptable Général (PCG) français
 */
const DEFAULT_ACCOUNTING_MAPPING: Record<string, BusinessLineCategory> = {
  // Classe 7 : Produits / Revenus
  '70': BusinessLineCategory.SALES_DISTRIBUTION, // Ventes de marchandises
  '701': BusinessLineCategory.SALES_DISTRIBUTION, // Ventes de produits finis
  '702': BusinessLineCategory.MANUFACTURING_PRODUCTION, // Ventes de produits intermédiaires
  '703': BusinessLineCategory.MANUFACTURING_PRODUCTION, // Ventes de produits résiduels
  '704': BusinessLineCategory.SERVICES_CONSULTING, // Travaux
  '705': BusinessLineCategory.SERVICES_CONSULTING, // Études
  '706': BusinessLineCategory.SERVICES_CONSULTING, // Prestations de services
  '707': BusinessLineCategory.SALES_DISTRIBUTION, // Ventes de marchandises
  '708': BusinessLineCategory.MANUFACTURING_PRODUCTION, // Produits des activités annexes
  '71': BusinessLineCategory.MANUFACTURING_PRODUCTION, // Production stockée
  '72': BusinessLineCategory.MANUFACTURING_PRODUCTION, // Production immobilisée
  '74': BusinessLineCategory.OTHER_ACTIVITIES, // Subventions d'exploitation
  '75': BusinessLineCategory.OTHER_ACTIVITIES, // Autres produits de gestion courante
  '76': BusinessLineCategory.FINANCIAL_SERVICES, // Produits financiers
  '78': BusinessLineCategory.OTHER_ACTIVITIES, // Reprises sur amortissements et provisions

  // Classe 6 : Charges
  '60': BusinessLineCategory.SALES_DISTRIBUTION, // Achats
  '61': BusinessLineCategory.SERVICES_CONSULTING, // Services extérieurs
  '62': BusinessLineCategory.ADMINISTRATIVE_SUPPORT, // Autres services extérieurs
  '63': BusinessLineCategory.ADMINISTRATIVE_SUPPORT, // Impôts, taxes et versements assimilés
  '64': BusinessLineCategory.ADMINISTRATIVE_SUPPORT, // Charges de personnel
  '65': BusinessLineCategory.ADMINISTRATIVE_SUPPORT, // Autres charges de gestion courante
  '66': BusinessLineCategory.FINANCIAL_SERVICES, // Charges financières
  '67': BusinessLineCategory.OTHER_ACTIVITIES, // Charges exceptionnelles
  '68': BusinessLineCategory.OTHER_ACTIVITIES, // Dotations aux amortissements
}

/**
 * Keywords pour classification sémantique (si pas de code comptable)
 */
const KEYWORD_MAPPING: Record<BusinessLineCategory, string[]> = {
  [BusinessLineCategory.MANUFACTURING_PRODUCTION]: [
    'production', 'fabrication', 'manufacture', 'usine', 'atelier',
    'assemblage', 'transformation', 'produit', 'industrie'
  ],
  [BusinessLineCategory.SALES_DISTRIBUTION]: [
    'vente', 'distribution', 'commercial', 'négoce', 'achat', 'revente',
    'magasin', 'boutique', 'commerce'
  ],
  [BusinessLineCategory.SERVICES_CONSULTING]: [
    'service', 'prestation', 'conseil', 'consulting', 'étude', 'expertise',
    'assistance', 'accompagnement', 'formation'
  ],
  [BusinessLineCategory.TECHNOLOGY_RND]: [
    'technologie', 'informatique', 'digital', 'numérique', 'IT', 'logiciel',
    'recherche', 'développement', 'R&D', 'innovation', 'tech'
  ],
  [BusinessLineCategory.FINANCIAL_SERVICES]: [
    'financier', 'banque', 'assurance', 'crédit', 'placement', 'investissement',
    'gestion', 'patrimoine', 'épargne'
  ],
  [BusinessLineCategory.ADMINISTRATIVE_SUPPORT]: [
    'administratif', 'administration', 'comptabilité', 'RH', 'ressources humaines',
    'juridique', 'secrétariat', 'support', 'back office'
  ],
  [BusinessLineCategory.MARKETING_COMMUNICATION]: [
    'marketing', 'communication', 'publicité', 'promotion', 'relation client',
    'média', 'événementiel', 'brand', 'marque'
  ],
  [BusinessLineCategory.OTHER_ACTIVITIES]: [
    'autre', 'divers', 'exceptionnel', 'non affecté', 'général'
  ]
}

/**
 * Calcule les 8 business lines à partir de données comptables
 */
export async function calculateBusinessLines(
  accountingData: AccountingData,
  config: CalculationConfig = {}
): Promise<BusinessLine[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // Étape 1: Classifier chaque catégorie comptable
  const categorizedData = new Map<BusinessLineCategory, {
    revenue: number
    expenses: number
    categories: string[]
  }>()

  // Initialiser les 8 catégories
  Object.values(BusinessLineCategory).forEach(cat => {
    categorizedData.set(cat, { revenue: 0, expenses: 0, categories: [] })
  })

  // Classifier chaque catégorie comptable
  for (const accCategory of accountingData.categories) {
    const businessCategory = classifyAccountingCategory(accCategory, finalConfig)

    const existing = categorizedData.get(businessCategory)!
    existing.revenue += accCategory.revenue
    existing.expenses += accCategory.expenses
    existing.categories.push(accCategory.name)
  }

  // Étape 2: Créer les BusinessLine objects
  const businessLines: BusinessLine[] = []

  for (const [category, data] of categorizedData.entries()) {
    // Ignorer les catégories vides
    if (data.revenue === 0 && data.expenses === 0) continue

    businessLines.push({
      name: category,
      category: category,
      year: accountingData.year,
      metrics: {
        revenue: data.revenue,
        expenses: data.expenses,
        headcount: undefined, // Pas calculable depuis données comptables
        budget_n1: undefined
      },
      confidence: 0.8 // Confidence calculée (moins élevée qu'extraction directe)
    })
  }

  // Étape 3: S'assurer qu'on a exactement 8 lignes
  // Si moins de 8, ajouter des lignes vides pour les catégories manquantes
  if (businessLines.length < 8) {
    const missingCategories = Object.values(BusinessLineCategory).filter(
      cat => !businessLines.some(line => line.category === cat)
    )

    for (const cat of missingCategories.slice(0, 8 - businessLines.length)) {
      businessLines.push({
        name: cat,
        category: cat,
        year: accountingData.year,
        metrics: {
          revenue: 0,
          expenses: 0
        },
        confidence: 0.5 // Ligne vide = faible confidence
      })
    }
  }

  // Étape 4: Trier par revenue décroissant et limiter à 8
  businessLines.sort((a, b) => (b.metrics.revenue || 0) - (a.metrics.revenue || 0))
  const final8Lines = businessLines.slice(0, 8)

  return final8Lines
}

/**
 * Classifie une catégorie comptable vers une BusinessLineCategory
 */
function classifyAccountingCategory(
  category: AccountingCategory,
  config: CalculationConfig
): BusinessLineCategory {
  // Méthode 1: Par code comptable
  if (category.code && config.useDefaultMapping) {
    // Chercher dans le mapping par code exact
    if (DEFAULT_ACCOUNTING_MAPPING[category.code]) {
      return DEFAULT_ACCOUNTING_MAPPING[category.code]
    }

    // Chercher par code partiel (ex: "701" → "70")
    const prefix = category.code.substring(0, 2)
    if (DEFAULT_ACCOUNTING_MAPPING[prefix]) {
      return DEFAULT_ACCOUNTING_MAPPING[prefix]
    }
  }

  // Méthode 2: Par keywords dans le nom/description
  const text = `${category.name} ${category.description || ''}`.toLowerCase()

  for (const [businessCategory, keywords] of Object.entries(KEYWORD_MAPPING)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return businessCategory as BusinessLineCategory
      }
    }
  }

  // Fallback: Classer par type de montant
  if (category.revenue > category.expenses) {
    // Plus de revenus → probablement vente ou service
    return category.revenue > 100000
      ? BusinessLineCategory.SALES_DISTRIBUTION
      : BusinessLineCategory.SERVICES_CONSULTING
  } else {
    // Plus de charges → probablement support ou admin
    return BusinessLineCategory.ADMINISTRATIVE_SUPPORT
  }
}

/**
 * Extrait les données comptables depuis un workbook Excel
 * (Simplifié pour v1, à améliorer avec parsing Excel réel)
 */
export async function extractAccountingDataFromExcel(
  workbook: WorkBook,
  year?: number
): Promise<AccountingData> {
  // TODO: Implémenter parsing Excel réel
  // Pour l'instant, retourne des données mock
  // Exemple de données mock (à remplacer par vrai parsing)
  return {
    categories: [
      { name: 'Ventes de marchandises', code: '707', revenue: 500000, expenses: 300000 },
      { name: 'Prestations de services', code: '706', revenue: 300000, expenses: 150000 },
      { name: 'Production stockée', code: '71', revenue: 200000, expenses: 100000 },
      { name: 'Achats de marchandises', code: '60', revenue: 0, expenses: 250000 },
      { name: 'Services extérieurs', code: '61', revenue: 0, expenses: 80000 },
      { name: 'Charges de personnel', code: '64', revenue: 0, expenses: 200000 }
    ],
    totalRevenue: 1000000,
    totalExpenses: 1080000,
    year: year || new Date().getFullYear()
  }
}

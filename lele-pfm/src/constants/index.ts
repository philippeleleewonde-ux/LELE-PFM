/**
 * LELE PFM - Application Constants
 * All constant values, configurations, and reference data
 */

import { COICOPCategory, Grade, TransactionType, Nature } from '../types/database';

// ============================================================================
// COICOP CATEGORIES (8 entries)
// Classification Of Individual Consumption By Purpose
// ============================================================================

export const COICOP_CATEGORIES = {
  [COICOPCategory.FOOD]: {
    code: '01',
    label: 'Alimentation et boissons non alcoolisées',
    labelEn: 'Food and non-alcoholic beverages',
    icon: 'shopping-basket',
    description: 'Nourriture, fruits, légumes, pain, viande, poisson, etc.',
  },
  [COICOPCategory.CLOTHING]: {
    code: '02',
    label: 'Vêtements et chaussures',
    labelEn: 'Clothing and footwear',
    icon: 'shirt',
    description: 'Vêtements, chaussures, accessoires, entretien',
  },
  [COICOPCategory.HOUSING]: {
    code: '03',
    label: 'Logement, eau, électricité, gaz',
    labelEn: 'Housing, water, electricity, gas',
    icon: 'home',
    description: 'Loyer, électricité, gaz, eau, chauffage, entretien',
  },
  [COICOPCategory.HEALTH]: {
    code: '04',
    label: 'Santé',
    labelEn: 'Health',
    icon: 'heart-pulse',
    description: 'Médecins, dentistes, pharmacie, assurance santé',
  },
  [COICOPCategory.TRANSPORT]: {
    code: '05',
    label: 'Transports',
    labelEn: 'Transport',
    icon: 'car',
    description: 'Essence, transports publics, assurance auto, entretien',
  },
  [COICOPCategory.COMMUNICATIONS]: {
    code: '06',
    label: 'Communications',
    labelEn: 'Communications',
    icon: 'phone',
    description: 'Téléphone, internet, téléphonie mobile',
  },
  [COICOPCategory.RECREATION]: {
    code: '07',
    label: 'Loisirs et culture',
    labelEn: 'Recreation and culture',
    icon: 'film',
    description: 'Cinéma, sports, hobbies, abonnements, livres',
  },
  [COICOPCategory.EDUCATION]: {
    code: '08',
    label: 'Éducation',
    labelEn: 'Education',
    icon: 'book',
    description: 'Formations, cours, frais de scolarité',
  },
} as const;

export type COICOPCategoryConfig = (typeof COICOP_CATEGORIES)[COICOPCategory];

/**
 * Get COICOP category by code
 */
export function getCOICOPCategory(code: string): COICOPCategoryConfig | undefined {
  return COICOP_CATEGORIES[code as COICOPCategory];
}

/**
 * Get all COICOP categories as array
 */
export function getAllCOICOPCategories(): Array<COICOPCategoryConfig> {
  return Object.values(COICOP_CATEGORIES);
}

// ============================================================================
// TRANSACTION TYPES (4 entries - CRITICAL: NOT 5, EKH is not a type)
// ============================================================================

export const TRANSACTION_TYPES = {
  [TransactionType.FIXE]: {
    label: 'Fixe',
    labelEn: 'Fixed',
    description: 'Dépense fixe et régulière',
    descriptionEn: 'Fixed and regular expense',
    color: '#3b82f6', // blue
    icon: 'trending-down',
  },
  [TransactionType.VARIABLE]: {
    label: 'Variable',
    labelEn: 'Variable',
    description: 'Dépense variable et irrégulière',
    descriptionEn: 'Variable and irregular expense',
    color: '#f59e0b', // amber
    icon: 'trending-up',
  },
  [TransactionType.IMPRÉVUE]: {
    label: 'Imprévue',
    labelEn: 'Unexpected',
    description: 'Dépense exceptionnelle non planifiée',
    descriptionEn: 'Unexpected and unplanned expense',
    color: '#ef4444', // red
    icon: 'alert-circle',
  },
  [TransactionType.ÉPARGNE_DETTE]: {
    label: 'Épargne-Dette',
    labelEn: 'Savings-Debt',
    description: 'Épargne, remboursement de dette, investissement',
    descriptionEn: 'Savings, debt repayment, investment',
    color: '#10b981', // green
    icon: 'trending-up-right',
  },
} as const;

export type TransactionTypeConfig = (typeof TRANSACTION_TYPES)[TransactionType];

/**
 * Get transaction type by key
 */
export function getTransactionType(type: TransactionType): TransactionTypeConfig {
  return TRANSACTION_TYPES[type];
}

/**
 * Get all transaction types as array
 */
export function getAllTransactionTypes(): Array<[TransactionType, TransactionTypeConfig]> {
  return Object.entries(TRANSACTION_TYPES) as Array<[TransactionType, TransactionTypeConfig]>;
}

/**
 * CRITICAL: Validate that there are exactly 4 transaction types (not 5)
 */
export const TRANSACTION_TYPES_COUNT = Object.keys(TRANSACTION_TYPES).length;
console.assert(
  TRANSACTION_TYPES_COUNT === 4,
  `CRITICAL: Expected 4 transaction types, got ${TRANSACTION_TYPES_COUNT}. EKH is not a transaction type.`,
);

// ============================================================================
// NATURE (Essentiality) CLASSIFICATION
// ============================================================================

export const NATURE_TYPES = {
  [Nature.ESSENTIELLE]: {
    label: 'Essentielle',
    labelEn: 'Essential',
    description: 'Dépense essentielle et nécessaire',
    descriptionEn: 'Essential and necessary expense',
    color: '#dc2626', // red-600
    icon: 'alert-triangle',
  },
  [Nature.DISCRÉTIONNAIRE]: {
    label: 'Discrétionnaire',
    labelEn: 'Discretionary',
    description: 'Dépense discrétionnaire et flexible',
    descriptionEn: 'Discretionary and flexible expense',
    color: '#6366f1', // indigo
    icon: 'sparkles',
  },
} as const;

export type NatureConfig = (typeof NATURE_TYPES)[Nature];

/**
 * Get nature config
 */
export function getNatureConfig(nature: Nature): NatureConfig {
  return NATURE_TYPES[nature];
}

// ============================================================================
// PROFILE TYPES (12 entries)
// ============================================================================

export const PROFILE_TYPES = [
  {
    value: 'Salarié',
    label: 'Salarié',
    labelEn: 'Salaried Employee',
    description: 'Employé avec contrat de travail',
    icon: 'briefcase',
    risk: 'moderate',
    coefficient: 0.9,
  },
  {
    value: 'Indépendant',
    label: 'Indépendant',
    labelEn: 'Self-Employed',
    description: 'Travailleur indépendant ou freelance',
    icon: 'laptop',
    risk: 'high',
    coefficient: 1.2,
  },
  {
    value: 'Fonctionnaire',
    label: 'Fonctionnaire',
    labelEn: 'Civil Servant',
    description: 'Employé du secteur public',
    icon: 'shield-check',
    risk: 'low',
    coefficient: 0.85,
  },
  {
    value: 'Étudiant',
    label: 'Étudiant',
    labelEn: 'Student',
    description: 'Étudiant en formation',
    icon: 'book-open',
    risk: 'very-high',
    coefficient: 1.1,
  },
  {
    value: 'Retraité',
    label: 'Retraité',
    labelEn: 'Retiree',
    description: 'Personne à la retraite',
    icon: 'sun',
    risk: 'moderate',
    coefficient: 0.7,
  },
  {
    value: 'Entrepreneur',
    label: 'Entrepreneur',
    labelEn: 'Entrepreneur',
    description: 'Propriétaire d\'entreprise',
    icon: 'rocket',
    risk: 'very-high',
    coefficient: 1.2,
  },
  {
    value: 'Intérimaire',
    label: 'Intérimaire',
    labelEn: 'Temporary Worker',
    description: 'Travailleur en mission temporaire',
    icon: 'clock',
    risk: 'high',
    coefficient: 1.3,
  },
  {
    value: 'Auto-entrepreneur',
    label: 'Auto-entrepreneur',
    labelEn: 'Micro-Entrepreneur',
    description: 'Micro-entreprise individuelle',
    icon: 'zap',
    risk: 'high',
    coefficient: 1.15,
  },
  {
    value: 'Sans emploi',
    label: 'Sans emploi',
    labelEn: 'Unemployed',
    description: 'Sans activité professionnelle',
    icon: 'alert-circle',
    risk: 'very-high',
    coefficient: 1.5,
  },
  {
    value: 'Cadre',
    label: 'Cadre',
    labelEn: 'Manager/Executive',
    description: 'Cadre avec responsabilités de gestion',
    icon: 'crown',
    risk: 'low',
    coefficient: 0.8,
  },
  {
    value: 'Profession libérale',
    label: 'Profession libérale',
    labelEn: 'Liberal Profession',
    description: 'Médecin, avocat, architecte, etc.',
    icon: 'user-check',
    risk: 'moderate',
    coefficient: 1.1,
  },
  {
    value: 'Agriculteur',
    label: 'Agriculteur',
    labelEn: 'Farmer',
    description: 'Exploitant agricole',
    icon: 'sprout',
    risk: 'high',
    coefficient: 1.25,
  },
] as const;

export const PROFILE_TYPES_COUNT = PROFILE_TYPES.length;
console.assert(
  PROFILE_TYPES_COUNT === 12,
  `CRITICAL: Expected 12 profile types, got ${PROFILE_TYPES_COUNT}`,
);

/**
 * Get profile type by value
 */
export function getProfileType(value: string) {
  return PROFILE_TYPES.find((pt) => pt.value === value);
}

// ============================================================================
// GRADE SCALE (6 entries: A+ to E)
// ============================================================================

export const GRADE_SCALE = {
  [Grade.A_PLUS]: {
    grade: 'A+',
    label: 'Excellent',
    labelEn: 'Excellent',
    minScore: 90,
    maxScore: 100,
    color: '#065f46', // green-900
    description: 'Gestion financière exceptionnelle',
  },
  [Grade.A]: {
    grade: 'A',
    label: 'Très Bon',
    labelEn: 'Very Good',
    minScore: 80,
    maxScore: 89.99,
    color: '#047857', // green-700
    description: 'Excellente gestion financière',
  },
  [Grade.B]: {
    grade: 'B',
    label: 'Bon',
    labelEn: 'Good',
    minScore: 70,
    maxScore: 79.99,
    color: '#059669', // green-600
    description: 'Bonne gestion financière',
  },
  [Grade.C]: {
    grade: 'C',
    label: 'Acceptable',
    labelEn: 'Fair',
    minScore: 55,
    maxScore: 69.99,
    color: '#f59e0b', // amber-500
    description: 'Gestion financière acceptable',
  },
  [Grade.D]: {
    grade: 'D',
    label: 'Faible',
    labelEn: 'Poor',
    minScore: 40,
    maxScore: 54.99,
    color: '#dc2626', // red-600
    description: 'Gestion financière à améliorer',
  },
  [Grade.E]: {
    grade: 'E',
    label: 'Très Faible',
    labelEn: 'Very Poor',
    minScore: 0,
    maxScore: 39.99,
    color: '#7f1d1d', // red-900
    description: 'Gestion financière très faible',
  },
} as const;

export type GradeConfig = (typeof GRADE_SCALE)[Grade];

/**
 * Get grade config
 */
export function getGradeConfig(grade: Grade): GradeConfig {
  return GRADE_SCALE[grade];
}

/**
 * Get all grades as array
 */
export function getAllGrades(): Array<[Grade, GradeConfig]> {
  return Object.entries(GRADE_SCALE) as Array<[Grade, GradeConfig]>;
}

// ============================================================================
// WATERFALL PRIORITIES (P1-P4)
// Default distribution: P1=30%, P2=35%, P3=20%, P4=15%
// ============================================================================

export const WATERFALL_PRIORITIES = {
  P1: {
    priority: 'P1',
    label: 'Essentiel Fixe',
    labelEn: 'Essential Fixed',
    description: 'Dépenses fixes essentielles (loyer, assurances, etc.)',
    descriptionEn: 'Essential fixed expenses (rent, insurance, etc.)',
    color: '#3b82f6', // blue
    icon: 'home',
    defaultPercentage: 30,
    minPercentage: 20,
    maxPercentage: 40,
  },
  P2: {
    priority: 'P2',
    label: 'Essentiel Variable',
    labelEn: 'Essential Variable',
    description: 'Dépenses variables essentielles (nourriture, transports, etc.)',
    descriptionEn: 'Essential variable expenses (food, transport, etc.)',
    color: '#f59e0b', // amber
    icon: 'shopping-cart',
    defaultPercentage: 35,
    minPercentage: 25,
    maxPercentage: 45,
  },
  P3: {
    priority: 'P3',
    label: 'Discrétionnaire',
    labelEn: 'Discretionary',
    description: 'Dépenses flexibles et discrétionnaires (loisirs, divertissement)',
    descriptionEn: 'Flexible and discretionary expenses (leisure, entertainment)',
    color: '#8b5cf6', // purple
    icon: 'sparkles',
    defaultPercentage: 20,
    minPercentage: 5,
    maxPercentage: 30,
  },
  P4: {
    priority: 'P4',
    label: 'Épargne & Dette',
    labelEn: 'Savings & Debt',
    description: 'Épargne, remboursement de dettes, investissements',
    descriptionEn: 'Savings, debt repayment, investments',
    color: '#10b981', // green
    icon: 'trending-up',
    defaultPercentage: 15,
    minPercentage: 5,
    maxPercentage: 30,
  },
} as const;

export type WaterfallPriorityConfig = (typeof WATERFALL_PRIORITIES)[keyof typeof WATERFALL_PRIORITIES];

/**
 * Default waterfall distribution (sums to 100%)
 */
export const DEFAULT_WATERFALL_DISTRIBUTION = {
  P1: WATERFALL_PRIORITIES.P1.defaultPercentage,
  P2: WATERFALL_PRIORITIES.P2.defaultPercentage,
  P3: WATERFALL_PRIORITIES.P3.defaultPercentage,
  P4: WATERFALL_PRIORITIES.P4.defaultPercentage,
} as const;

/**
 * Validate waterfall distribution sums to 100%
 */
export function isValidWaterfallDistribution(distribution: {
  P1: number;
  P2: number;
  P3: number;
  P4: number;
}): boolean {
  const sum = distribution.P1 + distribution.P2 + distribution.P3 + distribution.P4;
  return sum === 100;
}

// ============================================================================
// FLEXIBILITY AND SCORING CONSTANTS
// ============================================================================

/**
 * Maximum flexibility score denominator
 * Flexibility = (F1 + F2 + F3) / 63 × 100
 * 63 = 21 (max F1) + 21 (max F2) + 21 (max F3)
 */
export const FLEXIBILITY_MAX = 63;

/**
 * Maximum per-factor flexibility score
 */
export const FLEXIBILITY_FACTOR_MAX = 21;

/**
 * Score weights for composite scoring
 */
export const SCORE_WEIGHTS = {
  ekh: 4, // EKH score weight
  completion: 3, // Completion percentage weight
  budget: 2, // Budget adherence weight
  variation: 1, // Variation/consistency weight
} as const;

/**
 * Total score weight
 */
export const SCORE_WEIGHTS_TOTAL =
  SCORE_WEIGHTS.ekh + SCORE_WEIGHTS.completion + SCORE_WEIGHTS.budget + SCORE_WEIGHTS.variation;

/**
 * Calculate weighted score
 */
export function calculateWeightedScore(
  ekh: number,
  completion: number,
  budget: number,
  variation: number,
): number {
  const weighted =
    (ekh * SCORE_WEIGHTS.ekh +
      completion * SCORE_WEIGHTS.completion +
      budget * SCORE_WEIGHTS.budget +
      variation * SCORE_WEIGHTS.variation) /
    SCORE_WEIGHTS_TOTAL;
  return Math.round(weighted * 100) / 100;
}

// ============================================================================
// TIME AND CALENDAR CONSTANTS
// ============================================================================

/**
 * Maximum week number in a year
 */
export const MAX_WEEK = 52;

/**
 * Minimum week number
 */
export const MIN_WEEK = 1;

/**
 * Minimum planning year
 */
export const MIN_YEAR = 2015;

/**
 * Maximum planning year
 */
export const MAX_YEAR = 2030;

/**
 * Planning horizon in years
 */
export const PLANNING_HORIZON = MAX_YEAR - MIN_YEAR;

// ============================================================================
// COICOP CONSTANTS
// ============================================================================

/**
 * Maximum COICOP N1 category number
 */
export const MAX_COICOP = 8;

/**
 * Minimum COICOP N1 category number
 */
export const MIN_COICOP = 1;

/**
 * Get COICOP code from number
 */
export function getCOICOPCode(num: number): string {
  if (num < 1 || num > 8) throw new Error(`Invalid COICOP number: ${num}`);
  return String(num).padStart(2, '0');
}

/**
 * Get COICOP number from code
 */
export function getCOICOPNumber(code: string): number {
  const num = parseInt(code, 10);
  if (num < 1 || num > 8) throw new Error(`Invalid COICOP code: ${code}`);
  return num;
}

// ============================================================================
// RISK ASSESSMENT CONSTANTS
// ============================================================================

/**
 * Risk score minimum and maximum
 */
export const RISK_SCORE_MIN = 1;
export const RISK_SCORE_MAX = 5;

/**
 * Risk score ranges
 */
export const RISK_SCORE_RANGES = {
  TRÈS_BAS: { min: 1, max: 1.5, label: 'Très bas' },
  BAS: { min: 1.5, max: 2.5, label: 'Bas' },
  MOYEN: { min: 2.5, max: 3.5, label: 'Moyen' },
  HAUT: { min: 3.5, max: 4.5, label: 'Haut' },
  TRÈS_HAUT: { min: 4.5, max: 5, label: 'Très haut' },
} as const;

/**
 * Risk dimensions labels
 */
// 6 domaines de risque individuel — parallèle HCM :
// emploi ↔ operationalRisk, logement ↔ liquidityRisk,
// sante ↔ creditRisk, endettement ↔ marketRisk,
// epargne ↔ reputationalRisk, juridique ↔ strategicRisk
export const RISK_DIMENSIONS = {
  emploi: {
    label: 'Risque Emploi',
    description: 'Stabilité professionnelle et du revenu',
  },
  logement: {
    label: 'Risque Logement',
    description: 'Situation immobilière et résidentielle',
  },
  sante: {
    label: 'Risque Santé',
    description: 'Couverture et frais médicaux',
  },
  endettement: {
    label: 'Risque Endettement',
    description: 'Niveau d\'endettement et capacité de remboursement',
  },
  epargne: {
    label: 'Risque Épargne',
    description: 'Capacité d\'épargne et réserves financières',
  },
  juridique: {
    label: 'Risque Juridique',
    description: 'Exposition juridique et légale',
  },
} as const;

// ============================================================================
// EKH ASSESSMENT CONSTANTS
// ============================================================================

/**
 * EKH question labels and descriptions
 */
export const EKH_QUESTIONS = {
  q1: {
    question: 'Maîtrise du budget',
    description: 'À quel point maîtrisez-vous votre budget mensuel?',
    descriptionEn: 'How well do you master your monthly budget?',
  },
  q2: {
    question: 'Connaissance des produits financiers',
    description: 'Connaissez-vous les différents produits d\'épargne et d\'investissement?',
    descriptionEn: 'Do you know different savings and investment products?',
  },
  q3: {
    question: 'Gestion des risques',
    description: 'Savez-vous identifier et gérer les risques financiers?',
    descriptionEn: 'Can you identify and manage financial risks?',
  },
  q4: {
    question: 'Planification financière',
    description: 'Avez-vous un plan financier à long terme?',
    descriptionEn: 'Do you have a long-term financial plan?',
  },
  q5: {
    question: 'Discipline d\'épargne',
    description: 'Avez-vous la discipline d\'épargner régulièrement?',
    descriptionEn: 'Do you have the discipline to save regularly?',
  },
  q6: {
    question: 'Compréhension des impôts',
    description: 'Comprenez-vous la fiscalité et l\'optimisation fiscale?',
    descriptionEn: 'Do you understand taxation and tax optimization?',
  },
} as const;

/**
 * EKH score rating scale (1-5)
 */
export const EKH_RATING_SCALE = {
  1: { label: 'Très faible', description: 'Pas de maîtrise' },
  2: { label: 'Faible', description: 'Maîtrise insuffisante' },
  3: { label: 'Moyen', description: 'Maîtrise acceptable' },
  4: { label: 'Bon', description: 'Bonne maîtrise' },
  5: { label: 'Très bon', description: 'Excellente maîtrise' },
} as const;

// ============================================================================
// IMPROVEMENT LEVER CONSTANTS
// ============================================================================

/**
 * Improvement lever types and configurations
 */
export const IMPROVEMENT_LEVER_TYPES = [
  {
    value: 'Augmenter Revenus',
    label: 'Augmenter Revenus',
    description: 'Augmenter les revenus existants ou créer de nouvelles sources',
    icon: 'trending-up',
    color: '#10b981',
  },
  {
    value: 'Réduire Dépenses',
    label: 'Réduire Dépenses',
    description: 'Optimiser et réduire les dépenses sans sacrifier la qualité de vie',
    icon: 'trending-down',
    color: '#3b82f6',
  },
  {
    value: 'Optimiser Imposition',
    label: 'Optimiser Imposition',
    description: 'Réduire la fiscalité à travers la planification fiscale',
    icon: 'calculator',
    color: '#8b5cf6',
  },
  {
    value: 'Réduire Dettes',
    label: 'Réduire Dettes',
    description: 'Rembourser et diminuer le niveau d\'endettement',
    icon: 'shield-x',
    color: '#ef4444',
  },
  {
    value: 'Augmenter Épargne',
    label: 'Augmenter Épargne',
    description: 'Augmenter le taux d\'épargne et l\'accumulation de patrimoine',
    icon: 'piggy-bank',
    color: '#f59e0b',
  },
  {
    value: 'Diversifier Revenus',
    label: 'Diversifier Revenus',
    description: 'Créer plusieurs sources de revenus pour plus de stabilité',
    icon: 'zap',
    color: '#06b6d4',
  },
] as const;

export const IMPROVEMENT_LEVERS_COUNT = IMPROVEMENT_LEVER_TYPES.length;
console.assert(
  IMPROVEMENT_LEVERS_COUNT === 6,
  `CRITICAL: Expected 6 improvement levers, got ${IMPROVEMENT_LEVERS_COUNT}`,
);

/**
 * Get improvement lever type config
 */
export function getImprovementLeverType(value: string) {
  return IMPROVEMENT_LEVER_TYPES.find((lever) => lever.value === value);
}

// ============================================================================
// CURRENCY CONSTANTS
// ============================================================================

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = {
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'fr-FR' },
  USD: { code: 'USD', symbol: '$', name: 'Dollar US', locale: 'en-US' },
  GBP: { code: 'GBP', symbol: '£', name: 'Livre Sterling', locale: 'en-GB' },
} as const;

export const DEFAULT_CURRENCY = 'EUR';

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Minimum transaction amount (in cents)
 */
export const MIN_TRANSACTION_AMOUNT = 0;

/**
 * Maximum transaction amount (in cents) - 999,999,999.99 EUR
 */
export const MAX_TRANSACTION_AMOUNT = 99999999999;

/**
 * Maximum number of decimal places for percentages
 */
export const PERCENTAGE_DECIMAL_PLACES = 2;

/**
 * Interest rate maximum (%)
 */
export const MAX_INTEREST_RATE = 100;

/**
 * Minimum duration for financial commitments (months)
 */
export const MIN_COMMITMENT_DURATION = 1;

/**
 * Maximum duration for financial commitments (months)
 */
export const MAX_COMMITMENT_DURATION = 600; // 50 years

// ============================================================================
// FEATURE FLAGS (if needed)
// ============================================================================

export const FEATURE_FLAGS = {
  ENABLE_BULK_IMPORT: true,
  ENABLE_EXPORT_PDF: true,
  ENABLE_MOBILE_APP: true,
  ENABLE_API_SYNC: true,
  ENABLE_FORECASTING: true,
} as const;

// ============================================================================
// END OF CONSTANTS
// ============================================================================

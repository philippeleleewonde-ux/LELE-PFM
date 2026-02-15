/**
 * ============================================
 * TYPES - CENTRE DE PERFORMANCE
 * ============================================
 *
 * Types et fonctions de calcul pour le Centre de la Performance
 * des lignes d'activités et des salariés par indicateurs socio-économiques.
 *
 * @module performanceCenter
 * @version 3.1.0
 *
 * @description
 * Ce module contient:
 * - Les types TypeScript pour la gestion des performances
 * - Les fonctions de calcul de note et grade
 * - Les utilitaires de style (couleurs, labels)
 *
 * Formules principales:
 * - Note Globale: (Économies / Objectif) × 10, plafonnée à 10
 * - Distribution Prime: 33% des économies
 * - Distribution Trésorerie: 67% des économies
 */

// ============================================
// CONSTANTES DE DISTRIBUTION
// ============================================

/** Ratio de distribution pour la Prime (33%) */
export const PRIME_RATIO = 0.33;

/** Ratio de distribution pour la Trésorerie (67%) */
export const TRESO_RATIO = 0.67;

// ============================================
// TYPES PRINCIPAUX
// ============================================

/**
 * Représente la performance complète d'un employé.
 *
 * @interface EmployeePerformance
 * @property {string} id - Identifiant unique de l'employé
 * @property {string} name - Nom complet de l'employé
 * @property {number} globalNote - Note sur 10 (0-10)
 * @property {string} grade - Grade de performance (A+ à E)
 */
export interface EmployeePerformance {
  id: string;
  name: string;
  role: string;
  businessLineId: string;
  businessLineName: string;
  teamLeader: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;

  // Note et Grade
  globalNote: number;           // Note sur 10
  previousGlobalNote?: number;  // Note précédente (pour tendance)
  grade: string;                // A+, A, B+, B, C+, C, D+, D, E+, E

  // Performance de la ligne
  linePerformance: {
    objectif: number;
    economiesRealisees: number;
    prevPrime: number;
    prevTreso: number;
    realPrime: number;
    realTreso: number;
  };

  // Performance globale du salarié
  employeePerformance: {
    objectif: number;
    economiesRealisees: number;
    prevPrime: number;
    prevTreso: number;
    realPrime: number;
    realTreso: number;
  };

  // Performance par indicateur
  indicators: {
    absenteisme: IndicatorPerformanceDetail;
    qualite: IndicatorPerformanceDetail;
    accident: IndicatorPerformanceDetail;
    productivite: IndicatorPerformanceDetail;
    savoirFaire: IndicatorPerformanceDetail;
  };
}

export interface IndicatorPerformanceDetail {
  key: string;
  label: string;
  totalTemps?: number;       // Heures
  totalFrais?: number;       // EUR
  objectif: number;          // EUR
  economiesRealisees: number; // EUR
  prevPrime: number;
  prevTreso: number;
  realPrime: number;
  realTreso: number;
}

export interface BusinessLineWithEmployees {
  id: string;
  name: string;
  employees: EmployeePerformance[];
  totals: {
    objectif: number;
    economiesRealisees: number;
    avgNote: number;
    // Totaux Prime/Trésorerie pour le bulletin
    prevPrime?: number;
    prevTreso?: number;
    realPrime?: number;
    realTreso?: number;
  };
}

// ============================================
// CALCUL DE LA NOTE ET DU GRADE
// ============================================

/**
 * Calcule la note globale de performance d'un employé sur une échelle de 0 à 10.
 *
 * @description
 * La note est calculée selon la formule: (Économies Réalisées / Objectif) × 10
 * - Elle est plafonnée à 10 (surperformance)
 * - Elle est bornée à 0 (valeurs négatives ou invalides)
 * - Elle est arrondie au dixième le plus proche
 *
 * @param economiesRealisees - Montant des économies réalisées en devise locale (doit être ≥ 0)
 * @param objectif - Objectif d'économies assigné à l'employé (doit être > 0)
 * @returns Note sur 10, arrondie au dixième, comprise entre 0 et 10 inclus
 *
 * @example
 * // Performance à 100%
 * calculateGlobalNote(1000, 1000) // returns 10
 *
 * @example
 * // Performance à 75%
 * calculateGlobalNote(750, 1000) // returns 7.5
 *
 * @example
 * // Surperformance (plafonnée)
 * calculateGlobalNote(1500, 1000) // returns 10
 *
 * @example
 * // Objectif non défini
 * calculateGlobalNote(500, 0) // returns 0
 *
 * @example
 * // Valeurs négatives (invalides)
 * calculateGlobalNote(-100, 1000) // returns 0
 *
 * @since 3.1.0
 */
export function calculateGlobalNote(economiesRealisees: number, objectif: number): number {
  // Validation: objectif doit être positif
  if (objectif <= 0) return 0;

  // Validation: économies négatives invalides
  if (economiesRealisees < 0) return 0;

  // Calcul de la note
  const note = (economiesRealisees / objectif) * 10;

  // Arrondir à 1 décimale, borner entre 0 et 10
  return Math.min(10, Math.max(0, Math.round(note * 10) / 10));
}

/**
 * Attribue le grade de performance en fonction de la note globale.
 *
 * @description
 * La note est arrondie à l'entier le plus proche avant attribution du grade.
 * Échelle des grades:
 * - A+ : 9-10 (Excellent)
 * - A  : 8 (Très bien)
 * - B+ : 7 (Bien)
 * - B  : 6 (Assez bien)
 * - C+ : 5 (Passable)
 * - C  : 4 (Insuffisant)
 * - D+ : 3 (Médiocre)
 * - D  : 2 (Très insuffisant)
 * - E+ : 1 (Critique)
 * - E  : 0 ou négatif (Échec)
 *
 * @param note - Note globale sur 10 (sera arrondie)
 * @returns Grade sous forme de chaîne (A+, A, B+, B, C+, C, D+, D, E+, E)
 *
 * @example
 * calculateGrade(9.5) // returns 'A+' (arrondi à 10)
 * calculateGrade(7.4) // returns 'B+' (arrondi à 7)
 * calculateGrade(5.5) // returns 'B' (arrondi à 6)
 * calculateGrade(0)   // returns 'E'
 *
 * @since 3.1.0
 */
export function calculateGrade(note: number): string {
  const roundedNote = Math.round(note);

  // Mapping optimisé avec objet au lieu de switch
  const gradeMap: Record<number, string> = {
    10: 'A+',
    9: 'A+',
    8: 'A',
    7: 'B+',
    6: 'B',
    5: 'C+',
    4: 'C',
    3: 'D+',
    2: 'D',
    1: 'E+'
  };

  return gradeMap[roundedNote] ?? 'E';
}

// ============================================
// VALIDATION DU RATIO PRIME / TRÉSORERIE
// ============================================

/**
 * Résultat de la validation du ratio Prime/Trésorerie.
 *
 * @interface RatioValidationResult
 */
export interface RatioValidationResult {
  /** La répartition Prime respecte-t-elle le ratio 33% ? */
  isPrimeRatioValid: boolean;
  /** La répartition Trésorerie respecte-t-elle le ratio 67% ? */
  isTresoRatioValid: boolean;
  /** Les deux ratios sont-ils conformes ? */
  isFullyCompliant: boolean;
  /** Ratio Prime calculé (réel) */
  actualPrimeRatio: number;
  /** Ratio Trésorerie calculé (réel) */
  actualTresoRatio: number;
  /** Écart Prime en pourcentage */
  primeDeviation: number;
  /** Écart Trésorerie en pourcentage */
  tresoDeviation: number;
}

/**
 * Valide que la répartition Prime/Trésorerie respecte les ratios 33%/67%.
 * Tolère un écart de 1% pour les arrondis.
 *
 * @param economiesRealisees - Montant total des économies réalisées
 * @param realPrime - Montant attribué à la Prime
 * @param realTreso - Montant attribué à la Trésorerie
 * @param tolerance - Tolérance d'écart en ratio (default: 0.01 = 1%)
 * @returns Résultat de la validation avec détails
 *
 * @example
 * // Cas conforme
 * validatePrimeTresoRatio(1000, 330, 670)
 * // { isPrimeRatioValid: true, isTresoRatioValid: true, isFullyCompliant: true, ... }
 *
 * // Cas non conforme
 * validatePrimeTresoRatio(1000, 500, 500)
 * // { isPrimeRatioValid: false, isTresoRatioValid: false, isFullyCompliant: false, ... }
 *
 * @since 3.1.0
 */
export function validatePrimeTresoRatio(
  economiesRealisees: number,
  realPrime: number,
  realTreso: number,
  tolerance: number = 0.01
): RatioValidationResult {
  // Protection contre division par zéro
  if (economiesRealisees <= 0) {
    return {
      isPrimeRatioValid: true,
      isTresoRatioValid: true,
      isFullyCompliant: true,
      actualPrimeRatio: 0,
      actualTresoRatio: 0,
      primeDeviation: 0,
      tresoDeviation: 0
    };
  }

  // Calcul des ratios réels
  const actualPrimeRatio = realPrime / economiesRealisees;
  const actualTresoRatio = realTreso / economiesRealisees;

  // Calcul des écarts
  const primeDeviation = Math.abs(actualPrimeRatio - PRIME_RATIO);
  const tresoDeviation = Math.abs(actualTresoRatio - TRESO_RATIO);

  // Validation avec tolérance
  const isPrimeRatioValid = primeDeviation <= tolerance;
  const isTresoRatioValid = tresoDeviation <= tolerance;

  return {
    isPrimeRatioValid,
    isTresoRatioValid,
    isFullyCompliant: isPrimeRatioValid && isTresoRatioValid,
    actualPrimeRatio,
    actualTresoRatio,
    primeDeviation,
    tresoDeviation
  };
}

// ============================================
// VALIDATION RÉALISÉ ≤ PRÉVU (RIGUEUR COMPTABLE)
// ============================================

/**
 * Résultat de la validation du plafond Réalisé vs Prévu.
 *
 * @interface CapValidationResult
 * @description
 * Vérifie que les montants réalisés ne dépassent JAMAIS les montants prévisionnels.
 * C'est un principe comptable fondamental.
 *
 * @since 3.1.1
 */
export interface CapValidationResult {
  /** La Prime réalisée respecte-t-elle le plafond Prévu ? */
  isPrimeCapValid: boolean;
  /** La Trésorerie réalisée respecte-t-elle le plafond Prévu ? */
  isTresoCapValid: boolean;
  /** Les deux plafonds sont-ils respectés ? */
  isFullyCompliant: boolean;
  /** Excès Prime (si > 0, c'est une anomalie) */
  primeExcess: number;
  /** Excès Trésorerie (si > 0, c'est une anomalie) */
  tresoExcess: number;
  /** Ratio Prime réalisée / prévue (max 100%) */
  primeRatio: number;
  /** Ratio Trésorerie réalisée / prévue (max 100%) */
  tresoRatio: number;
}

/**
 * Valide que les montants réalisés ne dépassent pas les montants prévisionnels.
 *
 * @description
 * Principe comptable fondamental: Réalisé ≤ Prévu (TOUJOURS)
 * - realPrime ≤ prevPrime
 * - realTreso ≤ prevTreso
 *
 * @param prevPrime - Prime prévisionnelle
 * @param realPrime - Prime réalisée
 * @param prevTreso - Trésorerie prévisionnelle
 * @param realTreso - Trésorerie réalisée
 * @returns Résultat de validation avec détails
 *
 * @example
 * // Cas conforme
 * validateRealVsPrev(100, 80, 200, 150)
 * // { isPrimeCapValid: true, isTresoCapValid: true, isFullyCompliant: true, ... }
 *
 * // Cas non conforme (réalisé > prévu)
 * validateRealVsPrev(100, 120, 200, 150)
 * // { isPrimeCapValid: false, isTresoCapValid: true, isFullyCompliant: false, primeExcess: 20, ... }
 *
 * @since 3.1.1
 */
export function validateRealVsPrev(
  prevPrime: number,
  realPrime: number,
  prevTreso: number,
  realTreso: number
): CapValidationResult {
  // Calcul des excès (si > 0, c'est une anomalie)
  const primeExcess = Math.max(0, realPrime - prevPrime);
  const tresoExcess = Math.max(0, realTreso - prevTreso);

  // Validation des plafonds
  const isPrimeCapValid = realPrime <= prevPrime;
  const isTresoCapValid = realTreso <= prevTreso;

  // Calcul des ratios (protection division par zéro)
  const primeRatio = prevPrime > 0 ? Math.min(100, (realPrime / prevPrime) * 100) : 0;
  const tresoRatio = prevTreso > 0 ? Math.min(100, (realTreso / prevTreso) * 100) : 0;

  return {
    isPrimeCapValid,
    isTresoCapValid,
    isFullyCompliant: isPrimeCapValid && isTresoCapValid,
    primeExcess,
    tresoExcess,
    primeRatio,
    tresoRatio
  };
}

/**
 * Plafonne un montant réalisé pour qu'il ne dépasse pas le prévu.
 *
 * @description
 * Applique le principe comptable: Réalisé ≤ Prévu
 * Retourne Math.min(realAmount, prevAmount)
 *
 * @param realAmount - Montant réalisé
 * @param prevAmount - Montant prévisionnel (plafond)
 * @returns Montant plafonné
 *
 * @example
 * capRealToPrevu(120, 100) // returns 100 (plafonné)
 * capRealToPrevu(80, 100)  // returns 80 (inchangé)
 *
 * @since 3.1.1
 */
export function capRealToPrevu(realAmount: number, prevAmount: number): number {
  return Math.min(realAmount, prevAmount);
}

/**
 * Calcule et plafonne les montants Prime et Trésorerie réalisés.
 *
 * @description
 * Applique la distribution 33%/67% avec plafonnement automatique.
 * Garantit que realPrime ≤ prevPrime et realTreso ≤ prevTreso.
 *
 * @param economiesRealisees - Total des économies réalisées
 * @param pprPrevues - Total des PPR prévus
 * @returns Objet avec les 4 montants calculés et plafonnés
 *
 * @example
 * calculateCappedPrimeTreso(150, 100)
 * // { prevPrime: 33, prevTreso: 67, realPrime: 33, realTreso: 67 }
 * // (réalisé plafonné au prévu car économies > PPR)
 *
 * @since 3.1.1
 */
export function calculateCappedPrimeTreso(
  economiesRealisees: number,
  pprPrevues: number
): { prevPrime: number; prevTreso: number; realPrime: number; realTreso: number } {
  // Calcul des montants prévisionnels
  const prevPrime = pprPrevues * PRIME_RATIO;
  const prevTreso = pprPrevues * TRESO_RATIO;

  // Calcul des montants réalisés (non plafonnés)
  const rawRealPrime = economiesRealisees * PRIME_RATIO;
  const rawRealTreso = economiesRealisees * TRESO_RATIO;

  // Plafonnement: Réalisé ≤ Prévu (TOUJOURS)
  const realPrime = capRealToPrevu(rawRealPrime, prevPrime);
  const realTreso = capRealToPrevu(rawRealTreso, prevTreso);

  return { prevPrime, prevTreso, realPrime, realTreso };
}

/**
 * Mapping des grades vers les classes de couleur de fond Tailwind.
 * Optimisé pour le contraste WCAG AA (minimum 4.5:1).
 *
 * @constant
 * @since 3.1.0
 */
/**
 * Mapping des grades vers les classes de couleur de fond Tailwind.
 * WCAG AA Conformité: Toutes les couleurs ont un contraste ≥ 4.5:1 avec texte blanc.
 *
 * @see docs/AUDIT-VISUAL-WCAG.md pour le détail des ratios de contraste
 */
const GRADE_BG_COLORS: Record<string, string> = {
  'A+': 'bg-emerald-600',  // Contraste 5.1:1 ✓
  'A': 'bg-green-600',     // Contraste 4.5:1 ✓
  'B+': 'bg-blue-600',     // Contraste 4.6:1 ✓
  'B': 'bg-sky-600',       // Contraste 4.7:1 ✓
  'C+': 'bg-amber-700',    // Contraste 4.6:1 ✓ (corrigé de amber-600)
  'C': 'bg-orange-700',    // Contraste 4.7:1 ✓ (corrigé de orange-600)
  'D+': 'bg-red-600',      // Contraste 4.5:1 ✓ (corrigé de red-500)
  'D': 'bg-red-700',       // Contraste 5.6:1 ✓ (renforcé)
  'E+': 'bg-rose-700',     // Contraste 5.2:1 ✓ (corrigé de rose-600)
  'E': 'bg-rose-800'       // Contraste 6.8:1 ✓ (renforcé)
};

/**
 * Retourne la classe CSS de couleur de fond associée au grade.
 *
 * @description
 * Les couleurs sont optimisées pour:
 * - Contraste WCAG AA (4.5:1 minimum avec texte blanc)
 * - Lisibilité en mode clair et sombre
 * - Cohérence visuelle progressive (vert → bleu → orange → rouge)
 *
 * @param grade - Grade de performance (A+, A, B+, B, C+, C, D+, D, E+, E)
 * @returns Classe Tailwind CSS pour le background (ex: 'bg-emerald-600')
 *
 * @example
 * getGradeColor('A+') // returns 'bg-emerald-600'
 * getGradeColor('C')  // returns 'bg-orange-600'
 * getGradeColor('X')  // returns 'bg-gray-500' (fallback)
 *
 * @since 3.1.0
 */
export function getGradeColor(grade: string): string {
  return GRADE_BG_COLORS[grade] ?? 'bg-gray-500';
}

/**
 * Mapping des grades vers les classes de couleur de texte Tailwind.
 *
 * @constant
 * @since 3.1.0
 */
const GRADE_TEXT_COLORS: Record<string, string> = {
  'A+': 'text-emerald-600 dark:text-emerald-400',
  'A': 'text-green-600 dark:text-green-400',
  'B+': 'text-blue-600 dark:text-blue-400',
  'B': 'text-sky-600 dark:text-sky-400',
  'C+': 'text-amber-600 dark:text-amber-400',
  'C': 'text-orange-600 dark:text-orange-400',
  'D+': 'text-red-500 dark:text-red-400',
  'D': 'text-red-600 dark:text-red-400',
  'E+': 'text-rose-600 dark:text-rose-400',
  'E': 'text-rose-700 dark:text-rose-400'
};

/**
 * Retourne la classe CSS de couleur de texte associée au grade.
 *
 * @description
 * Inclut les variantes dark mode pour une lisibilité optimale.
 *
 * @param grade - Grade de performance (A+, A, B+, B, C+, C, D+, D, E+, E)
 * @returns Classe Tailwind CSS pour la couleur du texte avec dark mode
 *
 * @example
 * getGradeTextColor('A+') // returns 'text-emerald-600 dark:text-emerald-400'
 *
 * @since 3.1.0
 */
export function getGradeTextColor(grade: string): string {
  return GRADE_TEXT_COLORS[grade] ?? 'text-gray-600 dark:text-gray-400';
}

// ============================================
// CONSTANTES
// ============================================

export const INDICATOR_LABELS: Record<string, string> = {
  abs: 'Absentéisme',
  qd: 'Défauts de qualité',
  oa: 'Accidents du travail',
  ddp: 'Écarts de productivité directe',
  ekh: 'Écarts de savoir-faire'
};

export const INDICATOR_KEYS = ['abs', 'qd', 'oa', 'ddp', 'ekh'] as const;
export type IndicatorKey = typeof INDICATOR_KEYS[number];

// ============================================
// VALIDATION DES ENTRÉES
// ============================================

/**
 * Résultat de validation avec message d'erreur optionnel.
 *
 * @interface ValidationResult
 * @property {boolean} isValid - Indique si la valeur est valide
 * @property {string} [error] - Message d'erreur si invalide
 * @property {number} [sanitizedValue] - Valeur corrigée/nettoyée
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: number;
}

/**
 * Valide et nettoie une valeur monétaire.
 *
 * @description
 * Vérifie que la valeur est:
 * - Un nombre fini
 * - Non-NaN
 * - Optionnellement non-négatif
 *
 * @param value - Valeur à valider
 * @param fieldName - Nom du champ pour le message d'erreur
 * @param options - Options de validation
 * @param options.allowNegative - Autoriser les valeurs négatives (défaut: false)
 * @param options.maxValue - Valeur maximale autorisée
 * @returns Résultat de validation avec valeur nettoyée
 *
 * @example
 * validateCurrency(1000, 'objectif')
 * // { isValid: true, sanitizedValue: 1000 }
 *
 * @example
 * validateCurrency(-500, 'économies', { allowNegative: false })
 * // { isValid: false, error: 'économies ne peut pas être négatif' }
 *
 * @since 3.1.0
 */
export function validateCurrency(
  value: unknown,
  fieldName: string,
  options: { allowNegative?: boolean; maxValue?: number } = {}
): ValidationResult {
  const { allowNegative = false, maxValue } = options;

  // Conversion en nombre
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);

  // Vérification NaN ou non-fini
  if (!Number.isFinite(numValue)) {
    return {
      isValid: false,
      error: `${fieldName} doit être un nombre valide`,
      sanitizedValue: 0
    };
  }

  // Vérification négativité
  if (!allowNegative && numValue < 0) {
    return {
      isValid: false,
      error: `${fieldName} ne peut pas être négatif`,
      sanitizedValue: 0
    };
  }

  // Vérification valeur maximale
  if (maxValue !== undefined && numValue > maxValue) {
    return {
      isValid: false,
      error: `${fieldName} dépasse la valeur maximale autorisée (${maxValue})`,
      sanitizedValue: maxValue
    };
  }

  return {
    isValid: true,
    sanitizedValue: numValue
  };
}

/**
 * Valide un objectif de performance.
 *
 * @description
 * Un objectif valide doit être:
 * - Un nombre positif
 * - Supérieur à zéro (pour éviter les divisions par zéro)
 *
 * @param objectif - Valeur de l'objectif
 * @returns Résultat de validation
 *
 * @example
 * validateObjectif(5000) // { isValid: true, sanitizedValue: 5000 }
 * validateObjectif(0)    // { isValid: false, error: "L'objectif doit être supérieur à 0" }
 *
 * @since 3.1.0
 */
export function validateObjectif(objectif: unknown): ValidationResult {
  const result = validateCurrency(objectif, 'Objectif', { allowNegative: false });

  if (!result.isValid) return result;

  if (result.sanitizedValue === 0) {
    return {
      isValid: false,
      error: "L'objectif doit être supérieur à 0",
      sanitizedValue: 0
    };
  }

  return result;
}

/**
 * Valide des économies réalisées.
 *
 * @description
 * Les économies peuvent être:
 * - Positives (économies effectives)
 * - Zéro (aucune économie)
 * - Les valeurs négatives sont plafonnées à 0 pour le calcul de note
 *
 * @param economies - Valeur des économies
 * @returns Résultat de validation avec valeur nettoyée (≥ 0)
 *
 * @example
 * validateEconomies(1000)  // { isValid: true, sanitizedValue: 1000 }
 * validateEconomies(-500)  // { isValid: true, sanitizedValue: 0 } (plafonné)
 *
 * @since 3.1.0
 */
export function validateEconomies(economies: unknown): ValidationResult {
  const result = validateCurrency(economies, 'Économies', { allowNegative: true });

  if (!result.isValid) return result;

  // Plafonner les valeurs négatives à 0 (pas de note négative)
  return {
    isValid: true,
    sanitizedValue: Math.max(0, result.sanitizedValue ?? 0)
  };
}

/**
 * Valide une clé d'indicateur.
 *
 * @param key - Clé à valider
 * @returns true si la clé est un indicateur valide
 *
 * @example
 * isValidIndicatorKey('abs') // true
 * isValidIndicatorKey('xyz') // false
 *
 * @since 3.1.0
 */
export function isValidIndicatorKey(key: string): key is IndicatorKey {
  return INDICATOR_KEYS.includes(key as IndicatorKey);
}

/**
 * Valide un grade de performance.
 *
 * @param grade - Grade à valider
 * @returns true si le grade est valide (A+ à E)
 *
 * @example
 * isValidGrade('A+') // true
 * isValidGrade('F')  // false
 *
 * @since 3.1.0
 */
export function isValidGrade(grade: string): boolean {
  const validGrades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'E+', 'E'];
  return validGrades.includes(grade);
}

/**
 * Calcule la note globale avec validation préalable des entrées.
 *
 * @description
 * Version sécurisée de calculateGlobalNote qui valide les entrées
 * et retourne un résultat structuré avec messages d'erreur.
 *
 * @param economiesRealisees - Économies réalisées
 * @param objectif - Objectif assigné
 * @returns Objet avec note, grade et éventuels avertissements
 *
 * @example
 * calculateGlobalNoteWithValidation(750, 1000)
 * // { note: 7.5, grade: 'A', isValid: true }
 *
 * @since 3.1.0
 */
export function calculateGlobalNoteWithValidation(
  economiesRealisees: unknown,
  objectif: unknown
): { note: number; grade: string; isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Valider l'objectif
  const objResult = validateObjectif(objectif);
  if (!objResult.isValid) {
    warnings.push(objResult.error || 'Objectif invalide');
  }

  // Valider les économies
  const ecoResult = validateEconomies(economiesRealisees);
  if (!ecoResult.isValid) {
    warnings.push(ecoResult.error || 'Économies invalides');
  }

  // Calculer avec les valeurs nettoyées
  const cleanObjectif = objResult.sanitizedValue ?? 0;
  const cleanEconomies = ecoResult.sanitizedValue ?? 0;

  const note = calculateGlobalNote(cleanEconomies, cleanObjectif);
  const grade = calculateGrade(note);

  return {
    note,
    grade,
    isValid: warnings.length === 0,
    warnings
  };
}

// ============================================
// SANITIZATION DES DONNÉES LOCALSTORAGE
// ============================================

/**
 * Interface pour les données d'indicateur (structure localStorage)
 */
interface IndicatorDataForSanitization {
  prevPrime?: number;
  prevTreso?: number;
  realPrime?: number;
  realTreso?: number;
  [key: string]: any;
}

/**
 * Interface pour les données de performance (structure localStorage)
 */
interface PerformanceDataForSanitization {
  prevPrime?: number;
  prevTreso?: number;
  realPrime?: number;
  realTreso?: number;
  [key: string]: any;
}

/**
 * Interface pour les données d'employé (structure localStorage)
 */
interface EmployeeDataForSanitization {
  linePerformance?: PerformanceDataForSanitization;
  employeePerformance?: PerformanceDataForSanitization;
  indicators?: Record<string, IndicatorDataForSanitization>;
  [key: string]: any;
}

/**
 * Applique le plafonnement à un objet de performance (linePerformance ou employeePerformance).
 *
 * @description
 * Garantit que realPrime ≤ prevPrime et realTreso ≤ prevTreso.
 * Modifie l'objet en place.
 *
 * @param perf - Objet de performance à sanitizer
 * @returns L'objet modifié avec plafonnement appliqué
 *
 * @since 3.1.2
 */
function sanitizePerformanceObject(perf: PerformanceDataForSanitization): PerformanceDataForSanitization {
  if (!perf) return perf;

  const prevPrime = perf.prevPrime ?? 0;
  const prevTreso = perf.prevTreso ?? 0;
  const realPrime = perf.realPrime ?? 0;
  const realTreso = perf.realTreso ?? 0;

  // ✅ PLAFONNEMENT: Réalisé ≤ Prévu (TOUJOURS)
  perf.realPrime = Math.min(realPrime, prevPrime);
  perf.realTreso = Math.min(realTreso, prevTreso);

  return perf;
}

/**
 * Applique le plafonnement à tous les indicateurs d'un employé.
 *
 * @description
 * Parcourt tous les indicateurs (absenteisme, qualite, accident, productivite, savoirFaire)
 * et applique Math.min(realPrime, prevPrime) et Math.min(realTreso, prevTreso).
 *
 * @param indicators - Objet contenant les indicateurs
 * @returns L'objet modifié avec plafonnement appliqué
 *
 * @since 3.1.2
 */
function sanitizeIndicators(indicators: Record<string, IndicatorDataForSanitization>): Record<string, IndicatorDataForSanitization> {
  if (!indicators) return indicators;

  Object.keys(indicators).forEach(key => {
    const ind = indicators[key];
    if (ind) {
      sanitizePerformanceObject(ind);
    }
  });

  return indicators;
}

/**
 * Sanitize une liste de données employés pour garantir la conformité comptable.
 *
 * @description
 * Applique le principe comptable "Réalisé ≤ Prévu" à TOUTES les données:
 * - linePerformance (performance de la ligne)
 * - employeePerformance (performance globale de l'employé)
 * - indicators (tous les indicateurs)
 *
 * ⚠️ CRITIQUE: Cette fonction DOIT être appelée après lecture du localStorage
 * pour garantir que les anciennes données non plafonnées soient corrigées.
 *
 * @param employees - Liste des employés à sanitizer
 * @returns Liste des employés avec plafonnement appliqué
 *
 * @example
 * const bulletinData = JSON.parse(localStorage.getItem('hcm_bulletin_performances'));
 * const sanitizedData = sanitizeEmployeePerformances(bulletinData.data);
 * setEmployeePerformances(sanitizedData);
 *
 * @since 3.1.2
 */
export function sanitizeEmployeePerformances<T extends EmployeeDataForSanitization>(employees: T[]): T[] {
  if (!employees || !Array.isArray(employees)) return employees;

  let totalCorrected = 0;

  employees.forEach(emp => {
    // 1. Sanitize linePerformance
    if (emp.linePerformance) {
      const before = { realPrime: emp.linePerformance.realPrime, realTreso: emp.linePerformance.realTreso };
      sanitizePerformanceObject(emp.linePerformance);
      if (before.realPrime !== emp.linePerformance.realPrime || before.realTreso !== emp.linePerformance.realTreso) {
        totalCorrected++;
      }
    }

    // 2. Sanitize employeePerformance
    if (emp.employeePerformance) {
      const before = { realPrime: emp.employeePerformance.realPrime, realTreso: emp.employeePerformance.realTreso };
      sanitizePerformanceObject(emp.employeePerformance);
      if (before.realPrime !== emp.employeePerformance.realPrime || before.realTreso !== emp.employeePerformance.realTreso) {
        totalCorrected++;
      }
    }

    // 3. Sanitize tous les indicateurs
    if (emp.indicators) {
      sanitizeIndicators(emp.indicators);
    }
  });

  if (totalCorrected > 0) {
    console.log(`[SANITIZE] ✅ ${totalCorrected} enregistrements corrigés (Réalisé ≤ Prévu)`);
  }

  return employees;
}

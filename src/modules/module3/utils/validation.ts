/**
 * ============================================
 * UTILITAIRES DE VALIDATION
 * ============================================
 *
 * Fonctions de validation et sanitization des données
 * pour le Centre de Performance.
 *
 * @module validation
 * @version 3.1.0
 */

import type { EmployeePerformance, IndicatorPerformanceDetail } from '../types/performanceCenter';

// ============================================
// TYPES INTERNES
// ============================================

interface ValidationResult<T> {
  isValid: boolean;
  data: T | null;
  errors: string[];
}

// ============================================
// VALIDATION DES VALEURS NUMÉRIQUES
// ============================================

/**
 * Valide et sanitize une valeur numérique.
 *
 * @description
 * - Retourne 0 pour les valeurs undefined, null, NaN
 * - Retourne 0 pour les valeurs négatives si allowNegative est false
 * - Applique un minimum et maximum optionnels
 *
 * @param value - Valeur à valider
 * @param options - Options de validation
 * @returns Valeur numérique validée
 *
 * @example
 * sanitizeNumber(undefined) // returns 0
 * sanitizeNumber(-50) // returns 0
 * sanitizeNumber(150, { max: 100 }) // returns 100
 */
export function sanitizeNumber(
  value: unknown,
  options: {
    min?: number;
    max?: number;
    allowNegative?: boolean;
    defaultValue?: number;
  } = {}
): number {
  const { min = 0, max, allowNegative = false, defaultValue = 0 } = options;

  // Gestion des valeurs invalides
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value));

  if (isNaN(num)) {
    return defaultValue;
  }

  // Validation des valeurs négatives
  if (!allowNegative && num < 0) {
    return defaultValue;
  }

  // Application des bornes
  let result = Math.max(min, num);
  if (max !== undefined) {
    result = Math.min(max, result);
  }

  return result;
}

/**
 * Valide une note de performance (0-10).
 *
 * @param note - Note à valider
 * @returns Note validée entre 0 et 10
 */
export function sanitizeNote(note: unknown): number {
  return sanitizeNumber(note, { min: 0, max: 10, defaultValue: 0 });
}

/**
 * Valide un montant financier (positif ou zéro).
 *
 * @param amount - Montant à valider
 * @returns Montant validé (≥ 0)
 */
export function sanitizeAmount(amount: unknown): number {
  return sanitizeNumber(amount, { min: 0, defaultValue: 0 });
}

// ============================================
// VALIDATION DES CHAÎNES
// ============================================

/**
 * Valide et sanitize une chaîne de caractères.
 *
 * @param value - Valeur à valider
 * @param defaultValue - Valeur par défaut si invalide
 * @returns Chaîne validée et trimée
 */
export function sanitizeString(value: unknown, defaultValue: string = ''): string {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const str = String(value).trim();
  return str || defaultValue;
}

// ============================================
// VALIDATION DES DONNÉES EMPLOYÉ
// ============================================

/**
 * Valide et sanitize les données de performance d'un indicateur.
 *
 * @param data - Données brutes de l'indicateur
 * @returns Données validées ou null si structure invalide
 */
export function sanitizeIndicatorData(data: unknown): IndicatorPerformanceDetail | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const ind = data as Record<string, unknown>;

  return {
    key: sanitizeString(ind.key, 'unknown'),
    label: sanitizeString(ind.label, 'Indicateur'),
    totalTemps: sanitizeNumber(ind.totalTemps),
    totalFrais: sanitizeAmount(ind.totalFrais),
    objectif: sanitizeAmount(ind.objectif),
    economiesRealisees: sanitizeAmount(ind.economiesRealisees),
    prevPrime: sanitizeAmount(ind.prevPrime),
    prevTreso: sanitizeAmount(ind.prevTreso),
    realPrime: sanitizeAmount(ind.realPrime),
    realTreso: sanitizeAmount(ind.realTreso)
  };
}

/**
 * Valide et sanitize les données complètes d'un employé.
 *
 * @description
 * Cette fonction vérifie:
 * - La présence des champs obligatoires (id, name)
 * - La validité des valeurs numériques
 * - La cohérence des indicateurs
 *
 * @param data - Données brutes de l'employé
 * @returns Objet ValidationResult avec les données validées ou les erreurs
 *
 * @example
 * const result = validateEmployeeData(rawData);
 * if (result.isValid) {
 *   console.log(result.data); // EmployeePerformance
 * } else {
 *   console.error(result.errors);
 * }
 */
export function validateEmployeeData(data: unknown): ValidationResult<Partial<EmployeePerformance>> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      data: null,
      errors: ['Les données employé doivent être un objet']
    };
  }

  const emp = data as Record<string, unknown>;

  // Validation des champs obligatoires
  if (!emp.id || typeof emp.id !== 'string') {
    errors.push('ID employé manquant ou invalide');
  }

  if (!emp.name && !emp.employeeName) {
    errors.push('Nom employé manquant');
  }

  // Construction des données validées
  const validatedData: Partial<EmployeePerformance> = {
    id: sanitizeString(emp.id || emp.employeeId),
    name: sanitizeString(emp.name || emp.employeeName),
    role: sanitizeString(emp.role || emp.professionalCategory, 'Non défini'),
    businessLineId: sanitizeString(emp.businessLineId),
    businessLineName: sanitizeString(emp.businessLineName, 'Ligne non assignée'),
    teamLeader: sanitizeString(emp.teamLeader, 'Non assigné'),
    globalNote: sanitizeNote(emp.globalNote),
    grade: sanitizeString(emp.grade, 'E')
  };

  // Validation de la performance employé
  if (emp.employeePerformance && typeof emp.employeePerformance === 'object') {
    const perf = emp.employeePerformance as Record<string, unknown>;
    validatedData.employeePerformance = {
      objectif: sanitizeAmount(perf.objectif),
      economiesRealisees: sanitizeAmount(perf.economiesRealisees),
      prevPrime: sanitizeAmount(perf.prevPrime),
      prevTreso: sanitizeAmount(perf.prevTreso),
      realPrime: sanitizeAmount(perf.realPrime),
      realTreso: sanitizeAmount(perf.realTreso)
    };
  }

  return {
    isValid: errors.length === 0,
    data: validatedData,
    errors
  };
}

// ============================================
// VALIDATION DES DONNÉES LOCALSTORAGE
// ============================================

/**
 * Valide les données de bulletin stockées dans localStorage.
 *
 * @param data - Données brutes du localStorage
 * @returns Tableau d'employés validés
 */
export function validateBulletinData(data: unknown): {
  employees: Partial<EmployeePerformance>[];
  invalidCount: number;
  errors: string[];
} {
  const result = {
    employees: [] as Partial<EmployeePerformance>[],
    invalidCount: 0,
    errors: [] as string[]
  };

  if (!data || typeof data !== 'object') {
    result.errors.push('Format de données invalide');
    return result;
  }

  const parsed = data as Record<string, unknown>;
  const employeeList = parsed.data as unknown[];

  if (!Array.isArray(employeeList)) {
    result.errors.push('La liste des employés doit être un tableau');
    return result;
  }

  for (let i = 0; i < employeeList.length; i++) {
    const validation = validateEmployeeData(employeeList[i]);
    if (validation.isValid && validation.data) {
      result.employees.push(validation.data);
    } else {
      result.invalidCount++;
      validation.errors.forEach(err => {
        result.errors.push(`Employé ${i + 1}: ${err}`);
      });
    }
  }

  return result;
}

// ============================================
// HELPERS
// ============================================

/**
 * Vérifie si un objet a une propriété définie et non null.
 */
export function hasProperty<T extends object>(
  obj: T,
  key: keyof T
): boolean {
  return obj[key] !== undefined && obj[key] !== null;
}

/**
 * Retourne true si la valeur est un nombre fini valide.
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
}

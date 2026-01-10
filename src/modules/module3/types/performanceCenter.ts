/**
 * ============================================
 * TYPES - CENTRE DE PERFORMANCE
 * ============================================
 *
 * Types pour le Centre de la Performance des lignes d'activités
 * et des salariés par indicateurs socio-économiques
 */

// ============================================
// TYPES PRINCIPAUX
// ============================================

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
 * Calcule la note globale sur 10
 * Formule: (Économies Réalisées / Objectif) × 10
 */
export function calculateGlobalNote(economiesRealisees: number, objectif: number): number {
  if (objectif <= 0) return 0;
  const note = (economiesRealisees / objectif) * 10;
  // Arrondir à 1 décimale et cap à 10
  return Math.min(10, Math.round(note * 10) / 10);
}

/**
 * Attribue le grade en fonction de la note
 * 10/10 → A+, 9/10 → A+, 8/10 → A, 7/10 → B+, etc.
 */
export function calculateGrade(note: number): string {
  const roundedNote = Math.round(note);

  switch (roundedNote) {
    case 10:
    case 9:
      return 'A+';
    case 8:
      return 'A';
    case 7:
      return 'B+';
    case 6:
      return 'B';
    case 5:
      return 'C+';
    case 4:
      return 'C';
    case 3:
      return 'D+';
    case 2:
      return 'D';
    case 1:
      return 'E+';
    case 0:
    default:
      return 'E';
  }
}

/**
 * Retourne la couleur CSS associée au grade
 */
export function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'bg-emerald-500';
  if (grade.startsWith('B')) return 'bg-yellow-500';
  if (grade.startsWith('C')) return 'bg-orange-500';
  if (grade.startsWith('D')) return 'bg-red-400';
  return 'bg-red-600';
}

/**
 * Retourne la couleur du texte associée au grade
 */
export function getGradeTextColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-600';
  if (grade.startsWith('B')) return 'text-yellow-600';
  if (grade.startsWith('C')) return 'text-orange-600';
  if (grade.startsWith('D')) return 'text-red-400';
  return 'text-red-600';
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

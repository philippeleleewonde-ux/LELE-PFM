/**
 * ============================================
 * BULLETIN HELPERS - Fonctions Utilitaires
 * ============================================
 *
 * Fonctions utilitaires, types et constantes pour le
 * Bulletin de Performance.
 *
 * @module bulletinHelpers
 * @version 3.1.0
 */

import { sanitizeEmployeePerformances } from '../../types/performanceCenter';

// ============================================
// COULEURS GRAPHIQUES
// ============================================

export const CHART_COLORS = [
  '#10b981', // emerald - Absentéisme
  '#eab308', // yellow - Qualité
  '#3b82f6', // blue - Accident
  '#6366f1', // indigo - Productivité
  '#8b5cf6'  // purple - Savoir-faire
];

// ============================================
// TYPES
// ============================================

export type TabType = 'synthese' | 'details' | 'analyses';
export type EvolutionViewMode = 'note' | 'economies';

export interface PerformanceHistory {
  week: string;           // "S48", "S49", etc.
  date: string;           // "25/11 - 01/12"
  globalNote: number;     // 0-10
  economiesRealisees: number;
  objectif: number;
  grade: string;          // A, B, C, D, E
}

export interface BenchmarkData {
  rank: number;                    // Position du salarié (1, 2, 3...)
  totalInDepartment: number;       // Nombre total de salariés dans le département
  percentile: number;              // Top X% (ex: top 33%)

  employeeNote: number;            // Note du salarié actuel
  departmentAverage: number;       // Moyenne du département
  departmentMin: number;           // Note minimum
  departmentMax: number;           // Note maximum

  bestPerformer: {
    name: string;
    note: number;
    grade: string;
  };

  gapToAverage: number;            // Écart par rapport à la moyenne (+/-)
  gapToTop: number;                // Écart par rapport au meilleur
  pointsToNextRank: number;        // Points nécessaires pour monter d'un rang
}

export interface DepartmentEmployee {
  employeeId: string;
  employeeName: string;
  businessLineId: string;
  businessLineName: string;
  globalNote: number;
  grade: string;
}

// ============================================
// BARRE DE PROGRESSION - COULEURS
// ============================================

/**
 * Retourne la couleur de la barre de progression selon le pourcentage.
 *
 * @description
 * - 0-50%  : Rouge (#EF4444) - Insuffisant/Échec
 * - 51-79% : Orange (#F59E0B) - Moyen
 * - 80-99% : Bleu (#3B82F6) - Proche de l'objectif
 * - 100%+  : Vert (#10B981) - Objectif atteint
 *
 * @param percentage - Pourcentage de réalisation
 * @returns Code couleur hexadécimal
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 100) return '#10B981'; // Vert - Objectif atteint
  if (percentage >= 80) return '#3B82F6';  // Bleu - Proche
  if (percentage >= 51) return '#F59E0B';  // Orange - Moyen (51-79%)
  return '#EF4444';                         // Rouge - Insuffisant (0-50%)
}

/**
 * Calcule la largeur de la barre de progression.
 * Si 0%, affiche une barre minimale de 8% pour visualiser l'échec.
 *
 * @param economiesRealisees - Économies réalisées
 * @param objectif - Objectif d'économies
 * @returns Largeur en pourcentage (0-100)
 */
export function getProgressWidth(economiesRealisees: number, objectif: number): number {
  if (objectif <= 0) return 0;
  const percentage = (economiesRealisees / objectif) * 100;
  // Si 0%, afficher une barre minimale de 8% pour visualiser l'échec
  if (percentage === 0) return 8;
  return Math.min(percentage, 100);
}

/**
 * Détermine si le pourcentage est à zéro (échec total).
 *
 * @param economiesRealisees - Économies réalisées
 * @param objectif - Objectif d'économies
 * @returns True si 0%
 */
export function isZeroPercentage(economiesRealisees: number, objectif: number): boolean {
  if (objectif <= 0) return false;
  return economiesRealisees === 0 || (economiesRealisees / objectif) * 100 === 0;
}

/**
 * Retourne la classe CSS du fond de la barre de progression.
 * Fond rouge clair si 0%, sinon gris normal.
 *
 * @param economiesRealisees - Économies réalisées
 * @param objectif - Objectif d'économies
 * @returns Classe Tailwind CSS
 */
export function getProgressTrackClass(economiesRealisees: number, objectif: number): string {
  if (objectif <= 0) return 'bg-gray-200 dark:bg-gray-600';
  const percentage = (economiesRealisees / objectif) * 100;
  if (percentage === 0) {
    return 'bg-red-200 dark:bg-red-900/50'; // Fond rouge clair pour 0%
  }
  return 'bg-gray-200 dark:bg-gray-600';
}

// ============================================
// GÉNÉRATION DONNÉES HISTORIQUES
// ============================================

/**
 * Génère des données historiques simulées basées sur la note actuelle
 * pour montrer une tendance progressive.
 *
 * @param currentNote - Note actuelle
 * @param currentEconomies - Économies actuelles
 * @param objectif - Objectif d'économies
 * @returns Tableau d'historique de performance
 */
export function generateDemoHistory(
  currentNote: number,
  currentEconomies: number,
  objectif: number
): PerformanceHistory[] {
  const weeks = ['S48', 'S49', 'S50', 'S51', 'S52'];
  const dates = ['25/11-01/12', '02/12-08/12', '09/12-15/12', '16/12-22/12', '23/12-26/12'];

  // Calculer une base de départ plus basse pour montrer une progression
  const baseNote = Math.max(0, currentNote - 0.7);
  const baseEconomies = Math.max(0, currentEconomies - (currentEconomies * 0.25));

  return weeks.map((week, index) => {
    // Progression graduelle avec légère variation aléatoire
    const progressRatio = index / (weeks.length - 1);
    const noteVariation = (Math.random() * 0.2 - 0.1);
    const note = Math.min(10, Math.max(0, baseNote + (currentNote - baseNote) * progressRatio + noteVariation));
    const economies = Math.round(baseEconomies + (currentEconomies - baseEconomies) * progressRatio + (Math.random() * 20 - 10));

    // Calculer le grade en fonction de la note
    const roundedNote = Math.round(note);
    let grade = 'E';
    if (roundedNote >= 9) grade = 'A+';
    else if (roundedNote >= 8) grade = 'A';
    else if (roundedNote >= 7) grade = 'B+';
    else if (roundedNote >= 6) grade = 'B';
    else if (roundedNote >= 5) grade = 'C+';
    else if (roundedNote >= 4) grade = 'C';
    else if (roundedNote >= 3) grade = 'D+';
    else if (roundedNote >= 2) grade = 'D';
    else if (roundedNote >= 1) grade = 'E+';

    return {
      week,
      date: dates[index],
      globalNote: Math.round(note * 10) / 10,
      economiesRealisees: Math.max(0, economies),
      objectif,
      grade
    };
  });
}

/**
 * Calcule la tendance sur la période.
 *
 * @param data - Historique de performance
 * @returns Direction ('up', 'down', 'stable'), pourcentage et différence
 */
export function calculateTrend(data: PerformanceHistory[]) {
  if (data.length < 2) return { direction: 'stable' as const, percentage: 0, diff: '0' };

  const first = data[0].globalNote;
  const last = data[data.length - 1].globalNote;
  const diff = last - first;
  const percentage = first > 0 ? Math.abs((diff / first) * 100) : 0;

  return {
    direction: diff > 0.1 ? 'up' as const : diff < -0.1 ? 'down' as const : 'stable' as const,
    percentage: Math.round(percentage * 10) / 10,
    diff: diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)
  };
}

// ============================================
// BENCHMARK - COMPARAISON ÉQUIPE
// ============================================

/**
 * Récupère les données des collègues depuis localStorage.
 *
 * @param currentBusinessLineId - ID de la ligne d'activité
 * @returns Liste des employés du même département
 */
export function getDepartmentEmployeesFromStorage(currentBusinessLineId: string): DepartmentEmployee[] {
  try {
    const bulletinData = localStorage.getItem('hcm_bulletin_performances');
    if (!bulletinData) return [];

    const parsed = JSON.parse(bulletinData);
    // Structure: { companyId, data: [...] }
    const rawEmployees: DepartmentEmployee[] = parsed.data || [];

    // ✅ SANITIZATION: Garantir Réalisé ≤ Prévu (rigueur comptable)
    const allEmployees = sanitizeEmployeePerformances(rawEmployees);

    // Filtrer par même Business Line
    return allEmployees.filter(
      (emp: DepartmentEmployee) => emp.businessLineId === currentBusinessLineId
    );
  } catch (error) {
    console.warn('[Benchmark] Failed to load department data:', error);
    return [];
  }
}

/**
 * Calcule les données de benchmark pour la comparaison d'équipe.
 *
 * @param currentEmployeeId - ID de l'employé actuel
 * @param currentNote - Note actuelle de l'employé
 * @param departmentEmployees - Liste des employés du département
 * @returns Données de benchmark ou null si pas assez de données
 */
export function calculateBenchmark(
  currentEmployeeId: string,
  currentNote: number,
  departmentEmployees: DepartmentEmployee[]
): BenchmarkData | null {
  if (departmentEmployees.length <= 1) return null;

  // Trier par note décroissante
  const sorted = [...departmentEmployees].sort((a, b) => b.globalNote - a.globalNote);

  // Classement
  const rank = sorted.findIndex(emp => emp.employeeId === currentEmployeeId) + 1;
  const totalInDepartment = sorted.length;
  const percentile = Math.round((rank / totalInDepartment) * 100);

  // Stats
  const notes = sorted.map(emp => emp.globalNote);
  const departmentAverage = notes.reduce((a, b) => a + b, 0) / notes.length;
  const departmentMin = Math.min(...notes);
  const departmentMax = Math.max(...notes);

  // Meilleur performeur
  const bestPerformer = {
    name: sorted[0].employeeName,
    note: sorted[0].globalNote,
    grade: sorted[0].grade
  };

  // Écarts
  const gapToAverage = currentNote - departmentAverage;
  const gapToTop = currentNote - departmentMax;

  // Points pour monter d'un rang
  const currentIndex = rank - 1;
  const pointsToNextRank = currentIndex > 0
    ? sorted[currentIndex - 1].globalNote - currentNote
    : 0;

  return {
    rank,
    totalInDepartment,
    percentile,
    employeeNote: currentNote,
    departmentAverage,
    departmentMin,
    departmentMax,
    bestPerformer,
    gapToAverage,
    gapToTop,
    pointsToNextRank
  };
}

/**
 * Formate un nombre pour affichage avec signe + ou -.
 *
 * @param value - Valeur à formater
 * @param decimals - Nombre de décimales
 * @returns Chaîne formatée avec signe
 */
export function formatWithSign(value: number, decimals: number = 1): string {
  const formatted = value.toFixed(decimals);
  return value >= 0 ? `+${formatted}` : formatted;
}

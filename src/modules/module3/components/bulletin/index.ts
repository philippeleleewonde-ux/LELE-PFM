/**
 * ============================================
 * BULLETIN DE PERFORMANCE - INDEX
 * ============================================
 *
 * Point d'entrée pour les sous-composants et utilitaires
 * du Bulletin de Performance.
 *
 * @module bulletin
 * @version 3.1.0
 */

// Helpers et types
export {
  // Types
  type TabType,
  type EvolutionViewMode,
  type PerformanceHistory,
  type BenchmarkData,
  type DepartmentEmployee,

  // Constantes
  CHART_COLORS,

  // Fonctions utilitaires
  getProgressColor,
  getProgressWidth,
  isZeroPercentage,
  getProgressTrackClass,
  generateDemoHistory,
  calculateTrend,
  getDepartmentEmployeesFromStorage,
  calculateBenchmark,
  formatWithSign
} from './bulletinHelpers';

// Composants
export { BenchmarkSection, EmptyBenchmark } from './BenchmarkSection';

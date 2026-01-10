/**
 * ============================================
 * INDICATOR ANALYSIS UTILITIES
 * ============================================
 *
 * Fonctions d'analyse pour identifier les champions
 * et alertes par département et par indicateur.
 */

// ============================================
// TYPES
// ============================================

export interface DepartmentData {
  id: string;
  name: string;
  employeeCount: number;
  totalObjectif: number;
  totalEconomies: number;
  totalPrevPrime: number;
  totalPrevTreso: number;
  totalRealPrime: number;
  totalRealTreso: number;
  contributionPct: number;
}

export interface IndicatorDepartmentData {
  department: string;
  departmentId: string;
  salaries: number;
  economiesRealisees: number;
  objectif: number;
  prevPrime: number;
  prevTreso: number;
  realPrime: number;
  realTreso: number;
}

export interface AnalysisResult {
  best: DepartmentData & {
    tauxAtteinte: number;
    economiesParSalarie: number;
    percentOfMax: number;
  };
  worst: DepartmentData & {
    tauxAtteinte: number;
    economiesParSalarie: number;
    percentOfMax: number;
  };
}

export interface IndicatorAnalysisResult {
  indicatorKey: string;
  indicatorName: string;
  best: IndicatorDepartmentData & {
    economiesParSalarie: number;
    percentOfMax: number;
  };
  worst: IndicatorDepartmentData & {
    economiesParSalarie: number;
    percentOfMax: number;
  };
}

export interface ChampionshipCount {
  championCount: Record<string, number>;
  alertCount: Record<string, number>;
  mostPolyvalent: { department: string; count: number } | null;
  needsMostSupport: { department: string; count: number } | null;
}

// ============================================
// ANALYSE PERFORMANCE GLOBALE
// ============================================

/** Trouver le département avec la meilleure contribution */
export const getBestContribution = (depts: DepartmentData[]): DepartmentData | null => {
  if (depts.length === 0) return null;
  return depts.reduce((max, d) => d.contributionPct > max.contributionPct ? d : max);
};

/** Trouver le département avec la plus faible contribution */
export const getWorstContribution = (depts: DepartmentData[]): DepartmentData | null => {
  if (depts.length === 0) return null;
  return depts.reduce((min, d) => d.contributionPct < min.contributionPct ? d : min);
};

/** Trouver le département avec le meilleur impact trésorerie */
export const getBestTresorerie = (depts: DepartmentData[]): DepartmentData | null => {
  if (depts.length === 0) return null;
  return depts.reduce((max, d) => d.totalRealTreso > max.totalRealTreso ? d : max);
};

/** Trouver le département avec le plus faible impact trésorerie */
export const getWorstTresorerie = (depts: DepartmentData[]): DepartmentData | null => {
  if (depts.length === 0) return null;
  return depts.reduce((min, d) => d.totalRealTreso < min.totalRealTreso ? d : min);
};

/** Calculer le taux d'atteinte d'un département */
export const getAttainmentRate = (d: DepartmentData): number => {
  if (d.totalObjectif <= 0) return 0;
  return (d.totalEconomies / d.totalObjectif) * 100;
};

/** Trouver le département le plus proche de l'objectif */
export const getClosestToObjective = (depts: DepartmentData[]): DepartmentData | null => {
  if (depts.length === 0) return null;
  return depts.reduce((best, d) =>
    getAttainmentRate(d) > getAttainmentRate(best) ? d : best
  );
};

/** Trouver le département le plus éloigné de l'objectif */
export const getFurthestFromObjective = (depts: DepartmentData[]): DepartmentData | null => {
  if (depts.length === 0) return null;
  return depts.reduce((worst, d) =>
    getAttainmentRate(d) < getAttainmentRate(worst) ? d : worst
  );
};

/** Trouver le département avec la plus grosse prime réalisée */
export const getBestPrime = (depts: DepartmentData[]): DepartmentData | null => {
  if (depts.length === 0) return null;
  return depts.reduce((max, d) => d.totalRealPrime > max.totalRealPrime ? d : max);
};

/** Trouver le département avec la plus faible prime réalisée */
export const getWorstPrime = (depts: DepartmentData[]): DepartmentData | null => {
  if (depts.length === 0) return null;
  return depts.reduce((min, d) => d.totalRealPrime < min.totalRealPrime ? d : min);
};

/** Calculer le ratio prime réalisée / prime prévue */
export const getPrimeRatio = (d: DepartmentData): number => {
  if (d.totalPrevPrime <= 0) return 0;
  return (d.totalRealPrime / d.totalPrevPrime) * 100;
};

/** Calculer l'économie pour l'entreprise (prime prévue - prime réalisée) */
export const getPrimeEconomy = (d: DepartmentData): number => {
  return d.totalPrevPrime - d.totalRealPrime;
};

// ============================================
// ANALYSE PAR INDICATEUR
// ============================================

/** Analyser un indicateur pour trouver le meilleur et le pire département */
export const analyzeIndicator = (
  data: IndicatorDepartmentData[],
  indicatorKey: string,
  indicatorName: string
): IndicatorAnalysisResult | null => {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => b.economiesRealisees - a.economiesRealisees);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const bestEcoParSalarie = best.salaries > 0 ? Math.round(best.economiesRealisees / best.salaries) : 0;
  const worstEcoParSalarie = worst.salaries > 0 ? Math.round(worst.economiesRealisees / worst.salaries) : 0;
  const percentOfMax = best.economiesRealisees > 0
    ? Math.round((worst.economiesRealisees / best.economiesRealisees) * 100)
    : 0;

  return {
    indicatorKey,
    indicatorName,
    best: {
      ...best,
      economiesParSalarie: bestEcoParSalarie,
      percentOfMax: 100
    },
    worst: {
      ...worst,
      economiesParSalarie: worstEcoParSalarie,
      percentOfMax
    }
  };
};

/** Compter les apparitions en tant que champion ou alerte */
export const countChampionships = (
  indicatorResults: IndicatorAnalysisResult[]
): ChampionshipCount => {
  const championCount: Record<string, number> = {};
  const alertCount: Record<string, number> = {};

  indicatorResults.forEach(result => {
    if (result.best) {
      championCount[result.best.department] = (championCount[result.best.department] || 0) + 1;
    }
    if (result.worst) {
      alertCount[result.worst.department] = (alertCount[result.worst.department] || 0) + 1;
    }
  });

  const championEntries = Object.entries(championCount).sort(([,a], [,b]) => b - a);
  const alertEntries = Object.entries(alertCount).sort(([,a], [,b]) => b - a);

  return {
    championCount,
    alertCount,
    mostPolyvalent: championEntries.length > 0
      ? { department: championEntries[0][0], count: championEntries[0][1] }
      : null,
    needsMostSupport: alertEntries.length > 0
      ? { department: alertEntries[0][0], count: alertEntries[0][1] }
      : null
  };
};

// ============================================
// FORMATAGE
// ============================================

/** Formater un montant en format compact (K, M, B) */
export const formatCompactAmount = (amount: number, symbol: string): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B ${symbol}`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ${symbol}`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ${symbol}`;
  }
  return `${amount.toLocaleString('fr-FR')} ${symbol}`;
};

/** Formater un pourcentage */
export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/** Formater un écart (positif ou négatif) */
export const formatEcart = (value: number, symbol: string): string => {
  const prefix = value >= 0 ? '+' : '';
  if (Math.abs(value) >= 1000000) {
    return `${prefix}${(value / 1000000).toFixed(1)}M ${symbol}`;
  }
  if (Math.abs(value) >= 1000) {
    return `${prefix}${(value / 1000).toFixed(0)}K ${symbol}`;
  }
  return `${prefix}${value.toLocaleString('fr-FR')} ${symbol}`;
};

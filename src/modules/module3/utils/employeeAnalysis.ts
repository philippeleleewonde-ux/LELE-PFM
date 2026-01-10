/**
 * ============================================
 * EMPLOYEE ANALYSIS UTILITIES
 * ============================================
 *
 * Fonctions d'analyse pour identifier les champions
 * et alertes par SALARIÉ au sein d'un département.
 */

// ============================================
// TYPES
// ============================================

export interface EmployeeData {
  employeeId: string;
  employeeName: string;
  objectif: number;
  economiesRealisees: number;
  prevPrime: number;
  prevTreso: number;
  realPrime: number;
  realTreso: number;
  progressPercent: number;
  contribution: number;
  indicateurs: {
    absenteisme: number;
    defautsQualite: number;
    accidentsTravail: number;
    ecartProductivite: number;
    ecartKnowHow: number;
  };
}

export interface EmployeeAnalysisResult {
  employee: EmployeeData;
  value: number;
  label: string;
}

export type IndicatorKey = 'absenteisme' | 'defautsQualite' | 'accidentsTravail' | 'ecartProductivite' | 'ecartKnowHow';

export interface IndicatorEmployeeAnalysis {
  best: {
    name: string;
    value: number;
    percentOfMax: number;
  };
  worst: {
    name: string;
    value: number;
    percentOfMax: number;
  };
}

export interface VersatilityResult {
  championCount: Record<string, number>;
  alertCount: Record<string, number>;
  mostVersatile: { name: string; count: number } | null;
  needsMostSupport: { name: string; count: number } | null;
}

// ============================================
// ANALYSE PERFORMANCE GLOBALE DES SALARIÉS
// ============================================

/** Trouver le salarié avec la meilleure contribution économies */
export const getBestEmployeeContribution = (employees: EmployeeData[]): EmployeeData | null => {
  if (employees.length === 0) return null;
  return employees.reduce((max, e) => e.economiesRealisees > max.economiesRealisees ? e : max);
};

/** Trouver le salarié avec la plus faible contribution économies */
export const getWorstEmployeeContribution = (employees: EmployeeData[]): EmployeeData | null => {
  if (employees.length === 0) return null;
  return employees.reduce((min, e) => e.economiesRealisees < min.economiesRealisees ? e : min);
};

/** Trouver le salarié avec le meilleur impact trésorerie */
export const getBestEmployeeTresorerie = (employees: EmployeeData[]): EmployeeData | null => {
  if (employees.length === 0) return null;
  return employees.reduce((max, e) => e.realTreso > max.realTreso ? e : max);
};

/** Trouver le salarié avec le plus faible impact trésorerie */
export const getWorstEmployeeTresorerie = (employees: EmployeeData[]): EmployeeData | null => {
  if (employees.length === 0) return null;
  return employees.reduce((min, e) => e.realTreso < min.realTreso ? e : min);
};

/** Trouver le salarié le plus proche de son objectif */
export const getClosestToObjectiveEmployee = (employees: EmployeeData[]): EmployeeData | null => {
  if (employees.length === 0) return null;
  return employees.reduce((best, e) => e.progressPercent > best.progressPercent ? e : best);
};

/** Trouver le salarié le plus éloigné de son objectif */
export const getFurthestFromObjectiveEmployee = (employees: EmployeeData[]): EmployeeData | null => {
  if (employees.length === 0) return null;
  return employees.reduce((worst, e) => e.progressPercent < worst.progressPercent ? e : worst);
};

/** Trouver le salarié avec la plus grosse prime */
export const getBestEmployeePrime = (employees: EmployeeData[]): EmployeeData | null => {
  if (employees.length === 0) return null;
  return employees.reduce((max, e) => e.realPrime > max.realPrime ? e : max);
};

/** Trouver le salarié avec la plus faible prime */
export const getWorstEmployeePrime = (employees: EmployeeData[]): EmployeeData | null => {
  if (employees.length === 0) return null;
  return employees.reduce((min, e) => e.realPrime < min.realPrime ? e : min);
};

/** Calculer le ratio prime réalisée / prime prévue */
export const getEmployeePrimeRatio = (e: EmployeeData): number => {
  if (e.prevPrime <= 0) return 0;
  return (e.realPrime / e.prevPrime) * 100;
};

/** Calculer l'économie pour l'entreprise (prime prévue - prime réalisée) */
export const getEmployeePrimeEconomy = (e: EmployeeData): number => {
  return e.prevPrime - e.realPrime;
};

/** Calculer le ratio trésorerie réalisée / prévue */
export const getEmployeeTresoRatio = (e: EmployeeData): number => {
  if (e.prevTreso <= 0) return 0;
  return (e.realTreso / e.prevTreso) * 100;
};

// ============================================
// ANALYSE PAR INDICATEUR
// ============================================

/** Analyser un indicateur pour les salariés d'un département */
export const analyzeEmployeeIndicator = (
  employees: EmployeeData[],
  indicator: IndicatorKey
): IndicatorEmployeeAnalysis | null => {
  if (employees.length === 0) return null;

  const sorted = [...employees].sort(
    (a, b) => b.indicateurs[indicator] - a.indicateurs[indicator]
  );

  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const maxValue = best.indicateurs[indicator];
  const worstValue = worst.indicateurs[indicator];

  return {
    best: {
      name: best.employeeName,
      value: maxValue,
      percentOfMax: 100
    },
    worst: {
      name: worst.employeeName,
      value: worstValue,
      percentOfMax: maxValue > 0
        ? Math.round((worstValue / maxValue) * 100)
        : 0
    }
  };
};

// ============================================
// RÉCAPITULATIF POLYVALENCE
// ============================================

/** Identifier le salarié le plus polyvalent (champion sur plusieurs indicateurs) */
export const getMostVersatileEmployee = (employees: EmployeeData[]): VersatilityResult => {
  const indicators: IndicatorKey[] = [
    'absenteisme', 'defautsQualite', 'accidentsTravail', 'ecartProductivite', 'ecartKnowHow'
  ];

  const championCount: Record<string, number> = {};
  const alertCount: Record<string, number> = {};

  indicators.forEach(indicator => {
    const analysis = analyzeEmployeeIndicator(employees, indicator);
    if (analysis) {
      championCount[analysis.best.name] = (championCount[analysis.best.name] || 0) + 1;
      alertCount[analysis.worst.name] = (alertCount[analysis.worst.name] || 0) + 1;
    }
  });

  const championEntries = Object.entries(championCount).sort(([,a], [,b]) => b - a);
  const alertEntries = Object.entries(alertCount).sort(([,a], [,b]) => b - a);

  return {
    championCount,
    alertCount,
    mostVersatile: championEntries.length > 0
      ? { name: championEntries[0][0], count: championEntries[0][1] }
      : null,
    needsMostSupport: alertEntries.length > 0
      ? { name: alertEntries[0][0], count: alertEntries[0][1] }
      : null
  };
};

/** Obtenir le tableau récapitulatif des champions par indicateur */
export const getIndicatorSummary = (employees: EmployeeData[]): {
  indicator: IndicatorKey;
  indicatorLabel: string;
  champion: string;
  alert: string;
}[] => {
  const indicatorLabels: Record<IndicatorKey, string> = {
    absenteisme: 'Absentéisme',
    defautsQualite: 'Défauts Qualité',
    accidentsTravail: 'Accidents Travail',
    ecartProductivite: 'Écart Productivité',
    ecartKnowHow: 'Écart Know-How'
  };

  const indicators: IndicatorKey[] = [
    'absenteisme', 'defautsQualite', 'accidentsTravail', 'ecartProductivite', 'ecartKnowHow'
  ];

  return indicators.map(indicator => {
    const analysis = analyzeEmployeeIndicator(employees, indicator);
    return {
      indicator,
      indicatorLabel: indicatorLabels[indicator],
      champion: analysis?.best.name || '-',
      alert: analysis?.worst.name || '-'
    };
  });
};

// ============================================
// TRANSFORMATION DES DONNÉES
// ============================================

/** Transformer les données employé de la page vers le format EmployeeData */
export const transformEmployeePerformanceData = (
  emp: {
    employeeId: string;
    employeeName: string;
    employeePerformance: {
      objectif: number;
      economiesRealisees: number;
      prevPrime: number;
      prevTreso: number;
      realPrime: number;
      realTreso: number;
    };
    indicators?: Record<string, {
      economiesRealisees?: number;
    }>;
  },
  globalTotalEconomies: number
): EmployeeData => {
  const perf = emp.employeePerformance;
  const progressPercent = perf.objectif > 0
    ? (perf.economiesRealisees / perf.objectif) * 100
    : 0;
  const contribution = globalTotalEconomies > 0
    ? (perf.economiesRealisees / globalTotalEconomies) * 100
    : 0;

  return {
    employeeId: emp.employeeId,
    employeeName: emp.employeeName,
    objectif: perf.objectif,
    economiesRealisees: perf.economiesRealisees,
    prevPrime: perf.prevPrime,
    prevTreso: perf.prevTreso,
    realPrime: perf.realPrime,
    realTreso: perf.realTreso,
    progressPercent,
    contribution,
    indicateurs: {
      absenteisme: emp.indicators?.['abs']?.economiesRealisees || 0,
      defautsQualite: emp.indicators?.['qd']?.economiesRealisees || 0,
      accidentsTravail: emp.indicators?.['oa']?.economiesRealisees || 0,
      ecartProductivite: emp.indicators?.['ddp']?.economiesRealisees || 0,
      ecartKnowHow: emp.indicators?.['ekh']?.economiesRealisees || 0
    }
  };
};

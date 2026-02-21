/**
 * ============================================
 * PERFORMANCE DATA CONTEXT
 * ============================================
 *
 * Contexte partagé pour les données de performance calculées
 * Source: PerformanceRecapPage (TOTAL GÉNÉRAL)
 * Destination: CostSavingsReportingPage (Bloc Reporting)
 *
 * Mapping:
 * - Bloc 1: PPR PREVUES (semaine) → Objectif par indicateur
 * - Bloc 2: Données agrégées par ligne d'activité
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================
// TYPES
// ============================================

export interface IndicatorPerformance {
  key: string;
  label: string;
  pprPrevues: number;      // PPR PREVUES (semaine) → Objectif
  totalEconomies: number;  // Total Économies → Economies réalisées
  totalPrevPrime: number;
  totalPrevTreso: number;
  totalRealPrime: number;
  totalRealTreso: number;
  partPct: number;
}

// BLOC 2 & BLOC 4: Données par ligne d'activité
export interface BusinessLinePerformance {
  businessLineId: string;
  businessLineName: string;
  objectif: number;           // Σ PPR PREVUES de tous les employés de la ligne
  economiesRealisees: number; // Σ Économies (N1+N2) de tous les employés de la ligne
  employeeCount: number;      // Nombre de salariés dans la ligne
  // BLOC 4: Primes et Trésorerie par ligne d'activité
  prevPrime: number;          // Σ Prévisionnel Prime de tous les employés de la ligne
  prevTreso: number;          // Σ Prévisionnel Trésorerie de tous les employés de la ligne
  realPrime: number;          // Σ Réalisé Prime de tous les employés de la ligne
  realTreso: number;          // Σ Réalisé Trésorerie de tous les employés de la ligne
}

export interface GrandTotals {
  grandTotalPPR: number;
  grandTotalEco: number;
  grandTotalPrevPrime: number;
  grandTotalPrevTreso: number;
  grandTotalRealPrime: number;
  grandTotalRealTreso: number;
}

// AUDIT 06/02/2026: Données par employé pour synchronisation avec Centre de la Performance
export interface EmployeePerformanceData {
  employeeId: string;
  employeeName: string;
  businessLineId: string;
  businessLineName: string;
  professionalCategory: string;
  globalNote: number;
  grade: string;
  employeePerformance: {
    objectif: number;
    economiesRealisees: number;
    prevPrime: number;
    prevTreso: number;
    realPrime: number;
    realTreso: number;
  };
  indicators: Record<string, {
    objectif: number;
    economiesRealisees: number;
    prevPrime: number;
    prevTreso: number;
    realPrime: number;
    realTreso: number;
    totalTemps?: number;
    totalFrais?: number;
  }>;
}

interface PerformanceDataContextType {
  // Bloc 1: Données par indicateur
  indicatorsPerformance: IndicatorPerformance[];

  // Bloc 2: Données par ligne d'activité
  businessLinePerformances: BusinessLinePerformance[];

  // AUDIT 06/02/2026: Données par employé pour Centre de la Performance
  employeePerformancesMap: Map<string, EmployeePerformanceData>;

  // Grand totaux
  grandTotals: GrandTotals;

  // Métadonnées
  lastUpdated: Date | null;
  isDataLoaded: boolean;

  // Actions
  setPerformanceData: (
    indicators: IndicatorPerformance[],
    totals: GrandTotals,
    businessLines?: BusinessLinePerformance[],
    employees?: EmployeePerformanceData[]
  ) => void;
  clearPerformanceData: () => void;

  // Helpers
  getIndicatorByKey: (key: string) => IndicatorPerformance | undefined;
  getBusinessLineById: (id: string) => BusinessLinePerformance | undefined;
  getEmployeeById: (id: string) => EmployeePerformanceData | undefined;
}

// ============================================
// VALEURS PAR DÉFAUT
// ============================================

const defaultIndicators: IndicatorPerformance[] = [
  { key: 'abs', label: 'Absentéisme', pprPrevues: 0, totalEconomies: 0, totalPrevPrime: 0, totalPrevTreso: 0, totalRealPrime: 0, totalRealTreso: 0, partPct: 0 },
  { key: 'qd', label: 'Défauts de qualité', pprPrevues: 0, totalEconomies: 0, totalPrevPrime: 0, totalPrevTreso: 0, totalRealPrime: 0, totalRealTreso: 0, partPct: 0 },
  { key: 'oa', label: 'Accidents du travail', pprPrevues: 0, totalEconomies: 0, totalPrevPrime: 0, totalPrevTreso: 0, totalRealPrime: 0, totalRealTreso: 0, partPct: 0 },
  { key: 'ddp', label: 'Ecarts de productivité directe', pprPrevues: 0, totalEconomies: 0, totalPrevPrime: 0, totalPrevTreso: 0, totalRealPrime: 0, totalRealTreso: 0, partPct: 0 },
  { key: 'ekh', label: 'Ecarts de know how', pprPrevues: 0, totalEconomies: 0, totalPrevPrime: 0, totalPrevTreso: 0, totalRealPrime: 0, totalRealTreso: 0, partPct: 0 }
];

const defaultTotals: GrandTotals = {
  grandTotalPPR: 0,
  grandTotalEco: 0,
  grandTotalPrevPrime: 0,
  grandTotalPrevTreso: 0,
  grandTotalRealPrime: 0,
  grandTotalRealTreso: 0
};

// ============================================
// CONTEXTE
// ============================================

const PerformanceDataContext = createContext<PerformanceDataContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface PerformanceDataProviderProps {
  children: ReactNode;
}

export function PerformanceDataProvider({ children }: PerformanceDataProviderProps) {
  const [indicatorsPerformance, setIndicatorsPerformance] = useState<IndicatorPerformance[]>(defaultIndicators);
  const [businessLinePerformances, setBusinessLinePerformances] = useState<BusinessLinePerformance[]>([]);
  // AUDIT 06/02/2026: Map pour accès O(1) aux données employés
  const [employeePerformancesMap, setEmployeePerformancesMap] = useState<Map<string, EmployeePerformanceData>>(new Map());
  const [grandTotals, setGrandTotals] = useState<GrandTotals>(defaultTotals);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Mettre à jour les données de performance
  const setPerformanceData = useCallback((
    indicators: IndicatorPerformance[],
    totals: GrandTotals,
    businessLines?: BusinessLinePerformance[],
    employees?: EmployeePerformanceData[]
  ) => {
    setIndicatorsPerformance(indicators);
    setGrandTotals(totals);
    if (businessLines) {
      setBusinessLinePerformances(businessLines);
    }
    // AUDIT 06/02/2026: Stocker les données employés dans une Map pour accès rapide
    if (employees && employees.length > 0) {
      const empMap = new Map<string, EmployeePerformanceData>();
      employees.forEach(emp => empMap.set(emp.employeeId, emp));
      setEmployeePerformancesMap(empMap);
      // AUDIT: Log sample IDs pour debug
      const sampleIds = employees.slice(0, 3).map(e => ({
        id: e.employeeId,
        name: e.employeeName,
        objectif: e.employeePerformance?.objectif
      }));
      console.log(`[PerformanceDataContext] ✅ Stored ${employees.length} employees in context. Sample:`, sampleIds);
    } else {
      console.warn('[PerformanceDataContext] ⚠️ setPerformanceData called with NO employees!', {
        employeesParam: employees,
        employeesLength: employees?.length
      });
    }
    setLastUpdated(new Date());
    setIsDataLoaded(true);

    // Sauvegarder aussi dans localStorage pour persistance entre navigations
    try {
      localStorage.setItem('hcm_performance_data', JSON.stringify({
        indicators,
        totals,
        businessLines: businessLines || [],
        employees: employees || [],
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('Failed to save performance data to localStorage:', error);
    }
  }, []);

  // Effacer les données
  const clearPerformanceData = useCallback(() => {
    setIndicatorsPerformance(defaultIndicators);
    setBusinessLinePerformances([]);
    setEmployeePerformancesMap(new Map());
    setGrandTotals(defaultTotals);
    setLastUpdated(null);
    setIsDataLoaded(false);

    try {
      localStorage.removeItem('hcm_performance_data');
    } catch (error) {
      console.warn('Failed to clear performance data from localStorage:', error);
    }
  }, []);

  // Helper: obtenir un indicateur par clé
  const getIndicatorByKey = useCallback((key: string) => {
    return indicatorsPerformance.find(ind => ind.key === key);
  }, [indicatorsPerformance]);

  // Helper: obtenir une ligne d'activité par ID
  const getBusinessLineById = useCallback((id: string) => {
    return businessLinePerformances.find(bl => bl.businessLineId === id);
  }, [businessLinePerformances]);

  // AUDIT 06/02/2026: Helper pour obtenir un employé par ID
  const getEmployeeById = useCallback((id: string) => {
    return employeePerformancesMap.get(id);
  }, [employeePerformancesMap]);

  // Charger les données depuis localStorage au montage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('hcm_performance_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.indicators && parsed.totals) {
          // AUDIT 06/02/2026: Vérifier si les données sont obsolètes (sans employees)
          const hasEmployees = parsed.employees && Array.isArray(parsed.employees) && parsed.employees.length > 0;

          if (!hasEmployees) {
            // Données obsolètes - nettoyer le localStorage pour forcer un recalcul
            console.warn('[PerformanceDataContext] ⚠️ localStorage obsolète (sans employees) - suppression');
            localStorage.removeItem('hcm_performance_data');
            localStorage.removeItem('hcm_bulletin_performances'); // Aussi nettoyer l'ancien cache
            return; // Ne pas charger les données obsolètes
          }

          setIndicatorsPerformance(parsed.indicators);
          setGrandTotals(parsed.totals);
          if (parsed.businessLines) {
            setBusinessLinePerformances(parsed.businessLines);
          }
          // AUDIT 06/02/2026: Charger les données employés
          const empMap = new Map<string, EmployeePerformanceData>();
          parsed.employees.forEach((emp: EmployeePerformanceData) => empMap.set(emp.employeeId, emp));
          setEmployeePerformancesMap(empMap);
          // AUDIT: Log sample IDs pour debug localStorage
          const sampleIds = parsed.employees.slice(0, 3).map((e: EmployeePerformanceData) => ({
            id: e.employeeId,
            name: e.employeeName,
            objectif: e.employeePerformance?.objectif
          }));
          console.log(`[PerformanceDataContext] ✅ Loaded ${parsed.employees.length} employees from localStorage. Sample:`, sampleIds);

          setLastUpdated(new Date(parsed.timestamp));
          setIsDataLoaded(true);
        }
      }
    } catch (error) {
      console.warn('Failed to load performance data from localStorage:', error);
    }
  }, []);

  const value: PerformanceDataContextType = {
    indicatorsPerformance,
    businessLinePerformances,
    employeePerformancesMap,
    grandTotals,
    lastUpdated,
    isDataLoaded,
    setPerformanceData,
    clearPerformanceData,
    getIndicatorByKey,
    getBusinessLineById,
    getEmployeeById
  };

  return (
    <PerformanceDataContext.Provider value={value}>
      {children}
    </PerformanceDataContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function usePerformanceData() {
  const context = useContext(PerformanceDataContext);
  if (context === undefined) {
    throw new Error('usePerformanceData must be used within a PerformanceDataProvider');
  }
  return context;
}

// Export par défaut
export default PerformanceDataContext;

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

interface PerformanceDataContextType {
  // Bloc 1: Données par indicateur
  indicatorsPerformance: IndicatorPerformance[];

  // Bloc 2: Données par ligne d'activité
  businessLinePerformances: BusinessLinePerformance[];

  // Grand totaux
  grandTotals: GrandTotals;

  // Métadonnées
  lastUpdated: Date | null;
  isDataLoaded: boolean;

  // Actions
  setPerformanceData: (indicators: IndicatorPerformance[], totals: GrandTotals, businessLines?: BusinessLinePerformance[]) => void;
  clearPerformanceData: () => void;

  // Helpers
  getIndicatorByKey: (key: string) => IndicatorPerformance | undefined;
  getBusinessLineById: (id: string) => BusinessLinePerformance | undefined;
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
  const [grandTotals, setGrandTotals] = useState<GrandTotals>(defaultTotals);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Mettre à jour les données de performance
  const setPerformanceData = useCallback((
    indicators: IndicatorPerformance[],
    totals: GrandTotals,
    businessLines?: BusinessLinePerformance[]
  ) => {
    setIndicatorsPerformance(indicators);
    setGrandTotals(totals);
    if (businessLines) {
      setBusinessLinePerformances(businessLines);
    }
    setLastUpdated(new Date());
    setIsDataLoaded(true);

    // Sauvegarder aussi dans localStorage pour persistance entre navigations
    try {
      localStorage.setItem('hcm_performance_data', JSON.stringify({
        indicators,
        totals,
        businessLines: businessLines || [],
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

  // Charger les données depuis localStorage au montage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('hcm_performance_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.indicators && parsed.totals) {
          setIndicatorsPerformance(parsed.indicators);
          setGrandTotals(parsed.totals);
          if (parsed.businessLines) {
            setBusinessLinePerformances(parsed.businessLines);
          }
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
    grandTotals,
    lastUpdated,
    isDataLoaded,
    setPerformanceData,
    clearPerformanceData,
    getIndicatorByKey,
    getBusinessLineById
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

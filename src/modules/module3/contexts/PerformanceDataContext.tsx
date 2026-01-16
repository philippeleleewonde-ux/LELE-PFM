/**
 * ============================================
 * HCM COST SAVINGS - PERFORMANCE DATA CONTEXT
 * ============================================
 * Context centralisé pour partager les données de performance
 * entre toutes les pages du module 3
 *
 * ARCHITECTURE SCALABLE:
 * - Chargement unique des données
 * - Calculs centralisés via usePerformanceCalculations
 * - Partage entre pages sans rechargement
 * - Support pour 10 000+ salariés via pagination
 *
 * OPTIMISATIONS 10K v2:
 * - Requêtes Supabase en parallèle (Promise.all)
 * - Pagination des cost_entries et team_members
 * - Chargement progressif pour réduire le temps initial
 */

// OPTIMISATION 10K: Constantes de pagination
const PAGE_SIZE_ENTRIES = 500;
const PAGE_SIZE_MEMBERS = 500;

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { createMetricsService } from '@/lib/fiscal';
import { launchDateService } from '@/lib/fiscal/LaunchDateService';
import type { Currency } from '@/modules/module1/types';

import type {
  CostEntry,
  TeamMember,
  BusinessLine,
  EmployeePerformance,
  IndicatorTotals,
  FinancialParams,
  GlobalStats,
  KPIType,
  Module1BusinessLine,
} from '../types/performance';

import {
  calculateEmployeePerformances,
  calculateIndicatorTotals,
} from '../hooks/usePerformanceCalculations';

// ============================================
// CONTEXT TYPES
// ============================================

interface PerformanceDataContextType {
  // Loading state
  loading: boolean;
  error: string | null;

  // Raw data
  costEntries: CostEntry[];
  teamMembers: TeamMember[];
  businessLines: BusinessLine[];
  module1BusinessLines: Module1BusinessLine[];

  // Calculated data
  employeePerformances: EmployeePerformance[];
  financialParams: FinancialParams;

  // Currency
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;

  // Helper functions
  getTotals: (kpiType: KPIType) => IndicatorTotals;
  getGlobalStats: () => GlobalStats;
  getFilteredPerformances: (searchTerm: string, kpiType?: string) => EmployeePerformance[];

  // Refresh data
  refreshData: () => Promise<void>;
}

const PerformanceDataContext = createContext<PerformanceDataContextType | undefined>(undefined);

// ============================================
// PROVIDER COMPONENT
// ============================================

interface PerformanceDataProviderProps {
  children: ReactNode;
}

export function PerformanceDataProvider({ children }: PerformanceDataProviderProps) {
  const { user } = useAuth();
  const { companyId, isLoading: isCompanyLoading } = useCompany();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('EUR');

  // Raw data
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [module1BusinessLines, setModule1BusinessLines] = useState<Module1BusinessLine[]>([]);

  // Calculated data
  const [employeePerformances, setEmployeePerformances] = useState<EmployeePerformance[]>([]);
  const [financialParams, setFinancialParams] = useState<FinancialParams>({
    recettesN1: 0,
    depensesN1: 0,
    volumeHoraireN1: 1,
    pprAnnuelReference: 0,
    gainsN1: 0,
    indicatorRates: { abs: 0, qd: 0, oa: 0, ddp: 0, ekh: 0 }
  });

  // ============================================
  // DATA FETCHING
  // ============================================

  // OPTIMISATION 10K: Fonction pour charger les données restantes en arrière-plan
  const loadRemainingDataInBackground = useCallback(async (
    businessLineIds: string[],
    companyId: string,
    currentMembersCount: number,
    currentEntriesCount: number
  ) => {
    // Charger les membres restants si > PAGE_SIZE_MEMBERS
    if (currentMembersCount === PAGE_SIZE_MEMBERS && businessLineIds.length > 0) {
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const from = page * PAGE_SIZE_MEMBERS;
        const to = from + PAGE_SIZE_MEMBERS - 1;
        const { data: moreMembers } = await supabase
          .from('module3_team_members')
          .select('id, name, professional_category, tech_level, business_line_id, incapacity_rate, versatility_f1, versatility_f2, versatility_f3')
          .in('business_line_id', businessLineIds)
          .order('name', { ascending: true })
          .range(from, to);

        if (moreMembers && moreMembers.length > 0) {
          const formattedMembers = moreMembers.map(m => ({
            ...m,
            incapacity_rate: m.incapacity_rate || 0,
            versatility_f1: m.versatility_f1 || '',
            versatility_f2: m.versatility_f2 || '',
            versatility_f3: m.versatility_f3 || ''
          }));
          setTeamMembers(prev => [...prev, ...formattedMembers]);
          page++;
          hasMore = moreMembers.length === PAGE_SIZE_MEMBERS;
        } else {
          hasMore = false;
        }
      }
    }

    // Charger les entries restantes si > PAGE_SIZE_ENTRIES
    if (currentEntriesCount === PAGE_SIZE_ENTRIES) {
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const from = page * PAGE_SIZE_ENTRIES;
        const to = from + PAGE_SIZE_ENTRIES - 1;
        const { data: moreEntries } = await supabase
          .from('module3_cost_entries')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (moreEntries && moreEntries.length > 0) {
          setCostEntries(prev => [...prev, ...moreEntries]);
          page++;
          hasMore = moreEntries.length === PAGE_SIZE_ENTRIES;
        } else {
          hasMore = false;
        }
      }
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!user || isCompanyLoading || !companyId) {
      return;
    }

    let isMounted = true;

    try {
      setLoading(true);
      setError(null);

      // OPTIMISATION 10K: Exécuter les requêtes indépendantes en PARALLÈLE
      const [blResult, scoreResult] = await Promise.all([
        // 1. Fetch business lines
        supabase
          .from('business_lines')
          .select('id, activity_name, team_leader')
          .eq('company_id', companyId)
          .order('created_at', { ascending: true }),

        // 2. Fetch financial params (performance scores) en parallèle
        supabase
          .from('company_performance_scores')
          .select('factors')
          .eq('company_id', companyId)
          .eq('module_number', 1)
          .order('calculation_date', { ascending: false })
          .limit(1)
          .single()
      ]);

      if (!isMounted) return;
      if (blResult.error) throw blResult.error;

      const blData = blResult.data || [];
      setBusinessLines(blData);

      // OPTIMISATION 10K: Charger members et entries en PARALLÈLE
      const businessLineIds = blData.map(bl => bl.id);

      const [membersResult, entriesResult] = await Promise.all([
        // Fetch team members avec pagination
        businessLineIds.length > 0
          ? supabase
              .from('module3_team_members')
              .select('id, name, professional_category, tech_level, business_line_id, incapacity_rate, versatility_f1, versatility_f2, versatility_f3')
              .in('business_line_id', businessLineIds)
              .order('name', { ascending: true })
              .range(0, PAGE_SIZE_MEMBERS - 1)
          : Promise.resolve({ data: [], error: null }),

        // Fetch cost entries avec pagination
        supabase
          .from('module3_cost_entries')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .range(0, PAGE_SIZE_ENTRIES - 1)
      ]);

      if (!isMounted) return;
      if (membersResult.error) throw membersResult.error;
      if (entriesResult.error) throw entriesResult.error;

      const membersData: TeamMember[] = (membersResult.data || []).map(m => ({
        ...m,
        incapacity_rate: m.incapacity_rate || 0,
        versatility_f1: m.versatility_f1 || '',
        versatility_f2: m.versatility_f2 || '',
        versatility_f3: m.versatility_f3 || ''
      }));

      setTeamMembers(membersData);
      const entriesData = entriesResult.data || [];
      setCostEntries(entriesData);

      // OPTIMISATION 10K: Charger le reste des données en arrière-plan (non-bloquant)
      // pour les datasets > PAGE_SIZE - on n'attend pas la fin
      loadRemainingDataInBackground(businessLineIds, companyId, membersData.length, entriesData.length);

      const scoreData = scoreResult.data;

      // 4. Process financial parameters from Module 1 (already fetched in parallel)
      let fetchedFinancialParams: FinancialParams = {
        recettesN1: 0,
        depensesN1: 0,
        volumeHoraireN1: 1,
        pprAnnuelReference: 0,
        gainsN1: 0,
        indicatorRates: { abs: 0, qd: 0, oa: 0, ddp: 0, ekh: 0 }
      };

      if (scoreData?.factors) {
        const factors = scoreData.factors as any;

        // Set currency
        if (factors.selectedCurrency) {
          setSelectedCurrency(factors.selectedCurrency as Currency);
        }

        // Extract financial parameters
        if (factors.employeeEngagement?.financialHistory?.length > 0) {
          const financialHistory = factors.employeeEngagement.financialHistory;
          // CORRECTION BUG: N-1 est à l'INDEX 0, pas à la fin du tableau
          const yearN1 = financialHistory.find((y: any) => y.year === 'N-1') || financialHistory[0];
          if (yearN1) {
            fetchedFinancialParams.recettesN1 = yearN1.sales || 0;
            fetchedFinancialParams.depensesN1 = yearN1.spending || 0;
          }
        }

        if (factors.employeeEngagement?.annualHoursPerPerson) {
          fetchedFinancialParams.volumeHoraireN1 = factors.employeeEngagement.annualHoursPerPerson;
        }

        if (factors.finalScore?.breakdown?.totalPotentialLoss) {
          fetchedFinancialParams.pprAnnuelReference = factors.finalScore.breakdown.totalPotentialLoss;
        } else if (factors.employeeEngagement?.financialHistory?.length > 0) {
          const financialHistory = factors.employeeEngagement.financialHistory;
          // CORRECTION BUG: N-1 est à l'INDEX 0, pas à la fin du tableau
          const yearN1 = financialHistory.find((y: any) => y.year === 'N-1') || financialHistory[0];
          if (yearN1) {
            const marge = (yearN1.sales || 0) - (yearN1.spending || 0);
            fetchedFinancialParams.pprAnnuelReference = Math.abs(marge) * 0.05;
          }
        }

        // Fetch calculated fields
        if (factors.calculatedFields) {
          const calc = factors.calculatedFields;
          fetchedFinancialParams.gainsN1 = calc.gainsN1 || 0;
          fetchedFinancialParams.gainsN2 = calc.gainsN2 || 0;  // PPR N+2 pour sélection dynamique
          fetchedFinancialParams.gainsN3 = calc.gainsN3 || 0;  // PPR N+3 pour sélection dynamique
          fetchedFinancialParams.indicatorRates = {
            abs: calc.indicator_absenteeism_rate || 0,
            qd: calc.indicator_quality_rate || 0,
            oa: calc.indicator_accidents_rate || 0,
            ddp: calc.indicator_productivity_rate || 0,
            ekh: calc.indicator_knowhow_rate || 0
          };

          if (calc.priorityActionsN1 && Array.isArray(calc.priorityActionsN1) && calc.priorityActionsN1.length > 0) {
            fetchedFinancialParams.priorityActionsN1 = calc.priorityActionsN1;
          } else {
            // Fallback: fetch from calculated_metrics
            try {
              const metricsService = createMetricsService(companyId);
              const priorityActionsFromDB = await metricsService.getPriorityActions(1);
              if (priorityActionsFromDB && priorityActionsFromDB.length > 0) {
                fetchedFinancialParams.priorityActionsN1 = priorityActionsFromDB;
              }
            } catch (dbError) {
              console.error('Error fetching Priority Actions from DB:', dbError);
            }
          }

          // Fetch gainsN1 from DB if missing
          if (!fetchedFinancialParams.gainsN1 || fetchedFinancialParams.gainsN1 === 0) {
            try {
              const metricsService = createMetricsService(companyId);
              const gainsFromDB = await metricsService.getGains(1);
              if (gainsFromDB > 0) {
                fetchedFinancialParams.gainsN1 = gainsFromDB;
              }
            } catch (dbError) {
              console.error('Error fetching Gains from DB:', dbError);
            }
          }

          // Fetch gainsN2 and gainsN3 from DB if missing (pour sélection dynamique PPR)
          if (!fetchedFinancialParams.gainsN2 || fetchedFinancialParams.gainsN2 === 0) {
            try {
              const metricsService = createMetricsService(companyId);
              const gainsN2FromDB = await metricsService.getGains(2);
              if (gainsN2FromDB > 0) {
                fetchedFinancialParams.gainsN2 = gainsN2FromDB;
              }
            } catch (dbError) {
              console.error('Error fetching GainsN2 from DB:', dbError);
            }
          }
          if (!fetchedFinancialParams.gainsN3 || fetchedFinancialParams.gainsN3 === 0) {
            try {
              const metricsService = createMetricsService(companyId);
              const gainsN3FromDB = await metricsService.getGains(3);
              if (gainsN3FromDB > 0) {
                fetchedFinancialParams.gainsN3 = gainsN3FromDB;
              }
            } catch (dbError) {
              console.error('Error fetching GainsN3 from DB:', dbError);
            }
          }

          // Fetch launchDate from LaunchDateService (pour détection période courante)
          try {
            const launchConfig = await launchDateService.loadConfig(companyId);
            if (launchConfig?.platformLaunchDate) {
              fetchedFinancialParams.launchDate = launchConfig.platformLaunchDate;
              console.log('[PerformanceDataContext] 📅 Launch date loaded:', launchConfig.platformLaunchDate.toLocaleDateString('fr-FR'));
            }
          } catch (launchError) {
            console.error('Error fetching Launch Date:', launchError);
          }

          // Fetch indicator rates from DB if missing
          const rates = fetchedFinancialParams.indicatorRates;
          const hasNoRates = !rates || (rates.abs === 0 && rates.qd === 0 && rates.oa === 0 && rates.ddp === 0 && rates.ekh === 0);
          if (hasNoRates) {
            try {
              const metricsService = createMetricsService(companyId);
              const ratesFromDB = await metricsService.getIndicatorRates();
              if (ratesFromDB && Object.keys(ratesFromDB).length > 0) {
                fetchedFinancialParams.indicatorRates = {
                  abs: ratesFromDB.absenteeism || 0,
                  qd: ratesFromDB.quality || 0,
                  oa: ratesFromDB.accidents || 0,
                  ddp: ratesFromDB.productivity || 0,
                  ekh: ratesFromDB.knowhow || 0
                };
              }
            } catch (dbError) {
              console.error('Error fetching indicator rates from DB:', dbError);
            }
          }
        }

        // Fetch business lines from Module 1
        if (factors.businessLines && Array.isArray(factors.businessLines)) {
          const m1BusinessLines = factors.businessLines.map((bl: any) => ({
            id: bl.id,
            activityName: bl.activityName || '',
            staffCount: bl.staffCount || 0,
            budget: bl.budget || 0,
            budgetRate: bl.budgetRate || 0
          }));
          setModule1BusinessLines(m1BusinessLines);
          fetchedFinancialParams.module1BusinessLines = m1BusinessLines;
        }
      }

      if (!isMounted) return;
      setFinancialParams(fetchedFinancialParams);

      // 5. Calculate performances
      const performances = calculateEmployeePerformances(
        membersData,
        entriesData,
        fetchedFinancialParams,
        blData
      );
      setEmployeePerformances(performances);

    } catch (err: any) {
      if (!isMounted) return;
      console.error('Error fetching performance data:', err);
      setError(err.message || 'Erreur lors du chargement des données');
      toast.error("Erreur lors du chargement des données de performance");
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [user, isCompanyLoading, companyId, loadRemainingDataInBackground]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ============================================
  // MEMOIZED HELPER FUNCTIONS
  // ============================================

  const getTotals = useCallback((kpiType: KPIType): IndicatorTotals => {
    return calculateIndicatorTotals(employeePerformances, kpiType);
  }, [employeePerformances]);

  const getGlobalStats = useCallback((): GlobalStats => {
    const allTotals = (['abs', 'qd', 'oa', 'ddp', 'ekh'] as KPIType[]).map(kpi => getTotals(kpi));

    return {
      totalEconomies: allTotals.reduce((sum, t) => sum + t.economiesRealiseesTotal, 0),
      totalPertes: allTotals.reduce((sum, t) => sum + t.pertesConstateesTotal, 0),
      totalPPR: allTotals.reduce((sum, t) => sum + t.pprPrevuesTotal, 0),
      totalScoreFinancier: allTotals.reduce((sum, t) => sum + t.scoreFinancierTotal, 0),
      employeesCount: employeePerformances.length,
      employeesWithData: employeePerformances.filter(p =>
        p.abs.codePRC || p.qd.codePRC || p.oa.codePRC || p.ddp.codePRC || p.ekh.codePRC
      ).length
    };
  }, [employeePerformances, getTotals]);

  const getFilteredPerformances = useCallback((searchTerm: string, kpiType?: string): EmployeePerformance[] => {
    return employeePerformances.filter(perf => {
      const matchesSearch = searchTerm === '' ||
        perf.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perf.professionalCategory.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [employeePerformances]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const contextValue = useMemo(() => ({
    loading: loading || isCompanyLoading,
    error,
    costEntries,
    teamMembers,
    businessLines,
    module1BusinessLines,
    employeePerformances,
    financialParams,
    selectedCurrency,
    setSelectedCurrency,
    getTotals,
    getGlobalStats,
    getFilteredPerformances,
    refreshData: fetchAllData,
  }), [
    loading,
    isCompanyLoading,
    error,
    costEntries,
    teamMembers,
    businessLines,
    module1BusinessLines,
    employeePerformances,
    financialParams,
    selectedCurrency,
    getTotals,
    getGlobalStats,
    getFilteredPerformances,
    fetchAllData,
  ]);

  return (
    <PerformanceDataContext.Provider value={contextValue}>
      {children}
    </PerformanceDataContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function usePerformanceData(): PerformanceDataContextType {
  const context = useContext(PerformanceDataContext);
  if (context === undefined) {
    throw new Error('usePerformanceData must be used within a PerformanceDataProvider');
  }
  return context;
}

export default PerformanceDataContext;

/**
 * ============================================
 * REPORTING ECONOMIES DE COUTS
 * ============================================
 *
 * Page de reporting pour le Module 3 - HCM COST SAVINGS
 * Données provenant du moteur de calcul (PerformanceRecapPage)
 *
 * BLOCS:
 * 1. ECONOMIES DE COUTS REALISEES (BENEFICE ECONOMIQUE)
 *    - Tableau SEMAINE avec 5 indicateurs
 *    - Graphique barres comparatif
 *
 * 2. ECONOMIES DE COUTS REALISEES - LIGNES D'ACTIVITES
 *    - Tableau avec totaux par ligne d'activité
 *    - Graphique barres comparatif Objectif vs Economies
 *
 * Design professionnel pour auditeurs financiers
 * Support complet dark/light mode via classes Tailwind dark:
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';
import {
  ArrowLeft,
  BarChart3,
  Download,
  Printer,
  RefreshCw,
  Lock,
  ShieldCheck,
  Award,
  Users
} from 'lucide-react';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
// Smart Calendar Integration - Dernière semaine complétée + date de lancement
import { getLastCompletedWeek, launchDateService, type LastCompletedWeekResult } from '@/lib/fiscal/LaunchDateService';
// Import du dashboard de statut des périodes
import PeriodStatusDashboard from '@/components/shared/PeriodStatusDashboard';

// PHASE 3: Import du service de résultats de période
import { createPeriodResultsService, PeriodResultStatus } from '../services/PeriodResultsService';
import type { IndicatorPerformance, BusinessLinePerformance, GrandTotals } from '@/contexts/PerformanceDataContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatCurrency, CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import { usePerformanceData } from '@/contexts/PerformanceDataContext';
import type { Currency } from '@/modules/module1/types';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';

// ============================================
// TYPES
// ============================================

interface IndicatorData {
  key: string;
  domainesCles: string;
  indicateur: string;
  objectif: number;
  economiesRealisees: number;
  color: string;
}

interface TeamMember {
  id: string;
  name: string;
  professional_category: string;
  incapacity_rate: number;
  versatility_f1: string;
  versatility_f2: string;
  versatility_f3: string;
}

interface CostEntry {
  id: string;
  company_id: string;
  business_line_id: string;
  employee_id: string;
  kpi_type: string;
  period_start: string;
  period_end: string;
  event_date: string;
  duration_hours: number;
  duration_minutes: number;
  compensation_amount: number;
}

interface BusinessLine {
  id: string;
  name: string;
}

// BLOC 5: Type pour les indicateurs SCR
interface SCRIndicatorData {
  key: string;
  label: string;
  labelFr: string;
  percentage: number;
  previsionnel: number;
  realise: number;
  color: string;
}

// ============================================
// CONFIGURATION DES INDICATEURS
// Couleurs compatibles dark/light mode
// ============================================

const INDICATORS_CONFIG: IndicatorData[] = [
  {
    key: 'abs',
    domainesCles: 'DOMAINE CLÉ : Gestion du temps',
    indicateur: 'Absentéisme',
    objectif: 0,
    economiesRealisees: 0,
    color: '#DC2626'
  },
  {
    key: 'qd',
    domainesCles: "DOMAINE CLÉ : L'organisation du travail",
    indicateur: 'Défauts de qualité',
    objectif: 0,
    economiesRealisees: 0,
    color: '#16A34A'
  },
  {
    key: 'oa',
    domainesCles: 'Domaine clé - les conditions de travail',
    indicateur: 'Accidents du travail',
    objectif: 0,
    economiesRealisees: 0,
    color: '#EAB308'
  },
  {
    key: 'ddp',
    domainesCles: 'DOMAINE CLÉ : Mise en œuvre stratégique',
    indicateur: 'Ecarts de productivité directe',
    objectif: 0,
    economiesRealisees: 0,
    color: '#F97316'
  },
  {
    key: 'ekh',
    domainesCles: 'DOMAINES CLÉS : 3C (Communication, coordination et concertation) ; Formation intégrée',
    indicateur: 'Ecarts de know how',
    objectif: 0,
    economiesRealisees: 0,
    color: '#7C3AED'
  }
];

// ============================================
// BLOC 5: CONFIGURATION DES INDICATEURS SCR
// Source: Section D - Economic Benefit Breakdown (Module 1, Page 17)
// ============================================

const SCR_INDICATORS_CONFIG = [
  {
    key: 'operational_risk',
    label: 'Operational Risk',
    labelFr: 'Risques opérationnel',
    socioKey: 'keyArea1_workingConditions', // Domaine 1
    color: '#3b82f6' // blue-500
  },
  {
    key: 'credit_risk',
    label: 'Credit Risk',
    labelFr: 'Risque de contrepartie',
    socioKey: 'keyArea2_workOrganization', // Domaine 2
    color: '#8b5cf6' // purple-500
  },
  {
    key: 'market_risk',
    label: 'Market Risk',
    labelFr: 'Risque de Marché',
    socioKey: 'keyArea3_communication', // Domaine 3
    color: '#f59e0b' // amber-500
  },
  {
    key: 'transformation_risk',
    label: 'Transformation Risk',
    labelFr: 'Risque de souscription en vie',
    socioKey: 'keyArea4_timeManagement', // Domaine 4
    color: '#10b981' // emerald-500
  },
  {
    key: 'organizational_risk',
    label: 'Organizational Risk',
    labelFr: 'Risque de souscription en non-vie',
    socioKey: 'keyArea5_training', // Domaine 5
    color: '#ec4899' // pink-500
  },
  {
    key: 'health_insurance',
    label: 'Specific Health/Ins.',
    labelFr: 'Risque de souscription en santé',
    socioKey: 'keyArea6_strategy', // Domaine 6
    color: '#ef4444' // red-500
  }
];

// Fonction utilitaire pour convertir les valeurs socio-économiques en poids (0-4)
const convertSocioQualToWeight = (value: string | number): number => {
  if (typeof value === 'number') {
    if (value >= 0 && value <= 4) return value;
    if (value >= 1 && value <= 5) return value - 1;
    return Math.max(0, Math.min(4, Math.round(value)));
  }
  const map: Record<string, number> = {
    'Not important at all': 0,
    'Not very important': 1,
    'Somewhat important': 2,
    'Important': 3,
    'Very important': 4,
    'Low': 1,
    'Medium': 2,
    'High': 3,
    'Very High': 4
  };
  return map[value] ?? 0;
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function CostSavingsReportingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company: currentCompany, isLoading: isCompanyLoading } = useCompany();

  // DEBUG: Log au montage du composant
  console.log('[CostSavingsReporting] Component mounted. currentCompany:', currentCompany?.id || 'NO COMPANY', 'isCompanyLoading:', isCompanyLoading);

  // ✅ Données de performance depuis le contexte (TOTAL GÉNÉRAL → Reporting)
  // Bloc 1: indicatorsPerformance = données par indicateur
  // Bloc 2: businessLinePerformances = données par ligne d'activité
  const { indicatorsPerformance, businessLinePerformances, grandTotals, isDataLoaded, setPerformanceData } = usePerformanceData();

  // États
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState('1');
  const [weekStart, setWeekStart] = useState<Date>(new Date());
  const [weekEnd, setWeekEnd] = useState<Date>(new Date());
  const [currency, setCurrency] = useState<Currency>('EUR');

  // PHASE 3: État pour la période validée
  const [periodStatus, setPeriodStatus] = useState<PeriodResultStatus>({
    exists: false,
    isLocked: false,
    calculatedAt: null,
    lockedAt: null
  });
  const [isFromValidatedPeriod, setIsFromValidatedPeriod] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Smart Calendar - Dernière semaine complétée (avec données)
  const [lastCompletedWeek, setLastCompletedWeek] = useState<LastCompletedWeekResult | null>(null);

  // Date de lancement de la plateforme (pour calcul des semaines)
  const [platformLaunchDate, setPlatformLaunchDate] = useState<Date | null>(null);

  // Semaine fiscale courante (depuis lastCompletedWeek)
  const currentFiscalWeek = useMemo(() => {
    return lastCompletedWeek?.weekNumber || 1;
  }, [lastCompletedWeek]);

  // launchDate utilisé pour les calculs de semaines (date de lancement plateforme)
  const launchDate = platformLaunchDate;

  // Année fiscale calculée depuis lastCompletedWeek
  const currentFiscalYear = useMemo(() => {
    if (lastCompletedWeek?.weekStart) {
      return lastCompletedWeek.weekStart.getFullYear();
    }
    return new Date().getFullYear(); // Fallback
  }, [lastCompletedWeek]);

  // ============================================
  // CALCUL DES DATES DE SEMAINE FISCALE
  // ============================================
  // Recalculer les dates de semaine quand selectedWeek ou launchDate change
  useEffect(() => {
    if (!launchDate) return;

    // selectedYearOffset est toujours 1 pour cette page (N+1)
    const selectedYearOffset = 1;
    const weekNumber = parseInt(selectedWeek, 10);

    // Calculer le début de l'année fiscale basé sur la date de lancement + offset
    const fiscalYearStart = new Date(launchDate);
    fiscalYearStart.setFullYear(launchDate.getFullYear() + (selectedYearOffset - 1));

    // Calculer le début de la semaine: fiscalYearStart + (weekNumber - 1) * 7 jours
    const calculatedWeekStart = new Date(fiscalYearStart);
    calculatedWeekStart.setDate(fiscalYearStart.getDate() + (weekNumber - 1) * 7);

    // Calculer la fin de la semaine: weekStart + 6 jours
    const calculatedWeekEnd = new Date(calculatedWeekStart);
    calculatedWeekEnd.setDate(calculatedWeekStart.getDate() + 6);

    setWeekStart(calculatedWeekStart);
    setWeekEnd(calculatedWeekEnd);

    console.log(`[CostSavingsReporting] Fiscal Week ${weekNumber}: ${calculatedWeekStart.toLocaleDateString()} - ${calculatedWeekEnd.toLocaleDateString()}`);
  }, [selectedWeek, launchDate]);

  // Données
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [pprData, setPprData] = useState<Record<string, number>>({});

  // BLOC 5: État pour les données SCR (depuis Module 1 - Section D)
  const [scrIndicatorsData, setScrIndicatorsData] = useState<SCRIndicatorData[]>([]);
  const [socioeconomicData, setSocioeconomicData] = useState<any>(null);

  const currencyConfig = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EUR;

  // ============================================
  // FONCTION: Charger les données SCR depuis Module 1
  // ============================================
  const loadSCRData = useCallback(async (companyId: string) => {
    try {
      console.log('[SCR] Loading data for company_id:', companyId);

      const { data: scoreData, error: scoreError } = await supabase
        .from('company_performance_scores')
        .select('factors')
        .eq('company_id', companyId)
        .eq('module_number', 1)
        .order('calculation_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('[SCR] Query result:', { scoreData, scoreError });

      if (scoreError) {
        console.error('[SCR] Query error:', scoreError);
        return;
      }

      if (scoreData?.factors) {
        const factors = scoreData.factors as any;
        console.log('[SCR] Factors keys:', Object.keys(factors));

        // Charger la devise configurée dans HCM Performance Plan
        if (factors.selectedCurrency) {
          setCurrency(factors.selectedCurrency as Currency);
          console.log('[SCR] ✅ Currency set to:', factors.selectedCurrency);
        }

        // FormData stocke les données sous 'socioeconomicImprovement'
        if (factors.socioeconomicImprovement) {
          setSocioeconomicData(factors.socioeconomicImprovement);
          console.log('[SCR] ✅ Loaded socioeconomic data:', factors.socioeconomicImprovement);
        } else {
          console.warn('[SCR] ⚠️ No socioeconomicImprovement in factors. Available keys:', Object.keys(factors));
        }
      } else {
        console.warn('[SCR] ⚠️ No scoreData found for Module 1. Make sure data has been saved in HCM Performance Plan.');
      }
    } catch (scrError) {
      console.error('[SCR] ❌ Exception loading SCR data:', scrError);
    }
  }, []);

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================

  useEffect(() => {
    console.log('[CostSavingsReporting] useEffect triggered. currentCompany?.id:', currentCompany?.id);

    const loadData = async () => {
      if (!currentCompany?.id) {
        console.log('[CostSavingsReporting] No company ID - skipping load');
        setLoading(false);
        return;
      }

      console.log('[CostSavingsReporting] Loading data for company:', currentCompany.id);
      setLoading(true);
      try {
        // ============================================
        // PHASE 0: Charger la DERNIÈRE SEMAINE COMPLÉTÉE (avec données)
        // et la date de lancement de la plateforme
        // ============================================
        const completedWeek = await getLastCompletedWeek(currentCompany.id);
        if (completedWeek) {
          setLastCompletedWeek(completedWeek);
          // Initialiser selectedWeek avec la semaine complétée
          setSelectedWeek(String(completedWeek.weekNumber));
          console.log('[CostSavingsReporting] ✅ Last completed week:', completedWeek.periodLabel);
        } else {
          console.warn('[CostSavingsReporting] ⚠️ No completed week found');
        }

        // Récupérer aussi la date de lancement pour le calcul des semaines
        const config = launchDateService.getConfig();
        if (config?.platformLaunchDate) {
          setPlatformLaunchDate(new Date(config.platformLaunchDate));
          console.log('[CostSavingsReporting] ✅ Platform launch date:', config.platformLaunchDate);
        }

        // ============================================
        // PHASE 3: Vérifier si période validée
        // Si validée → charger depuis module3_period_results
        // ============================================
        try {
          const periodService = createPeriodResultsService(currentCompany.id);
          const status = await periodService.getPeriodStatus(currentFiscalWeek, currentFiscalYear);
          setPeriodStatus(status);

          if (status.exists && status.isLocked) {
            console.log(`[CostSavingsReporting] Period W${currentFiscalWeek}/${currentFiscalYear} is validated - loading from DB`);

            const periodResults = await periodService.getPeriodResults(currentFiscalWeek, currentFiscalYear);

            if (periodResults) {
              // Charger les données directement depuis la période validée
              setPerformanceData(
                periodResults.indicators_data,
                periodResults.grand_totals,
                periodResults.business_lines_data
              );
              setIsFromValidatedPeriod(true);

              // Configurer les dates de la période
              setWeekStart(new Date(periodResults.period_start));
              setWeekEnd(new Date(periodResults.period_end));

              // Charger les business lines pour l'affichage
              const { data: blData } = await supabase
                .from('business_lines')
                .select('id, name')
                .eq('company_id', currentCompany.id);
              if (blData) setBusinessLines(blData);

              // ============================================
              // BLOC 5: Charger SCR même pour période validée
              // ============================================
              await loadSCRData(currentCompany.id);

              setLoading(false);
              toast.success(`Données S${currentFiscalWeek} - Période validée`, {
                icon: <Lock className="w-4 h-4" aria-hidden="true" />
              });
              return; // Sortir - données chargées depuis période validée
            }
          }
        } catch (periodError) {
          console.warn('[CostSavingsReporting] Period check failed, continuing with context/calculation:', periodError);
        }

        // ============================================
        // Chargement normal si période non validée
        // ============================================
        const { data: blData } = await supabase
          .from('business_lines')
          .select('id, name')
          .eq('company_id', currentCompany.id);

        if (blData) setBusinessLines(blData);

        const { data: membersData } = await supabase
          .from('team_members')
          .select('id, name, professional_category, incapacity_rate, versatility_f1, versatility_f2, versatility_f3')
          .eq('company_id', currentCompany.id);

        if (membersData) setTeamMembers(membersData as TeamMember[]);

        const { data: entriesData } = await supabase
          .from('cost_entries')
          .select('*')
          .eq('company_id', currentCompany.id);

        if (entriesData) setCostEntries(entriesData);

        const { data: pprSettings } = await supabase
          .from('company_ppr_settings')
          .select('*')
          .eq('company_id', currentCompany.id)
          .single();

        if (pprSettings) {
          setPprData({
            abs: pprSettings.ppr_abs_weekly || 0,
            qd: pprSettings.ppr_qd_weekly || 0,
            oa: pprSettings.ppr_oa_weekly || 0,
            ddp: pprSettings.ppr_ddp_weekly || 0,
            ekh: pprSettings.ppr_ekh_weekly || 0
          });
        }

        // ============================================
        // BLOC 5: Charger les données SCR depuis Module 1
        // ============================================
        await loadSCRData(currentCompany.id);

        // NOTE: Les dates weekStart/weekEnd sont maintenant calculées
        // automatiquement par le useEffect qui écoute selectedWeek et launchDate
        // (voir section "CALCUL DES DATES DE SEMAINE FISCALE" plus haut)

      } catch (error) {
        console.error('Erreur chargement données:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentCompany?.id, currentFiscalWeek, currentFiscalYear, setPerformanceData, loadSCRData]);

  // ============================================
  // CALCUL DES TOTAUX PAR INDICATEUR
  // ============================================
  // ✅ PRIORITÉ: Données du contexte (PerformanceRecapPage TOTAL GÉNÉRAL)
  // Fallback: Calcul local si contexte non chargé

  const indicatorsData = useMemo(() => {
    // ✅ SI données du contexte disponibles → les utiliser directement
    // Mapping: PPR PREVUES → Objectif, Total Économies → Economies réalisées
    if (isDataLoaded && indicatorsPerformance.length > 0) {
      return INDICATORS_CONFIG.map(ind => {
        const contextData = indicatorsPerformance.find(p => p.key === ind.key);
        if (contextData) {
          return {
            ...ind,
            objectif: contextData.pprPrevues,           // PPR PREVUES (semaine) → Objectif
            economiesRealisees: contextData.totalEconomies  // Total Économies → Economies réalisées
          };
        }
        return ind;
      });
    }

    // Fallback: Calcul local si contexte non disponible
    if (!teamMembers.length) return INDICATORS_CONFIG;

    const calculateTotals = (kpiType: string) => {
      let pprPrevuesTotal = 0;
      let economiesRealiseesTotal = 0;

      const pprPerPerson = pprData[kpiType] || 0;
      pprPrevuesTotal = pprPerPerson * teamMembers.length;

      const kpiEntries = costEntries.filter(e => e.kpi_type === kpiType);

      teamMembers.forEach(member => {
        const memberEntries = kpiEntries.filter(e => e.employee_id === member.id);

        let memberScoreFinancier = 0;
        memberEntries.forEach(entry => {
          const hours = entry.duration_hours + (entry.duration_minutes / 60);
          memberScoreFinancier += entry.compensation_amount || (hours * 25);
        });

        const tauxIncapacite = member.incapacity_rate || 0;
        const pertesConstatees = memberScoreFinancier * (1 - tauxIncapacite / 100);

        const pprMembre = pprPerPerson;
        const economiesMembre = pprMembre - pertesConstatees;
        economiesRealiseesTotal += economiesMembre;
      });

      return {
        objectif: pprPrevuesTotal,
        economiesRealisees: economiesRealiseesTotal
      };
    };

    return INDICATORS_CONFIG.map(ind => {
      const totals = calculateTotals(ind.key);
      return {
        ...ind,
        objectif: totals.objectif,
        economiesRealisees: totals.economiesRealisees
      };
    });
  }, [teamMembers, costEntries, pprData, isDataLoaded, indicatorsPerformance]);

  const totals = useMemo(() => {
    return {
      objectif: indicatorsData.reduce((sum, ind) => sum + ind.objectif, 0),
      economiesRealisees: indicatorsData.reduce((sum, ind) => sum + ind.economiesRealisees, 0)
    };
  }, [indicatorsData]);

  const chartData = useMemo(() => {
    return [
      {
        name: 'Objectif',
        'Absentéisme': indicatorsData[0]?.objectif || 0,
        'Défauts de qualité': indicatorsData[1]?.objectif || 0,
        'Accidents du travail': indicatorsData[2]?.objectif || 0,
        'Ecarts de productivité directe': indicatorsData[3]?.objectif || 0,
        'Ecarts de know how': indicatorsData[4]?.objectif || 0
      },
      {
        name: 'Economies réalisées',
        'Absentéisme': indicatorsData[0]?.economiesRealisees || 0,
        'Défauts de qualité': indicatorsData[1]?.economiesRealisees || 0,
        'Accidents du travail': indicatorsData[2]?.economiesRealisees || 0,
        'Ecarts de productivité directe': indicatorsData[3]?.economiesRealisees || 0,
        'Ecarts de know how': indicatorsData[4]?.economiesRealisees || 0
      }
    ];
  }, [indicatorsData]);

  // ============================================
  // BLOC 5: Calcul des indicateurs SCR
  // Source: socioeconomicData depuis Module 1
  // Formules: TOTAL Tréso × % indicateur SCR
  // ============================================

  const scrIndicators = useMemo(() => {
    // Récupérer les totaux Trésorerie depuis le contexte
    const totalPrevTreso = grandTotals?.grandTotalPrevTreso || 0;
    const totalRealTreso = grandTotals?.grandTotalRealTreso || 0;

    console.log('[SCR] Calculating with:', {
      totalPrevTreso,
      totalRealTreso,
      socioeconomicData: socioeconomicData ? 'Loaded' : 'Not loaded',
      socioKeys: socioeconomicData ? Object.keys(socioeconomicData) : []
    });

    // Si pas de données socioéconomiques, utiliser des poids par défaut égaux (16.67% chacun)
    if (!socioeconomicData) {
      console.log('[SCR] No socioeconomic data - using default equal distribution');
      const defaultPercentage = 100 / 6; // ~16.67%
      return SCR_INDICATORS_CONFIG.map(config => ({
        key: config.key,
        label: config.label,
        labelFr: config.labelFr,
        percentage: defaultPercentage,
        previsionnel: (totalPrevTreso * defaultPercentage) / 100,
        realise: (totalRealTreso * defaultPercentage) / 100,
        color: config.color
      }));
    }

    // ============================================
    // CALCUL EXACT comme Section D - Economic Benefit Breakdown
    // Source: Module 1, Page 17, Section D
    // ============================================
    const s1 = convertSocioQualToWeight(socioeconomicData.keyArea1_workingConditions || 'Low');
    const s2 = convertSocioQualToWeight(socioeconomicData.keyArea2_workOrganization || 'Low');
    const s3 = convertSocioQualToWeight(socioeconomicData.keyArea3_communication || 'Low');
    const s4 = convertSocioQualToWeight(socioeconomicData.keyArea4_timeManagement || 'Low');
    const s5 = convertSocioQualToWeight(socioeconomicData.keyArea5_training || 'Low');
    const s6 = convertSocioQualToWeight(socioeconomicData.keyArea6_strategy || 'Low');

    // Dénominateur = somme de tous les poids
    const socioDenom = (s1 + s2 + s3 + s4 + s5 + s6) || 1;

    // Calcul des pourcentages EXACTEMENT comme Section D
    const w205 = (s1 / socioDenom) * 100;                    // Operational Risk
    const w206 = (s2 / socioDenom) * 100;                    // Credit Risk
    const w207 = ((s3 + s5) / socioDenom) * 100;             // Market Risk (s3 + s5)
    const w208 = (s4 / socioDenom) * 100;                    // Transformation Risk
    // w207 réutilisé pour Organizational Risk (même formule)
    const w209 = (s6 / socioDenom) * 100;                    // Specific Health/Ins.

    // Array des pourcentages dans l'ordre des indicateurs: [w205, w206, w207, w208, w207, w209]
    const socioRiskWeights = [w205, w206, w207, w208, w207, w209];

    console.log('[SCR] Section D weights:', {
      s1, s2, s3, s4, s5, s6,
      socioDenom,
      weights: socioRiskWeights
    });

    // Construire les indicateurs avec les pourcentages calculés
    return SCR_INDICATORS_CONFIG.map((config, idx) => {
      const percentage = socioRiskWeights[idx];

      return {
        key: config.key,
        label: config.label,
        labelFr: config.labelFr,
        percentage: percentage,
        previsionnel: (totalPrevTreso * percentage) / 100,
        realise: (totalRealTreso * percentage) / 100,
        color: config.color
      };
    });
  }, [socioeconomicData, grandTotals]);

  // Totaux SCR
  const scrTotals = useMemo(() => {
    return {
      percentage: 100,
      previsionnel: scrIndicators.reduce((sum, ind) => sum + ind.previsionnel, 0),
      realise: scrIndicators.reduce((sum, ind) => sum + ind.realise, 0)
    };
  }, [scrIndicators]);

  // Données pour le graphique SCR
  const scrChartData = useMemo(() => {
    return scrIndicators.map(ind => ({
      name: ind.labelFr.length > 20 ? ind.labelFr.substring(0, 20) + '...' : ind.labelFr,
      fullName: ind.labelFr,
      previsionnel: ind.previsionnel,
      realise: ind.realise,
      color: ind.color
    }));
  }, [scrIndicators]);

  // ============================================
  // VALIDATION ET VERROUILLAGE DE LA PÉRIODE
  // ============================================

  const handleValidateAndLock = useCallback(async () => {
    if (!currentCompany?.id) {
      toast.error("Aucune entreprise sélectionnée");
      return;
    }

    if (periodStatus.isLocked) {
      toast.info("Cette période est déjà verrouillée");
      return;
    }

    // Confirmation avant verrouillage
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir valider et verrouiller la Semaine ${currentFiscalWeek} ?\n\n` +
      `Cette action est définitive. Les données ne pourront plus être modifiées.`
    );

    if (!confirmed) {
      return;
    }

    setIsValidating(true);
    try {
      const periodService = createPeriodResultsService(currentCompany.id);

      const result = await periodService.validateAndSavePeriod(
        currentFiscalWeek,
        currentFiscalYear,
        weekStart,
        weekEnd,
        indicatorsPerformance,
        businessLinePerformances,
        grandTotals,
        [], // employeeDetails - à ajouter si disponible
        currency
      );

      if (result.success) {
        // Mettre à jour le statut local
        setPeriodStatus({
          exists: true,
          isLocked: true,
          calculatedAt: new Date(),
          lockedAt: new Date()
        });
        setIsFromValidatedPeriod(true);

        toast.success(
          `Semaine ${currentFiscalWeek} validée et verrouillée avec succès`,
          { icon: <Lock className="w-4 h-4 text-green-500" aria-hidden="true" /> }
        );
      } else {
        toast.error(result.error || "Erreur lors de la validation");
      }
    } catch (error: any) {
      console.error('[CostSavingsReporting] Error validating period:', error);
      toast.error(error.message || "Erreur lors de la validation de la période");
    } finally {
      setIsValidating(false);
    }
  }, [
    currentCompany?.id,
    periodStatus.isLocked,
    currentFiscalWeek,
    currentFiscalYear,
    weekStart,
    weekEnd,
    indicatorsPerformance,
    businessLinePerformances,
    grandTotals,
    currency
  ]);

  // ============================================
  // FORMAT DATE & NOMBRE
  // ============================================

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'numeric',
      year: '2-digit'
    });
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // ============================================
  // RENDU
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <HCMLoader text="Chargement du reporting..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header - Adaptatif dark/light */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/modules/module3/performance-recap')}
                className="gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  Reporting Economies de Coûts
                  {/* Badge de période validée */}
                  {periodStatus.isLocked && (
                    <Badge className="ml-2 gap-1 bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                      <Lock className="w-3 h-3" aria-hidden="true" />
                      S{currentFiscalWeek} validée
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Module 3 - HCM COST SAVINGS
                  {periodStatus.lockedAt && (
                    <span className="ml-2 text-green-600 dark:text-green-400">
                      (Données verrouillées le {periodStatus.lockedAt.toLocaleDateString('fr-FR')})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Boutons supprimés: sélecteur de semaine, imprimer, exporter, valider & verrouiller */}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Dashboard de Statut des Périodes - Mode étendu */}
        <PeriodStatusDashboard
          selectedYear={1}
          selectedWeek={parseInt(selectedWeek, 10)}
          compact={false}
          defaultExpanded={false}
          title="STATUT DES VALIDATIONS - N+1"
          className="mb-2"
        />

        {/* ============================================ */}
        {/* BLOC 1: ECONOMIES DE COUTS REALISEES */}
        {/* ============================================ */}
        <Card className="overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm">
          {/* En-tête SEMAINE - Design professionnel adaptatif */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800">
            {/* Titre SEMAINE */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-500/30">
              <h2 className="text-2xl font-bold text-white">SEMAINE {selectedWeek}</h2>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-indigo-200">semaine du</span>
                <span className="text-white font-medium">{formatDate(weekStart)}</span>
                <span className="text-indigo-200">Au</span>
                <span className="text-white font-medium">{formatDate(weekEnd)}</span>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-indigo-400/50 flex items-center justify-center hover:bg-indigo-500/20 transition-colors cursor-pointer">
                <RefreshCw className="w-5 h-5 text-indigo-200" aria-hidden="true" />
              </div>
            </div>

            {/* Copyright */}
            <div className="px-6 py-1 text-xs text-indigo-300/70">
              Copyright . 2010 . Riskosoft Corporation – All Rights Reserved
            </div>

            {/* En-têtes du tableau */}
            <div className="grid grid-cols-4 gap-4 px-6 py-3 text-sm font-semibold border-t border-indigo-500/30">
              <div className="text-indigo-100">DOMAINES - CLÉS</div>
              <div className="text-amber-300">Indicateurs génériques des pertes</div>
              <div className="text-center text-indigo-100">Objectif</div>
              <div className="text-center text-emerald-300">Economies réalisées</div>
            </div>
          </div>

          <CardContent className="p-0">
            {/* Lignes des indicateurs */}
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {indicatorsData.map((indicator, index) => (
                <div
                  key={indicator.key}
                  className="grid grid-cols-4 gap-4 px-6 py-4 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* Numéro + Domaine */}
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 text-slate-400 dark:text-slate-500 font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 leading-tight">
                      {indicator.domainesCles}
                    </span>
                  </div>

                  {/* Indicateur */}
                  <div className="flex items-center">
                    <span className="text-slate-800 dark:text-slate-200 text-sm">
                      {indicator.indicateur}
                    </span>
                  </div>

                  {/* Objectif */}
                  <div className="text-center flex items-center justify-center">
                    <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      {formatNumber(indicator.objectif)} {currencyConfig.symbol}
                    </span>
                  </div>

                  {/* Economies réalisées */}
                  <div className="text-center flex items-center justify-center">
                    <span className={cn(
                      "text-lg font-semibold",
                      indicator.economiesRealisees >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {formatNumber(indicator.economiesRealisees)} {currencyConfig.symbol}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Ligne TOTAL */}
            <div className="bg-slate-100 dark:bg-slate-700/50 px-6 py-4 grid grid-cols-4 gap-4 border-t border-slate-200 dark:border-slate-600">
              <div className="col-span-2 flex items-center">
                <span className="text-base font-bold text-slate-800 dark:text-white">
                  ECONOMIES REALISEES (BENEFICE ECONOMIQUE)
                </span>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  {formatNumber(totals.objectif)} {currencyConfig.symbol}
                </span>
              </div>
              <div className="text-center">
                <span className={cn(
                  "text-xl font-bold",
                  totals.economiesRealisees >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {formatNumber(totals.economiesRealisees)} {currencyConfig.symbol}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============================================ */}
        {/* GRAPHIQUE: ECONOMIES DE COUTS REALISEES */}
        {/* ============================================ */}
        <Card className="overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm">
          <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-3">
            <CardTitle className="text-center text-base font-semibold text-slate-800 dark:text-slate-200">
              GRAPHIQUE : ECONOMIES DE COUTS REALISEES (BENEFICE ECONOMIQUE)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white dark:bg-slate-800/30">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  className="text-slate-600 dark:text-slate-400"
                  axisLine={{ stroke: 'currentColor' }}
                />
                <YAxis
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  className="text-slate-600 dark:text-slate-400"
                  axisLine={{ stroke: 'currentColor' }}
                  tickFormatter={(value) => `${formatNumber(value)} ${currencyConfig.symbol}`}
                />
                <RechartsTooltip
                  formatter={(value: number) => [`${formatNumber(value)} ${currencyConfig.symbol}`, '']}
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    border: '1px solid var(--tooltip-border)',
                    borderRadius: '8px',
                    color: 'var(--tooltip-text)'
                  }}
                  wrapperClassName="[--tooltip-bg:theme(colors.white)] dark:[--tooltip-bg:theme(colors.slate.800)] [--tooltip-border:theme(colors.slate.200)] dark:[--tooltip-border:theme(colors.slate.600)] [--tooltip-text:theme(colors.slate.800)] dark:[--tooltip-text:theme(colors.slate.200)]"
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                  formatter={(value) => <span className="text-slate-700 dark:text-slate-300 text-sm">{value}</span>}
                />
                <Bar dataKey="Absentéisme" fill="#DC2626" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Défauts de qualité" fill="#16A34A" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Accidents du travail" fill="#EAB308" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Ecarts de productivité directe" fill="#F97316" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Ecarts de know how" fill="#7C3AED" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ============================================ */}
        {/* BLOC 2: ECONOMIES DE COUTS - LIGNES D'ACTIVITES */}
        {/* ============================================ */}
        <Card className="overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm">
          {/* En-tête BLOC 2 - Design professionnel adaptatif */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-900">
            {/* Titre */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-600/30">
              <h2 className="text-lg font-bold text-white">
                2- ECONOMIES DE COUTS REALISEES - LIGNES D'ACTIVITES (BENEFICE ECONOMIQUE)
              </h2>
            </div>

            {/* Sous-titre SEMAINE */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-600/30">
              <h3 className="text-xl font-bold text-white">SEMAINE {selectedWeek}</h3>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-slate-300">semaine du</span>
                <span className="text-white font-medium">{formatDate(weekStart)}</span>
                <span className="text-slate-300">Au</span>
                <span className="text-white font-medium">{formatDate(weekEnd)}</span>
              </div>
            </div>

            {/* Copyright */}
            <div className="px-6 py-1 text-xs text-slate-400/70">
              Copyright . 2010 . Riskosoft Corporation – All Rights Reserved
            </div>

            {/* En-têtes du tableau */}
            <div className="grid grid-cols-3 gap-4 px-6 py-3 text-sm font-semibold border-t border-slate-600/30">
              <div className="text-amber-300">Lignes d'activités</div>
              <div className="text-center text-slate-100">Objectif</div>
              <div className="text-center text-emerald-300">Economies réalisées</div>
            </div>
          </div>

          <CardContent className="p-0">
            {/* Lignes des business lines */}
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {businessLinePerformances.length > 0 ? (
                businessLinePerformances.map((bl, index) => (
                  <div
                    key={bl.businessLineId}
                    className="grid grid-cols-3 gap-4 px-6 py-4 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Numéro + Nom de la ligne */}
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 text-amber-600 dark:text-amber-400 font-bold">
                        {index + 1}-
                      </span>
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        {bl.businessLineName}
                      </span>
                    </div>

                    {/* Objectif */}
                    <div className="text-center flex items-center justify-center">
                      <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {formatNumber(bl.objectif)} {currencyConfig.symbol}
                      </span>
                    </div>

                    {/* Economies réalisées */}
                    <div className="text-center flex items-center justify-center">
                      <span className={cn(
                        "text-lg font-semibold",
                        bl.economiesRealisees >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}>
                        {formatNumber(bl.economiesRealisees)} {currencyConfig.symbol}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  Aucune donnée disponible. Visitez d'abord la page "Récapitulatif des Performances".
                </div>
              )}
            </div>

            {/* Ligne TOTAL */}
            {businessLinePerformances.length > 0 && (
              <div className="bg-slate-100 dark:bg-slate-700/50 px-6 py-4 grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-600">
                <div className="flex items-center">
                  <span className="text-base font-bold text-slate-800 dark:text-white">
                    ECONOMIES REALISEES (BENEFICE ECONOMIQUE)
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    {formatNumber(businessLinePerformances.reduce((sum, bl) => sum + bl.objectif, 0))} {currencyConfig.symbol}
                  </span>
                </div>
                <div className="text-center">
                  <span className={cn(
                    "text-xl font-bold",
                    businessLinePerformances.reduce((sum, bl) => sum + bl.economiesRealisees, 0) >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {formatNumber(businessLinePerformances.reduce((sum, bl) => sum + bl.economiesRealisees, 0))} {currencyConfig.symbol}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============================================ */}
        {/* GRAPHIQUE BLOC 2: LIGNES D'ACTIVITES */}
        {/* ============================================ */}
        {businessLinePerformances.length > 0 && (
          <Card className="overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-3">
              <CardTitle className="text-center text-base font-semibold text-slate-800 dark:text-slate-200">
                GRAPHIQUE : ECONOMIES DE COUTS REALISEES (BENEFICE ECONOMIQUE)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-800/30">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={[
                    {
                      name: 'Objectif',
                      ...businessLinePerformances.reduce((acc, bl, index) => {
                        acc[`${index + 1}- ${bl.businessLineName}`] = bl.objectif;
                        return acc;
                      }, {} as Record<string, number>)
                    },
                    {
                      name: 'Economies réalisées',
                      ...businessLinePerformances.reduce((acc, bl, index) => {
                        acc[`${index + 1}- ${bl.businessLineName}`] = bl.economiesRealisees;
                        return acc;
                      }, {} as Record<string, number>)
                    }
                  ]}
                  margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    className="text-slate-600 dark:text-slate-400"
                    axisLine={{ stroke: 'currentColor' }}
                  />
                  <YAxis
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    className="text-slate-600 dark:text-slate-400"
                    axisLine={{ stroke: 'currentColor' }}
                    tickFormatter={(value) => `${formatNumber(value)} ${currencyConfig.symbol}`}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => [`${formatNumber(value)} ${currencyConfig.symbol}`, '']}
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg)',
                      border: '1px solid var(--tooltip-border)',
                      borderRadius: '8px',
                      color: 'var(--tooltip-text)'
                    }}
                    wrapperClassName="[--tooltip-bg:theme(colors.white)] dark:[--tooltip-bg:theme(colors.slate.800)] [--tooltip-border:theme(colors.slate.200)] dark:[--tooltip-border:theme(colors.slate.600)] [--tooltip-text:theme(colors.slate.800)] dark:[--tooltip-text:theme(colors.slate.200)]"
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="rect"
                    formatter={(value) => <span className="text-slate-700 dark:text-slate-300 text-sm">{value}</span>}
                  />
                  {/* Barres dynamiques pour chaque ligne d'activité */}
                  {businessLinePerformances.map((bl, index) => {
                    // Couleurs variées pour chaque ligne
                    const colors = ['#DC2626', '#16A34A', '#EAB308', '#F97316', '#7C3AED', '#06B6D4', '#EC4899', '#8B5CF6'];
                    return (
                      <Bar
                        key={bl.businessLineId}
                        dataKey={`${index + 1}- ${bl.businessLineName}`}
                        fill={colors[index % colors.length]}
                        radius={[2, 2, 0, 0]}
                      />
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ============================================ */}
        {/* BLOC 3: RÉPARTITION DU BÉNÉFICE ÉCONOMIQUE */}
        {/* ============================================ */}
        <div className="mt-8 space-y-6">
          {/* Titre principal Bloc 3 */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white px-6 py-4 rounded-lg">
            <h2 className="text-xl font-bold">
              3- Répartition du bénéfice économique entre la trésorerie et les primes des salariés
            </h2>
          </div>

          {/* ============================================ */}
          {/* BLOC 3-1: PRIMES DES SALARIÉS */}
          {/* ============================================ */}
          <div className="space-y-4">
            {/* Sous-titre 3-1 */}
            <div className="bg-yellow-400 text-slate-900 px-4 py-2 rounded font-bold text-lg">
              3-1 Répartition du bénéfice économique - primes des salariés
            </div>

            {/* En-tête SEMAINE */}
            <div className="bg-slate-600 dark:bg-slate-700 text-white px-6 py-4 rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-amber-400">SEMAINE {selectedWeek}</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span>semaine du</span>
                  <span className="font-bold">{formatDate(weekStart)}</span>
                  <span>Au</span>
                  <span className="font-bold">{formatDate(weekEnd)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 mt-1">Copyright . 2010 . Riskosoft Corporation – All Rights Reserved</p>
            </div>

            {/* Tableau 3-1: Primes */}
            <div className="bg-slate-700 dark:bg-slate-800 rounded-lg overflow-hidden">
              {/* Header du tableau */}
              <div className="grid grid-cols-3 gap-4 px-6 py-3 bg-slate-600 dark:bg-slate-700 text-slate-200 font-semibold text-sm">
                <div>Indicateurs génériques des pertes</div>
                <div className="text-center">Prévisionnel Prime</div>
                <div className="text-center">Réalisé Prime</div>
              </div>

              {/* Lignes des indicateurs */}
              <div className="divide-y divide-slate-600 dark:divide-slate-700">
                {indicatorsPerformance.map((indicator, index) => (
                  <div
                    key={indicator.key}
                    className={cn(
                      "grid grid-cols-3 gap-4 px-6 py-4 items-center",
                      index % 2 === 0 ? "bg-slate-700/50 dark:bg-slate-800/50" : "bg-slate-700/30 dark:bg-slate-800/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 font-bold">{index + 1}</span>
                      <span className="text-white font-medium">{indicator.label}</span>
                    </div>
                    <div className="text-center text-xl font-bold text-slate-200">
                      {formatNumber(indicator.totalPrevPrime)} {currencyConfig.symbol}
                    </div>
                    <div className="text-center text-xl font-bold text-slate-200">
                      {formatNumber(indicator.totalRealPrime)} {currencyConfig.symbol}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ligne TOTAL */}
              <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-slate-800 dark:bg-slate-900 border-t-2 border-slate-500">
                <div className="text-white font-bold text-lg">TOTAL</div>
                <div className="text-center text-2xl font-bold text-amber-400">
                  {formatNumber(grandTotals.grandTotalPrevPrime)} {currencyConfig.symbol}
                </div>
                <div className="text-center text-2xl font-bold text-emerald-400">
                  {formatNumber(grandTotals.grandTotalRealPrime)} {currencyConfig.symbol}
                </div>
              </div>
            </div>

            {/* Graphique 3-1: Primes */}
            <Card className="overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm">
              <CardHeader className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-3">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  GRAPHIQUE : Répartition du bénéfice économique - primes des salariés
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={[
                      {
                        name: 'Prévisionnel Prime',
                        Absentéisme: indicatorsPerformance.find(i => i.key === 'abs')?.totalPrevPrime || 0,
                        'Défauts de qualité': indicatorsPerformance.find(i => i.key === 'qd')?.totalPrevPrime || 0,
                        'Accidents du travail': indicatorsPerformance.find(i => i.key === 'oa')?.totalPrevPrime || 0,
                        'Ecarts de productivité directe': indicatorsPerformance.find(i => i.key === 'ddp')?.totalPrevPrime || 0,
                        'Ecarts de know how': indicatorsPerformance.find(i => i.key === 'ekh')?.totalPrevPrime || 0,
                      },
                      {
                        name: 'Réalisé Prime',
                        Absentéisme: indicatorsPerformance.find(i => i.key === 'abs')?.totalRealPrime || 0,
                        'Défauts de qualité': indicatorsPerformance.find(i => i.key === 'qd')?.totalRealPrime || 0,
                        'Accidents du travail': indicatorsPerformance.find(i => i.key === 'oa')?.totalRealPrime || 0,
                        'Ecarts de productivité directe': indicatorsPerformance.find(i => i.key === 'ddp')?.totalRealPrime || 0,
                        'Ecarts de know how': indicatorsPerformance.find(i => i.key === 'ekh')?.totalRealPrime || 0,
                      }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      formatter={(value: number) => [`${formatNumber(value)} ${currencyConfig.symbol}`, '']}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Absentéisme" fill="#DC2626" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="Absentéisme" position="top" formatter={(value: number) => `${formatNumber(value)} ${currencyConfig.symbol}`} style={{ fontSize: '9px', fill: '#64748b' }} />
                    </Bar>
                    <Bar dataKey="Défauts de qualité" fill="#16A34A" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="Défauts de qualité" position="top" formatter={(value: number) => `${formatNumber(value)} ${currencyConfig.symbol}`} style={{ fontSize: '9px', fill: '#64748b' }} />
                    </Bar>
                    <Bar dataKey="Accidents du travail" fill="#EAB308" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="Accidents du travail" position="top" formatter={(value: number) => `${formatNumber(value)} ${currencyConfig.symbol}`} style={{ fontSize: '9px', fill: '#64748b' }} />
                    </Bar>
                    <Bar dataKey="Ecarts de productivité directe" fill="#7C3AED" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="Ecarts de productivité directe" position="top" formatter={(value: number) => `${formatNumber(value)} ${currencyConfig.symbol}`} style={{ fontSize: '9px', fill: '#64748b' }} />
                    </Bar>
                    <Bar dataKey="Ecarts de know how" fill="#6B7280" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="Ecarts de know how" position="top" formatter={(value: number) => `${formatNumber(value)} ${currencyConfig.symbol}`} style={{ fontSize: '9px', fill: '#64748b' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ============================================ */}
          {/* BLOC 3-2: TRÉSORERIE */}
          {/* ============================================ */}
          <div className="space-y-4">
            {/* Sous-titre 3-2 */}
            <div className="bg-yellow-400 text-slate-900 px-4 py-2 rounded font-bold text-lg">
              3-2 Répartition du bénéfice économique - Trésorerie
            </div>

            {/* En-tête SEMAINE */}
            <div className="bg-slate-600 dark:bg-slate-700 text-white px-6 py-4 rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-amber-400">SEMAINE {selectedWeek}</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span>semaine du</span>
                  <span className="font-bold">{formatDate(weekStart)}</span>
                  <span>Au</span>
                  <span className="font-bold">{formatDate(weekEnd)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 mt-1">Copyright . 2010 . Riskosoft Corporation – All Rights Reserved</p>
            </div>

            {/* Tableau 3-2: Trésorerie */}
            <div className="bg-slate-700 dark:bg-slate-800 rounded-lg overflow-hidden">
              {/* Header du tableau */}
              <div className="grid grid-cols-3 gap-4 px-6 py-3 bg-slate-600 dark:bg-slate-700 text-slate-200 font-semibold text-sm">
                <div>Indicateurs génériques des pertes</div>
                <div className="text-center">Prévisionnel trésorerie</div>
                <div className="text-center">Réalisé Trésorerie</div>
              </div>

              {/* Lignes des indicateurs */}
              <div className="divide-y divide-slate-600 dark:divide-slate-700">
                {indicatorsPerformance.map((indicator, index) => (
                  <div
                    key={indicator.key}
                    className={cn(
                      "grid grid-cols-3 gap-4 px-6 py-4 items-center",
                      index % 2 === 0 ? "bg-slate-700/50 dark:bg-slate-800/50" : "bg-slate-700/30 dark:bg-slate-800/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 font-bold">{index + 1}</span>
                      <span className="text-white font-medium">{indicator.label}</span>
                    </div>
                    <div className="text-center text-xl font-bold text-slate-200">
                      {formatNumber(indicator.totalPrevTreso)} {currencyConfig.symbol}
                    </div>
                    <div className="text-center text-xl font-bold text-slate-200">
                      {formatNumber(indicator.totalRealTreso)} {currencyConfig.symbol}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ligne TOTAL */}
              <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-slate-800 dark:bg-slate-900 border-t-2 border-slate-500">
                <div className="text-white font-bold text-lg">TOTAL</div>
                <div className="text-center text-2xl font-bold text-amber-400">
                  {formatNumber(grandTotals.grandTotalPrevTreso)} {currencyConfig.symbol}
                </div>
                <div className="text-center text-2xl font-bold text-emerald-400">
                  {formatNumber(grandTotals.grandTotalRealTreso)} {currencyConfig.symbol}
                </div>
              </div>
            </div>

            {/* Graphique 3-2: Trésorerie */}
            <Card className="overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm">
              <CardHeader className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-3">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  GRAPHIQUE : Répartition du bénéfice économique - Trésorerie
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={[
                      {
                        name: 'Prévisionnel trésorerie',
                        Absentéisme: indicatorsPerformance.find(i => i.key === 'abs')?.totalPrevTreso || 0,
                        'Défauts de qualité': indicatorsPerformance.find(i => i.key === 'qd')?.totalPrevTreso || 0,
                        'Accidents du travail': indicatorsPerformance.find(i => i.key === 'oa')?.totalPrevTreso || 0,
                        'Ecarts de productivité directe': indicatorsPerformance.find(i => i.key === 'ddp')?.totalPrevTreso || 0,
                        'Ecarts de know how': indicatorsPerformance.find(i => i.key === 'ekh')?.totalPrevTreso || 0,
                      },
                      {
                        name: 'Réalisé Trésorerie',
                        Absentéisme: indicatorsPerformance.find(i => i.key === 'abs')?.totalRealTreso || 0,
                        'Défauts de qualité': indicatorsPerformance.find(i => i.key === 'qd')?.totalRealTreso || 0,
                        'Accidents du travail': indicatorsPerformance.find(i => i.key === 'oa')?.totalRealTreso || 0,
                        'Ecarts de productivité directe': indicatorsPerformance.find(i => i.key === 'ddp')?.totalRealTreso || 0,
                        'Ecarts de know how': indicatorsPerformance.find(i => i.key === 'ekh')?.totalRealTreso || 0,
                      }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      formatter={(value: number) => [`${formatNumber(value)} ${currencyConfig.symbol}`, '']}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Absentéisme" fill="#DC2626" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="Absentéisme" position="top" formatter={(value: number) => `${formatNumber(value)} ${currencyConfig.symbol}`} style={{ fontSize: '9px', fill: '#64748b' }} />
                    </Bar>
                    <Bar dataKey="Défauts de qualité" fill="#16A34A" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="Défauts de qualité" position="top" formatter={(value: number) => `${formatNumber(value)} ${currencyConfig.symbol}`} style={{ fontSize: '9px', fill: '#64748b' }} />
                    </Bar>
                    <Bar dataKey="Accidents du travail" fill="#EAB308" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="Accidents du travail" position="top" formatter={(value: number) => `${formatNumber(value)} ${currencyConfig.symbol}`} style={{ fontSize: '9px', fill: '#64748b' }} />
                    </Bar>
                    <Bar dataKey="Ecarts de productivité directe" fill="#7C3AED" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="Ecarts de productivité directe" position="top" formatter={(value: number) => `${formatNumber(value)} ${currencyConfig.symbol}`} style={{ fontSize: '9px', fill: '#64748b' }} />
                    </Bar>
                    <Bar dataKey="Ecarts de know how" fill="#6B7280" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="Ecarts de know how" position="top" formatter={(value: number) => `${formatNumber(value)} ${currencyConfig.symbol}`} style={{ fontSize: '9px', fill: '#64748b' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ============================================ */}
        {/* BLOC 4: RÉPARTITION PAR LIGNES D'ACTIVITÉS */}
        {/* Source: TOTAL ligne d'activité du tableau PERFORMANCE GLOBALE */}
        {/* ============================================ */}
        <div className="mt-8 space-y-6">
          {/* Titre principal Bloc 4 */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-lg px-6 py-4">
            <h2 className="text-xl font-bold text-cyan-400">
              4- Répartition du bénéfice économique entre la trésorerie et les primes des salariés - Lignes d'activités
            </h2>
          </div>

          {/* BLOC 4-1: PRIMES DES SALARIÉS PAR LIGNE D'ACTIVITÉ */}
          <div className="space-y-4">
            {/* Sous-titre 4-1 */}
            <div className="bg-yellow-400 text-slate-900 px-4 py-2 rounded-t-lg font-bold">
              4-1 Répartition du bénéfice économique - primes des salariés
            </div>

            {/* En-tête SEMAINE */}
            <div className="bg-slate-800 dark:bg-slate-900 px-6 py-4 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400">SEMAINE {selectedWeek}</h3>
              <div className="flex items-center gap-4 text-sm text-slate-300 mt-2">
                <span>semaine du</span>
                <span className="font-bold text-white">{formatDate(weekStart)}</span>
                <span>Au</span>
                <span className="font-bold text-white">{formatDate(weekEnd)}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Copyright . 2010 . Riskosoft Corporation – All Rights Reserved</p>
            </div>

            {/* Tableau 4-1: Primes par ligne d'activité */}
            <div className="bg-slate-700 dark:bg-slate-800 rounded-lg overflow-hidden">
              {/* Header du tableau */}
              <div className="grid grid-cols-3 gap-4 px-6 py-3 bg-slate-600 dark:bg-slate-700 text-slate-200 font-semibold text-sm">
                <div>Lignes d'activités</div>
                <div className="text-center">Prévisionnel Prime</div>
                <div className="text-center">Réalisé Prime</div>
              </div>

              {/* Lignes des activités */}
              <div className="divide-y divide-slate-600 dark:divide-slate-700">
                {businessLinePerformances.map((bl, index) => (
                  <div
                    key={bl.businessLineId}
                    className={cn(
                      "grid grid-cols-3 gap-4 px-6 py-4 items-center",
                      index % 2 === 0 ? "bg-slate-700/50 dark:bg-slate-800/50" : "bg-slate-700/30 dark:bg-slate-800/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 font-bold">{index + 1}-</span>
                      <span className="text-white font-medium">{bl.businessLineName}</span>
                    </div>
                    <div className="text-center text-xl font-bold text-slate-200">
                      {formatNumber(bl.prevPrime)} {currencyConfig.symbol}
                    </div>
                    <div className="text-center text-xl font-bold text-slate-200">
                      {formatNumber(bl.realPrime)} {currencyConfig.symbol}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ligne TOTAL */}
              <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-slate-800 dark:bg-slate-900 border-t-2 border-slate-500">
                <div className="text-white font-bold text-lg">TOTAL</div>
                <div className="text-center text-2xl font-bold text-amber-400">
                  {formatNumber(businessLinePerformances.reduce((sum, bl) => sum + bl.prevPrime, 0))} {currencyConfig.symbol}
                </div>
                <div className="text-center text-2xl font-bold text-emerald-400">
                  {formatNumber(businessLinePerformances.reduce((sum, bl) => sum + bl.realPrime, 0))} {currencyConfig.symbol}
                </div>
              </div>
            </div>

            {/* Graphique 4-1: Primes par ligne d'activité */}
            <Card className="overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm">
              <CardHeader className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-3">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  GRAPHIQUE : Répartition du bénéfice économique entre la trésorerie et les primes des salariés
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-2">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={[
                      {
                        name: 'Prévisionnel Prime',
                        ...Object.fromEntries(businessLinePerformances.map(bl => [bl.businessLineName, bl.prevPrime]))
                      },
                      {
                        name: 'Réalisé Prime',
                        ...Object.fromEntries(businessLinePerformances.map(bl => [bl.businessLineName, bl.realPrime]))
                      }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      formatter={(value: number) => [`${formatNumber(value)} ${currencyConfig.symbol}`, '']}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    {businessLinePerformances.map((bl, index) => {
                      const colors = ['#DC2626', '#16A34A', '#EAB308', '#F97316', '#7C3AED', '#0EA5E9', '#EC4899', '#14B8A6', '#8B5CF6', '#6366F1'];
                      return (
                        <Bar key={bl.businessLineId} dataKey={bl.businessLineName} fill={colors[index % colors.length]} radius={[2, 2, 0, 0]}>
                          <LabelList dataKey={bl.businessLineName} position="top" formatter={(value: number) => `${formatNumber(value)} ${currencyConfig.symbol}`} style={{ fontSize: '8px', fill: '#64748b' }} />
                        </Bar>
                      );
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* BLOC 4-2: TRÉSORERIE PAR LIGNE D'ACTIVITÉ */}
          <div className="space-y-4">
            {/* Sous-titre 4-2 */}
            <div className="bg-yellow-400 text-slate-900 px-4 py-2 rounded-t-lg font-bold">
              4-2 Répartition du bénéfice économique - Trésorerie
            </div>

            {/* En-tête SEMAINE */}
            <div className="bg-slate-800 dark:bg-slate-900 px-6 py-4 rounded-lg">
              <h3 className="text-xl font-bold text-amber-400">SEMAINE {selectedWeek}</h3>
              <div className="flex items-center gap-4 text-sm text-slate-300 mt-2">
                <span>semaine du</span>
                <span className="font-bold text-white">{formatDate(weekStart)}</span>
                <span>Au</span>
                <span className="font-bold text-white">{formatDate(weekEnd)}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Copyright . 2010 . Riskosoft Corporation – All Rights Reserved</p>
            </div>

            {/* Tableau 4-2: Trésorerie par ligne d'activité */}
            <div className="bg-slate-700 dark:bg-slate-800 rounded-lg overflow-hidden">
              {/* Header du tableau */}
              <div className="grid grid-cols-3 gap-4 px-6 py-3 bg-slate-600 dark:bg-slate-700 text-slate-200 font-semibold text-sm">
                <div>Lignes d'activités</div>
                <div className="text-center">Prévisionnel trésorerie</div>
                <div className="text-center">Réalisé Trésorerie</div>
              </div>

              {/* Lignes des activités */}
              <div className="divide-y divide-slate-600 dark:divide-slate-700">
                {businessLinePerformances.map((bl, index) => (
                  <div
                    key={bl.businessLineId}
                    className={cn(
                      "grid grid-cols-3 gap-4 px-6 py-4 items-center",
                      index % 2 === 0 ? "bg-slate-700/50 dark:bg-slate-800/50" : "bg-slate-700/30 dark:bg-slate-800/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 font-bold">{index + 1}-</span>
                      <span className="text-white font-medium">{bl.businessLineName}</span>
                    </div>
                    <div className="text-center text-xl font-bold text-slate-200">
                      {formatNumber(bl.prevTreso)} {currencyConfig.symbol}
                    </div>
                    <div className="text-center text-xl font-bold text-slate-200">
                      {formatNumber(bl.realTreso)} {currencyConfig.symbol}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ligne TOTAL */}
              <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-slate-800 dark:bg-slate-900 border-t-2 border-slate-500">
                <div className="text-white font-bold text-lg">TOTAL</div>
                <div className="text-center text-2xl font-bold text-amber-400">
                  {formatNumber(businessLinePerformances.reduce((sum, bl) => sum + bl.prevTreso, 0))} {currencyConfig.symbol}
                </div>
                <div className="text-center text-2xl font-bold text-emerald-400">
                  {formatNumber(businessLinePerformances.reduce((sum, bl) => sum + bl.realTreso, 0))} {currencyConfig.symbol}
                </div>
              </div>
            </div>

            {/* Graphique 4-2: Trésorerie par ligne d'activité */}
            <Card className="overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm">
              <CardHeader className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-3">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  GRAPHIQUE : Répartition du bénéfice économique - Trésorerie
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-2">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={[
                      {
                        name: 'Prévisionnel trésorerie',
                        ...Object.fromEntries(businessLinePerformances.map(bl => [bl.businessLineName, bl.prevTreso]))
                      },
                      {
                        name: 'Réalisé Trésorerie',
                        ...Object.fromEntries(businessLinePerformances.map(bl => [bl.businessLineName, bl.realTreso]))
                      }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      formatter={(value: number) => [`${formatNumber(value)} ${currencyConfig.symbol}`, '']}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    {businessLinePerformances.map((bl, index) => {
                      const colors = ['#DC2626', '#16A34A', '#EAB308', '#F97316', '#7C3AED', '#0EA5E9', '#EC4899', '#14B8A6', '#8B5CF6', '#6366F1'];
                      return (
                        <Bar key={bl.businessLineId} dataKey={bl.businessLineName} fill={colors[index % colors.length]} radius={[2, 2, 0, 0]}>
                          <LabelList dataKey={bl.businessLineName} position="top" formatter={(value: number) => `${formatNumber(value)} ${currencyConfig.symbol}`} style={{ fontSize: '8px', fill: '#64748b' }} />
                        </Bar>
                      );
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ============================================ */}
        {/* BLOC 5: RÉPARTITION DU BÉNÉFICE ÉCONOMIQUE AU SCR PAR RISQUE */}
        {/* Source: Section D - Economic Benefit Breakdown (Module 1, Page 17) */}
        {/* ============================================ */}
        <div className="space-y-6">
          {/* Titre principal Bloc 5 */}
          <div className="bg-slate-800 dark:bg-slate-900 text-white p-4 rounded-t-lg">
            <h2 className="text-lg font-bold">5- Répartition du bénéfice économique réalisé au SCR par risque</h2>
          </div>

          {/* En-tête de période */}
          <Card className="bg-slate-700 dark:bg-slate-800 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-white">
                <h3 className="text-xl font-bold">SEMAINE {currentFiscalWeek}</h3>
                <div className="flex items-center gap-8 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">semaine du</span>
                    <span className="font-semibold">{formatDate(weekStart)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">Au</span>
                    <span className="font-semibold">{formatDate(weekEnd)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau SCR */}
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-700 border-b-2 border-slate-300 dark:border-slate-600">
                      <th className="py-3 px-4 text-left font-bold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600">
                        Impacts sur le SCR
                      </th>
                      <th className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600">
                        Pourcentages
                      </th>
                      <th className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600">
                        Prévisionnel
                      </th>
                      <th className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-200">
                        Réalisé
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scrIndicators.map((indicator, idx) => (
                      <tr
                        key={indicator.key}
                        className={cn(
                          "border-b border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors",
                          idx % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/50 dark:bg-slate-800/50"
                        )}
                      >
                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-600">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: indicator.color }}
                            />
                            <span>{idx + 1}- {indicator.labelFr}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600">
                          {indicator.percentage.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600">
                          {formatCurrency(indicator.previsionnel, currency)}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(indicator.realise, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-800 dark:bg-slate-900 text-white font-bold">
                      <td className="py-3 px-4 border-r border-slate-600">
                        TOTAL
                      </td>
                      <td className="py-3 px-4 text-center border-r border-slate-600">
                        {scrTotals.percentage.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-center border-r border-slate-600">
                        {formatCurrency(scrTotals.previsionnel, currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {formatCurrency(scrTotals.realise, currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Graphique SCR */}
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-slate-700 dark:text-slate-200 text-sm font-semibold">
                GRAPHIQUE : Répartition du bénéfice économique - Impacts sur le SCR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        category: 'Prévisionnel',
                        ...Object.fromEntries(scrIndicators.map(ind => [ind.labelFr, ind.previsionnel]))
                      },
                      {
                        category: 'Réalisé',
                        ...Object.fromEntries(scrIndicators.map(ind => [ind.labelFr, ind.realise]))
                      }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="category"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value, currency),
                        name
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="square"
                      formatter={(value) => (
                        <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>
                      )}
                    />
                    {scrIndicators.map((indicator) => (
                      <Bar
                        key={indicator.key}
                        dataKey={indicator.labelFr}
                        fill={indicator.color}
                        radius={[4, 4, 0, 0]}
                      >
                        <LabelList
                          dataKey={indicator.labelFr}
                          position="top"
                          formatter={(value: number) => value > 0 ? `${(value / 1000).toFixed(0)}k` : ''}
                          style={{ fill: '#64748b', fontSize: 10 }}
                        />
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================ */}
        {/* BOUTON CENTRE DE PERFORMANCE */}
        {/* ============================================ */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => navigate('/modules/module3/performance-center')}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
          >
            <Award className="w-6 h-6" aria-hidden="true" />
            <span className="text-lg">Centre de Performance</span>
            <Users className="w-5 h-5 opacity-70" aria-hidden="true" />
          </Button>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
          Accédez au centre de la performance des lignes d'activités et des salariés par indicateurs socio-économiques
        </p>

      </div>
    </div>
  );
}
